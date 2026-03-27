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