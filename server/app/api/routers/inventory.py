from datetime import date, timedelta
from uuid import UUID

import httpx
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.core.config import get_settings
from app.models import Hospital, HospitalAgreement, HospitalSurveillance, InventoryBatch, MedicineDailyUsage, SurplusListing, TransferAuditEvent, TransferRequest
from app.schemas import (
    HospitalAdminIdentity,
    InventoryBatchCreate,
    InventoryBatchDeletePayload,
    InventoryBatchRead,
    InventoryBatchUpdate,
    InventoryUsageUpdate,
    MOUInventoryRequestCreate,
)
from app.services.geography import is_within_hospital_radius
from app.services.realtime import publish_hospital_event
from app.services.stock import seven_day_stock_reserve


router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    dependencies=[Depends(get_current_hospital_admin)],
)


@router.post("/batches", response_model=InventoryBatchRead, status_code=status.HTTP_201_CREATED)
def create_inventory_batch(
    payload: InventoryBatchCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    if payload.hospital_id is not None and payload.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Inventory can only be added to your hospital")
    if db.get(Hospital, identity.hospital_id) is None:
        raise HTTPException(status_code=404, detail="Hospital not found")

    batch = InventoryBatch(
        hospital_id=identity.hospital_id,
        **payload.model_dump(exclude={"hospital_id"}),
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    publish_hospital_event({identity.hospital_id}, "inventory.updated", batch_id=str(batch.id))
    return batch


@router.get("/forecast")
async def inventory_forecast(
    horizon_days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batches = list(
        db.scalars(
            select(InventoryBatch).where(
                InventoryBatch.hospital_id == identity.hospital_id,
                InventoryBatch.quantity > 0,
            )
        )
    )
    forecasts = []
    latest_surveillance = db.scalar(
        select(HospitalSurveillance)
        .where(
            HospitalSurveillance.hospital_id == identity.hospital_id,
            HospitalSurveillance.report_date >= date.today() - timedelta(days=7),
        )
        .order_by(HospitalSurveillance.report_date.desc())
    )
    surveillance_multiplier = 1.0
    surveillance_status = "no_recent_surveillance"
    if latest_surveillance is not None:
        surveillance_status = latest_surveillance.alert_level
        if latest_surveillance.outbreak_flag or latest_surveillance.alert_level == "surge":
            surveillance_multiplier = 1.25
        elif latest_surveillance.alert_level == "watch":
            surveillance_multiplier = 1.10
    forecast_client = httpx.AsyncClient(timeout=60.0) if horizon_days in (7, 14) else None
    settings = get_settings()
    try:
      for batch in batches:
        recent_usage = db.scalar(
            select(func.avg(MedicineDailyUsage.quantity_dispensed)).where(
                MedicineDailyUsage.hospital_id == identity.hospital_id,
                MedicineDailyUsage.sku_code == batch.sku_code,
                MedicineDailyUsage.usage_date >= date.today() - timedelta(days=30),
            )
        )
        usage_rows = list(db.scalars(
            select(MedicineDailyUsage)
            .where(
                MedicineDailyUsage.hospital_id == identity.hospital_id,
                MedicineDailyUsage.sku_code == batch.sku_code,
            )
            .order_by(MedicineDailyUsage.usage_date.asc())
        ))
        ml_forecast = None
        if forecast_client is not None and len(usage_rows) >= 28:
            surveillance_rows = list(db.scalars(
                select(HospitalSurveillance).where(
                    HospitalSurveillance.hospital_id == identity.hospital_id,
                    HospitalSurveillance.report_date.in_([row.usage_date for row in usage_rows]),
                )
            ))
            outbreak_by_date = {
                row.report_date.isoformat(): int(row.outbreak_flag or row.alert_level == "surge")
                for row in surveillance_rows
            }
            history = [
                {
                    "date": row.usage_date.isoformat(),
                    "quantity_requested": row.quantity_requested or row.quantity_dispensed or row.quantity_issued,
                    "outbreak_flag": outbreak_by_date.get(row.usage_date.isoformat(), 0),
                }
                for row in usage_rows
            ]
            try:
                response = await forecast_client.post(
                    f"{settings.FORECAST_SERVICE_URL.rstrip('/')}/predict/real-history",
                    json={
                        "hospital_id": str(identity.hospital_id),
                        "medicine_id": batch.sku_code,
                        "horizon_days": horizon_days,
                        "outbreak_flag": int(bool(latest_surveillance and (
                            latest_surveillance.outbreak_flag or latest_surveillance.alert_level == "surge"
                        ))),
                        "history": history,
                    },
                )
                if response.status_code < 400:
                    ml_forecast = response.json()
            except httpx.RequestError:
                ml_forecast = None

        base_daily_use = float(recent_usage) if recent_usage is not None else batch.average_daily_use
        if ml_forecast:
            daily_values = [float(item["predicted_demand"]) for item in ml_forecast["predictions"]]
            daily_use = sum(daily_values) / len(daily_values)
            daily_forecast = [
                {
                    "date": item["date"],
                    "predicted_demand": round(float(item["predicted_demand"]), 2),
                    "projected_quantity": round(max(0, batch.quantity - sum(daily_values[:index + 1])), 2),
                }
                for index, item in enumerate(ml_forecast["predictions"])
            ]
            data_source = "lightgbm_real_history"
        else:
            daily_use = base_daily_use * surveillance_multiplier
            daily_forecast = [
                {
                    "date": (date.today() + timedelta(days=offset)).isoformat(),
                    "predicted_demand": round(daily_use, 2),
                    "projected_quantity": round(max(0, batch.quantity - (daily_use * (offset + 1))), 2),
                }
                for offset in range(horizon_days)
            ]
            data_source = "daily_usage_records" if recent_usage is not None else "inventory_batch_average"
        projected_use = daily_use * horizon_days
        days_remaining = (
            batch.quantity / daily_use
            if daily_use > 0
            else None
        )
        risk_level = (
            "critical_shortage"
            if days_remaining is not None and days_remaining <= 3
            else "shortage_within_horizon"
            if days_remaining is not None and days_remaining <= horizon_days
            else "no_shortage_projected"
        )
        forecasts.append(
            {
                "inventory_batch_id": str(batch.id),
                "sku_code": batch.sku_code,
                "medicine_name": batch.sku_name,
                "current_quantity": batch.quantity,
                "average_daily_use": round(daily_use, 2),
                "base_daily_use": round(base_daily_use, 2),
                "data_source": data_source,
                "ml_model_version": ml_forecast.get("model_version") if ml_forecast else None,
                "surveillance_status": surveillance_status,
                "surveillance_multiplier": surveillance_multiplier,
                "horizon_days": horizon_days,
                "projected_quantity": max(0, batch.quantity - projected_use),
                "days_until_stockout": round(days_remaining, 1) if days_remaining is not None else None,
                "stockout_within_horizon": days_remaining is not None and days_remaining <= horizon_days,
                "risk_level": risk_level,
                "daily_forecast": daily_forecast,
                "expires_on": batch.expires_on.isoformat() if batch.expires_on else None,
            }
        )
    finally:
        if forecast_client is not None:
            await forecast_client.aclose()
    return {"hospital_id": str(identity.hospital_id), "horizon_days": horizon_days, "forecasts": forecasts}


@router.get("/mou-availability")
def mou_inventory_availability(
    sku_code: str = Query(min_length=1),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    """Show same-SKU stock at active MOU partners after their 7-day reserve."""
    partner_ids = db.scalars(
        select(HospitalAgreement.partner_hospital_id).where(
            HospitalAgreement.hospital_id == identity.hospital_id,
            HospitalAgreement.status == "active",
        )
    ).all()
    reverse_partner_ids = db.scalars(
        select(HospitalAgreement.hospital_id).where(
            HospitalAgreement.partner_hospital_id == identity.hospital_id,
            HospitalAgreement.status == "active",
        )
    ).all()
    partner_ids = set(partner_ids).union(reverse_partner_ids)
    current_hospital = db.get(Hospital, identity.hospital_id)
    partner_hospitals = list(
        db.scalars(select(Hospital).where(Hospital.id.in_(partner_ids), Hospital.status == "active"))
    )
    partner_ids = {
        hospital.id
        for hospital in partner_hospitals
        if current_hospital is not None
        and is_within_hospital_radius(current_hospital, hospital)
    }
    if not partner_ids:
        return {"sku_code": sku_code, "partners": []}

    batches = db.scalars(
        select(InventoryBatch).where(
            InventoryBatch.hospital_id.in_(partner_ids),
            InventoryBatch.sku_code == sku_code,
            InventoryBatch.quantity > 0,
            InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= date.today()),
        ).order_by(
            InventoryBatch.hospital_id,
            InventoryBatch.expires_on.asc().nullslast(),
            InventoryBatch.created_at.asc(),
        )
    ).all()
    hospitals = {hospital.id: hospital.name for hospital in partner_hospitals if hospital.id in partner_ids}
    batches_by_hospital: dict[UUID, list[InventoryBatch]] = {}
    for batch in batches:
        batches_by_hospital.setdefault(batch.hospital_id, []).append(batch)
    partners = []
    for hospital_id, hospital_batches in batches_by_hospital.items():
        total_on_hand, reserve, shareable_by_batch = mou_shareable_quantities(
            db, hospital_id, sku_code, hospital_batches
        )
        for batch in hospital_batches:
            partners.append({
                "hospital_id": str(batch.hospital_id),
                "hospital_name": hospitals.get(batch.hospital_id, "MOU hospital"),
                "sku_code": batch.sku_code,
                "sku_name": batch.sku_name,
                "quantity_on_hand": total_on_hand,
                "average_daily_use": batch.average_daily_use,
                "protected_reserve": reserve,
                "quantity_shareable": shareable_by_batch.get(batch.id, 0),
                "inventory_batch_id": str(batch.id),
                "expires_on": batch.expires_on.isoformat() if batch.expires_on else None,
            })
    return {"sku_code": sku_code, "partners": partners}


@router.post("/mou-availability/request", status_code=status.HTTP_201_CREATED)
def request_mou_inventory(
    payload: MOUInventoryRequestCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batch = db.get(InventoryBatch, payload.inventory_batch_id)
    requester = db.get(Hospital, identity.hospital_id)
    if batch is None or batch.hospital_id == identity.hospital_id:
        raise HTTPException(status_code=404, detail="MOU inventory batch not found")
    owner = db.get(Hospital, batch.hospital_id)
    if owner is None or requester is None or not is_within_hospital_radius(requester, owner):
        raise HTTPException(status_code=403, detail="MOU inventory is outside the 50 km sharing radius")

    active_mou = db.scalar(
        select(HospitalAgreement.id).where(
            HospitalAgreement.status == "active",
            (
                ((HospitalAgreement.hospital_id == identity.hospital_id) & (HospitalAgreement.partner_hospital_id == owner.id))
                | ((HospitalAgreement.hospital_id == owner.id) & (HospitalAgreement.partner_hospital_id == identity.hospital_id))
            ),
        )
    )
    if active_mou is None:
        raise HTTPException(status_code=403, detail="An active MOU is required to request this inventory")

    owner_batches = list(db.scalars(
        select(InventoryBatch).where(
            InventoryBatch.hospital_id == owner.id,
            InventoryBatch.sku_code == batch.sku_code,
            InventoryBatch.quantity > 0,
            InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= date.today()),
        ).order_by(
            InventoryBatch.expires_on.asc().nullslast(),
            InventoryBatch.created_at.asc(),
        )
    ))
    _, _, shareable_by_batch = mou_shareable_quantities(
        db, owner.id, batch.sku_code, owner_batches
    )
    shareable = shareable_by_batch.get(batch.id, 0)
    if payload.quantity > shareable:
        raise HTTPException(
            status_code=409,
            detail=f"Only {shareable} units are currently shareable after keeping the owner's 7-day reserve",
        )
    duplicate = db.scalar(
        select(TransferRequest).where(
            TransferRequest.requesting_hospital_id == identity.hospital_id,
            TransferRequest.source_hospital_id == owner.id,
            TransferRequest.sku_code == batch.sku_code,
            TransferRequest.status.in_((
                "requested", "approved", "pending_pickup", "in_transit",
                "arrived_awaiting_inspection", "exception",
            )),
        )
    )
    if duplicate is not None:
        raise HTTPException(status_code=409, detail="You already have an active request for this medicine")

    transfer = TransferRequest(
        requesting_hospital_id=identity.hospital_id,
        source_hospital_id=owner.id,
        sku_code=batch.sku_code,
        sku_name=batch.sku_name,
        quantity=payload.quantity,
        unit=batch.unit,
        urgency=payload.urgency,
        department=payload.department,
        notes=payload.notes,
    )
    db.add(transfer)
    db.flush()
    db.add(TransferAuditEvent(
        transfer_id=transfer.id,
        actor_hospital_id=identity.hospital_id,
        from_status=None,
        to_status="requested",
        quantity=transfer.quantity,
    ))
    db.commit()
    db.refresh(transfer)
    publish_hospital_event(
        {identity.hospital_id, owner.id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return {"transfer": transfer, "owner_hospital_name": owner.name}


@router.get("/batches", response_model=list[InventoryBatchRead])
def list_inventory_batches(
    hospital_id: UUID | None = None,
    sku_code: str | None = None,
    expiring_within_days: int | None = Query(default=None, ge=0, le=3650),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    statement = select(InventoryBatch).order_by(
        InventoryBatch.expires_on.asc().nullslast(),
        InventoryBatch.created_at.desc(),
    )
    if hospital_id is not None and hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Inventory can only be viewed for your hospital")
    statement = statement.where(InventoryBatch.hospital_id == identity.hospital_id)
    if sku_code:
        statement = statement.where(InventoryBatch.sku_code == sku_code)
    if expiring_within_days is not None:
        today = date.today()
        cutoff = today + timedelta(days=expiring_within_days)
        statement = statement.where(
            InventoryBatch.expires_on >= today,
            InventoryBatch.expires_on <= cutoff,
        )
    return list(db.scalars(statement.limit(limit)))


@router.patch("/batches/{batch_id}", response_model=InventoryBatchRead)
def update_inventory_batch(
    batch_id: UUID,
    payload: InventoryBatchUpdate,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    batch = db.scalar(
        select(InventoryBatch).where(InventoryBatch.id == batch_id).with_for_update()
    )
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    if payload.quantity < batch.reserved_quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot reduce stock below {batch.reserved_quantity} units reserved for active transfers",
        )
    batch.quantity = payload.quantity
    db.commit()
    db.refresh(batch)
    publish_hospital_event({identity.hospital_id}, "inventory.updated", batch_id=str(batch.id))
    return batch


def _perform_delete_inventory_batch(
    batch_id: UUID,
    db: Session,
    identity: HospitalAdminIdentity,
):
    batch = db.scalar(
        select(InventoryBatch).where(InventoryBatch.id == batch_id).with_for_update()
    )
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    if batch.reserved_quantity:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete a batch with {batch.reserved_quantity} units reserved for an active transfer",
        )
    db.delete(batch)
    db.commit()


@router.delete("/batches/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batches/{batch_id}/", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batch/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batch/{batch_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch(
    batch_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    _perform_delete_inventory_batch(batch_id, db, identity)


@router.delete("/batches", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/batches/", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch_by_param_or_body(
    batch_id: UUID | None = Query(default=None),
    id: UUID | None = Query(default=None),
    payload: InventoryBatchDeletePayload | None = Body(default=None),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    target_id = batch_id or id or (payload.batch_id if payload else None) or (payload.id if payload else None)
    if target_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A batch_id or id query parameter or body payload is required to delete an inventory batch",
        )
    _perform_delete_inventory_batch(target_id, db, identity)


@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
@router.delete("/{batch_id}/", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch_by_root_id(
    batch_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    _perform_delete_inventory_batch(batch_id, db, identity)


@router.post("/batches/{batch_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
@router.post("/{batch_id}/delete", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_batch_via_post(
    batch_id: UUID,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    _perform_delete_inventory_batch(batch_id, db, identity)


@router.patch("/batches/{batch_id}/usage", response_model=InventoryBatchRead)
def update_inventory_usage(
    batch_id: UUID,
    payload: InventoryUsageUpdate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batch = db.get(InventoryBatch, batch_id)
    if batch is None or batch.hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Inventory batch not found")
    batch.average_daily_use = payload.average_daily_use
    db.commit()
    db.refresh(batch)
    return batch


def mou_shareable_quantities(
    db: Session, hospital_id: UUID, sku_code: str, batches: list[InventoryBatch]
) -> tuple[int, int, dict[UUID, int]]:
    listed_rows = db.execute(
        select(SurplusListing.inventory_batch_id, func.sum(SurplusListing.quantity_available))
        .where(
            SurplusListing.hospital_id == hospital_id,
            SurplusListing.sku_code == sku_code,
            SurplusListing.status == "active",
            SurplusListing.expires_on.is_(None) | (SurplusListing.expires_on >= date.today()),
        )
        .group_by(SurplusListing.inventory_batch_id)
    )
    listed_by_batch = {batch_id: int(quantity or 0) for batch_id, quantity in listed_rows}
    pending_requests = int(db.scalar(
        select(func.coalesce(func.sum(TransferRequest.quantity), 0)).where(
            TransferRequest.source_hospital_id == hospital_id,
            TransferRequest.sku_code == sku_code,
            TransferRequest.status == "requested",
        )
    ) or 0)
    unlisted_by_batch = {
        batch.id: max(0, batch.quantity - batch.reserved_quantity - listed_by_batch.get(batch.id, 0))
        for batch in batches
    }
    reserve = seven_day_stock_reserve(db, hospital_id, sku_code)
    remaining_shareable = max(
        0,
        sum(unlisted_by_batch.values()) - reserve - pending_requests,
    )
    shareable_by_batch = {}
    for batch in batches:
        batch_shareable = min(unlisted_by_batch[batch.id], remaining_shareable)
        if batch_shareable > 0:
            shareable_by_batch[batch.id] = batch_shareable
            remaining_shareable -= batch_shareable
    return sum(batch.quantity for batch in batches), reserve, shareable_by_batch
