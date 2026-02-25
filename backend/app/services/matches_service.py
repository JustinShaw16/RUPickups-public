from uuid import UUID

from app.db.supabase_client import get_supabase_client

def get_matches() -> list[dict]:
    db = get_supabase_client()

    response = (
        db
        .table("matches")
        .select("*")
        .execute()
    )

    return response.data or []