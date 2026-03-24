from uuid import UUID

from app.repositories import lobby_repository
from app.models.lobby import LobbyCreate, LobbyResponse, LobbyUpdate


def get_all_lobbies() -> list[LobbyResponse]:
    return lobby_repository.get_all_lobbies()


def get_my_upcoming_lobbies(user_id: str) -> list:
    return lobby_repository.get_upcoming_lobbies_for_user(user_id)


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


def _player_id_key(player_id) -> str:
    try:
        return str(UUID(str(player_id).strip()))
    except (TypeError, ValueError):
        return str(player_id).strip()


def join_lobby(*, lobby_id: UUID, user_id: str) -> dict:
    lobby = lobby_repository.get_lobby_by_id(lobby_id)
    if not lobby:
        raise RuntimeError("Lobby not found")

    participants = lobby_repository.get_participants_for_lobby(lobby_id)
    user_key = _player_id_key(user_id)
    for row in participants:
        if _player_id_key(row.get("player_id")) == user_key:
            raise RuntimeError("Already in this lobby")

    max_players = int(lobby.get("max_players") or 0)
    if max_players > 0 and len(participants) >= max_players:
        raise RuntimeError("Lobby is full")

    return lobby_repository.join_lobby(lobby_id=lobby_id, player_id=user_id)


def leave_lobby(*, lobby_id: UUID, user_id: str) -> None:
    lobby_repository.leave_lobby(lobby_id=lobby_id, player_id=user_id)


def get_lobby_participants(lobby_id: UUID) -> list[dict]:
    return lobby_repository.get_participants_for_lobby(lobby_id)

