from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import HospitalSurveillance, MedicineDailyUsage
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
    if record is None:
        record = MedicineDailyUsage(hospital_id=identity.hospital_id, **payload.model_dump())
        db.add(record)
    else:
        for key, value in payload.model_dump().items():
            setattr(record, key, value)
    db.commit()
    db.refresh(record)
    publish_hospital_event({identity.hospital_id}, "forecast-data.updated", record_id=str(record.id))
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
