from fastapi import APIRouter

from app.services.lobby_service import get_lobbies
from app.models.lobby import LobbyResponse

router = APIRouter()

@router.get("/lobby_manifest", response_model=list[LobbyResponse])
def get_list_of_lobbies():
    return get_lobbies()

