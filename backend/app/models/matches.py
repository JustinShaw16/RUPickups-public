from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class MatchCreateRequest(BaseModel):
    lobby_id: UUID
 
 
class MatchResponse(BaseModel):
    match_id: UUID
    lobby_id: UUID
 
    match_number: int = Field(ge=1)
    status: str
 
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
 
    winner_team: Optional[str] = None
    created_at: datetime
 
    class Config:
        from_attributes = True