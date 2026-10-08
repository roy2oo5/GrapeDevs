from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import Hospital, TransferRequest
from app.schemas import TransferCreate, TransferRead, TransferStatusUpdate


router = APIRouter(
    prefix="/transfers",
    tags=["Transfers"],
    dependencies=[Depends(get_current_hospital_admin)],
)


def serialize_transfer(db: Session, transfer: TransferRequest) -> dict:
    requesting_hospital = db.get(Hospital, transfer.requesting_hospital_id) if transfer.requesting_hospital_id else None
    source_hospital = db.get(Hospital, transfer.source_hospital_id) if transfer.source_hospital_id else None
    fields = (
        "id", "requesting_hospital_id", "source_hospital_id", "sku_code", "sku_name",
        "quantity", "unit", "urgency", "department", "notes", "status", "created_at", "updated_at",
    )
    return {
        **{field: getattr(transfer, field) for field in fields},
        "requesting_hospital_name": requesting_hospital.name if requesting_hospital else None,
        "source_hospital_name": source_hospital.name if source_hospital else None,
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
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(db, transfer)


@router.get("", response_model=list[TransferRead])
def list_transfers(
    status_filter: str | None = Query(default=None, alias="status"),
    hospital_id: UUID | None = None,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    statement = select(TransferRequest).order_by(TransferRequest.created_at.desc())
    if hospital_id is not None and hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Transfers can only be viewed for your hospital")
    statement = statement.where(
        (TransferRequest.requesting_hospital_id == identity.hospital_id)
        | (TransferRequest.source_hospital_id == identity.hospital_id)
    )
    if status_filter:
        statement = statement.where(TransferRequest.status == status_filter)
    return [serialize_transfer(db, transfer) for transfer in db.scalars(statement)]


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

    allowed_transitions = {
        "requested": {"approved", "rejected", "canceled"},
        "approved": {"in_transit", "canceled"},
        "in_transit": {"completed"},
        "rejected": set(),
        "completed": set(),
        "canceled": set(),
    }
    if payload.status not in allowed_transitions.get(transfer.status, set()):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot move transfer from {transfer.status} to {payload.status}",
        )

    transfer.status = payload.status
    transfer.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(db, transfer)