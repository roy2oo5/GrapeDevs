from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import CheckConstraint, DateTime, Index, JSON, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Hospital(Base):
    __tablename__ = "hospitals"
    __table_args__ = (
        CheckConstraint("classification IN ('tertiary', 'secondary', 'clinic', 'depot')", name="ck_hospitals_classification"),
        CheckConstraint("node_role IN ('pharmacy', 'coordinator', 'logistics')", name="ck_hospitals_node_role"),
        CheckConstraint("status IN ('active', 'suspended')", name="ck_hospitals_status"),
    )

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(180), nullable=False, index=True)
    administrator_name: Mapped[str] = mapped_column(String(160), nullable=False)
    administrator_email: Mapped[str] = mapped_column(String(254), nullable=False, index=True)
    classification: Mapped[str] = mapped_column(String(24), nullable=False)
    node_role: Mapped[str] = mapped_column(String(24), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active")
    settings: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )


Index("uq_hospitals_administrator_email_lower", func.lower(Hospital.administrator_email), unique=True)