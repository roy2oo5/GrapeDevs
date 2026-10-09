from datetime import date, timedelta
from math import ceil
from uuid import UUID

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models import (
    HospitalSurveillance,
    InventoryBatch,
    MedicineDailyUsage,
    SurplusListing,
    TransferRequest,
)
from app.services.stock import hospital_surge_status, seven_day_stock_reserve


ACTIVE_INCOMING_STATUSES = (
    "approved",
    "pending_pickup",
    "in_transit",
    "arrived_awaiting_inspection",
    "exception",
)


def recommend_request_allocations(
    db: Session,
    source_hospital_id: UUID,
    sku_code: str,
    requests: list[TransferRequest],
) -> dict[UUID, dict[str, int | float | str | None]]:
    today = date.today()
    source_batches = list(db.scalars(
        select(InventoryBatch).where(
            InventoryBatch.hospital_id == source_hospital_id,
            InventoryBatch.sku_code == sku_code,
            InventoryBatch.quantity > 0,
            InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= today),
        )
    ))
    supplier_unreserved = sum(
        max(0, batch.quantity - batch.reserved_quantity) for batch in source_batches
    )
    active_listed_quantity = int(db.scalar(
        select(func.coalesce(func.sum(SurplusListing.quantity_available), 0)).where(
            SurplusListing.hospital_id == source_hospital_id,
            SurplusListing.sku_code == sku_code,
            SurplusListing.status == "active",
            SurplusListing.expires_on.is_(None) | (SurplusListing.expires_on >= today),
        )
    ) or 0)
    supplier_reserve = seven_day_stock_reserve(db, source_hospital_id, sku_code)
    supplier_surge_status = hospital_surge_status(db, source_hospital_id)
    supplier_shareable = max(
        0, supplier_unreserved - supplier_reserve - active_listed_quantity
    )

    recipient_ids = {transfer.requesting_hospital_id for transfer in requests}
    eligible_batch = (
        (InventoryBatch.quantity > 0)
        & (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= today))
    )
    inventory_statistics = {
        hospital_id: (int(on_hand or 0), float(average_daily_use or 0))
        for hospital_id, on_hand, average_daily_use in db.execute(
            select(
                InventoryBatch.hospital_id,
                func.sum(case(
                    (eligible_batch, InventoryBatch.quantity - InventoryBatch.reserved_quantity),
                    else_=0,
                )),
                func.max(case(
                    (eligible_batch, InventoryBatch.average_daily_use),
                    else_=None,
                )),
            )
            .where(
                InventoryBatch.hospital_id.in_(recipient_ids),
                InventoryBatch.sku_code == sku_code,
            )
            .group_by(InventoryBatch.hospital_id)
        )
    }
    incoming_quantities = {
        hospital_id: int(quantity or 0)
        for hospital_id, quantity in db.execute(
            select(
                TransferRequest.requesting_hospital_id,
                func.sum(TransferRequest.quantity),
            )
            .where(
                TransferRequest.requesting_hospital_id.in_(recipient_ids),
                TransferRequest.sku_code == sku_code,
                TransferRequest.status.in_(ACTIVE_INCOMING_STATUSES),
            )
            .group_by(TransferRequest.requesting_hospital_id)
        )
    }
    usage_statistics = {
        hospital_id: int(quantity or 0)
        for hospital_id, quantity in db.execute(
            select(
                MedicineDailyUsage.hospital_id,
                func.sum(MedicineDailyUsage.quantity_dispensed),
            )
            .where(
                MedicineDailyUsage.hospital_id.in_(recipient_ids),
                MedicineDailyUsage.sku_code == sku_code,
                MedicineDailyUsage.usage_date >= today - timedelta(days=6),
                MedicineDailyUsage.usage_date <= today,
            )
            .group_by(MedicineDailyUsage.hospital_id)
        )
    }
    surveillance_by_hospital: dict[UUID, list[tuple[str, bool]]] = {}
    for hospital_id, alert_level, outbreak_flag in db.execute(
        select(
            HospitalSurveillance.hospital_id,
            HospitalSurveillance.alert_level,
            HospitalSurveillance.outbreak_flag,
        ).where(
            HospitalSurveillance.hospital_id.in_(recipient_ids),
            HospitalSurveillance.report_date >= today - timedelta(days=6),
            HospitalSurveillance.report_date <= today,
        )
    ):
        surveillance_by_hospital.setdefault(hospital_id, []).append(
            (alert_level, outbreak_flag)
        )

    candidates: list[dict[str, int | float | str | UUID | None]] = []
    remaining_need_by_hospital: dict[UUID, int] = {}
    for transfer in sorted(requests, key=lambda row: (row.created_at, str(row.id))):
        on_hand, average_daily_use = inventory_statistics.get(
            transfer.requesting_hospital_id, (0, 0.0)
        )
        projected_stock = on_hand + incoming_quantities.get(
            transfer.requesting_hospital_id, 0
        )
        has_usage_records = transfer.requesting_hospital_id in usage_statistics
        if has_usage_records:
            daily_use = max(
                0.0, usage_statistics[transfer.requesting_hospital_id] / 7
            )
            use_source = "recorded 7-day use"
        else:
            daily_use = max(0.0, average_daily_use)
            use_source = "inventory average" if daily_use > 0 else "no usage history"
        surveillance = surveillance_by_hospital.get(transfer.requesting_hospital_id, [])
        if any(outbreak or alert_level == "surge" for alert_level, outbreak in surveillance):
            surge_status, demand_multiplier = "surge", 1.25
        elif any(alert_level == "watch" for alert_level, _ in surveillance):
            surge_status, demand_multiplier = "watch", 1.10
        else:
            surge_status, demand_multiplier = "normal", 1.0
        adjusted_daily_use = daily_use * demand_multiplier
        days_of_stock = (
            projected_stock / adjusted_daily_use if adjusted_daily_use > 0 else None
        )
        needed = (
            max(0, ceil(adjusted_daily_use * 7 - projected_stock))
            if adjusted_daily_use > 0 else 0
        )
        hospital_need = remaining_need_by_hospital.setdefault(
            transfer.requesting_hospital_id, needed
        )
        request_need = min(transfer.quantity, hospital_need)
        remaining_need_by_hospital[transfer.requesting_hospital_id] = (
            hospital_need - request_need
        )
        candidates.append({
            "transfer_id": transfer.id,
            "requested": transfer.quantity,
            "need": request_need,
            "days_of_stock": days_of_stock,
            "surge_status": surge_status,
            "use_source": use_source,
            "urgency": transfer.urgency,
            "created_at": transfer.created_at,
        })

    recommended = {candidate["transfer_id"]: 0 for candidate in candidates}
    remaining_pool = supplier_shareable
    active_candidates = [candidate for candidate in candidates if candidate["need"] > 0]
    urgency_weights = {"critical": 1.5, "high": 1.2, "normal": 1.0}
    while remaining_pool > 0 and active_candidates:
        weights: dict[UUID, float] = {}
        for candidate in active_candidates:
            days_of_stock = candidate["days_of_stock"]
            shortage_weight = (
                1.5 if days_of_stock is not None and days_of_stock <= 3
                else 1.2 if days_of_stock is not None and days_of_stock <= 7
                else 1.0
            )
            weights[candidate["transfer_id"]] = (
                float(candidate["need"] - recommended[candidate["transfer_id"]])
                * urgency_weights[candidate["urgency"]]
                * shortage_weight
            )
        total_weight = sum(weights.values())
        if total_weight <= 0:
            break

        proposed = {
            candidate["transfer_id"]: remaining_pool * weights[candidate["transfer_id"]] / total_weight
            for candidate in active_candidates
        }
        capped = [
            candidate for candidate in active_candidates
            if proposed[candidate["transfer_id"]]
            >= candidate["need"] - recommended[candidate["transfer_id"]]
        ]
        if capped:
            for candidate in capped:
                transfer_id = candidate["transfer_id"]
                amount = int(candidate["need"]) - recommended[transfer_id]
                recommended[transfer_id] += amount
                remaining_pool -= amount
            active_candidates = [
                candidate for candidate in active_candidates if candidate not in capped
            ]
            continue

        floors = {
            transfer_id: int(amount) for transfer_id, amount in proposed.items()
        }
        for transfer_id, amount in floors.items():
            recommended[transfer_id] += amount
        remaining_pool -= sum(floors.values())
        remainder_order = sorted(
            active_candidates,
            key=lambda candidate: (
                -(proposed[candidate["transfer_id"]] - floors[candidate["transfer_id"]]),
                -(urgency_weights[candidate["urgency"]]),
                candidate["created_at"],
                str(candidate["transfer_id"]),
            ),
        )
        for candidate in remainder_order:
            transfer_id = candidate["transfer_id"]
            if remaining_pool <= 0:
                break
            if recommended[transfer_id] < candidate["need"]:
                recommended[transfer_id] += 1
                remaining_pool -= 1
        break

    return {
        candidate["transfer_id"]: {
            "allocation_suggested_quantity": recommended[candidate["transfer_id"]],
            "allocation_requested_quantity": int(candidate["requested"]),
            "allocation_supplier_shareable": supplier_shareable,
            "allocation_recipient_need": int(candidate["need"]),
            "allocation_recipient_stock_days": (
                round(float(candidate["days_of_stock"]), 1)
                if candidate["days_of_stock"] is not None else None
            ),
            "allocation_surge_status": str(candidate["surge_status"]),
            "allocation_supplier_surge_status": supplier_surge_status,
            "allocation_explanation": (
                f"Based on {candidate['use_source']}, {candidate['surge_status']} recipient demand, "
                f"and the 7-day stock target; your {supplier_surge_status} level is reflected in your reserve."
            ),
        }
        for candidate in candidates
    }
