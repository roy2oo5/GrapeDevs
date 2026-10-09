from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, aliased

from app.db.session import get_db
from app.api.routers.auth import get_current_hospital_admin
from app.models import (
    Driver, Hospital, HospitalAgreement, InventoryBatch, SurplusListing, TransferAuditEvent, TransferRequest,
    TransferItem, TransferCustodyEvent, TransferReceipt, TransferIncident,
    TransferTrackingSession, TransferLocationPoint, Vehicle,
)
from app.schemas import (
    TransferAuditRead, TransferCreate, TransferRead, TransferStatusUpdate,
    DriverCreate, VehicleCreate, LogisticsAssignment, CustodyEventCreate,
    TransferReceiptCreate, TransferIncidentCreate, TrackingSessionCreate,
    LocationPointCreate,
)
from app.services.realtime import publish_hospital_event
from app.services.geography import is_within_hospital_radius
from app.services.allocation import recommend_request_allocations
from app.services.stock import seven_day_stock_reserve


router = APIRouter(
    prefix="/transfers",
    tags=["Transfers"],
    dependencies=[Depends(get_current_hospital_admin)],
)


def allocated_unreserved_quantity(
    db: Session,
    hospital_id: UUID,
    sku_code: str,
    exclude_transfer_id: UUID | None = None,
    include_pending_requests: bool = True,
) -> int:
    active_listed = db.scalar(
        select(func.coalesce(func.sum(SurplusListing.quantity_available), 0)).where(
            SurplusListing.hospital_id == hospital_id,
            SurplusListing.sku_code == sku_code,
            SurplusListing.status == "active",
            SurplusListing.expires_on.is_(None) | (
                SurplusListing.expires_on >= datetime.now(timezone.utc).date()
            ),
        )
    ) or 0
    pending_requests = 0
    if include_pending_requests:
        pending_requests_query = select(
            func.coalesce(func.sum(TransferRequest.quantity), 0)
        ).where(
            TransferRequest.source_hospital_id == hospital_id,
            TransferRequest.sku_code == sku_code,
            TransferRequest.status == "requested",
        )
        if exclude_transfer_id is not None:
            pending_requests_query = pending_requests_query.where(
                TransferRequest.id != exclude_transfer_id
            )
        pending_requests = db.scalar(pending_requests_query) or 0
    return int(active_listed) + int(pending_requests)


def serialize_transfer(
    db: Session,
    transfer: TransferRequest,
    requesting_hospital_name: str | None = None,
    source_hospital_name: str | None = None,
) -> dict:
    if requesting_hospital_name is None and transfer.requesting_hospital_id:
        requesting_hospital = db.get(Hospital, transfer.requesting_hospital_id)
        requesting_hospital_name = requesting_hospital.name if requesting_hospital else None
    if source_hospital_name is None and transfer.source_hospital_id:
        source_hospital = db.get(Hospital, transfer.source_hospital_id)
        source_hospital_name = source_hospital.name if source_hospital else None
    fields = (
        "id", "requesting_hospital_id", "source_hospital_id", "sku_code", "sku_name",
        "quantity", "unit", "urgency", "department", "notes", "status", "created_at", "updated_at",
        "assigned_driver_id", "assigned_vehicle_id",
    )
    return {
        **{field: getattr(transfer, field) for field in fields},
        "destination_hospital_id": transfer.requesting_hospital_id,
        "requesting_hospital_name": requesting_hospital_name,
        "source_hospital_name": source_hospital_name,
    }


