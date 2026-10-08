from uuid import UUID

import jwt
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.db.session import get_session_factory
from app.models import Hospital, HospitalAdminAccount
from app.services.auth import decode_access_token
from app.services.realtime import realtime_manager


router = APIRouter(tags=["Realtime"])


@router.websocket("/api/ws")
async def hospital_websocket(websocket: WebSocket):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Authentication required")
        return
    try:
        claims = decode_access_token(token)
        administrator_id = UUID(claims["sub"])
        hospital_id = UUID(claims["hospital_id"])
    except (jwt.PyJWTError, KeyError, ValueError, RuntimeError):
        await websocket.close(code=1008, reason="Invalid or expired access token")
        return

    db = get_session_factory()()
    try:
        account = db.get(HospitalAdminAccount, administrator_id)
        hospital = db.get(Hospital, hospital_id)
        if (
            account is None
            or not account.is_active
            or hospital is None
            or hospital.status != "active"
            or account.hospital_id != hospital.id
        ):
            await websocket.close(code=1008, reason="Invalid or expired access token")
            return
    finally:
        db.close()

    await realtime_manager.connect(hospital_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await realtime_manager.disconnect(hospital_id, websocket)
