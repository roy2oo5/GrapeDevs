from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TransferCreate(BaseModel):
    requesting_hospital_id: UUID | None = None
    source_hospital_id: UUID | None = None
    destination_hospital_id: UUID | None = None
    sku_code: str = Field(min_length=1, max_length=80)
    sku_name: str = Field(min_length=1, max_length=200)
    quantity: int = Field(gt=0, le=1000000)
    unit: str = Field(default="units", min_length=1, max_length=40)
    urgency: str = Field(default="normal", pattern="^(critical|high|normal)$")
    department: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=1000)


class TransferStatusUpdate(BaseModel):
    status: str = Field(pattern="^(approved|rejected|pending_pickup|in_transit|arrived_awaiting_inspection|completed|returned|exception|canceled)$")
    approved_quantity: int | None = Field(default=None, gt=0, le=1000000)


class TransferAuditRead(BaseModel):
    id: UUID
    transfer_id: UUID
    actor_hospital_id: UUID | None
    from_status: str | None
    to_status: str
    quantity: int
    created_at: datetime


class TransferRead(TransferCreate):
    model_config = ConfigDict(from_attributes=True)

    source_hospital_id: UUID | None = None
    sku_code: str | None = None
    id: UUID
    status: str
    created_at: datetime
    updated_at: datetime
    requesting_hospital_name: str | None = None
    source_hospital_name: str | None = None
    assigned_driver_id: UUID | None = None
    assigned_vehicle_id: UUID | None = None
    allocation_suggested_quantity: int | None = None
    allocation_requested_quantity: int | None = None
    allocation_supplier_shareable: int | None = None
    allocation_recipient_need: int | None = None
    allocation_recipient_stock_days: float | None = None
    allocation_surge_status: str | None = None
    allocation_supplier_surge_status: str | None = None
    allocation_explanation: str | None = None


class DriverCreate(BaseModel):
    driver_identifier: str = Field(min_length=1, max_length=80)
    full_name: str = Field(min_length=1, max_length=160)
    phone_number: str | None = Field(default=None, max_length=40)


class VehicleCreate(BaseModel):
    vehicle_identifier: str = Field(min_length=1, max_length=80)
    registration_number: str | None = Field(default=None, max_length=80)
    vehicle_type: str = Field(pattern="^(cold_chain_bike|standard_bike|cold_chain_van|standard_van)$")
    max_payload_kg: float | None = Field(default=None, gt=0)
    is_cold_chain_capable: bool = False


class LogisticsAssignment(BaseModel):
    driver_id: UUID
    vehicle_id: UUID | None = None


class CustodyEventCreate(BaseModel):
    event_type: str = Field(pattern="^(picked_up|received_by_hospital|returned_to_origin)$")
    occurred_at: datetime
    confirmed_by_name: str = Field(min_length=1, max_length=160)
    notes: str | None = Field(default=None, max_length=1000)


class TransferReceiptCreate(BaseModel):
    received_by_name: str = Field(min_length=1, max_length=160)
    inspected_at: datetime
    accepted_quantity: int = Field(ge=0)
    rejected_quantity: int = Field(default=0, ge=0)
    notes: str | None = Field(default=None, max_length=1000)


class TransferIncidentCreate(BaseModel):
    incident_type: str = Field(pattern="^(damaged|temperature_breach|lost|vehicle_failure|accident)$")
    affected_quantity: int = Field(default=0, ge=0)
    occurred_at: datetime
    description: str = Field(min_length=1, max_length=2000)
    evidence_url: str | None = Field(default=None, max_length=500)


class TrackingSessionCreate(BaseModel):
    driver_id: UUID
    vehicle_id: UUID | None = None


class LocationPointCreate(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_meters: float | None = Field(default=None, ge=0)
    captured_at: datetime