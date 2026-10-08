from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class MedicineDailyUsageCreate(BaseModel):
    sku_code: str = Field(min_length=1, max_length=80)
    sku_name: str = Field(min_length=1, max_length=200)
    usage_date: date
    quantity_dispensed: int = Field(default=0, ge=0)
    quantity_requested: int = Field(default=0, ge=0)
    quantity_issued: int = Field(default=0, ge=0)
    stockout_flag: bool = False


class MedicineDailyUsageRead(MedicineDailyUsageCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    hospital_id: UUID
    created_at: datetime


class HospitalSurveillanceCreate(BaseModel):
    report_date: date
    syndrome: str = Field(min_length=1, max_length=120)
    new_cases: int = Field(default=0, ge=0)
    admissions: int = Field(default=0, ge=0)
    icu_admissions: int = Field(default=0, ge=0)
    outbreak_flag: bool = False
    alert_level: str = Field(default="normal", pattern="^(normal|watch|surge)$")


class HospitalSurveillanceRead(HospitalSurveillanceCreate):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    hospital_id: UUID
    created_at: datetime
