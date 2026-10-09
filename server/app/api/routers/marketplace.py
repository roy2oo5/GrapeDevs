from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital, InventoryBatch, SurplusListing, TransferAuditEvent, TransferRequest
from app.schemas import (
    HospitalAdminIdentity,
    SurplusListingCreate,
    SurplusListingRead,
    SurplusInventoryBatchRead,
    SurplusRequestCreate,
)
from app.services.geography import is_within_hospital_radius
from app.services.realtime import publish_hospital_event
from app.services.stock import seven_day_stock_reserve


router = APIRouter(prefix="/marketplace", tags=["Surplus Marketplace"])


def supplier_stock_state(db: Session, hospital_id: UUID, sku_code: str) -> tuple[int, int]:
    available_quantity = db.scalar(
        select(func.coalesce(func.sum(InventoryBatch.quantity - InventoryBatch.reserved_quantity), 0)).where(
            InventoryBatch.hospital_id == hospital_id,
            InventoryBatch.sku_code == sku_code,
            InventoryBatch.quantity > 0,
            (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= date.today())),
        )
    ) or 0
    reserve_quantity = seven_day_stock_reserve(db, hospital_id, sku_code)
    return int(available_quantity), reserve_quantity


def active_allocated_quantity_by_batch(
    db: Session, hospital_id: UUID, sku_code: str
) -> dict[UUID, int]:
    rows = db.execute(
        select(SurplusListing.inventory_batch_id, func.sum(SurplusListing.quantity_available))
        .where(
            SurplusListing.hospital_id == hospital_id,
            SurplusListing.sku_code == sku_code,
            SurplusListing.status == "active",
            (SurplusListing.expires_on.is_(None) | (SurplusListing.expires_on >= date.today())),
        )
        .group_by(SurplusListing.inventory_batch_id)
    )
    quantities = {batch_id: int(quantity or 0) for batch_id, quantity in rows}
    transfer_rows = db.execute(
        select(SurplusListing.inventory_batch_id, func.sum(TransferRequest.quantity))
        .join(TransferRequest, TransferRequest.surplus_listing_id == SurplusListing.id)
        .where(
            SurplusListing.hospital_id == hospital_id,
            SurplusListing.sku_code == sku_code,
            SurplusListing.expires_on.is_(None) | (SurplusListing.expires_on >= date.today()),
            TransferRequest.status == "requested",
        )
        .group_by(SurplusListing.inventory_batch_id)
    )
    for batch_id, quantity in transfer_rows:
        quantities[batch_id] = quantities.get(batch_id, 0) + int(quantity or 0)
    pending_mou_quantity = int(db.scalar(
        select(func.coalesce(func.sum(TransferRequest.quantity), 0)).where(
            TransferRequest.source_hospital_id == hospital_id,
            TransferRequest.sku_code == sku_code,
            TransferRequest.surplus_listing_id.is_(None),
            TransferRequest.status == "requested",
        )
    ) or 0)
    if pending_mou_quantity:
        batches = db.scalars(
            select(InventoryBatch)
            .where(
                InventoryBatch.hospital_id == hospital_id,
                InventoryBatch.sku_code == sku_code,
                InventoryBatch.quantity > 0,
                InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= date.today()),
            )
            .order_by(InventoryBatch.expires_on.asc().nullslast(), InventoryBatch.created_at.asc())
        )
        for batch in batches:
            allocated = min(
                max(0, batch.quantity - batch.reserved_quantity - quantities.get(batch.id, 0)),
                pending_mou_quantity,
            )
            quantities[batch.id] = quantities.get(batch.id, 0) + allocated
            pending_mou_quantity -= allocated
            if pending_mou_quantity <= 0:
                break
    return quantities


def shareable_quantity_by_batch(
    batches: list[InventoryBatch],
    active_listed_quantity: dict[UUID, int],
    reserve_quantity: int,
) -> dict[UUID, int]:
    unlisted_quantities = {
        batch.id: max(
            0,
            batch.quantity - batch.reserved_quantity - active_listed_quantity.get(batch.id, 0),
        )
        for batch in batches
    }
    remaining_surplus = max(0, sum(unlisted_quantities.values()) - reserve_quantity)
    result = {}
    for batch in batches:
        quantity = min(unlisted_quantities[batch.id], remaining_surplus)
        if quantity > 0:
            result[batch.id] = quantity
            remaining_surplus -= quantity
    return result


