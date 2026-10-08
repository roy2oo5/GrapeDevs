from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, aliased

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital, InventoryBatch, SurplusListing, TransferAuditEvent, TransferRequest
from app.schemas import (
    HospitalAdminIdentity,
    SurplusListingCreate,
    SurplusListingRead,
    SurplusRequestCreate,
)
from app.services.geography import is_within_hospital_radius
from app.services.realtime import publish_hospital_event


router = APIRouter(prefix="/marketplace", tags=["Surplus Marketplace"])


def get_buyers_by_listing(db: Session, listings: list[SurplusListing]) -> dict[UUID, list[dict]]:
    if not listings:
        return {}
    rows = db.execute(
        select(
            TransferRequest.surplus_listing_id,
            Hospital.id,
            Hospital.name,
            TransferRequest.quantity,
            TransferRequest.status,
        )
        .join(Hospital, TransferRequest.requesting_hospital_id == Hospital.id)
        .where(TransferRequest.surplus_listing_id.in_([listing.id for listing in listings]))
        .order_by(TransferRequest.created_at.desc())
    )
    buyers_by_listing: dict[UUID, list[dict]] = {}
    for listing_id, hospital_id, hospital_name, quantity, transfer_status in rows:
        buyers_by_listing.setdefault(listing_id, []).append({
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "quantity": quantity,
            "status": transfer_status,
        })
    return buyers_by_listing


def serialize_listing(
    db: Session,
    listing: SurplusListing,
    hospital_name: str | None = None,
    buyers: list[dict] | None = None,
) -> dict:
    if hospital_name is None:
        hospital = db.get(Hospital, listing.hospital_id)
        hospital_name = hospital.name if hospital else "Unknown hospital"
    return {
        "id": listing.id,
        "hospital_id": listing.hospital_id,
        "hospital_name": hospital_name,
        "inventory_batch_id": listing.inventory_batch_id,
        "sku_code": listing.sku_code,
        "sku_name": listing.sku_name,
        "quantity": listing.quantity,
        "quantity_available": listing.quantity_available,
        "unit": listing.unit,
        "lot_number": listing.lot_number,
        "expires_on": listing.expires_on,
        "storage_regime": listing.storage_regime,
        "notes": listing.notes,
        "status": listing.status,
        "created_at": listing.created_at,
        "buyers": buyers or [],
    }


