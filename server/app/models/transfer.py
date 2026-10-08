from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class TransferRequest(Base):
    __tablename__ = "transfer_requests"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_transfer_quantity_positive"),
        CheckConstraint("urgency IN ('critical', 'high', 'normal')", name="ck_transfer_urgency"),
        CheckConstraint(
            "status IN ('requested', 'approved', 'rejected', 'in_transit', 'completed', 'canceled')",
            name="ck_transfer_status",
        ),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    requesting_hospital_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL"), index=True
    )
    source_hospital_id: Mapped[UUID | None] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="SET NULL"), index=True
    )
    sku_code: Mapped[str | None] = mapped_column(String(80), index=True)
    sku_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False, default="units")
    urgency: Mapped[str] = mapped_column(String(24), nullable=False, default="normal")
    department: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="requested", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc)
    )