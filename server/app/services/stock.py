from datetime import date, timedelta
from math import ceil
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import HospitalSurveillance, InventoryBatch, MedicineDailyUsage


def hospital_surge_status(db: Session, hospital_id: UUID) -> str:
    today = date.today()
    surveillance = list(db.execute(
        select(
            HospitalSurveillance.alert_level,
            HospitalSurveillance.outbreak_flag,
        ).where(
            HospitalSurveillance.hospital_id == hospital_id,
            HospitalSurveillance.report_date >= today - timedelta(days=6),
            HospitalSurveillance.report_date <= today,
        )
    ))
    if any(outbreak or alert_level == "surge" for alert_level, outbreak in surveillance):
        return "surge"
    if any(alert_level == "watch" for alert_level, _ in surveillance):
        return "watch"
    return "normal"


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
        base_reserve = max(0, int(dispensed_in_seven_days))
    else:
        average_daily_use = db.scalar(
            select(func.max(InventoryBatch.average_daily_use)).where(
                InventoryBatch.hospital_id == hospital_id,
                InventoryBatch.sku_code == sku_code,
                InventoryBatch.quantity > 0,
                (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= today)),
            )
        )
        base_reserve = ceil(max(0, float(average_daily_use or 0)) * 7)

    risk_multiplier = {
        "surge": 1.25,
        "watch": 1.10,
        "normal": 1.0,
    }[hospital_surge_status(db, hospital_id)]
    return ceil(base_reserve * risk_multiplier)
