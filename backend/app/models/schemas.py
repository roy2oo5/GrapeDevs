from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ItemCreate(BaseModel):
    name: str = Field(..., example="Neural Network Checkpoint")
    description: Optional[str] = Field(None, example="Pre-trained weights for vision tasks")

class ItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: str

class ItemListResponse(BaseModel):
    count: int
    items: List[ItemResponse]

class HealthStatus(BaseModel):
    status: str
    framework: str
    environment: str
    python_version: str
    uptime_seconds: float
