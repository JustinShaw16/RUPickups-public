from fastapi import APIRouter

from app.models.users import UserResponse, UserCreate
from app.services.users_service import get_users, create_user

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users():
    return get_users()

@router.post("/", response_model=UserResponse)
def add_user(payload: UserCreate):
    return create_user(payload)
