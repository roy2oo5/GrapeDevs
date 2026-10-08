from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SurplusListing(Base):
    __tablename__ = "surplus_listings"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="ck_surplus_listing_quantity_positive"),
        CheckConstraint("quantity_available >= 0", name="ck_surplus_listing_available_nonnegative"),
        CheckConstraint("status IN ('active', 'filled', 'withdrawn')", name="ck_surplus_listing_status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    hospital_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True
    )
    inventory_batch_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("inventory_batches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sku_code: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    sku_name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity_available: Mapped[int] = mapped_column(Integer, nullable=False)
    unit: Mapped[str] = mapped_column(String(40), nullable=False, default="units")
    lot_number: Mapped[str | None] = mapped_column(String(100))
    expires_on: Mapped[datetime | None] = mapped_column(Date)
    storage_regime: Mapped[str] = mapped_column(String(80), nullable=False, default="ambient")
    notes: Mapped[str | None] = mapped_column(String(1000))
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )