from fastapi import APIRouter

from app.services.playerstats_service import get_player_stats
from app.models.playerstats import PlayerStatsResponse

router = APIRouter()

@router.get("/player_stats_manifest", response_model=list[PlayerStatsResponse])
def get_list_of_player_stats():
    return get_player_stats()