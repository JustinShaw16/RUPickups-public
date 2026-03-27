from fastapi import APIRouter, status
from uuid import UUID
from app.services.matchplayers_service import get_match_players, insert_match_player_to_db
from app.models.matchplayers import MatchPlayerResponse

router = APIRouter()

@router.get("/player_manifest", response_model=list[MatchPlayerResponse])
def get_list_of_match_players():
    return get_match_players()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_match_player(payload: MatchPlayerResponse):
    insert_match_player_to_db(match_id=payload.match_id, player_id=payload.player_id, team=payload.team)