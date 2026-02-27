from fastapi import APIRouter

from app.services import lobby_service
from app.models.lobby import LobbyResponse

router = APIRouter()

@router.get("", response_model=list[LobbyResponse])
def get_all_lobbies():
    return lobby_service.get_all_lobbies()

