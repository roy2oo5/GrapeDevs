from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Driver(Base):
    __tablename__ = "drivers"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    driver_identifier: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160))
    terminal_access_key_hash: Mapped[str | None] = mapped_column(String(256))
    phone_number: Mapped[str | None] = mapped_column(String(40))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Vehicle(Base):
    __tablename__ = "vehicles"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    vehicle_identifier: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    registration_number: Mapped[str | None] = mapped_column(String(80), unique=True)
    vehicle_type: Mapped[str] = mapped_column(String(32), default="standard_van")
    status: Mapped[str] = mapped_column(String(24), default="available")
    max_payload_kg: Mapped[float | None] = mapped_column(Float)
    is_cold_chain_capable: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class TransferItem(Base):
    __tablename__ = "transfer_items"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transfer_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transfer_requests.id", ondelete="CASCADE"), index=True)
    source_inventory_batch_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("inventory_batches.id", ondelete="SET NULL"))
    requested_quantity: Mapped[int] = mapped_column(Integer)
    reserved_quantity: Mapped[int] = mapped_column(Integer, default=0)
    accepted_quantity: Mapped[int] = mapped_column(Integer, default=0)
    damaged_quantity: Mapped[int] = mapped_column(Integer, default=0)
    returned_quantity: Mapped[int] = mapped_column(Integer, default=0)
    destination_batch_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("inventory_batches.id", ondelete="SET NULL"))


class TransferCustodyEvent(Base):
    __tablename__ = "transfer_chain_of_custody"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transfer_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transfer_requests.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(32))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    liability_from_type: Mapped[str] = mapped_column(String(24))
    liability_to_type: Mapped[str] = mapped_column(String(24))
    liability_from_hospital_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL"))
    liability_to_hospital_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL"))
    driver_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"))
    vehicle_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"))
    confirmed_by_name: Mapped[str] = mapped_column(String(160))
    notes: Mapped[str | None] = mapped_column(String(1000))


class TransferReceipt(Base):
    __tablename__ = "transfer_receipts"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transfer_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transfer_requests.id", ondelete="CASCADE"), unique=True)
    receiving_hospital_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"))
    received_by_name: Mapped[str] = mapped_column(String(160))
    inspected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    accepted_quantity: Mapped[int] = mapped_column(Integer)
    rejected_quantity: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str | None] = mapped_column(String(1000))


class TransferIncident(Base):
    __tablename__ = "transfer_incidents"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transfer_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transfer_requests.id", ondelete="CASCADE"), index=True)
    driver_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("drivers.id", ondelete="SET NULL"))
    incident_type: Mapped[str] = mapped_column(String(32))
    affected_quantity: Mapped[int] = mapped_column(Integer, default=0)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    description: Mapped[str] = mapped_column(String(2000))
    evidence_url: Mapped[str | None] = mapped_column(String(500))
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TransferTrackingSession(Base):
    __tablename__ = "transfer_tracking_sessions"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    transfer_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transfer_requests.id", ondelete="CASCADE"), unique=True)
    driver_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("drivers.id", ondelete="CASCADE"))
    vehicle_id: Mapped[UUID | None] = mapped_column(Uuid(as_uuid=True), ForeignKey("vehicles.id", ondelete="SET NULL"))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_latitude: Mapped[float | None] = mapped_column(Float)
    last_longitude: Mapped[float | None] = mapped_column(Float)
    last_recorded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class TransferLocationPoint(Base):
    __tablename__ = "transfer_location_points"
    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    tracking_session_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("transfer_tracking_sessions.id", ondelete="CASCADE"), index=True)
    latitude: Mapped[float] = mapped_column(Float)
    longitude: Mapped[float] = mapped_column(Float)
    accuracy_meters: Mapped[float | None] = mapped_column(Float)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
