from app.repositories import lobby_repository
from app.models.lobby import LobbyCreate, LobbyResponse


def get_all_lobbies() -> list[LobbyResponse]:
    return lobby_repository.get_all_lobbies()


def create_lobby(*, user_id: str, payload: LobbyCreate):
    return lobby_repository.create_lobby(host_user_id=user_id, payload=payload)

