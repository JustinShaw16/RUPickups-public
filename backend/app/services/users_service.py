from app.repositories import user_repository
from app.models.users import UserCreate

def get_users() -> list[dict]:
    return user_repository.get_all_users()

def get_user_by_id(user_id: str):
    return user_repository.get_user_by_id(user_id)

def upsert_user(payload: UserCreate, user_id: str):
    existing = user_repository.get_user_by_id(user_id)

    if existing:
        return user_repository.update_user(
            user_id=user_id,
            username=payload.username,
            preferred_campus=payload.preferred_campus,
            phone_number=payload.phone_number,
        )

    return user_repository.insert_user(
        user_id=user_id,
        username=payload.username,
        preferred_campus=payload.preferred_campus,
        phone_number=payload.phone_number,
    )