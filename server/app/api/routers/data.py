from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import HospitalSurveillance, InventoryBatch, MedicineDailyUsage
from app.schemas import (
    HospitalAdminIdentity,
    HospitalSurveillanceCreate,
    HospitalSurveillanceRead,
    MedicineDailyUsageCreate,
    MedicineDailyUsageRead,
)
from app.services.realtime import publish_hospital_event

router = APIRouter(prefix="/data", tags=["Forecasting Data"])


@router.post("/usage", response_model=MedicineDailyUsageRead, status_code=status.HTTP_201_CREATED)
def create_usage(
    payload: MedicineDailyUsageCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    record = db.scalar(
        select(MedicineDailyUsage).where(
            MedicineDailyUsage.hospital_id == identity.hospital_id,
            MedicineDailyUsage.sku_code == payload.sku_code,
            MedicineDailyUsage.usage_date == payload.usage_date,
        )
    )
    previous_dispensed = record.quantity_dispensed if record is not None else 0
    consumption_delta = payload.quantity_dispensed - previous_dispensed
    if consumption_delta > 0:
        batches = list(db.scalars(
            select(InventoryBatch)
            .where(
                InventoryBatch.hospital_id == identity.hospital_id,
                InventoryBatch.sku_code == payload.sku_code,
                InventoryBatch.quantity > 0,
            )
            .order_by(InventoryBatch.expires_on.asc().nulls_last(), InventoryBatch.created_at.asc())
            .with_for_update()
        ))
        available_quantity = sum(batch.quantity - batch.reserved_quantity for batch in batches)
        if available_quantity < consumption_delta:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Cannot record {consumption_delta} dispensed units. "
                    f"Only {available_quantity} units of {payload.sku_code} remain in inventory."
                ),
            )
        remaining = consumption_delta
        for batch in batches:
            deducted = min(batch.quantity - batch.reserved_quantity, remaining)
            batch.quantity -= deducted
            remaining -= deducted
            if remaining == 0:
                break
    if record is None:
        record = MedicineDailyUsage(hospital_id=identity.hospital_id, **payload.model_dump())
        db.add(record)
    else:
        for key, value in payload.model_dump().items():
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    publish_hospital_event({identity.hospital_id}, "forecast-data.updated", record_id=str(record.id))
    if consumption_delta:
        publish_hospital_event(
            {identity.hospital_id},
            "inventory.updated",
            sku_code=payload.sku_code,
            quantity_change=-consumption_delta,
        )
    return record


@router.get("/usage", response_model=list[MedicineDailyUsageRead])
def list_usage(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    return list(db.scalars(select(MedicineDailyUsage).where(MedicineDailyUsage.hospital_id == identity.hospital_id).order_by(MedicineDailyUsage.usage_date.desc())))


@router.post("/surveillance", response_model=HospitalSurveillanceRead, status_code=status.HTTP_201_CREATED)
def create_surveillance(
    payload: HospitalSurveillanceCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    record = db.scalar(
        select(HospitalSurveillance).where(
            HospitalSurveillance.hospital_id == identity.hospital_id,
            HospitalSurveillance.report_date == payload.report_date,
            HospitalSurveillance.syndrome == payload.syndrome,
        )
    )
    if record is None:
        record = HospitalSurveillance(hospital_id=identity.hospital_id, **payload.model_dump())
        db.add(record)
    else:
        for key, value in payload.model_dump().items():
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    publish_hospital_event({identity.hospital_id}, "forecast-data.updated", record_id=str(record.id))
    return record


@router.get("/surveillance", response_model=list[HospitalSurveillanceRead])
def list_surveillance(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    return list(db.scalars(select(HospitalSurveillance).where(HospitalSurveillance.hospital_id == identity.hospital_id).order_by(HospitalSurveillance.report_date.desc())))
