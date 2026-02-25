from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class MatchPlayerResponse(BaseModel):
    match_id: UUID
    player_id: UUID

    team: str

    elo_before: int = Field(ge=0)
    elo_after: Optional[int] = Field(default=None, ge=0)

    class Config:
        from_attributes = True