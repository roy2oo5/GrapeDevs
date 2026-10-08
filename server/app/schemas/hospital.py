from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class HospitalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    administrator_name: str
    administrator_email: str
    classification: str
    node_role: str
    status: str
    settings: dict[str, Any]
    created_at: datetime


class HospitalDirectoryEntry(BaseModel):
    id: UUID
    name: str
    classification: str