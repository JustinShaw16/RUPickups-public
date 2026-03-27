from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class MatchPlayerResponse(BaseModel):
    match_id: str
    player_id: str

    team: str

    class Config:
        from_attributes = True

class CreateMatchPlayersRequest(BaseModel):
    match_id: UUID
    team_A_player_ids: list[UUID]
    team_B_player_ids: list[UUID]
