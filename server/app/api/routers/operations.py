from fastapi import APIRouter, Depends, HTTPException
import math
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital, InventoryBatch, ScenarioRun
from app.schemas import HospitalAdminIdentity, HospitalRead, HospitalSettingsUpdate, ScenarioRunCreate, ScenarioRunRead
from app.services.geography import hospital_coordinates
from app.services.realtime import publish_hospital_event


router = APIRouter(prefix="/operations", tags=["Hospital Operations"])


@router.get("/settings", response_model=HospitalRead)
def get_hospital_settings(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    return db.get(Hospital, identity.hospital_id)


@router.put("/settings", response_model=HospitalRead)
def update_hospital_settings(
    payload: HospitalSettingsUpdate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    hospital = db.get(Hospital, identity.hospital_id)
    if hospital is None:
        raise HTTPException(status_code=404, detail="Hospital not found")
    merged_settings = {**(hospital.settings or {}), **payload.settings}
    has_latitude = "latitude" in merged_settings
    has_longitude = "longitude" in merged_settings
    if has_latitude != has_longitude or (
        has_latitude and hospital_coordinates(merged_settings) is None
    ):
        raise HTTPException(status_code=422, detail="Latitude and longitude must be valid coordinates")
    hospital.settings = merged_settings
    db.commit()
    db.refresh(hospital)
    publish_hospital_event({identity.hospital_id}, "hospital.updated")
    return hospital


@router.post("/scenarios", response_model=ScenarioRunRead, status_code=201)
def run_scenario(
    payload: ScenarioRunCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    batches = list(
        db.scalars(select(InventoryBatch).where(InventoryBatch.hospital_id == identity.hospital_id))
    )
    projections = []
    for batch in batches:
        daily_use = batch.average_daily_use * payload.demand_multiplier
        available_after_delay = max(0, batch.quantity - daily_use * payload.supplier_delay_days)
        days_until_stockout = available_after_delay / daily_use if daily_use > 0 else None
        projections.append(
            {
                "inventory_batch_id": str(batch.id),
                "sku_code": batch.sku_code,
                "medicine_name": batch.sku_name,
                "current_quantity": batch.quantity,
                "adjusted_daily_use": round(daily_use, 2),
                "days_until_stockout": round(days_until_stockout, 1) if days_until_stockout is not None else None,
                "at_risk": days_until_stockout is not None and days_until_stockout <= 7,
                "recommended_replenishment_quantity": max(
                    0,
                    math.ceil(daily_use * (payload.supplier_delay_days + 7) - batch.quantity),
                ),
            }
        )
    scenario_risk_score = min(
        100,
        round(
            18.2
            + max(0, payload.demand_multiplier - 1) * 22
            + payload.supplier_delay_days * 1.6
            + payload.reproduction_index * 18,
            1,
        ),
    )
    results = {
        "inventory_batches_analyzed": len(batches),
        "at_risk_batches": sum(1 for item in projections if item["at_risk"]),
        "scenario_risk_score": scenario_risk_score,
        "projections": projections,
    }
    scenario = ScenarioRun(
        hospital_id=identity.hospital_id,
        scenario_type=payload.scenario_type,
        demand_multiplier=payload.demand_multiplier,
        supplier_delay_days=payload.supplier_delay_days,
        reproduction_index=payload.reproduction_index,
        results=results,
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)
    return scenario


@router.get("/scenarios", response_model=list[ScenarioRunRead])
def list_scenarios(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    return list(
        db.scalars(
            select(ScenarioRun)
            .where(ScenarioRun.hospital_id == identity.hospital_id)
            .order_by(ScenarioRun.created_at.desc())
        )
    )