from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TransferCreate(BaseModel):
    requesting_hospital_id: UUID | None = None
    source_hospital_id: UUID | None = None
    sku_code: str | None = Field(default=None, max_length=80)
    sku_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0, le=1000000)
    unit: str = Field(default="units", min_length=1, max_length=40)
    urgency: str = Field(default="normal", pattern="^(critical|high|normal)$")
    department: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)


class TransferStatusUpdate(BaseModel):
    status: str = Field(pattern="^(approved|rejected|in_transit|completed|canceled)$")


class TransferRead(TransferCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime