from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field


class LobbyCreate(BaseModel):
    sport: str
    campus: str
    scheduled_start_time: datetime
    location_id: Optional[UUID] = None
    is_public: bool = Field(default=True)
    max_players: int = Field(default=2, ge=2, le=100)


class LobbyResponse(BaseModel):
    lobby_id: UUID
    host_user_id: UUID
    sport: str
    campus: str
    location_id: Optional[UUID] = None
    is_public: bool = Field(default=True)
    max_players: int = Field(default=2, ge=2, le=100)
    status: str
    scheduled_start_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True

