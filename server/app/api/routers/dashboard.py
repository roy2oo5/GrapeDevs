from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import Hospital, InventoryBatch, TransferRequest


router = APIRouter(tags=["Dashboard"], dependencies=[Depends(get_current_hospital_admin)])


@router.get("/dashboard")
def dashboard_summary(
    identity=Depends(get_current_hospital_admin),
    db: Session = Depends(get_db),
):
    today = date.today()
    expiry_cutoff = today + timedelta(days=30)
    total_units = db.scalar(
        select(func.coalesce(func.sum(InventoryBatch.quantity), 0)).where(
            InventoryBatch.hospital_id == identity.hospital_id
        )
    ) or 0
    expiring_units = db.scalar(
        select(func.coalesce(func.sum(InventoryBatch.quantity), 0)).where(
            InventoryBatch.expires_on >= today,
            InventoryBatch.expires_on <= expiry_cutoff,
            InventoryBatch.hospital_id == identity.hospital_id,
        )
    ) or 0
    inventory_count = db.scalar(
        select(func.count()).select_from(InventoryBatch).where(InventoryBatch.hospital_id == identity.hospital_id)
    ) or 0
    active_transfers = db.scalar(
        select(func.count()).select_from(TransferRequest).where(
            TransferRequest.status.in_(("requested", "approved", "in_transit")),
            (TransferRequest.requesting_hospital_id == identity.hospital_id)
            | (TransferRequest.source_hospital_id == identity.hospital_id),
        )
    ) or 0
    return {
        "inventory_units": total_units,
        "units_expiring_within_30_days": expiring_units,
        "inventory_batch_count": inventory_count,
        "active_transfer_count": active_transfers,
        "hospital_id": str(identity.hospital_id),
    }