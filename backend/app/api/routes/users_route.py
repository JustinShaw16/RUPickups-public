from fastapi import APIRouter, Depends, HTTPException, status

from app.models.users import UserResponse, UserCreate
from app.services import users_service
from app.core.auth import require_user_id

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users():
    return users_service.get_users()

@router.get("/me", response_model=UserResponse)
def read_me(user_id: str = Depends(require_user_id)):
    user = users_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    return user

@router.post("/me", response_model=UserResponse)
def upsert_me(payload: UserCreate, user_id: str = Depends(require_user_id)):
    return users_service.create_user(payload, user_id)

@router.post("/", response_model=UserResponse)
def add_user(payload: UserCreate, user_id: str = Depends(require_user_id)):
    return users_service.create_user(payload, user_id)
