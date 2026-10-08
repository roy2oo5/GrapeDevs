from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital
from app.schemas import HospitalAdminIdentity, HospitalDirectoryEntry, HospitalRead


router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("/me", response_model=HospitalRead)
def get_my_hospital(
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    return db.get(Hospital, identity.hospital_id)


@router.get("", response_model=list[HospitalDirectoryEntry])
def list_hospitals(
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    hospitals = db.scalars(
        select(Hospital)
        .where(Hospital.status == "active", Hospital.id != identity.hospital_id)
        .order_by(Hospital.name)
    )
    return hospitals