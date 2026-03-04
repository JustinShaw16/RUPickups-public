from app.db.supabase_client import get_supabase_client
from app.models.lobby import LobbyCreate


def get_all_lobbies():
    db = get_supabase_client()

    response = (
        db
        .table("lobby")
        .select("*")
        .execute()
    )

    return response.data or []


def create_lobby(*, host_user_id: str, payload: LobbyCreate) -> dict:
    db = get_supabase_client()

    insert_data: dict = {
        "host_user_id": host_user_id,
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

    return response.data[0]