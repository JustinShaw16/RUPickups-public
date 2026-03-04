from fastapi import APIRouter, Depends, status

from app.core.auth import require_user_id
from app.services import lobby_service
from app.models.lobby import LobbyCreate, LobbyResponse


router = APIRouter()


@router.get("", response_model=list[LobbyResponse])
def get_all_lobbies():
    return lobby_service.get_all_lobbies()


@router.post("", response_model=LobbyResponse, status_code=status.HTTP_201_CREATED)
def create_lobby(payload: LobbyCreate, user_id: str = Depends(require_user_id)):
    return lobby_service.create_lobby(user_id=user_id, payload=payload)

