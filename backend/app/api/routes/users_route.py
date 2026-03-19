from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import require_user_id
from app.models.users import UserCreate, UserResponse
from app.services import users_service

router = APIRouter()

@router.get("/", response_model=list[UserResponse])
def read_users():
    return users_service.get_users()

@router.get("/leaderboard", response_model=list[UserResponse])
def read_leaderboard(limit: int = 10):
    return users_service.get_leaderboard(limit=min(limit, 50))

@router.get("/me", response_model=UserResponse)
def read_me(user_id: str = Depends(require_user_id)):
    user = users_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    return user

@router.get("/{user_id}", response_model=UserResponse)
def read_user(user_id: str, _: str = Depends(require_user_id)):
    user = users_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found"
        )
    return user

@router.post("/me", response_model=UserResponse)
def upsert_me(payload: UserCreate, user_id: str = Depends(require_user_id)):
    return users_service.upsert_user(user_id=user_id, payload=payload)