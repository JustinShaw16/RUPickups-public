from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.models.lobby import LobbyCreate
from app.services import lobby_service


def _lobby_payload(**overrides):
    base = LobbyCreate(
        lobby_name="Evening Run",
        sport="basketball",
        campus="busch",
        scheduled_start_time=datetime.now(timezone.utc),
        location_id=None,
        is_public=True,
        max_players=10,
        min_elo=0,
        lobby_password=None,
    )
    return base.model_copy(update=overrides)


def test_create_lobby_rejects_min_elo_above_host(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(lobby_service, "_user_sport_elo", lambda **_kwargs: 1200)
    payload = _lobby_payload(min_elo=1500)

    with pytest.raises(ValueError, match="Minimum ELO"):
        lobby_service.create_lobby(user_id=str(uuid4()), payload=payload)


def test_create_lobby_rejects_duplicate_name(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(lobby_service, "_user_sport_elo", lambda **_kwargs: 1200)
    monkeypatch.setattr(lobby_service.lobby_repository, "lobby_name_exists", lambda **_kwargs: True)
    payload = _lobby_payload()

    with pytest.raises(lobby_service.LobbyConflictError, match="already exists"):
        lobby_service.create_lobby(user_id=str(uuid4()), payload=payload)


def test_join_lobby_rejects_full_lobby(monkeypatch: pytest.MonkeyPatch) -> None:
    lobby_id = uuid4()
    monkeypatch.setattr(
        lobby_service.lobby_repository,
        "get_lobby_by_id",
        lambda _id: {"lobby_id": str(lobby_id), "is_public": True, "max_players": 2, "min_elo": 0},
    )
    monkeypatch.setattr(
        lobby_service.lobby_repository,
        "get_participants_for_lobby",
        lambda _id: [{"player_id": str(uuid4())}, {"player_id": str(uuid4())}],
    )

    with pytest.raises(RuntimeError, match="Lobby is full"):
        lobby_service.join_lobby(lobby_id=lobby_id, user_id=str(uuid4()), unlock_token=None)
