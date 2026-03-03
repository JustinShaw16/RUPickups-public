from app.db.supabase_client import get_supabase_client

def get_all_users():
    db = get_supabase_client()

    response = (
        db
        .table("users")
        .select("*")
        .execute()
    )

    return response.data or []

def get_user_by_id(user_id: str):
    db = get_supabase_client()

    response = (
        db.table("users")
        .select("*")
        .eq("user_id", user_id)
        .execute()
    )

    return response.data[0] if response.data else None
    
def update_user(user_id: str, username: str | None = None, preferred_campus: str | None = None, phone_number: str | None = None):
    db = get_supabase_client()

    updates = {}

    # Only update fields that were provided (avoid overwriting with None)
    if username is not None:
        updates["username"] = username
    if preferred_campus is not None:
        updates["preferred_campus"] = preferred_campus
    if phone_number is not None:
        updates["phone_number"] = phone_number

    # Nothing to update
    if not updates:
        return get_user_by_id(user_id)

    response = (
        db.table("users")
        .update(updates)
        .eq("user_id", user_id)
        .execute()
    )

    return response.data[0] if response.data else get_user_by_id(user_id)

def insert_user(user_id: str, username: str, preferred_campus: str, phone_number: str):
    db = get_supabase_client()

    response = (
        db
        .table("users")
        .insert(
            {
                "user_id": user_id,
                "username": username,
                "preferred_campus": preferred_campus,
                "phone_number": phone_number,
            }
        )
        .execute()
    )

    if not response.data:
        raise Exception("Failed to insert user")
    
    return response.data[0]