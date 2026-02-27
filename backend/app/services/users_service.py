from app.db.supabase_client import get_supabase_client
from app.repositories import user_repository
from app.models.users import *

def get_users() -> list[dict]:
    return user_repository.get_all_users()

def create_user(payload : UserCreate, user_id: str):
    existing = user_repository.get_user_by_id(user_id)
    if existing:
        return existing

    return user_repository.insert_user(
        user_id=user_id,
        username=payload.username,
        preferred_campus=payload.preferred_campus,
        phone_number=payload.phone_number
    )