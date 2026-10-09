from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import Hospital, HospitalAgreement, InventoryBatch, TransferRequest


router = APIRouter(tags=["Dashboard"], dependencies=[Depends(get_current_hospital_admin)])


@router.get("/dashboard")
def dashboard_summary(
    identity=Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    today = date.today()
    expiry_cutoff = today + timedelta(days=30)
    inventory_metrics = db.execute(
        select(
            func.coalesce(func.sum(InventoryBatch.quantity), 0),
            func.coalesce(func.sum(case(
                ((InventoryBatch.expires_on >= today) & (InventoryBatch.expires_on <= expiry_cutoff),
                 InventoryBatch.quantity),
                else_=0,
            )), 0),
            func.count(InventoryBatch.id),
            func.coalesce(func.sum(case(
                ((InventoryBatch.average_daily_use > 0)
                 & (InventoryBatch.quantity > InventoryBatch.average_daily_use * 7),
                 InventoryBatch.quantity),
                else_=0,
            )), 0),
            func.coalesce(func.sum(case(
                ((InventoryBatch.average_daily_use > 0)
                 & (InventoryBatch.quantity > InventoryBatch.average_daily_use * 7),
                 1),
                else_=0,
            )), 0),
        ).where(InventoryBatch.hospital_id == identity.hospital_id)
    ).one()
    total_units, expiring_units, inventory_count, surplus_units, surplus_batches = inventory_metrics
    active_transfers = db.scalar(
        select(func.count()).select_from(TransferRequest).where(
            TransferRequest.status.in_((
                "requested", "approved", "pending_pickup", "in_transit",
                "arrived_awaiting_inspection", "exception",
            )),
            (TransferRequest.requesting_hospital_id == identity.hospital_id)
            | (TransferRequest.source_hospital_id == identity.hospital_id),
        )
    ) or 0
    agreement_metrics = db.execute(
        select(
            func.coalesce(func.sum(case((HospitalAgreement.status == "pending", 1), else_=0)), 0),
            func.coalesce(func.sum(case((HospitalAgreement.status == "active", 1), else_=0)), 0),
        ).where(
            (HospitalAgreement.hospital_id == identity.hospital_id)
            | (HospitalAgreement.partner_hospital_id == identity.hospital_id),
        )
    ).one()
    pending_agreements, active_agreements = agreement_metrics
    return {
        "inventory_units": total_units,
        "units_expiring_within_30_days": expiring_units,
        "inventory_batch_count": inventory_count,
        "surplus_units": surplus_units,
        "surplus_batch_count": surplus_batches,
        "active_transfer_count": active_transfers,
        "pending_agreement_count": pending_agreements,
        "active_agreement_count": active_agreements,
        "hospital_id": str(identity.hospital_id),
    }