from datetime import datetime
from typing import Optional

from uuid import UUID

from pydantic import BaseModel, Field

class NotificationResponse(BaseModel):
    notification_id: UUID
    recipient_id: UUID

    message: str
    type: str
    
    is_read: bool = Field(default=False)

    created_at: datetime

    class Config:
        from_attributes = True

