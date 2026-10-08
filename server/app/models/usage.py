from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MedicineDailyUsage(Base):
    __tablename__ = "medicine_daily_usage"
    __table_args__ = (
        UniqueConstraint("hospital_id", "sku_code", "usage_date", name="uq_medicine_daily_usage_day"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    hospital_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), index=True)
    sku_code: Mapped[str] = mapped_column(String(80), index=True)
    sku_name: Mapped[str] = mapped_column(String(200))
    usage_date: Mapped[date] = mapped_column(Date, index=True)
    quantity_dispensed: Mapped[int] = mapped_column(Integer, default=0)
    quantity_requested: Mapped[int] = mapped_column(Integer, default=0)
    quantity_issued: Mapped[int] = mapped_column(Integer, default=0)
    stockout_flag: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class HospitalSurveillance(Base):
    __tablename__ = "hospital_surveillance"
    __table_args__ = (
        UniqueConstraint("hospital_id", "report_date", "syndrome", name="uq_hospital_surveillance_day"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    hospital_id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), ForeignKey("hospitals.id", ondelete="CASCADE"), index=True)
    report_date: Mapped[date] = mapped_column(Date, index=True)
    syndrome: Mapped[str] = mapped_column(String(120))
    new_cases: Mapped[int] = mapped_column(Integer, default=0)
    admissions: Mapped[int] = mapped_column(Integer, default=0)
    icu_admissions: Mapped[int] = mapped_column(Integer, default=0)
    outbreak_flag: Mapped[bool] = mapped_column(default=False)
    alert_level: Mapped[str] = mapped_column(String(24), default="normal")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
