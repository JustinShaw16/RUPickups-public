from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class LobbyParticipantResponse(BaseModel):
    lobby_id: UUID
    player_id: UUID
    
    is_ready: bool = Field(default=False)
    current_team: Optional[str] = None

    class Config:
        from_attributes = True
