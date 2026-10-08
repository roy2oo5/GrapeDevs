from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class InventoryBatchCreate(BaseModel):
    hospital_id: UUID | None = None
    sku_code: str = Field(min_length=1, max_length=80)
    sku_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(ge=0)
    unit: str = Field(default="units", min_length=1, max_length=40)
    lot_number: str | None = Field(default=None, max_length=100)
    expires_on: date | None = None
    storage_regime: str = Field(default="ambient", min_length=1, max_length=80)
    average_daily_use: float = Field(default=0, ge=0, le=1000000)


class InventoryBatchUpdate(BaseModel):
    quantity: int = Field(ge=0)


class InventoryUsageUpdate(BaseModel):
    average_daily_use: float = Field(ge=0, le=1000000)


class InventoryBatchRead(InventoryBatchCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class InventoryBatchDeletePayload(BaseModel):
    batch_id: UUID | None = None
    id: UUID | None = None