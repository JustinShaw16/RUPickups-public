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


def get_match_by_id(match_id: UUID) -> dict | None:
    db = get_supabase_client()

    response = (
        db
        .table("matches")
        .select("*")
        .eq("match_id", str(match_id))
        .limit(1)
        .execute()
    )

    rows = response.data or []
    return rows[0] if rows else None


def create_match(lobby_id: UUID) -> dict:
    db = get_supabase_client()

    latest = (
        db
        .table("matches")
        .select("match_number")
        .eq("lobby_id", str(lobby_id))
        .order("match_number", desc=True)
        .limit(1)
        .execute()
    )

    latest_rows = latest.data or []
    next_match_number = (latest_rows[0]["match_number"] + 1) if latest_rows else 1

    created = (
        db
        .table("matches")
        .insert(
            {
                "lobby_id": str(lobby_id),
                "match_number": next_match_number,
                "status": "scheduled",
            }
        )
        .execute()
    )

    created_rows = created.data or []
    if not created_rows:
        raise RuntimeError("Failed to create match.")

    return created_rows[0]