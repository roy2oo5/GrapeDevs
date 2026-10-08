from __future__ import annotations

import asyncio
from collections import defaultdict
from uuid import UUID

from anyio import from_thread
from fastapi import WebSocket


class HospitalRealtimeManager:
    def __init__(self) -> None:
        self._connections: dict[UUID, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, hospital_id: UUID, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[hospital_id].add(websocket)

    async def disconnect(self, hospital_id: UUID, websocket: WebSocket) -> None:
        async with self._lock:
            connections = self._connections.get(hospital_id)
            if connections is None:
                return
            connections.discard(websocket)
            if not connections:
                self._connections.pop(hospital_id, None)

    async def publish(self, hospital_ids: set[UUID], event: dict) -> None:
        async with self._lock:
            recipients = {
                websocket
                for hospital_id in hospital_ids
                for websocket in self._connections.get(hospital_id, set())
            }
        stale: list[WebSocket] = []
        for websocket in recipients:
            try:
                await websocket.send_json(event)
            except (OSError, RuntimeError):
                stale.append(websocket)
        if stale:
            async with self._lock:
                for connections in self._connections.values():
                    connections.difference_update(stale)


realtime_manager = HospitalRealtimeManager()


def publish_hospital_event(hospital_ids: set[UUID], event_type: str, **payload) -> None:
    try:
        event = {"type": event_type, "payload": payload}
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            from_thread.run(realtime_manager.publish, hospital_ids, event)
        else:
            loop.create_task(realtime_manager.publish(hospital_ids, event))
    except RuntimeError:
        return
