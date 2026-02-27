from app.db.supabase_client import get_supabase_client

def get_all_lobbies():
    db = get_supabase_client()

    response = (
        db
        .table("lobby")
        .select("*")
        .execute()
    )

    return response.data or []