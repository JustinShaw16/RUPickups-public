from fastapi import APIRouter

from app.models.users import UserResponse
from app.services.users_service import get_users

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users():
    return get_users()
