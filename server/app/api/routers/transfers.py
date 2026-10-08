from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import Hospital, InventoryBatch, SurplusListing, TransferAuditEvent, TransferRequest
from app.models import MedicineDailyUsage
from app.schemas import TransferAuditRead, TransferCreate, TransferRead, TransferStatusUpdate
from app.services.realtime import publish_hospital_event


router = APIRouter(
    prefix="/transfers",
    tags=["Transfers"],
    dependencies=[Depends(get_current_hospital_admin)],
)


def serialize_transfer(
    db: Session,
    transfer: TransferRequest,
    requesting_hospital_name: str | None = None,
    source_hospital_name: str | None = None,
) -> dict:
    if requesting_hospital_name is None and transfer.requesting_hospital_id:
        requesting_hospital = db.get(Hospital, transfer.requesting_hospital_id)
        requesting_hospital_name = requesting_hospital.name if requesting_hospital else None
    if source_hospital_name is None and transfer.source_hospital_id:
        source_hospital = db.get(Hospital, transfer.source_hospital_id)
        source_hospital_name = source_hospital.name if source_hospital else None
    fields = (
        "id", "requesting_hospital_id", "source_hospital_id", "sku_code", "sku_name",
        "quantity", "unit", "urgency", "department", "notes", "status", "created_at", "updated_at",
    )
    return {
        **{field: getattr(transfer, field) for field in fields},
        "requesting_hospital_name": requesting_hospital_name,
        "source_hospital_name": source_hospital_name,
    }


