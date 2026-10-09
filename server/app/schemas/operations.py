from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class HospitalSettingsUpdate(BaseModel):
    settings: dict[str, Any]


class HospitalProfileUpdate(BaseModel):
    hospital_name: str = Field(min_length=2, max_length=180)
    administrator_name: str = Field(min_length=2, max_length=160)


class ScenarioRunCreate(BaseModel):
    scenario_type: str = Field(default="demand_surge", min_length=2, max_length=120)
    demand_multiplier: float = Field(default=1.0, ge=1, le=5)
    supplier_delay_days: int = Field(default=0, ge=0, le=90)
    reproduction_index: float = Field(default=0, ge=0, le=3)


class ScenarioRunRead(BaseModel):
    id: UUID
    hospital_id: UUID
    scenario_type: str
    demand_multiplier: float
    supplier_delay_days: int
    reproduction_index: float
    results: dict[str, Any]
    created_at: datetime