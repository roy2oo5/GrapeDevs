from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.routers.auth import get_current_hospital_admin
from app.db.session import get_db
from app.models import Hospital, HospitalAgreement
from app.schemas import (
    HospitalAdminIdentity,
    HospitalAgreementCreate,
    HospitalAgreementRead,
    HospitalAgreementStatusUpdate,
)
from app.services.geography import MAX_HOSPITAL_DISTANCE_KM, distance_between_hospitals
from app.services.realtime import publish_hospital_event


router = APIRouter(prefix="/agreements", tags=["Hospital Agreements"])


def serialize_agreement(db: Session, agreement: HospitalAgreement) -> dict:
    hospital = db.get(Hospital, agreement.hospital_id)
    partner = db.get(Hospital, agreement.partner_hospital_id)
    return {
        "id": agreement.id,
        "hospital_id": agreement.hospital_id,
        "hospital_name": hospital.name if hospital else "Unknown hospital",
        "partner_hospital_id": agreement.partner_hospital_id,
        "partner_hospital_name": partner.name if partner else "Unknown hospital",
        "title": agreement.title,
        "signatory": agreement.signatory,
        "agreement_type": agreement.agreement_type,
        "valid_until": agreement.valid_until,
        "terms_and_conditions": agreement.terms_and_conditions,
        "status": agreement.status,
        "created_at": agreement.created_at,
        "updated_at": agreement.updated_at,
    }


@router.get("", response_model=list[HospitalAgreementRead])
def list_agreements(
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    agreements = db.scalars(
        select(HospitalAgreement)
        .where(
            or_(
                HospitalAgreement.hospital_id == identity.hospital_id,
                HospitalAgreement.partner_hospital_id == identity.hospital_id,
            )
        )
        .order_by(HospitalAgreement.created_at.desc())
    )
    return [serialize_agreement(db, agreement) for agreement in agreements]


@router.post("", response_model=HospitalAgreementRead, status_code=status.HTTP_201_CREATED)
def create_agreement(
    payload: HospitalAgreementCreate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    partner = db.get(Hospital, payload.partner_hospital_id)
    if partner is None or partner.status != "active":
        raise HTTPException(status_code=404, detail="Partner hospital not found")
    if partner.id == identity.hospital_id:
        raise HTTPException(status_code=422, detail="An agreement must be with another hospital")
    current_hospital = db.get(Hospital, identity.hospital_id)
    distance = distance_between_hospitals(current_hospital, partner)
    if distance is None:
        raise HTTPException(
            status_code=422,
            detail="Both hospitals must have valid latitude and longitude before creating an MOU",
        )
    if distance > MAX_HOSPITAL_DISTANCE_KM:
        raise HTTPException(
            status_code=422,
            detail=f"MOU hospitals must be within {MAX_HOSPITAL_DISTANCE_KM:g} km of each other",
        )
    existing = db.scalar(
        select(HospitalAgreement).where(
            or_(
                (
                    (HospitalAgreement.hospital_id == identity.hospital_id)
                    & (HospitalAgreement.partner_hospital_id == partner.id)
                ),
                (
                    (HospitalAgreement.hospital_id == partner.id)
                    & (HospitalAgreement.partner_hospital_id == identity.hospital_id)
                ),
            ),
            HospitalAgreement.status.in_(("pending", "active")),
        )
    )
    if existing is not None:
        raise HTTPException(status_code=409, detail="An active or pending MOU already exists with this hospital")

    agreement = HospitalAgreement(
        hospital_id=identity.hospital_id,
        partner_hospital_id=partner.id,
        title=payload.title,
        signatory=payload.signatory,
        agreement_type=payload.agreement_type,
        valid_until=payload.valid_until,
        terms_and_conditions=payload.terms_and_conditions,
        status="pending",
    )
    db.add(agreement)
    db.commit()
    db.refresh(agreement)
    publish_hospital_event(
        {identity.hospital_id, partner.id},
        "agreements.updated",
        agreement_id=str(agreement.id),
    )
    return serialize_agreement(db, agreement)


@router.patch("/{agreement_id}", response_model=HospitalAgreementRead)
def update_agreement_status(
    agreement_id: UUID,
    payload: HospitalAgreementStatusUpdate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    agreement = db.get(HospitalAgreement, agreement_id)
    if agreement is None or identity.hospital_id not in {agreement.hospital_id, agreement.partner_hospital_id}:
        raise HTTPException(status_code=404, detail="Hospital agreement not found")
    is_sender = identity.hospital_id == agreement.hospital_id
    if agreement.status == "pending":
        if payload.status in {"active", "rejected"} and is_sender:
            raise HTTPException(status_code=403, detail="Only the receiving hospital can review this request")
        if payload.status == "archived" and not is_sender:
            raise HTTPException(status_code=403, detail="Only the sending hospital can revoke this request")
    elif agreement.status == "active":
        if payload.status != "archived":
            raise HTTPException(status_code=409, detail="An active MOU can only be revoked")
    else:
        raise HTTPException(status_code=409, detail="This MOU request is already closed")
    agreement.status = payload.status
    db.commit()
    db.refresh(agreement)
    publish_hospital_event(
        {agreement.hospital_id, agreement.partner_hospital_id},
        "agreements.updated",
        agreement_id=str(agreement.id),
    )
    return serialize_agreement(db, agreement)