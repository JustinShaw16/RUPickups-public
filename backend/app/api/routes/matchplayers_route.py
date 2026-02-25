from fastapi import APIRouter

from app.services.matchplayers_service import get_match_players
from app.models.matchplayers import MatchPlayerResponse

router = APIRouter()

@router.get("/player_manifest", response_model=list[MatchPlayerResponse])
def get_list_of_match_players():
    return get_match_players()