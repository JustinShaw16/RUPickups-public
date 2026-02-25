from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class PlayerStatsResponse(BaseModel):
    stat_id: UUID
    user_id: UUID
    sport: str
    
    matches_played: int = Field(ge=0)
    
    wins: int = Field(ge=0)
    losses: int = Field(ge=0)

    elo: int = Field(ge=0)
    
    current_streak: int
    
    created_at: datetime

    class Config:
        from_attributes = True

