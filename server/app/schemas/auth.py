from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HospitalAdminLogin(BaseModel):
    hospital_administrator_id: str = Field(min_length=3, max_length=80)
    terminal_access_key: str = Field(min_length=8, max_length=256)


class TerminalAccessKeyUpdate(BaseModel):
    current_access_key: str = Field(min_length=8, max_length=256)
    new_access_key: str = Field(min_length=8, max_length=256)


class HospitalRegistration(BaseModel):
    hospital_name: str = Field(min_length=2, max_length=180)
    administrator_name: str = Field(min_length=2, max_length=160)
    administrator_email: str = Field(
        min_length=5,
        max_length=254,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    classification: str = Field(pattern="^(tertiary|secondary|clinic|depot)$")
    node_role: str = Field(pattern="^(pharmacy|coordinator|logistics)$")
    hospital_administrator_id: str = Field(min_length=3, max_length=80)
    terminal_access_key: str = Field(min_length=8, max_length=256)


class HospitalRegistrationResult(BaseModel):
    hospital_id: UUID
    hospital_name: str
    hospital_administrator_id: str
    status: str


class HospitalAdminSession(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime
    administrator_id: str
    role: str = "Hospital Administrator"
    hospital_id: UUID
    hospital_name: str


class HospitalAdminIdentity(BaseModel):
    administrator_id: str
    role: str = "Hospital Administrator"
    hospital_id: UUID
    hospital_name: str