@router.post("", response_model=TransferRead, status_code=status.HTTP_201_CREATED)
def create_transfer(
    payload: TransferCreate,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    if payload.requesting_hospital_id is not None and payload.requesting_hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="A transfer request must belong to your hospital")
    if payload.source_hospital_id is not None and db.get(Hospital, payload.source_hospital_id) is None:
        raise HTTPException(status_code=404, detail="Source hospital not found")

    transfer = TransferRequest(
        **payload.model_dump(exclude={"requesting_hospital_id", "source_hospital_id"}),
        requesting_hospital_id=identity.hospital_id,
        source_hospital_id=payload.source_hospital_id,
    )
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
        {hospital_id for hospital_id in (transfer.requesting_hospital_id, transfer.source_hospital_id) if hospital_id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return serialize_transfer(db, transfer)


@router.get("", response_model=list[TransferRead])
def list_transfers(
    status_filter: str | None = Query(default=None, alias="status"),
    hospital_id: UUID | None = None,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    requesting_hospital = aliased(Hospital)
    source_hospital = aliased(Hospital)
    statement = (
        select(TransferRequest, requesting_hospital.name, source_hospital.name)
        .outerjoin(requesting_hospital, TransferRequest.requesting_hospital_id == requesting_hospital.id)
        .outerjoin(source_hospital, TransferRequest.source_hospital_id == source_hospital.id)
        .order_by(TransferRequest.created_at.desc())
    )
    if hospital_id is not None and hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Transfers can only be viewed for your hospital")
    statement = statement.where(
        (TransferRequest.requesting_hospital_id == identity.hospital_id)
        | (TransferRequest.source_hospital_id == identity.hospital_id)
    )
    if status_filter:
        statement = statement.where(TransferRequest.status == status_filter)
    return [
        serialize_transfer(db, transfer, requesting_name, source_name)
        for transfer, requesting_name, source_name in db.execute(statement)
    ]


@router.patch("/{transfer_id}", response_model=TransferRead)
def update_transfer_status(
    transfer_id: UUID,
    payload: TransferStatusUpdate,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None or identity.hospital_id not in {
        transfer.requesting_hospital_id,
        transfer.source_hospital_id,
    }:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    is_requester = identity.hospital_id == transfer.requesting_hospital_id
    is_source = identity.hospital_id == transfer.source_hospital_id
    allowed_transitions = {
        ("requested", "approved"): is_source,
        ("requested", "rejected"): is_source,
        ("requested", "canceled"): is_requester,
        ("approved", "in_transit"): is_source,
        ("approved", "canceled"): is_requester,
        ("in_transit", "completed"): is_requester,
    }
    if not allowed_transitions.get((transfer.status, payload.status), False):
        raise HTTPException(
            status_code=403,
            detail=f"Your hospital cannot move this transfer from {transfer.status} to {payload.status}",
        )

    previous_status = transfer.status
    if payload.status == "approved" and payload.approved_quantity is not None:
        if payload.approved_quantity > transfer.quantity:
            raise HTTPException(status_code=422, detail="Approved quantity cannot exceed requested quantity")
        if payload.approved_quantity < transfer.quantity:
            restore_quantity = transfer.quantity - payload.approved_quantity
            if transfer.surplus_listing_id:
                listing = db.get(SurplusListing, transfer.surplus_listing_id)
                if listing:
                    listing.quantity_available += restore_quantity
                    if listing.status == "filled" and (listing.expires_on is None or listing.expires_on >= datetime.now(timezone.utc).date()):
                        listing.status = "active"
            transfer.quantity = payload.approved_quantity
    if payload.status == "approved" and transfer.surplus_listing_id is None and transfer.source_hospital_id:
        source_batch = db.scalar(
            select(InventoryBatch).where(
                InventoryBatch.hospital_id == transfer.source_hospital_id,
                InventoryBatch.sku_code == transfer.sku_code,
                InventoryBatch.quantity > 0,
            ).order_by(InventoryBatch.expires_on.asc().nullslast())
        )
        requested_quantity = payload.approved_quantity or transfer.quantity
        if source_batch is None:
            raise HTTPException(status_code=409, detail="The requested medicine is no longer in the source inventory")
        recent_usage = db.scalar(
            select(func.avg(MedicineDailyUsage.quantity_dispensed)).where(
                MedicineDailyUsage.hospital_id == source_batch.hospital_id,
                MedicineDailyUsage.sku_code == source_batch.sku_code,
                MedicineDailyUsage.usage_date >= datetime.now(timezone.utc).date() - timedelta(days=30),
            )
        )
        daily_use = float(recent_usage) if recent_usage is not None else source_batch.average_daily_use
        days_until_stockout = source_batch.quantity / daily_use if daily_use > 0 else None
        if days_until_stockout is not None and days_until_stockout <= 3:
            raise HTTPException(
                status_code=409,
                detail="This medicine is now at critical shortage risk and cannot be approved for sharing",
            )
        shareable_quantity = max(0, round(source_batch.quantity - (daily_use * 14)))
        if requested_quantity > shareable_quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Only {shareable_quantity} units can be approved after the source hospital's 14-day reserve",
            )
    if payload.status in {"rejected", "canceled"} and transfer.surplus_listing_id and previous_status in {"requested", "approved"}:
        listing = db.get(SurplusListing, transfer.surplus_listing_id)
        if listing:
            listing.quantity_available += transfer.quantity
            if listing.status == "filled" and (listing.expires_on is None or listing.expires_on >= datetime.now(timezone.utc).date()):
                listing.status = "active"
    transfer.status = payload.status
    transfer.updated_at = datetime.now(timezone.utc)
    db.add(TransferAuditEvent(
        transfer_id=transfer.id,
        actor_hospital_id=identity.hospital_id,
        from_status=previous_status,
        to_status=payload.status,
        quantity=transfer.quantity,
    ))
    db.commit()
    db.refresh(transfer)
    publish_hospital_event(
        {hospital_id for hospital_id in (transfer.requesting_hospital_id, transfer.source_hospital_id) if hospital_id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return serialize_transfer(db, transfer)


@router.get("/{transfer_id}/audit", response_model=list[TransferAuditRead])
def list_transfer_audit(
    transfer_id: UUID,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None or identity.hospital_id not in {transfer.requesting_hospital_id, transfer.source_hospital_id}:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    return db.scalars(
        select(TransferAuditEvent)
        .where(TransferAuditEvent.transfer_id == transfer_id)
        .order_by(TransferAuditEvent.created_at.asc())
    ).all()