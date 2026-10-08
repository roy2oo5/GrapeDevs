from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import Hospital, InventoryBatch
from app.schemas import (
    HospitalAdminIdentity,
    InventoryBatchCreate,
    InventoryBatchRead,
    InventoryBatchUpdate,
)


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    dependencies=[Depends(get_current_hospital_admin)],
)


@router.post("/batches", response_model=InventoryBatchRead, status_code=status.HTTP_201_CREATED)
def create_inventory_batch(
    payload: InventoryBatchCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    if payload.hospital_id is not None and payload.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Inventory can only be added to your hospital")
    if db.get(Hospital, identity.hospital_id) is None:
        raise HTTPException(status_code=404, detail="Hospital not found")

    batch = InventoryBatch(
        hospital_id=identity.hospital_id,
        **payload.model_dump(exclude={"hospital_id"}),
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/batches", response_model=list[InventoryBatchRead])
def list_inventory_batches(
    hospital_id: UUID | None = None,
    sku_code: str | None = None,
    expiring_within_days: int | None = Query(default=None, ge=0, le=3650),
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    statement = select(InventoryBatch).order_by(InventoryBatch.expires_on.asc().nullslast())
    if hospital_id is not None and hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Inventory can only be viewed for your hospital")
    statement = statement.where(InventoryBatch.hospital_id == identity.hospital_id)
    if sku_code:
        statement = statement.where(InventoryBatch.sku_code == sku_code)
    if expiring_within_days is not None:
        today = date.today()
        cutoff = today + timedelta(days=expiring_within_days)
        statement = statement.where(
            InventoryBatch.expires_on >= today,
            InventoryBatch.expires_on <= cutoff,
        )
    return list(db.scalars(statement))


@router.patch("/batches/{batch_id}", response_model=InventoryBatchRead)
def update_inventory_batch(
    batch_id: UUID,
    payload: InventoryBatchUpdate,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    batch = db.get(InventoryBatch, batch_id)
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    batch.quantity = payload.quantity
    db.commit()
    db.refresh(batch)
    return batch