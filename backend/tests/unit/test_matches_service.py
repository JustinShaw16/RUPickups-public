from uuid import uuid4

import pytest

from app.services import matches_service


def test_create_match_requires_host(monkeypatch: pytest.MonkeyPatch) -> None:
    lobby_id = uuid4()
    monkeypatch.setattr(matches_service, "_get_lobby_host_user_id", lambda _lobby_id: "host-user")

    with pytest.raises(PermissionError, match="Only host can create"):
        matches_service.create_match(lobby_id=lobby_id, user_id="other-user")


def test_start_match_rejects_completed(monkeypatch: pytest.MonkeyPatch) -> None:
    match_id = uuid4()
    lobby_id = uuid4()
    monkeypatch.setattr(
        matches_service,
        "get_match_by_id",
        lambda _match_id: {"match_id": str(match_id), "lobby_id": str(lobby_id), "status": "completed"},
    )
    monkeypatch.setattr(matches_service, "_get_lobby_host_user_id", lambda _lobby_id: "host-user")

    with pytest.raises(RuntimeError, match="already completed"):
        matches_service.start_match(match_id=match_id, user_id="host-user")


def test_create_balanced_teams_distributes_all_players(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    players = ["a", "b", "c", "d"]
    monkeypatch.setattr(
        matches_service,
        "player_ids_and_elos",
        lambda **_kwargs: [("a", 1000), ("b", 900), ("c", 800), ("d", 700)],
    )

    team_a, team_b = matches_service.create_balanced_teams(players, "basketball")

    picked = [pid for pid, _elo in team_a + team_b]
    assert sorted(picked) == sorted(players)
    assert abs(sum(elo for _, elo in team_a) - sum(elo for _, elo in team_b)) <= 300
