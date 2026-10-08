from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital
from app.schemas import HospitalAdminIdentity, HospitalRead


router = APIRouter(prefix="/hospitals", tags=["Hospitals"])


@router.get("/me", response_model=HospitalRead)
def get_my_hospital(
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    return db.get(Hospital, identity.hospital_id)