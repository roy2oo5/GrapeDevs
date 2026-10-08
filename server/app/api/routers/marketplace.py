from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital, InventoryBatch, SurplusListing, TransferRequest
from app.schemas import HospitalAdminIdentity, SurplusListingCreate, SurplusListingRead, SurplusRequestCreate


router = APIRouter(prefix="/marketplace", tags=["Surplus Marketplace"])


def serialize_listing(db: Session, listing: SurplusListing) -> dict:
    hospital = db.get(Hospital, listing.hospital_id)
    return {
        "id": listing.id,
        "hospital_id": listing.hospital_id,
        "hospital_name": hospital.name if hospital else "Unknown hospital",
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
    }


@router.get("/listings", response_model=list[SurplusListingRead])
def list_listings(
    sku_code: str | None = None,
    min_quantity: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    statement = select(SurplusListing).where(
        SurplusListing.status == "active",
        SurplusListing.hospital_id != identity.hospital_id,
        SurplusListing.quantity_available >= min_quantity,
    ).order_by(SurplusListing.expires_on.asc().nullslast(), SurplusListing.created_at.desc())
    if sku_code:
        statement = statement.where(SurplusListing.sku_code == sku_code)
    return [serialize_listing(db, listing) for listing in db.scalars(statement)]


@router.get("/mine", response_model=list[SurplusListingRead])
def list_my_listings(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    listings = db.scalars(
        select(SurplusListing)
        .where(SurplusListing.hospital_id == identity.hospital_id)
        .order_by(SurplusListing.created_at.desc())
    )
    return [serialize_listing(db, listing) for listing in listings]


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

    listing = SurplusListing(
        hospital_id=identity.hospital_id,
        inventory_batch_id=batch.id,
        sku_code=batch.sku_code,
        sku_name=batch.sku_name,
        quantity=payload.quantity,
        quantity_available=payload.quantity,
        unit=batch.unit,
        lot_number=batch.lot_number,
        expires_on=batch.expires_on,
        storage_regime=batch.storage_regime,
        notes=payload.notes,
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)
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
    if payload.quantity > listing.quantity_available:
        raise HTTPException(status_code=409, detail="Requested quantity is no longer available")

    transfer = TransferRequest(
        requesting_hospital_id=identity.hospital_id,
        source_hospital_id=listing.hospital_id,
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
    db.commit()
    db.refresh(transfer)
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