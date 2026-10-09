from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, aliased

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import (
    Hospital,
    HospitalAgreement,
    HospitalSurveillance,
    InventoryBatch,
    MedicineDailyUsage,
    ScenarioRun,
    SurplusListing,
    TransferAuditEvent,
    TransferCustodyEvent,
    TransferIncident,
    TransferItem,
    TransferLocationPoint,
    TransferReceipt,
    TransferRequest,
    TransferTrackingSession,
)
from app.schemas import HospitalAdminIdentity
from app.services.geography import is_within_hospital_radius


router = APIRouter(prefix="/hospital-data", tags=["Hospital Data"])


@router.get("/search")
def search_hospital_data(
    q: str = Query(min_length=2, max_length=120),
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    term = q.strip()
    if len(term) < 2:
        return {"query": term, "results": []}
    pattern = f"%{term}%"
    results = []
    current_hospital = db.get(Hospital, identity.hospital_id)

    batches = db.scalars(
        select(InventoryBatch)
        .where(
            InventoryBatch.hospital_id == identity.hospital_id,
            or_(
                InventoryBatch.sku_code.ilike(pattern),
                InventoryBatch.sku_name.ilike(pattern),
                InventoryBatch.lot_number.ilike(pattern),
            ),
        )
        .order_by(InventoryBatch.expires_on.asc().nullslast(), InventoryBatch.created_at.desc())
        .limit(5)
    )
    results.extend({
        "type": "Inventory",
        "id": str(batch.id),
        "title": batch.sku_name,
        "detail": f"{batch.sku_code} · {batch.quantity} {batch.unit}",
        "sku_code": batch.sku_code,
        "unit": batch.unit,
        "view": "inventory-and-skus",
    } for batch in batches)

    source = aliased(Hospital)
    receiver = aliased(Hospital)
    transfer_rows = db.execute(
        select(TransferRequest, source.name, receiver.name)
        .outerjoin(source, TransferRequest.source_hospital_id == source.id)
        .outerjoin(receiver, TransferRequest.requesting_hospital_id == receiver.id)
        .where(
            (TransferRequest.source_hospital_id == identity.hospital_id)
            | (TransferRequest.requesting_hospital_id == identity.hospital_id),
            or_(
                TransferRequest.sku_code.ilike(pattern),
                TransferRequest.sku_name.ilike(pattern),
                TransferRequest.status.ilike(pattern),
                TransferRequest.notes.ilike(pattern),
                source.name.ilike(pattern),
                receiver.name.ilike(pattern),
            ),
        )
        .order_by(TransferRequest.created_at.desc())
        .limit(5)
    )
    results.extend({
        "type": "Transfer",
        "id": str(transfer.id),
        "title": transfer.sku_name,
        "detail": f"{transfer.status.replace('_', ' ').title()} · {transfer.quantity} {transfer.unit} · {source_name or 'Hospital'} → {receiver_name or 'Hospital'}",
        "view": "transfers-and-logistics",
    } for transfer, source_name, receiver_name in transfer_rows)

    partner = aliased(Hospital)
    agreement_rows = db.execute(
        select(HospitalAgreement, Hospital.name, partner.name)
        .join(Hospital, HospitalAgreement.hospital_id == Hospital.id)
        .join(partner, HospitalAgreement.partner_hospital_id == partner.id)
        .where(
            (HospitalAgreement.hospital_id == identity.hospital_id)
            | (HospitalAgreement.partner_hospital_id == identity.hospital_id),
            or_(
                HospitalAgreement.title.ilike(pattern),
                HospitalAgreement.agreement_type.ilike(pattern),
                HospitalAgreement.status.ilike(pattern),
                Hospital.name.ilike(pattern),
                partner.name.ilike(pattern),
            ),
        )
        .order_by(HospitalAgreement.updated_at.desc())
        .limit(5)
    )
    results.extend({
        "type": "MOU",
        "id": str(agreement.id),
        "title": agreement.title,
        "detail": f"{agreement.status.title()} · {hospital_name} ↔ {partner_name}",
        "view": "hospital-network",
    } for agreement, hospital_name, partner_name in agreement_rows)

    listings = db.scalars(
        select(SurplusListing)
        .where(
            SurplusListing.hospital_id == identity.hospital_id,
            or_(
                SurplusListing.sku_code.ilike(pattern),
                SurplusListing.sku_name.ilike(pattern),
                SurplusListing.status.ilike(pattern),
                SurplusListing.notes.ilike(pattern),
            ),
        )
        .order_by(SurplusListing.created_at.desc())
        .limit(5)
    )
    results.extend({
        "type": "Surplus",
        "id": str(listing.id),
        "title": listing.sku_name,
        "detail": f"{listing.status.title()} · {listing.quantity_available} {listing.unit} available",
        "view": "mou-partners",
    } for listing in listings)

    available_listing_rows = db.execute(
        select(SurplusListing, Hospital.name, Hospital)
        .join(Hospital, SurplusListing.hospital_id == Hospital.id)
        .where(
            SurplusListing.hospital_id != identity.hospital_id,
            SurplusListing.status == "active",
            SurplusListing.quantity_available > 0,
            SurplusListing.expires_on.is_(None) | (SurplusListing.expires_on >= date.today()),
            or_(
                SurplusListing.sku_code.ilike(pattern),
                SurplusListing.sku_name.ilike(pattern),
            ),
        )
        .order_by(SurplusListing.expires_on.asc().nullslast(), SurplusListing.created_at.desc())
        .limit(25)
    )
    if current_hospital is not None:
        nearby_surplus = [{
            "type": "Nearby surplus",
            "id": str(listing.id),
            "title": listing.sku_name,
            "detail": f"{hospital_name} · {listing.quantity_available} {listing.unit} available",
            "view": "mou-partners",
        } for listing, hospital_name, listing_hospital in available_listing_rows
            if is_within_hospital_radius(current_hospital, listing_hospital)]
        results.extend(nearby_surplus[:5])

    usage_rows = db.scalars(
        select(MedicineDailyUsage)
        .where(
            MedicineDailyUsage.hospital_id == identity.hospital_id,
            or_(
                MedicineDailyUsage.sku_code.ilike(pattern),
                MedicineDailyUsage.sku_name.ilike(pattern),
            ),
        )
        .order_by(MedicineDailyUsage.usage_date.desc())
        .limit(5)
    )
    results.extend({
        "type": "Usage",
        "id": str(row.id),
        "title": row.sku_name,
        "detail": f"{row.usage_date.isoformat()} · Dispensed {row.quantity_dispensed}",
        "view": "forecast-data",
    } for row in usage_rows)

    surveillance_rows = db.scalars(
        select(HospitalSurveillance)
        .where(
            HospitalSurveillance.hospital_id == identity.hospital_id,
            or_(
                HospitalSurveillance.syndrome.ilike(pattern),
                HospitalSurveillance.alert_level.ilike(pattern),
            ),
        )
        .order_by(HospitalSurveillance.report_date.desc())
        .limit(5)
    )
    results.extend({
        "type": "Surveillance",
        "id": str(row.id),
        "title": row.syndrome,
        "detail": f"{row.report_date.isoformat()} · {row.alert_level.title()} · {row.new_cases} cases",
        "view": "outbreak-surveillance",
    } for row in surveillance_rows)

    scenarios = db.scalars(
        select(ScenarioRun)
        .where(
            ScenarioRun.hospital_id == identity.hospital_id,
            ScenarioRun.scenario_type.ilike(pattern),
        )
        .order_by(ScenarioRun.created_at.desc())
        .limit(5)
    )
    results.extend({
        "type": "Scenario",
        "id": str(scenario.id),
        "title": scenario.scenario_type,
        "detail": f"Demand ×{scenario.demand_multiplier:g} · {scenario.supplier_delay_days}-day supplier delay",
        "view": "scenario-simulation",
    } for scenario in scenarios)

    if current_hospital is not None:
        hospital_rows = db.scalars(
            select(Hospital)
            .where(
                Hospital.id != identity.hospital_id,
                Hospital.status == "active",
                Hospital.name.ilike(pattern),
            )
            .order_by(Hospital.name)
            .limit(25)
        )
        results.extend({
            "type": "Hospital",
            "id": str(hospital.id),
            "title": hospital.name,
            "detail": f"Nearby {hospital.classification} hospital",
            "view": "hospital-network",
        } for hospital in hospital_rows if is_within_hospital_radius(current_hospital, hospital))

    return {"query": term, "results": results}


@router.get("/export")
def export_hospital_data(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    hospital = db.get(Hospital, identity.hospital_id)
    transfers = list(db.scalars(
        select(TransferRequest)
        .where(
            (TransferRequest.source_hospital_id == identity.hospital_id)
            | (TransferRequest.requesting_hospital_id == identity.hospital_id)
        )
        .order_by(TransferRequest.created_at.desc())
    ))
    transfer_ids = [transfer.id for transfer in transfers]
    tracking_sessions = list(db.scalars(
        select(TransferTrackingSession)
        .where(TransferTrackingSession.transfer_id.in_(transfer_ids))
        .order_by(TransferTrackingSession.started_at.desc())
    )) if transfer_ids else []
    tracking_session_ids = [session.id for session in tracking_sessions]

    return {
        "exported_at": datetime.now(timezone.utc),
        "hospital": {
            "id": str(identity.hospital_id),
            "name": hospital.name if hospital else identity.hospital_name,
        },
        "inventory": list(db.scalars(
            select(InventoryBatch)
            .where(InventoryBatch.hospital_id == identity.hospital_id)
            .order_by(InventoryBatch.created_at.desc())
        )),
        "transfers": transfers,
        "transfer_items": list(db.scalars(
            select(TransferItem)
            .where(TransferItem.transfer_id.in_(transfer_ids))
            .order_by(TransferItem.transfer_id)
        )) if transfer_ids else [],
        "transfer_receipts": list(db.scalars(
            select(TransferReceipt)
            .where(TransferReceipt.transfer_id.in_(transfer_ids))
            .order_by(TransferReceipt.inspected_at.desc())
        )) if transfer_ids else [],
        "transfer_audit": list(db.scalars(
            select(TransferAuditEvent)
            .where(TransferAuditEvent.transfer_id.in_(transfer_ids))
            .order_by(TransferAuditEvent.created_at)
        )) if transfer_ids else [],
        "transfer_custody": list(db.scalars(
            select(TransferCustodyEvent)
            .where(TransferCustodyEvent.transfer_id.in_(transfer_ids))
            .order_by(TransferCustodyEvent.recorded_at)
        )) if transfer_ids else [],
        "transfer_incidents": list(db.scalars(
            select(TransferIncident)
            .where(TransferIncident.transfer_id.in_(transfer_ids))
            .order_by(TransferIncident.occurred_at)
        )) if transfer_ids else [],
        "tracking_sessions": tracking_sessions,
        "tracking_points": list(db.scalars(
            select(TransferLocationPoint)
            .where(TransferLocationPoint.tracking_session_id.in_(tracking_session_ids))
            .order_by(TransferLocationPoint.captured_at)
        )) if tracking_session_ids else [],
        "surplus_listings": list(db.scalars(
            select(SurplusListing)
            .where(SurplusListing.hospital_id == identity.hospital_id)
            .order_by(SurplusListing.created_at.desc())
        )),
        "agreements": list(db.scalars(
            select(HospitalAgreement)
            .where(
                (HospitalAgreement.hospital_id == identity.hospital_id)
                | (HospitalAgreement.partner_hospital_id == identity.hospital_id)
            )
            .order_by(HospitalAgreement.updated_at.desc())
        )),
        "daily_usage": list(db.scalars(
            select(MedicineDailyUsage)
            .where(MedicineDailyUsage.hospital_id == identity.hospital_id)
            .order_by(MedicineDailyUsage.usage_date.desc())
        )),
        "surveillance": list(db.scalars(
            select(HospitalSurveillance)
            .where(HospitalSurveillance.hospital_id == identity.hospital_id)
            .order_by(HospitalSurveillance.report_date.desc())
        )),
        "scenarios": list(db.scalars(
            select(ScenarioRun)
            .where(ScenarioRun.hospital_id == identity.hospital_id)
            .order_by(ScenarioRun.created_at.desc())
        )),
        "generated_on": date.today().isoformat(),
    }