@router.post("", response_model=TransferRead, status_code=status.HTTP_201_CREATED)
def create_transfer(
    payload: TransferCreate,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    is_outbound_transfer = payload.destination_hospital_id is not None
    if is_outbound_transfer:
        if payload.source_hospital_id not in {None, identity.hospital_id}:
            raise HTTPException(status_code=403, detail="A transfer must be sent from your hospital")
        source_hospital_id = identity.hospital_id
        requesting_hospital_id = payload.destination_hospital_id
        if requesting_hospital_id == source_hospital_id:
            raise HTTPException(status_code=422, detail="A hospital cannot transfer stock to itself")
        hospital_ids = sorted((source_hospital_id, requesting_hospital_id))
        locked_hospitals = list(db.scalars(
            select(Hospital)
            .where(Hospital.id.in_(hospital_ids))
            .order_by(Hospital.id)
            .with_for_update()
        ))
        if len(locked_hospitals) != 2:
            raise HTTPException(status_code=404, detail="Destination hospital not found")
        hospitals_by_id = {hospital.id: hospital for hospital in locked_hospitals}
        source_hospital = hospitals_by_id[source_hospital_id]
        receiving_hospital = hospitals_by_id[requesting_hospital_id]
        if not is_within_hospital_radius(source_hospital, receiving_hospital):
            raise HTTPException(status_code=409, detail="Transfers are limited to hospitals within 50 km")
        active_mou = db.scalar(
            select(HospitalAgreement).where(
                HospitalAgreement.status == "active",
                (
                    HospitalAgreement.valid_until.is_(None)
                    | (HospitalAgreement.valid_until >= datetime.now(timezone.utc).date())
                ),
                (
                    ((HospitalAgreement.hospital_id == source_hospital_id) & (HospitalAgreement.partner_hospital_id == requesting_hospital_id))
                    | ((HospitalAgreement.hospital_id == requesting_hospital_id) & (HospitalAgreement.partner_hospital_id == source_hospital_id))
                ),
            )
        )
        if active_mou is None:
            raise HTTPException(status_code=409, detail="An active MOU is required before hospital stock can be transferred")
        transfer_status = "approved"
    else:
        if payload.requesting_hospital_id is not None and payload.requesting_hospital_id != identity.hospital_id:
            raise HTTPException(status_code=403, detail="A transfer request must belong to your hospital")
        if payload.source_hospital_id is None:
            raise HTTPException(status_code=422, detail="Choose a source hospital or destination hospital")
        if payload.source_hospital_id == identity.hospital_id:
            raise HTTPException(status_code=422, detail="A hospital cannot transfer stock to itself")
        if db.get(Hospital, payload.source_hospital_id) is None:
            raise HTTPException(status_code=404, detail="Source hospital not found")
        source_hospital_id = payload.source_hospital_id
        requesting_hospital_id = identity.hospital_id
        transfer_status = "requested"

    transfer = TransferRequest(
        **payload.model_dump(exclude={
            "requesting_hospital_id", "source_hospital_id", "destination_hospital_id",
        }),
        requesting_hospital_id=requesting_hospital_id,
        source_hospital_id=source_hospital_id,
        status=transfer_status,
    )
    db.add(transfer)
    db.flush()
    if is_outbound_transfer:
        source_batches = list(db.scalars(
            select(InventoryBatch)
            .where(
                InventoryBatch.hospital_id == source_hospital_id,
                InventoryBatch.sku_code == transfer.sku_code,
                (InventoryBatch.quantity - InventoryBatch.reserved_quantity) > 0,
                (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= datetime.now(timezone.utc).date())),
            )
            .order_by(
                InventoryBatch.expires_on.asc().nullslast(),
                InventoryBatch.created_at.asc(),
                InventoryBatch.id.asc(),
            )
            .with_for_update()
        ))
        available_quantity = sum(batch.quantity - batch.reserved_quantity for batch in source_batches)
        reserve_quantity = seven_day_stock_reserve(db, source_hospital_id, transfer.sku_code)
        allocated_quantity = allocated_unreserved_quantity(
            db, source_hospital_id, transfer.sku_code
        )
        shareable_quantity = max(0, available_quantity - reserve_quantity - allocated_quantity)
        if transfer.quantity > shareable_quantity:
            raise HTTPException(
                status_code=409,
                detail=f"Only {shareable_quantity} units can be sent after keeping the source hospital's 7-day reserve",
            )
        quantity_to_reserve = transfer.quantity
        for source_batch in source_batches:
            batch_reservation = min(
                source_batch.quantity - source_batch.reserved_quantity,
                quantity_to_reserve,
            )
            if batch_reservation <= 0:
                continue
            source_batch.reserved_quantity += batch_reservation
            db.add(TransferItem(
                transfer_id=transfer.id,
                source_inventory_batch_id=source_batch.id,
                requested_quantity=batch_reservation,
                reserved_quantity=batch_reservation,
            ))
            quantity_to_reserve -= batch_reservation
            if quantity_to_reserve == 0:
                break
        if quantity_to_reserve:
            raise HTTPException(status_code=409, detail="Source stock changed before it could be reserved")
    db.add(TransferAuditEvent(
        transfer_id=transfer.id,
        actor_hospital_id=identity.hospital_id,
        from_status=None,
        to_status=transfer.status,
        quantity=transfer.quantity,
    ))
    db.commit()
    db.refresh(transfer)
    publish_hospital_event(
        {hospital_id for hospital_id in (transfer.requesting_hospital_id, transfer.source_hospital_id) if hospital_id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return serialize_transfer(db, transfer)


@router.get("", response_model=list[TransferRead])
def list_transfers(
    status_filter: str | None = Query(default=None, alias="status"),
    hospital_id: UUID | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    requesting_hospital = aliased(Hospital)
    source_hospital = aliased(Hospital)
    statement = (
        select(TransferRequest, requesting_hospital.name, source_hospital.name)
        .outerjoin(requesting_hospital, TransferRequest.requesting_hospital_id == requesting_hospital.id)
        .outerjoin(source_hospital, TransferRequest.source_hospital_id == source_hospital.id)
        .order_by(TransferRequest.created_at.desc())
    )
    if hospital_id is not None and hospital_id != identity.hospital_id:
        raise HTTPException(status_code=403, detail="Transfers can only be viewed for your hospital")
    statement = statement.where(
        (TransferRequest.requesting_hospital_id == identity.hospital_id)
        | (TransferRequest.source_hospital_id == identity.hospital_id)
    )
    if status_filter:
        statement = statement.where(TransferRequest.status == status_filter)
    statement = statement.limit(limit)
    results = list(db.execute(statement))
    open_requests = list(db.scalars(
        select(TransferRequest).where(
            TransferRequest.source_hospital_id == identity.hospital_id,
            TransferRequest.status == "requested",
        )
    ))
    requests_by_sku: dict[str, list[TransferRequest]] = {}
    for transfer in open_requests:
        requests_by_sku.setdefault(transfer.sku_code, []).append(transfer)
    recommendations: dict[UUID, dict[str, int | float | str | None]] = {}
    for sku_code, requests in requests_by_sku.items():
        recommendations.update(recommend_request_allocations(
            db, identity.hospital_id, sku_code, requests
        ))

    serialized = []
    for transfer, requesting_name, source_name in results:
        item = serialize_transfer(db, transfer, requesting_name, source_name)
        if transfer.id in recommendations:
            item.update(recommendations[transfer.id])
        serialized.append(item)
    return serialized


def stop_active_tracking(db: Session, transfer_id: UUID) -> None:
    tracking_session = db.scalar(
        select(TransferTrackingSession)
        .where(
            TransferTrackingSession.transfer_id == transfer_id,
            TransferTrackingSession.is_active.is_(True),
        )
        .with_for_update()
    )
    if tracking_session is not None:
        tracking_session.is_active = False
        tracking_session.ended_at = datetime.now(timezone.utc)


@router.patch("/{transfer_id}", response_model=TransferRead)
def update_transfer_status(
    transfer_id: UUID,
    payload: TransferStatusUpdate,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    transfer = db.scalar(
        select(TransferRequest).where(TransferRequest.id == transfer_id).with_for_update()
    )
    if transfer is None or identity.hospital_id not in {
        transfer.requesting_hospital_id,
        transfer.source_hospital_id,
    }:
        raise HTTPException(status_code=404, detail="Transfer request not found")

    is_requester = identity.hospital_id == transfer.requesting_hospital_id
    is_source = identity.hospital_id == transfer.source_hospital_id
    allowed_transitions = {
        ("requested", "approved"): is_source,
        ("requested", "rejected"): is_source,
        ("approved", "pending_pickup"): is_source,
        ("requested", "canceled"): is_requester,
        ("approved", "canceled"): is_source or is_requester,
        ("pending_pickup", "canceled"): is_source or is_requester,
        ("pending_pickup", "in_transit"): is_source,
        ("in_transit", "arrived_awaiting_inspection"): is_requester,
        ("in_transit", "returned"): is_source,
        ("in_transit", "exception"): is_source or is_requester,
        ("arrived_awaiting_inspection", "exception"): is_source or is_requester,
        ("exception", "arrived_awaiting_inspection"): is_requester,
        ("exception", "returned"): is_source,
    }
    if not allowed_transitions.get((transfer.status, payload.status), False):
        if payload.status == "pending_pickup" and transfer.status == "approved":
            raise HTTPException(
                status_code=403,
                detail="Only the source hospital can prepare an approved transfer for pickup",
            )
        raise HTTPException(
            status_code=403,
            detail=f"Your hospital cannot move this transfer from {transfer.status} to {payload.status}",
        )

    previous_status = transfer.status
    if payload.status == "approved" and transfer.source_hospital_id == transfer.requesting_hospital_id:
        raise HTTPException(status_code=409, detail="A hospital cannot approve a transfer to itself")
    if (
        payload.status == "approved"
        and payload.approved_quantity is not None
        and payload.approved_quantity > transfer.quantity
    ):
        raise HTTPException(status_code=422, detail="Approved quantity cannot exceed requested quantity")
    if payload.status == "approved" and transfer.source_hospital_id:
        locked_hospitals = list(db.scalars(
            select(Hospital)
            .where(Hospital.id.in_((transfer.source_hospital_id, transfer.requesting_hospital_id)))
            .order_by(Hospital.id)
            .with_for_update()
        ))
        hospitals_by_id = {hospital.id: hospital for hospital in locked_hospitals}
        source_hospital = hospitals_by_id.get(transfer.source_hospital_id)
        receiving_hospital = hospitals_by_id.get(transfer.requesting_hospital_id)
        if source_hospital is None or receiving_hospital is None:
            raise HTTPException(status_code=409, detail="Both hospitals must still exist")
        if not is_within_hospital_radius(source_hospital, receiving_hospital):
            raise HTTPException(status_code=409, detail="Transfers are limited to hospitals within 50 km")
        if transfer.surplus_listing_id is None:
            active_mou = db.scalar(
                select(HospitalAgreement).where(
                    HospitalAgreement.status == "active",
                    (
                        HospitalAgreement.valid_until.is_(None)
                        | (HospitalAgreement.valid_until >= datetime.now(timezone.utc).date())
                    ),
                    (
                        ((HospitalAgreement.hospital_id == source_hospital.id) & (HospitalAgreement.partner_hospital_id == receiving_hospital.id))
                        | ((HospitalAgreement.hospital_id == receiving_hospital.id) & (HospitalAgreement.partner_hospital_id == source_hospital.id))
                    ),
                )
            )
            if active_mou is None:
                raise HTTPException(status_code=409, detail="An active MOU is required before hospital stock can be transferred")
            source_batch_query = select(InventoryBatch).where(
                InventoryBatch.hospital_id == transfer.source_hospital_id,
                InventoryBatch.sku_code == transfer.sku_code,
                (InventoryBatch.quantity - InventoryBatch.reserved_quantity) > 0,
                (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= datetime.now(timezone.utc).date())),
            )
        else:
            listing = db.get(SurplusListing, transfer.surplus_listing_id)
            if listing is None or listing.hospital_id != transfer.source_hospital_id:
                raise HTTPException(status_code=409, detail="The surplus listing is no longer available")
            source_batch_query = select(InventoryBatch).where(
                InventoryBatch.id == listing.inventory_batch_id,
                InventoryBatch.hospital_id == transfer.source_hospital_id,
                (InventoryBatch.quantity - InventoryBatch.reserved_quantity) > 0,
                (InventoryBatch.expires_on.is_(None) | (InventoryBatch.expires_on >= datetime.now(timezone.utc).date())),
            )
        source_batches = list(db.scalars(
            source_batch_query.order_by(
                InventoryBatch.expires_on.asc().nullslast(),
                InventoryBatch.created_at.asc(),
                InventoryBatch.id.asc(),
            ).with_for_update()
        ))
        if not source_batches:
            raise HTTPException(status_code=409, detail="The requested medicine is no longer in the source inventory")
        open_requests = list(db.scalars(
            select(TransferRequest).where(
                TransferRequest.source_hospital_id == transfer.source_hospital_id,
                TransferRequest.sku_code == transfer.sku_code,
                TransferRequest.status == "requested",
            )
        ))
        recommendations = recommend_request_allocations(
            db, transfer.source_hospital_id, transfer.sku_code, open_requests
        )
        recommendation = recommendations.get(transfer.id)
        suggested_quantity = (
            int(recommendation["allocation_suggested_quantity"])
            if recommendation else 0
        )
        requested_quantity = payload.approved_quantity or suggested_quantity
        if requested_quantity <= 0:
            raise HTTPException(
                status_code=409,
                detail="No quantity can be recommended until the recipient's medicine use and available stock show a need",
            )
        if requested_quantity > suggested_quantity:
            raise HTTPException(
                status_code=409,
                detail=f"The current suggested maximum for this request is {suggested_quantity} units",
            )
        if requested_quantity < transfer.quantity and transfer.surplus_listing_id:
            listing = db.get(SurplusListing, transfer.surplus_listing_id)
            if listing:
                listing.quantity_available += transfer.quantity - requested_quantity
                if listing.status == "filled" and (
                    listing.expires_on is None
                    or listing.expires_on >= datetime.now(timezone.utc).date()
                ):
                    listing.status = "active"
        transfer.quantity = requested_quantity
        available_source_quantity = int(db.scalar(
            select(func.coalesce(func.sum(
                InventoryBatch.quantity - InventoryBatch.reserved_quantity
            ), 0)).where(
                InventoryBatch.hospital_id == transfer.source_hospital_id,
                InventoryBatch.sku_code == transfer.sku_code,
                InventoryBatch.quantity > 0,
                InventoryBatch.expires_on.is_(None)
                | (InventoryBatch.expires_on >= datetime.now(timezone.utc).date()),
            )
        ) or 0)
        reserve_quantity = seven_day_stock_reserve(
            db, transfer.source_hospital_id, transfer.sku_code
        )
        allocated_quantity = allocated_unreserved_quantity(
            db,
            transfer.source_hospital_id,
            transfer.sku_code,
            transfer.id,
            include_pending_requests=False,
        )
        shareable_quantity = max(
            0, available_source_quantity - reserve_quantity - allocated_quantity
        )
        if requested_quantity > shareable_quantity:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Only {shareable_quantity} units can be approved after keeping the source hospital's "
                    "7-day reserve"
                ),
            )
        if transfer.surplus_listing_id and (
            source_batches[0].quantity - source_batches[0].reserved_quantity < requested_quantity
        ):
            raise HTTPException(
                status_code=409,
                detail="The listed inventory batch no longer contains the requested quantity",
            )
        quantity_to_reserve = requested_quantity
        for source_batch in source_batches:
            batch_available = source_batch.quantity - source_batch.reserved_quantity
            batch_reservation = min(batch_available, quantity_to_reserve)
            if batch_reservation <= 0:
                continue
            source_batch.reserved_quantity += batch_reservation
            db.add(TransferItem(
                transfer_id=transfer.id,
                source_inventory_batch_id=source_batch.id,
                requested_quantity=batch_reservation,
                reserved_quantity=batch_reservation,
            ))
            quantity_to_reserve -= batch_reservation
            if quantity_to_reserve == 0:
                break
        if quantity_to_reserve:
            raise HTTPException(status_code=409, detail="Source stock changed before it could be reserved")
    if payload.status in {"rejected", "canceled", "returned"} and transfer.surplus_listing_id and previous_status in {
        "requested", "approved", "pending_pickup", "in_transit", "exception"
    }:
        listing = db.get(SurplusListing, transfer.surplus_listing_id)
        if listing:
            listing.quantity_available += transfer.quantity
            if listing.status == "filled" and (listing.expires_on is None or listing.expires_on >= datetime.now(timezone.utc).date()):
                listing.status = "active"
    if payload.status in {"rejected", "canceled", "returned"} and previous_status in {
        "requested", "approved", "pending_pickup", "in_transit", "exception"
    }:
        items = list(db.scalars(
            select(TransferItem)
            .where(TransferItem.transfer_id == transfer.id)
            .order_by(TransferItem.source_inventory_batch_id)
            .with_for_update()
        ))
        for item in items:
            if not item.source_inventory_batch_id or not item.reserved_quantity:
                continue
            source_batch = db.scalar(
                select(InventoryBatch)
                .where(InventoryBatch.id == item.source_inventory_batch_id)
                .with_for_update()
            )
            if source_batch is None or source_batch.reserved_quantity < item.reserved_quantity:
                raise HTTPException(status_code=409, detail="Source inventory reservation is inconsistent")
            source_batch.reserved_quantity -= item.reserved_quantity
            item.returned_quantity = item.reserved_quantity if payload.status == "returned" else item.returned_quantity
            item.reserved_quantity = 0
    if payload.status == "in_transit":
        if transfer.assigned_vehicle_id:
            vehicle = db.scalar(
                select(Vehicle).where(Vehicle.id == transfer.assigned_vehicle_id).with_for_update()
            )
            if vehicle is None or vehicle.status != "in_service":
                raise HTTPException(status_code=409, detail="Assigned vehicle is no longer assigned to this transfer")
        db.add(TransferCustodyEvent(
            transfer_id=transfer.id,
            event_type="picked_up",
            occurred_at=datetime.now(timezone.utc),
            liability_from_type="hospital",
            liability_to_type="logistics_fleet",
            liability_from_hospital_id=transfer.source_hospital_id,
            driver_id=transfer.assigned_driver_id,
            vehicle_id=transfer.assigned_vehicle_id,
            confirmed_by_name=identity.hospital_name,
        ))
    if payload.status == "returned" and transfer.assigned_vehicle_id:
        vehicle = db.scalar(
            select(Vehicle).where(Vehicle.id == transfer.assigned_vehicle_id).with_for_update()
        )
        if vehicle is not None and vehicle.status == "in_service":
            vehicle.status = "available"
        db.add(TransferCustodyEvent(
            transfer_id=transfer.id,
            event_type="returned_to_origin",
            occurred_at=datetime.now(timezone.utc),
            liability_from_type="logistics_fleet",
            liability_to_type="hospital",
            liability_to_hospital_id=transfer.source_hospital_id,
            driver_id=transfer.assigned_driver_id,
            vehicle_id=transfer.assigned_vehicle_id,
            confirmed_by_name=identity.hospital_name,
        ))
    if payload.status == "canceled" and transfer.assigned_vehicle_id:
        vehicle = db.scalar(
            select(Vehicle).where(Vehicle.id == transfer.assigned_vehicle_id).with_for_update()
        )
        if vehicle is not None and vehicle.status == "in_service":
            vehicle.status = "available"
    if payload.status in {"arrived_awaiting_inspection", "returned", "canceled"}:
        stop_active_tracking(db, transfer.id)
    transfer.status = payload.status
    transfer.updated_at = datetime.now(timezone.utc)
    db.add(TransferAuditEvent(
        transfer_id=transfer.id,
        actor_hospital_id=identity.hospital_id,
        from_status=previous_status,
        to_status=payload.status,
        quantity=transfer.quantity,
    ))
    db.commit()
    db.refresh(transfer)
    publish_hospital_event(
        {hospital_id for hospital_id in (transfer.requesting_hospital_id, transfer.source_hospital_id) if hospital_id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return serialize_transfer(db, transfer)


@router.get("/{transfer_id}/audit", response_model=list[TransferAuditRead])
def list_transfer_audit(
    transfer_id: UUID,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None or identity.hospital_id not in {transfer.requesting_hospital_id, transfer.source_hospital_id}:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    return db.scalars(
        select(TransferAuditEvent)
        .where(TransferAuditEvent.transfer_id == transfer_id)
        .order_by(TransferAuditEvent.created_at.asc())
    ).all()


@router.get("/fleet/drivers")
def list_drivers(db: Session = Depends(get_db)):
    return db.scalars(select(Driver).where(Driver.is_active.is_(True)).order_by(Driver.full_name)).all()


@router.post("/fleet/drivers", status_code=status.HTTP_201_CREATED)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    driver = Driver(**payload.model_dump())
    db.add(driver)
    db.commit()
    db.refresh(driver)
    return driver


@router.get("/fleet/vehicles")
def list_vehicles(db: Session = Depends(get_db)):
    return db.scalars(select(Vehicle).where(Vehicle.status != "retired").order_by(Vehicle.vehicle_identifier)).all()


@router.post("/fleet/vehicles", status_code=status.HTTP_201_CREATED)
def create_vehicle(payload: VehicleCreate, db: Session = Depends(get_db)):
    vehicle = Vehicle(**payload.model_dump())
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


@router.patch("/{transfer_id}/assignment", response_model=TransferRead)
def assign_logistics(
    transfer_id: UUID,
    payload: LogisticsAssignment,
    db: Session = Depends(get_db),
    identity=Depends(get_current_hospital_admin),
):
    transfer = db.scalar(
        select(TransferRequest).where(TransferRequest.id == transfer_id).with_for_update()
    )
    if transfer is None or transfer.source_hospital_id != identity.hospital_id:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if transfer.status not in {"approved", "pending_pickup"}:
        raise HTTPException(status_code=409, detail="A driver or vehicle can only be assigned before dispatch")
    driver = db.scalar(select(Driver).where(Driver.id == payload.driver_id).with_for_update())
    vehicle = (
        db.scalar(select(Vehicle).where(Vehicle.id == payload.vehicle_id).with_for_update())
        if payload.vehicle_id else None
    )
    if driver is None or not driver.is_active:
        raise HTTPException(status_code=409, detail="Active driver not found")
    if vehicle is not None and vehicle.status not in {"available", "in_service"}:
        raise HTTPException(status_code=409, detail="Vehicle is not available")
    if vehicle is not None and vehicle.status == "in_service" and transfer.assigned_vehicle_id != vehicle.id:
        raise HTTPException(status_code=409, detail="Vehicle is already assigned to another transfer")
    if transfer.assigned_vehicle_id and transfer.assigned_vehicle_id != (vehicle.id if vehicle else None):
        previous_vehicle = db.scalar(
            select(Vehicle).where(Vehicle.id == transfer.assigned_vehicle_id).with_for_update()
        )
        if previous_vehicle is not None and previous_vehicle.status == "in_service":
            previous_vehicle.status = "available"
    transfer.assigned_driver_id = driver.id
    transfer.assigned_vehicle_id = vehicle.id if vehicle else None
    if vehicle:
        vehicle.status = "in_service"
    db.commit()
    db.refresh(transfer)
    return serialize_transfer(db, transfer)


def _get_transfer_for_party(db: Session, transfer_id: UUID, hospital_id: UUID) -> TransferRequest:
    transfer = db.get(TransferRequest, transfer_id)
    if transfer is None or hospital_id not in {transfer.requesting_hospital_id, transfer.source_hospital_id}:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    return transfer


@router.post("/{transfer_id}/custody", response_model=dict)
def add_custody_event(transfer_id: UUID, payload: CustodyEventCreate, db: Session = Depends(get_db), identity=Depends(get_current_hospital_admin)):
    transfer = _get_transfer_for_party(db, transfer_id, identity.hospital_id)
    if payload.event_type == "picked_up" and identity.hospital_id != transfer.source_hospital_id:
        raise HTTPException(status_code=403, detail="Only the source hospital can confirm pickup")
    if payload.event_type == "received_by_hospital" and identity.hospital_id != transfer.requesting_hospital_id:
        raise HTTPException(status_code=403, detail="Only the receiving hospital can confirm receipt")
    if payload.event_type == "returned_to_origin" and identity.hospital_id != transfer.source_hospital_id:
        raise HTTPException(status_code=403, detail="Only the source hospital can confirm a return")
    required_status = {
        "picked_up": "in_transit",
        "received_by_hospital": "arrived_awaiting_inspection",
        "returned_to_origin": "returned",
    }[payload.event_type]
    if transfer.status != required_status:
        raise HTTPException(status_code=409, detail=f"This handover is only valid when the transfer is {required_status}")
    if db.scalar(
        select(TransferCustodyEvent.id).where(
            TransferCustodyEvent.transfer_id == transfer.id,
            TransferCustodyEvent.event_type == payload.event_type,
        )
    ):
        raise HTTPException(status_code=409, detail="This handover has already been recorded")
    is_pickup = payload.event_type == "picked_up"
    is_receiver_handover = payload.event_type == "received_by_hospital"
    event = TransferCustodyEvent(
        transfer_id=transfer.id, event_type=payload.event_type, occurred_at=payload.occurred_at,
        liability_from_type="hospital" if is_pickup else "logistics_fleet",
        liability_to_type="logistics_fleet" if is_pickup else "hospital",
        liability_from_hospital_id=transfer.source_hospital_id if is_pickup else None,
        liability_to_hospital_id=(
            transfer.requesting_hospital_id if is_receiver_handover
            else transfer.source_hospital_id if payload.event_type == "returned_to_origin"
            else None
        ),
        driver_id=transfer.assigned_driver_id, vehicle_id=transfer.assigned_vehicle_id,
        confirmed_by_name=payload.confirmed_by_name, notes=payload.notes,
    )
    db.add(event)
    db.commit()
    return {"id": str(event.id), "event_type": event.event_type}


@router.post("/{transfer_id}/receipt", response_model=dict)
def create_receipt(transfer_id: UUID, payload: TransferReceiptCreate, db: Session = Depends(get_db), identity=Depends(get_current_hospital_admin)):
    transfer = db.scalar(
        select(TransferRequest).where(TransferRequest.id == transfer_id).with_for_update()
    )
    if transfer is None or identity.hospital_id not in {
        transfer.requesting_hospital_id, transfer.source_hospital_id
    }:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if identity.hospital_id != transfer.requesting_hospital_id:
        raise HTTPException(status_code=403, detail="Only the receiving hospital can submit a receipt")
    if transfer.status not in {"in_transit", "arrived_awaiting_inspection"}:
        raise HTTPException(status_code=409, detail="This transfer is not waiting for delivery acceptance")
    reserved_item_count = db.scalar(
        select(func.count()).select_from(TransferItem).where(TransferItem.transfer_id == transfer.id)
    ) or 0
    reserved_items = list(db.execute(
        select(TransferItem, InventoryBatch)
        .join(InventoryBatch, TransferItem.source_inventory_batch_id == InventoryBatch.id)
        .where(TransferItem.transfer_id == transfer.id)
        .order_by(
            InventoryBatch.expires_on.asc().nullslast(),
            InventoryBatch.created_at.asc(),
            InventoryBatch.id.asc(),
        )
        .with_for_update()
    ))
    if not reserved_items or len(reserved_items) != reserved_item_count:
        raise HTTPException(status_code=409, detail="This transfer has no active source inventory reservation")
    dispatched_quantity = sum(item.reserved_quantity for item, _ in reserved_items)
    if dispatched_quantity != transfer.quantity or any(item.reserved_quantity <= 0 for item, _ in reserved_items):
        raise HTTPException(status_code=409, detail="Transfer quantity does not match its source reservations")
    if payload.accepted_quantity + payload.rejected_quantity != dispatched_quantity:
        raise HTTPException(
            status_code=422,
            detail="Accepted and rejected quantities must equal the reserved shipment quantity",
        )
    if db.scalar(select(TransferReceipt).where(TransferReceipt.transfer_id == transfer.id)):
        raise HTTPException(status_code=409, detail="A receipt already exists for this transfer")
    receipt = TransferReceipt(transfer_id=transfer.id, receiving_hospital_id=identity.hospital_id, **payload.model_dump())
    db.add(receipt)
    remaining_accepted = payload.accepted_quantity
    for item, source_batch in reserved_items:
        if source_batch.quantity < item.reserved_quantity or source_batch.reserved_quantity < item.reserved_quantity:
            raise HTTPException(status_code=409, detail="Source inventory is lower than the reserved shipment quantity")
        source_batch.quantity -= item.reserved_quantity
        source_batch.reserved_quantity -= item.reserved_quantity
        accepted_from_batch = min(item.reserved_quantity, remaining_accepted)
        item.accepted_quantity = accepted_from_batch
        item.damaged_quantity = item.reserved_quantity - accepted_from_batch
        item.reserved_quantity = 0
        remaining_accepted -= accepted_from_batch
        if accepted_from_batch:
            destination_batch = InventoryBatch(
                hospital_id=identity.hospital_id,
                sku_code=transfer.sku_code,
                sku_name=transfer.sku_name,
                quantity=accepted_from_batch,
                unit=transfer.unit,
                lot_number=source_batch.lot_number,
                expires_on=source_batch.expires_on,
                storage_regime=source_batch.storage_regime,
                average_daily_use=source_batch.average_daily_use,
            )
            db.add(destination_batch)
            db.flush()
            item.destination_batch_id = destination_batch.id
    received_event = db.scalar(
        select(TransferCustodyEvent.id).where(
            TransferCustodyEvent.transfer_id == transfer.id,
            TransferCustodyEvent.event_type == "received_by_hospital",
        )
    )
    if received_event is None:
        pickup_event = db.scalar(
            select(TransferCustodyEvent.id).where(
                TransferCustodyEvent.transfer_id == transfer.id,
                TransferCustodyEvent.event_type == "picked_up",
            )
        )
        db.add(TransferCustodyEvent(
            transfer_id=transfer.id,
            event_type="received_by_hospital",
            occurred_at=payload.inspected_at,
            liability_from_type="logistics_fleet" if pickup_event else "hospital",
            liability_to_type="hospital",
            liability_from_hospital_id=None if pickup_event else transfer.source_hospital_id,
            liability_to_hospital_id=identity.hospital_id,
            driver_id=transfer.assigned_driver_id,
            vehicle_id=transfer.assigned_vehicle_id,
            confirmed_by_name=payload.received_by_name,
            notes=payload.notes,
        ))
    if transfer.assigned_vehicle_id:
        vehicle = db.scalar(
            select(Vehicle).where(Vehicle.id == transfer.assigned_vehicle_id).with_for_update()
        )
        if vehicle is not None and vehicle.status == "in_service":
            vehicle.status = "available"
    previous_status = transfer.status
    transfer.status = "completed"
    transfer.updated_at = datetime.now(timezone.utc)
    stop_active_tracking(db, transfer.id)
    db.add(TransferAuditEvent(
        transfer_id=transfer.id,
        actor_hospital_id=identity.hospital_id,
        from_status=previous_status,
        to_status="completed",
        quantity=transfer.quantity,
    ))
    db.commit()
    publish_hospital_event(
        {hospital_id for hospital_id in (transfer.requesting_hospital_id, transfer.source_hospital_id) if hospital_id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return {"id": str(receipt.id), "status": transfer.status}


@router.post("/{transfer_id}/incidents", response_model=dict)
def create_incident(transfer_id: UUID, payload: TransferIncidentCreate, db: Session = Depends(get_db), identity=Depends(get_current_hospital_admin)):
    transfer = db.scalar(
        select(TransferRequest).where(TransferRequest.id == transfer_id).with_for_update()
    )
    if transfer is None or identity.hospital_id not in {
        transfer.requesting_hospital_id, transfer.source_hospital_id
    }:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if transfer.status not in {"pending_pickup", "in_transit", "arrived_awaiting_inspection", "exception"}:
        raise HTTPException(status_code=409, detail="Incidents can only be reported during active transport or inspection")
    if payload.affected_quantity > transfer.quantity:
        raise HTTPException(status_code=422, detail="Incident quantity cannot exceed the transfer quantity")
    incident = TransferIncident(transfer_id=transfer.id, driver_id=transfer.assigned_driver_id, **payload.model_dump())
    previous_status = transfer.status
    db.add(incident)
    transfer.status = "exception"
    transfer.updated_at = datetime.now(timezone.utc)
    if previous_status != "exception":
        db.add(TransferAuditEvent(
            transfer_id=transfer.id,
            actor_hospital_id=identity.hospital_id,
            from_status=previous_status,
            to_status="exception",
            quantity=transfer.quantity,
        ))
    db.commit()
    publish_hospital_event(
        {hospital_id for hospital_id in (transfer.requesting_hospital_id, transfer.source_hospital_id) if hospital_id},
        "transfers.updated",
        transfer_id=str(transfer.id),
    )
    return {"id": str(incident.id), "status": transfer.status}


@router.post("/{transfer_id}/tracking", response_model=dict)
def start_tracking(transfer_id: UUID, payload: TrackingSessionCreate, db: Session = Depends(get_db), identity=Depends(get_current_hospital_admin)):
    transfer = db.scalar(
        select(TransferRequest).where(TransferRequest.id == transfer_id).with_for_update()
    )
    if transfer is None or identity.hospital_id not in {
        transfer.requesting_hospital_id, transfer.source_hospital_id
    }:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    if identity.hospital_id != transfer.source_hospital_id:
        raise HTTPException(status_code=403, detail="Only the source hospital can start tracking")
    if transfer.status != "in_transit":
        raise HTTPException(status_code=409, detail="Tracking can only start after the shipment is dispatched")
    driver = db.get(Driver, payload.driver_id)
    if driver is None or not driver.is_active:
        raise HTTPException(status_code=404, detail="Active driver not found")
    if transfer.assigned_driver_id != driver.id or transfer.assigned_vehicle_id != payload.vehicle_id:
        raise HTTPException(status_code=409, detail="Tracking must use the driver and vehicle assigned to this transfer")
    if db.scalar(
        select(TransferTrackingSession.id).where(TransferTrackingSession.transfer_id == transfer.id)
    ):
        raise HTTPException(status_code=409, detail="A tracking session has already been created for this transfer")
    session = TransferTrackingSession(transfer_id=transfer.id, driver_id=driver.id, vehicle_id=payload.vehicle_id, started_at=datetime.now(timezone.utc))
    db.add(session)
    db.commit()
    return {"id": str(session.id), "is_active": session.is_active}


@router.post("/{transfer_id}/tracking/{session_id}/points", response_model=dict)
def add_tracking_point(transfer_id: UUID, session_id: UUID, payload: LocationPointCreate, db: Session = Depends(get_db), identity=Depends(get_current_hospital_admin)):
    transfer = _get_transfer_for_party(db, transfer_id, identity.hospital_id)
    if transfer.status not in {"in_transit", "exception"}:
        raise HTTPException(status_code=409, detail="Tracking updates are only accepted during active transport")
    session = db.get(TransferTrackingSession, session_id)
    if session is None or session.transfer_id != transfer.id or not session.is_active:
        raise HTTPException(status_code=404, detail="Active tracking session not found")
    point = TransferLocationPoint(tracking_session_id=session.id, **payload.model_dump())
    session.last_latitude = payload.latitude
    session.last_longitude = payload.longitude
    session.last_recorded_at = datetime.now(timezone.utc)
    db.add(point)
    db.commit()
    publish_hospital_event({transfer.requesting_hospital_id, transfer.source_hospital_id}, "transfers.updated", transfer_id=str(transfer.id))
    return {"id": str(point.id), "latitude": point.latitude, "longitude": point.longitude}