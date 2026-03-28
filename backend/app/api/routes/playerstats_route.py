from fastapi import APIRouter, status, Query
from uuid import UUID

from app.services.playerstats_service import get_player_stats, increment_users_wins, increment_users_losses
from app.models.playerstats import PlayerStatsResponse

router = APIRouter()

@router.get("/player_stats_manifest", response_model=list[PlayerStatsResponse])
def get_list_of_player_stats():
    return get_player_stats()

@router.patch("/win", status_code=status.HTTP_202_ACCEPTED)
def update_wins(
        user_ids: list[UUID] = Query(...), 
        sport: str = Query(...),
    ):
    increment_users_wins(user_ids=[str(u) for u in user_ids], sport=sport)

    return {"ok": True}

@router.patch("/lose", status_code=status.HTTP_202_ACCEPTED)
def update_losses(
        user_ids: list[UUID] = Query(...), 
        sport: str = Query(...),
    ):
    increment_users_losses(user_ids=[str(u) for u in user_ids], sport=sport)

    return {"ok": True}