@router.get("/listings", response_model=list[SurplusListingRead])
def list_listings(
    sku_code: str | None = None,
    min_quantity: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    hospital = aliased(Hospital)
    statement = (
        select(SurplusListing, hospital.name)
        .join(hospital, SurplusListing.hospital_id == hospital.id)
        .where(
            SurplusListing.status == "active",
            SurplusListing.hospital_id != identity.hospital_id,
            SurplusListing.quantity_available >= min_quantity,
            (SurplusListing.expires_on.is_(None) | (SurplusListing.expires_on >= date.today())),
        )
        .order_by(SurplusListing.expires_on.asc().nullslast(), SurplusListing.created_at.desc())
    )
    if sku_code:
        statement = statement.where(SurplusListing.sku_code == sku_code)
    current_hospital = db.get(Hospital, identity.hospital_id)
    return [
        serialize_listing(db, listing, hospital_name)
        for listing, hospital_name in db.execute(statement)
        if current_hospital is not None
        and is_within_hospital_radius(current_hospital, db.get(Hospital, listing.hospital_id))
    ]


@router.get("/mine", response_model=list[SurplusListingRead])
def list_my_listings(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    hospital = aliased(Hospital)
    listing_rows = list(db.execute(
        select(SurplusListing, hospital.name)
        .join(hospital, SurplusListing.hospital_id == hospital.id)
        .where(SurplusListing.hospital_id == identity.hospital_id)
        .order_by(SurplusListing.created_at.desc())
    ))
    buyers_by_listing = get_buyers_by_listing(db, [listing for listing, _ in listing_rows])
    return [
        serialize_listing(db, listing, hospital_name, buyers_by_listing.get(listing.id, []))
        for listing, hospital_name in listing_rows
    ]


@router.post("/listings", response_model=SurplusListingRead, status_code=status.HTTP_201_CREATED)
def publish_listing(
    payload: SurplusListingCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batch = db.get(InventoryBatch, payload.inventory_batch_id)
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    if payload.quantity > batch.quantity:
        raise HTTPException(status_code=409, detail="Listing quantity exceeds the batch quantity")
    if (
        payload.expires_on is not None
        and batch.expires_on is not None
        and payload.expires_on > batch.expires_on
    ):
        raise HTTPException(
            status_code=422,
            detail="Surplus expiry date cannot be later than the inventory batch expiry date",
        )

    listing = SurplusListing(
        hospital_id=identity.hospital_id,
        inventory_batch_id=batch.id,
        sku_code=batch.sku_code,
        sku_name=batch.sku_name,
        quantity=payload.quantity,
        quantity_available=payload.quantity,
        unit=batch.unit,
        lot_number=batch.lot_number,
        expires_on=payload.expires_on or batch.expires_on,
        storage_regime=batch.storage_regime,
        notes=payload.notes,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
    publish_hospital_event({identity.hospital_id}, "marketplace.updated", listing_id=str(listing.id))
    return serialize_listing(db, listing)


@router.post("/listings/{listing_id}/request", status_code=status.HTTP_201_CREATED)
def request_listing(
    listing_id: UUID,
    payload: SurplusRequestCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    listing = db.get(SurplusListing, listing_id)
    if listing is None or listing.status != "active" or listing.hospital_id == identity.hospital_id:
        raise HTTPException(status_code=404, detail="Surplus listing not found")
    source_hospital = db.get(Hospital, listing.hospital_id)
    requesting_hospital = db.get(Hospital, identity.hospital_id)
    if (
        source_hospital is None
        or requesting_hospital is None
        or not is_within_hospital_radius(requesting_hospital, source_hospital)
    ):
        raise HTTPException(
            status_code=403,
            detail="Surplus can only be requested from a hospital within 50 km",
        )
    if payload.quantity > listing.quantity_available:
        raise HTTPException(status_code=409, detail="Requested quantity is no longer available")
    if listing.expires_on is not None and listing.expires_on < date.today():
        raise HTTPException(status_code=409, detail="This surplus listing has expired")
    duplicate = db.scalar(
        select(TransferRequest).where(
            TransferRequest.surplus_listing_id == listing.id,
            TransferRequest.requesting_hospital_id == identity.hospital_id,
            TransferRequest.status.in_(("requested", "approved", "in_transit")),
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="You already have an active request for this surplus listing")

    transfer = TransferRequest(
        requesting_hospital_id=identity.hospital_id,
        source_hospital_id=listing.hospital_id,
        surplus_listing_id=listing.id,
        sku_code=listing.sku_code,
        sku_name=listing.sku_name,
        quantity=payload.quantity,
        unit=listing.unit,
        urgency=payload.urgency,
        department=payload.department,
        notes=payload.notes,
    )
    listing.quantity_available -= payload.quantity
    if listing.quantity_available == 0:
        listing.status = "filled"
    db.add(transfer)
    db.flush()
    db.add(TransferAuditEvent(
        transfer_id=transfer.id,
        actor_hospital_id=identity.hospital_id,
        from_status=None,
        to_status="requested",
        quantity=transfer.quantity,
    ))
    db.commit()
    db.refresh(transfer)
    publish_hospital_event(
        {identity.hospital_id, listing.hospital_id},
        "marketplace.updated",
        listing_id=str(listing.id),
        transfer_id=str(transfer.id),
    )
    return {"transfer": transfer, "listing": serialize_listing(db, listing)}


@router.delete("/listings/{listing_id}", status_code=status.HTTP_204_NO_CONTENT)
def withdraw_listing(
    listing_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    listing = db.get(SurplusListing, listing_id)
    if listing is None or listing.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Surplus listing not found")
    listing.status = "withdrawn"
    db.commit()