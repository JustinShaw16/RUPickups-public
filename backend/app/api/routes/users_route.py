from fastapi import APIRouter

from app.models.users import UserResponse, UserCreate
from app.services import users_service

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users():
    return users_service.get_users()

@router.post("/", response_model=UserResponse)
def add_user(payload: UserCreate):
    # TEMPORARY DEV MODE — remove once auth is wired
    dev_user_id = "1b745401-d0da-4ca7-bf18-dc078aab91c6"
    return users_service.create_user(payload, dev_user_id)
