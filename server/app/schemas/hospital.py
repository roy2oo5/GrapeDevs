from datetime import datetime
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
    created_at: datetime