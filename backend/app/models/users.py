from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(min_length=1)
    preferred_campus: Optional[str] = None
    phone_number: Optional[str] = None


class UserResponse(BaseModel):
    user_id: UUID
    username: str
    preferred_campus: Optional[str] = None
    phone_number: Optional[str] = None
    elo: int
    wins: int
    losses: int
    created_at: datetime
