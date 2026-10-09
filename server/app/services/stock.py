from datetime import date, timedelta
from math import ceil
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import InventoryBatch, MedicineDailyUsage


def seven_day_stock_reserve(db: Session, hospital_id: UUID, sku_code: str) -> int:
    today = date.today()
    dispensed_in_seven_days = db.scalar(
        select(func.sum(MedicineDailyUsage.quantity_dispensed)).where(
            MedicineDailyUsage.hospital_id == hospital_id,
            MedicineDailyUsage.sku_code == sku_code,
            MedicineDailyUsage.usage_date >= today - timedelta(days=6),
            MedicineDailyUsage.usage_date <= today,
        )
    )
    if dispensed_in_seven_days is not None:
        return max(0, int(dispensed_in_seven_days))

    average_daily_use = db.scalar(
        select(func.max(InventoryBatch.average_daily_use)).where(
            InventoryBatch.hospital_id == hospital_id,
            InventoryBatch.sku_code == sku_code,
            InventoryBatch.quantity > 0,
            (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= today)),
        )
    )
    return ceil(max(0, float(average_daily_use or 0)) * 7)
