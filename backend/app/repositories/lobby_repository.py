from uuid import UUID

from app.db.supabase_client import get_supabase_client
from app.models.lobby import LobbyCreate, LobbyUpdate


def get_lobby_by_id(lobby_id: UUID) -> dict | None:
    db = get_supabase_client()
    response = db.table("lobby").select("*").eq("lobby_id", str(lobby_id)).execute()
    if not response.data or len(response.data) == 0:
        return None
    row = response.data[0]
    if not isinstance(row.get("lobby_name"), str) or not str(row.get("lobby_name", "")).strip():
        row["lobby_name"] = f"{row.get('sport') or 'Pickup'} lobby"
    return row


def get_all_lobbies():
    db = get_supabase_client()

    response = (
        db
        .table("lobby")
        .select("*")
        .execute()
    )

    rows = response.data or []

    lobby_ids: list[str] = [str(row["lobby_id"]) for row in rows if row.get("lobby_id")]

    participant_counts: dict[str, dict[str, set[str] | int]] = {}

    if lobby_ids:
        participants_resp = (
            db.table("lobby_participants")
            .select("lobby_id, player_id")
            .in_("lobby_id", lobby_ids)
            .execute()
        )
        participant_rows = participants_resp.data or []
        for r in participant_rows:
            lobby_id = str(r.get("lobby_id"))
            player_id = str(r.get("player_id"))
            if not lobby_id or not player_id:
                continue
            entry = participant_counts.setdefault(
                lobby_id, {"players": set(), "count": 0}
            )
            players = entry["players"]
            if isinstance(players, set) and player_id not in players:
                players.add(player_id)
                entry["count"] = int(entry["count"]) + 1

    # Backfill lobby_name for existing rows that predate the column
    for row in rows:
        name = row.get("lobby_name")
        if not isinstance(name, str) or not name.strip():
            sport = row.get("sport") or "Pickup"
            row["lobby_name"] = f"{sport} lobby"

        lobby_id = str(row.get("lobby_id") or "")
        host_id = str(row.get("host_user_id") or "")
        entry = participant_counts.get(lobby_id)
        count = int(entry["count"]) if entry and "count" in entry else 0
        players_set = entry["players"] if entry and "players" in entry else set()
        if host_id and (not isinstance(players_set, set) or host_id not in players_set):
            count += 1
        row["participant_count"] = count

    return rows


def create_lobby(*, host_user_id: str, payload: LobbyCreate) -> dict:
    db = get_supabase_client()

    insert_data: dict = {
        "host_user_id": host_user_id,
        "lobby_name": payload.lobby_name,
        "scheduled_start_time": payload.scheduled_start_time.isoformat(),
        "location_id": str(payload.location_id) if payload.location_id else None,
        "is_public": payload.is_public,
        "max_players": payload.max_players,
        "sport": payload.sport,
        "campus": payload.campus,
    }

    # Remove keys with None values so database defaults can apply
    insert_data = {key: value for key, value in insert_data.items() if value is not None}

    response = db.table("lobby").insert(insert_data).execute()

    if not response.data:
        raise RuntimeError("Failed to create lobby")

    lobby_row = response.data[0]

    # Add host as a lobby participant
    try:
        db.table("lobby_participants").insert({
            "lobby_id": str(lobby_row["lobby_id"]),
            "player_id": host_user_id,
        }).execute()
    except Exception:
        pass

    return lobby_row


def update_lobby(*, lobby_id: UUID, payload: LobbyUpdate) -> dict | None:
    db = get_supabase_client()
    update_data: dict = {}
    if payload.lobby_name is not None:
        update_data["lobby_name"] = payload.lobby_name
    if payload.sport is not None:
        update_data["sport"] = payload.sport
    if payload.campus is not None:
        update_data["campus"] = payload.campus
    if payload.scheduled_start_time is not None:
        update_data["scheduled_start_time"] = payload.scheduled_start_time.isoformat()
    if payload.location_id is not None:
        update_data["location_id"] = str(payload.location_id)
    if payload.is_public is not None:
        update_data["is_public"] = payload.is_public
    if payload.max_players is not None:
        update_data["max_players"] = payload.max_players
    if not update_data:
        return get_lobby_by_id(lobby_id)
    response = (
        db.table("lobby")
        .update(update_data)
        .eq("lobby_id", str(lobby_id))
        .execute()
    )
    if not response.data or len(response.data) == 0:
        return None
    return response.data[0]


def delete_lobby(*, lobby_id: UUID) -> None:
    db = get_supabase_client()
    db.table("lobby").delete().eq("lobby_id", str(lobby_id)).execute()


def join_lobby(*, lobby_id: UUID, player_id: str) -> dict:
    db = get_supabase_client()
    insert_data = {
        "lobby_id": str(lobby_id),
        "player_id": player_id,
    }
    response = db.table("lobby_participants").insert(insert_data).execute()
    if not response.data:
        raise RuntimeError("Failed to join lobby")
    return response.data[0]


def leave_lobby(*, lobby_id: UUID, player_id: str) -> None:
    db = get_supabase_client()
    db.table("lobby_participants").delete().eq("lobby_id", str(lobby_id)).eq(
        "player_id", player_id
    ).execute()


def get_participants_for_lobby(lobby_id: UUID) -> list[dict]:
    db = get_supabase_client()
    lobby = get_lobby_by_id(lobby_id)
    if not lobby:
        return []

    response = (
        db.table("lobby_participants")
        .select("player_id, is_ready, current_team")
        .eq("lobby_id", str(lobby_id))
        .execute()
    )
    rows = response.data or []
    player_ids = [r["player_id"] for r in rows]
    host_id = str(lobby.get("host_user_id", ""))

    # Include host as participant if not already in the list
    if host_id and host_id not in player_ids:
        player_ids.append(host_id)
        rows.insert(0, {"player_id": host_id, "is_ready": False, "current_team": None})

    users_resp = db.table("users").select("user_id, username").in_("user_id", player_ids).execute()
    users_by_id = {u["user_id"]: u for u in (users_resp.data or [])}
    out = []
    for r in rows:
        u = users_by_id.get(r["player_id"], {})
        out.append({
            "player_id": r["player_id"],
            "username": u.get("username") or "Unknown",
            "is_ready": r.get("is_ready", False),
            "current_team": r.get("current_team"),
        })
    return out