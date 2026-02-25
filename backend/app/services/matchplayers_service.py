from uuid import UUID

from app.db.supabase_client import get_supabase_client

def get_match_players() -> list[dict]:
    db = get_supabase_client()

    response = (
        db
        .table("match_players")
        .select("*")
        .execute()
    )

    return response.data or []