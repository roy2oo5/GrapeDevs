from uuid import UUID

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Hospital, HospitalAdminAccount
from app.schemas import (
    HospitalAdminIdentity,
    HospitalAdminLogin,
    HospitalAdminSession,
    HospitalRegistration,
    HospitalRegistrationResult,
    TerminalAccessKeyUpdate,
)
from app.services.auth import (
    create_access_token,
    create_dummy_password_hash,
    decode_access_token,
    hash_terminal_access_key,
    verify_terminal_access_key,
)
from app.services.realtime import publish_hospital_event


router = APIRouter(prefix="/auth", tags=["Hospital Authentication"])
bearer_scheme = HTTPBearer(auto_error=False)
dummy_password_hash = create_dummy_password_hash()


@router.post("/register", response_model=HospitalRegistrationResult, status_code=status.HTTP_201_CREATED)
def register_hospital(payload: HospitalRegistration, db: Session = Depends(get_db)):
    administrator_id = payload.hospital_administrator_id.strip()
    existing_email = db.scalar(
        select(Hospital.id).where(func.lower(Hospital.administrator_email) == payload.administrator_email.lower())
    )
    existing_admin_id = db.scalar(
        select(HospitalAdminAccount.id).where(
            func.lower(HospitalAdminAccount.administrator_id) == administrator_id.lower()
        )
    )
    if existing_email or existing_admin_id:
        raise HTTPException(status_code=409, detail="Hospital email or administrator ID is already registered")

    hospital = Hospital(
        name=payload.hospital_name.strip(),
        administrator_name=payload.administrator_name.strip(),
        administrator_email=payload.administrator_email.strip().lower(),
        classification=payload.classification,
        node_role=payload.node_role,
        status="active",
    )
    try:
        db.add(hospital)
        db.flush()
        db.add(
            HospitalAdminAccount(
                hospital_id=hospital.id,
                administrator_id=administrator_id,
                password_hash=hash_terminal_access_key(payload.terminal_access_key),
            )
        )
        db.commit()
        db.refresh(hospital)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Hospital email or administrator ID is already registered") from None

    return HospitalRegistrationResult(
        hospital_id=hospital.id,
        hospital_name=hospital.name,
        hospital_administrator_id=administrator_id,
        status=hospital.status,
    )


@router.post("/login", response_model=HospitalAdminSession)
def login(payload: HospitalAdminLogin, db: Session = Depends(get_db)):
    account = db.scalar(
        select(HospitalAdminAccount).where(
            func.lower(HospitalAdminAccount.administrator_id)
            == payload.hospital_administrator_id.strip().lower()
        )
    )
    if account is None:
        verify_terminal_access_key(payload.terminal_access_key, dummy_password_hash)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator ID or access key")

    key_is_valid = verify_terminal_access_key(payload.terminal_access_key, account.password_hash)
    hospital = db.get(Hospital, account.hospital_id)
    if not key_is_valid or not account.is_active or hospital is None or hospital.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid administrator ID or access key")

    try:
        token, expires_at = create_access_token(account.id, hospital.id)
    except RuntimeError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Hospital authentication is not configured",
        ) from None
    return HospitalAdminSession(
        access_token=token,
        expires_at=expires_at,
        administrator_id=account.administrator_id,
        hospital_id=hospital.id,
        hospital_name=hospital.name,
    )


def get_current_hospital_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> HospitalAdminIdentity:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token required")
    try:
        claims = decode_access_token(credentials.credentials)
        account_id = UUID(claims["sub"])
        hospital_id = UUID(claims["hospital_id"])
    except (jwt.PyJWTError, KeyError, ValueError, RuntimeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token") from None

    account = db.get(HospitalAdminAccount, account_id)
    hospital = db.get(Hospital, hospital_id)
    if (
        account is None
        or not account.is_active
        or hospital is None
        or hospital.status != "active"
        or account.hospital_id != hospital.id
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")

    return HospitalAdminIdentity(
        administrator_id=account.administrator_id,
        hospital_id=hospital.id,
        hospital_name=hospital.name,
    )


@router.post("/change-access-key", status_code=status.HTTP_204_NO_CONTENT)
def change_access_key(
    payload: TerminalAccessKeyUpdate,
    db: Session = Depends(get_db),
    identity: HospitalAdminIdentity = Depends(get_current_hospital_admin),
):
    if payload.current_access_key == payload.new_access_key:
        raise HTTPException(status_code=422, detail="Choose a new access key different from the current one")
    account = db.scalar(
        select(HospitalAdminAccount).where(
            HospitalAdminAccount.hospital_id == identity.hospital_id,
            func.lower(HospitalAdminAccount.administrator_id) == identity.administrator_id.lower(),
        )
    )
    if account is None or not verify_terminal_access_key(payload.current_access_key, account.password_hash):
        raise HTTPException(status_code=400, detail="Current access key is incorrect")
    account.password_hash = hash_terminal_access_key(payload.new_access_key)
    db.commit()
    publish_hospital_event({identity.hospital_id}, "hospital.updated")
    return None


@router.get("/me", response_model=HospitalAdminIdentity)
def current_admin(identity: HospitalAdminIdentity = Depends(get_current_hospital_admin)):
    return identity