@router.get("/inventory", response_model=list[SurplusInventoryBatchRead])
def list_shareable_inventory(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batches = list(db.scalars(
        select(InventoryBatch).where(
            InventoryBatch.hospital_id == identity.hospital_id,
            InventoryBatch.quantity > 0,
            (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= date.today())),
        ).order_by(InventoryBatch.sku_name, InventoryBatch.expires_on.asc().nullslast())
    ))
    batches_by_sku: dict[str, list[InventoryBatch]] = {}
    for batch in batches:
        batches_by_sku.setdefault(batch.sku_code, []).append(batch)
    result = []
    for sku_code, sku_batches in batches_by_sku.items():
        _, reserve_quantity = supplier_stock_state(db, identity.hospital_id, sku_code)
        active_listed_quantity = active_allocated_quantity_by_batch(db, identity.hospital_id, sku_code)
        shareable_by_batch = shareable_quantity_by_batch(
            sku_batches, active_listed_quantity, reserve_quantity
        )
        for batch in sku_batches:
            shareable_quantity = shareable_by_batch.get(batch.id, 0)
            if shareable_quantity > 0:
                result.append({
                    "id": batch.id,
                    "sku_code": batch.sku_code,
                    "sku_name": batch.sku_name,
                    "quantity_available": shareable_quantity,
                    "unit": batch.unit,
                    "expires_on": batch.expires_on,
                })
    return result


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
    limit: int = Query(default=100, ge=1, le=500),
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
        .limit(limit)
    )
    if sku_code:
        statement = statement.where(SurplusListing.sku_code == sku_code)
    current_hospital = db.get(Hospital, identity.hospital_id)
    listing_rows = list(db.execute(statement))
    safe_listings_by_supplier_sku: dict[tuple[UUID, str], bool] = {}
    listings = []
    for listing, hospital_name in listing_rows:
        supplier = db.get(Hospital, listing.hospital_id)
        key = (listing.hospital_id, listing.sku_code)
        if key not in safe_listings_by_supplier_sku:
            available_quantity, reserve_quantity = supplier_stock_state(db, *key)
            active_listed_quantity = sum(active_allocated_quantity_by_batch(db, *key).values())
            safe_listings_by_supplier_sku[key] = (
                available_quantity >= reserve_quantity + active_listed_quantity
            )
        if (
            current_hospital is not None
            and supplier is not None
            and is_within_hospital_radius(current_hospital, supplier)
            and safe_listings_by_supplier_sku[key]
        ):
            listings.append(serialize_listing(db, listing, hospital_name))
    return listings


@router.get("/mine", response_model=list[SurplusListingRead])
def list_my_listings(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    hospital = aliased(Hospital)
    listing_rows = list(db.execute(
        select(SurplusListing, hospital.name)
        .join(hospital, SurplusListing.hospital_id == hospital.id)
        .where(SurplusListing.hospital_id == identity.hospital_id)
        .order_by(SurplusListing.created_at.desc())
        .limit(limit)
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
    batch = db.scalar(
        select(InventoryBatch)
        .where(InventoryBatch.id == payload.inventory_batch_id)
        .with_for_update()
    )
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    batches = list(db.scalars(
        select(InventoryBatch).where(
            InventoryBatch.hospital_id == identity.hospital_id,
            InventoryBatch.sku_code == batch.sku_code,
            InventoryBatch.quantity > 0,
            (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= date.today())),
        ).order_by(InventoryBatch.expires_on.asc().nullslast())
    ))
    _, reserve_quantity = supplier_stock_state(db, identity.hospital_id, batch.sku_code)
    active_listed_quantity = active_allocated_quantity_by_batch(db, identity.hospital_id, batch.sku_code)
    batch_shareable = shareable_quantity_by_batch(
        batches, active_listed_quantity, reserve_quantity
    ).get(batch.id, 0)
    if payload.quantity > batch_shareable:
        raise HTTPException(
            status_code=409,
            detail=f"Only {batch_shareable} units are available to share from this batch after keeping 7 days of recent use in reserve.",
        )
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
    available_quantity, reserve_quantity = supplier_stock_state(db, listing.hospital_id, listing.sku_code)
    active_listed_quantity = sum(
        active_allocated_quantity_by_batch(db, listing.hospital_id, listing.sku_code).values()
    )
    if available_quantity < reserve_quantity + active_listed_quantity:
        raise HTTPException(
            status_code=409,
            detail="This surplus is no longer available because the hospital needs to keep its 7-day medicine use in reserve.",
        )
    if listing.expires_on is not None and listing.expires_on < date.today():
        raise HTTPException(status_code=409, detail="This surplus listing has expired")
    duplicate = db.scalar(
        select(TransferRequest).where(
            TransferRequest.surplus_listing_id == listing.id,
            TransferRequest.requesting_hospital_id == identity.hospital_id,
            TransferRequest.status.in_((
                "requested", "approved", "pending_pickup", "in_transit",
                "arrived_awaiting_inspection", "exception",
            )),
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