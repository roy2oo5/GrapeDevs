from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import Hospital, InventoryBatch
from app.schemas import (
    HospitalAdminIdentity,
    InventoryBatchCreate,
    InventoryBatchDeletePayload,
    InventoryBatchRead,
    InventoryBatchUpdate,
    InventoryUsageUpdate,
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


@router.get("/forecast")
def inventory_forecast(
    horizon_days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batches = list(
        db.scalars(
            select(InventoryBatch).where(
                InventoryBatch.hospital_id == identity.hospital_id,
                InventoryBatch.average_daily_use > 0,
            )
        )
    )
    forecasts = []
    for batch in batches:
        projected_use = batch.average_daily_use * horizon_days
        days_remaining = batch.quantity / batch.average_daily_use
        forecasts.append(
            {
                "inventory_batch_id": str(batch.id),
                "sku_code": batch.sku_code,
                "medicine_name": batch.sku_name,
                "current_quantity": batch.quantity,
                "average_daily_use": batch.average_daily_use,
                "horizon_days": horizon_days,
                "projected_quantity": max(0, batch.quantity - projected_use),
                "days_until_stockout": round(days_remaining, 1),
                "stockout_within_horizon": days_remaining <= horizon_days,
                "expires_on": batch.expires_on.isoformat() if batch.expires_on else None,
            }
        )
    return {"hospital_id": str(identity.hospital_id), "horizon_days": horizon_days, "forecasts": forecasts}


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


def _perform_delete_inventory_batch(
    batch_id: UUID,
    db: Session,
    identity: HospitalAdminIdentity,
):
    batch = db.get(InventoryBatch, batch_id)
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    db.delete(batch)
    db.commit()


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batches/{batch_id}/", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batch/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batch/{batch_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch(
    batch_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    _perform_delete_inventory_batch(batch_id, db, identity)


@router.delete("/batches", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batches/", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch_by_param_or_body(
    batch_id: UUID | None = Query(default=None),
    id: UUID | None = Query(default=None),
    payload: InventoryBatchDeletePayload | None = Body(default=None),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    target_id = batch_id or id or (payload.batch_id if payload else None) or (payload.id if payload else None)
    if target_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A batch_id or id query parameter or body payload is required to delete an inventory batch",
        )
    _perform_delete_inventory_batch(target_id, db, identity)


@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/{batch_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch_by_root_id(
    batch_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    _perform_delete_inventory_batch(batch_id, db, identity)


@router.post("/batches/{batch_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
@router.post("/{batch_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch_via_post(
    batch_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    _perform_delete_inventory_batch(batch_id, db, identity)


@router.patch("/batches/{batch_id}/usage", response_model=InventoryBatchRead)
def update_inventory_usage(
    batch_id: UUID,
    payload: InventoryUsageUpdate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batch = db.get(InventoryBatch, batch_id)
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    batch.average_daily_use = payload.average_daily_use
    db.commit()
    db.refresh(batch)
    return batch
