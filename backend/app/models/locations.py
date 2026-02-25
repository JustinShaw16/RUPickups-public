from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class LocationResponse(BaseModel):
    location_id: UUID
    name: str
    campus: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

