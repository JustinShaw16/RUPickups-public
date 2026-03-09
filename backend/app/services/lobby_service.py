from uuid import UUID

from app.repositories import lobby_repository
from app.models.lobby import LobbyCreate, LobbyResponse, LobbyUpdate


def get_all_lobbies() -> list[LobbyResponse]:
    return lobby_repository.get_all_lobbies()


def get_lobby_by_id(lobby_id: UUID) -> dict | None:
    return lobby_repository.get_lobby_by_id(lobby_id)


def create_lobby(*, user_id: str, payload: LobbyCreate):
    return lobby_repository.create_lobby(host_user_id=user_id, payload=payload)


def update_lobby(*, lobby_id: UUID, user_id: str, payload: LobbyUpdate) -> dict | None:
    lobby = lobby_repository.get_lobby_by_id(lobby_id)
    if not lobby or str(lobby.get("host_user_id")) != user_id:
        return None
    return lobby_repository.update_lobby(lobby_id=lobby_id, payload=payload)


def delete_lobby(*, lobby_id: UUID, user_id: str) -> bool:
    lobby = lobby_repository.get_lobby_by_id(lobby_id)
    if not lobby or str(lobby.get("host_user_id")) != user_id:
        return False
    lobby_repository.delete_lobby(lobby_id=lobby_id)
    return True


def join_lobby(*, lobby_id: UUID, user_id: str) -> dict:
    return lobby_repository.join_lobby(lobby_id=lobby_id, player_id=user_id)


def leave_lobby(*, lobby_id: UUID, user_id: str) -> None:
    lobby_repository.leave_lobby(lobby_id=lobby_id, player_id=user_id)


def get_lobby_participants(lobby_id: UUID) -> list[dict]:
    return lobby_repository.get_participants_for_lobby(lobby_id)

