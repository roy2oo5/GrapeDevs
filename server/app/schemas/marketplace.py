from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SurplusListingCreate(BaseModel):
    inventory_batch_id: UUID
    quantity: int = Field(gt=0, le=1000000)
    expires_on: date | None = None
    notes: str | None = Field(default=None, max_length=1000)


class SurplusInventoryBatchRead(BaseModel):
    id: UUID
    sku_code: str
    sku_name: str
    quantity_available: int
    unit: str
    expires_on: date | None


class SurplusBuyerRead(BaseModel):
    hospital_id: UUID
    hospital_name: str
    quantity: int
    status: str


class SurplusRequestCreate(BaseModel):
    quantity: int = Field(gt=0, le=1000000)
    urgency: str = Field(default="normal", pattern="^(critical|high|normal)$")
    department: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)


class SurplusListingRead(BaseModel):
    id: UUID
    hospital_id: UUID
    hospital_name: str
    inventory_batch_id: UUID
    sku_code: str
    sku_name: str
    quantity: int
    quantity_available: int
    unit: str
    lot_number: str | None
    expires_on: date | None
    storage_regime: str
    notes: str | None
    status: str
    created_at: datetime
    buyers: list[SurplusBuyerRead] = Field(default_factory=list)