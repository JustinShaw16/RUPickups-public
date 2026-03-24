from datetime import datetime
from typing import Literal, Optional

from uuid import UUID

from pydantic import BaseModel, Field


class LobbyCreate(BaseModel):
    lobby_name: str = Field(min_length=1, max_length=100)
    sport: str
    campus: str
    scheduled_start_time: datetime
    location_id: Optional[UUID] = None
    is_public: bool = Field(default=True)
    max_players: int = Field(default=2, ge=2, le=100)


class LobbyUpdate(BaseModel):
    lobby_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    sport: Optional[str] = None
    campus: Optional[str] = None
    scheduled_start_time: Optional[datetime] = None
    location_id: Optional[UUID] = None
    is_public: Optional[bool] = None
    max_players: Optional[int] = Field(default=None, ge=2, le=100)


class LobbyResponse(BaseModel):
    lobby_id: UUID
    host_user_id: UUID
    lobby_name: str
    sport: str
    campus: str
    location_id: Optional[UUID] = None
    is_public: bool = Field(default=True)
    max_players: int = Field(default=2, ge=2, le=100)
    status: str
    scheduled_start_time: datetime
    created_at: datetime
    participant_count: int | None = None
    participant_average_elo: float | None = None

    class Config:
        from_attributes = True


class LeaveLobbyResponse(BaseModel):
    result: Literal["left", "host_transferred", "lobby_deleted"]
    new_host_user_id: UUID | None = None

