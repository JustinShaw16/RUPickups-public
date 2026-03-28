from fastapi import APIRouter, status
from uuid import UUID

from app.services.playerstats_service import get_player_stats, increment_user_wins, increment_user_losses
from app.models.playerstats import PlayerStatsResponse

router = APIRouter()

@router.get("/player_stats_manifest", response_model=list[PlayerStatsResponse])
def get_list_of_player_stats():
    return get_player_stats()

@router.patch("/win", status_code=status.HTTP_202_ACCEPTED)
def update_wins(user_id: UUID, sport: str):
    increment_user_wins(user_id=user_id, sport=sport)

    return {"ok": True}

@router.patch("/lose", status_code=status.HTTP_202_ACCEPTED)
def update_losses(user_id: UUID, sport: str):
    increment_user_losses(user_id=user_id, sport=sport)

    return {"ok": True}