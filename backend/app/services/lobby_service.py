from uuid import UUID

from app.db.supabase_client import get_supabase_client
from app.repositories import lobby_repository
from app.models.lobby import *

def get_all_lobbies() ->list[LobbyResponse]:
    return lobby_repository.get_all_lobbies()

