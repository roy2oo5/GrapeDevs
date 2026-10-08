from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HospitalAgreementCreate(BaseModel):
    partner_hospital_id: UUID
    title: str = Field(min_length=2, max_length=180)
    signatory: str = Field(min_length=2, max_length=160)
    agreement_type: str = Field(min_length=2, max_length=120)
    valid_until: date | None = None


class HospitalAgreementStatusUpdate(BaseModel):
    status: str = Field(pattern="^(active|rejected|archived)$")


class HospitalAgreementRead(BaseModel):
    id: UUID
    hospital_id: UUID
    hospital_name: str
    partner_hospital_id: UUID
    partner_hospital_name: str
    title: str
    signatory: str
    agreement_type: str
    valid_until: date | None
    status: str
    created_at: datetime
    updated_at: datetime