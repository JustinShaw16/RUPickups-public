from uuid import UUID

from app.db.supabase_client import get_supabase_client

def get_users() -> list[dict]:
    db = get_supabase_client()

    response = (
        db
        .table("users")
        .select("*")
        .execute()
    )

    return response.data or []

def create_user(payload):
    supabase = get_supabase_client()

    res = (
        supabase.table("users")
        .insert(
            {
                "username": payload.username,
                "preferred_campus": payload.preferred_campus,
                "phone_number": payload.phone_number,
            }
        )
        .execute()
    )
    return res.data[0]
