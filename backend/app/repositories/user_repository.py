from fastapi import Depends, HTTPException, status

from app.db.supabase_admin_client import get_supabase_admin_client
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
    
def upsert_user(user_id: str, username: str | None = None, preferred_campus: str | None = None, phone_number: str | None = None):
    admin_client = get_supabase_admin_client()

    payload = {
        "user_id": user_id,
        "username": username,
        "preferred_campus": preferred_campus,
        "phone_number": phone_number
    }

    response = (
        admin_client
        .table("users")
        .upsert(payload, on_conflict="user_id")
        .execute()
    )
    
    return response.data[0] if response.data else get_user_by_id(user_id)