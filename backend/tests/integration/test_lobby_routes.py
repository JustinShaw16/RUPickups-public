from uuid import uuid4

import pytest

from app.api.routes import lobby_route
from app.core.auth import require_user_id
from app.main import app


@pytest.fixture
def authed_user() -> str:
    return str(uuid4())


def _override_auth(user_id: str) -> None:
    app.dependency_overrides[require_user_id] = lambda: user_id


def test_join_lobby_requires_unlock_token(
    client, monkeypatch: pytest.MonkeyPatch, authed_user: str
) -> None:
    lobby_id = uuid4()
    _override_auth(authed_user)
    monkeypatch.setattr(
        lobby_route.lobby_service,
        "get_lobby_by_id",
        lambda _lobby_id: {"lobby_id": str(lobby_id)},
    )
    monkeypatch.setattr(
        lobby_route.lobby_service,
        "join_lobby",
        lambda **_kwargs: (_ for _ in ()).throw(
            RuntimeError("Private lobby: unlock with the lobby password before joining")
        ),
    )

    response = client.post(f"/lobbies/{lobby_id}/join")

    assert response.status_code == 403
    assert "unlock" in response.json()["detail"].lower()


def test_join_lobby_maps_full_lobby_error(
    client, monkeypatch: pytest.MonkeyPatch, authed_user: str
) -> None:
    lobby_id = uuid4()
    _override_auth(authed_user)
    monkeypatch.setattr(
        lobby_route.lobby_service,
        "get_lobby_by_id",
        lambda _lobby_id: {"lobby_id": str(lobby_id)},
    )
    monkeypatch.setattr(
        lobby_route.lobby_service,
        "join_lobby",
        lambda **_kwargs: (_ for _ in ()).throw(RuntimeError("Lobby is full")),
    )

    response = client.post(f"/lobbies/{lobby_id}/join")

    assert response.status_code == 409
    assert response.json()["detail"] == "Lobby is full"


def test_unlock_lobby_returns_token(
    client, monkeypatch: pytest.MonkeyPatch, authed_user: str
) -> None:
    lobby_id = uuid4()
    _override_auth(authed_user)
    monkeypatch.setattr(
        lobby_route.lobby_repository,
        "get_lobby_by_id",
        lambda _lobby_id: {"lobby_id": str(lobby_id)},
    )
    monkeypatch.setattr(
        lobby_route.lobby_service,
        "unlock_private_lobby",
        lambda **_kwargs: "unlock-token",
    )

    response = client.post(f"/lobbies/{lobby_id}/unlock", json={"password": "secret123"})

    assert response.status_code == 200
    assert response.json() == {"unlock_token": "unlock-token"}
