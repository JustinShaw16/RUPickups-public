from fastapi import APIRouter, status
from uuid import UUID
from app.services.matchplayers_service import get_match_players, insert_match_players_to_db, delete_match_players_from_db
from app.models.matchplayers import MatchPlayerResponse

router = APIRouter()

@router.get("/player_manifest", response_model=list[MatchPlayerResponse])
def get_list_of_match_players():
    return get_match_players()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_match_player(match_id: str, team_A_player_ids: list[str], team_B_player_ids: list[str]):
    insert_match_players_to_db(match_id=match_id, team_A_player_ids=team_A_player_ids, team_B_player_ids=team_B_player_ids)
@router.delete("/", status_code=status.HTTP_200_OK)
def conclude_match(match_id: str):
    delete_match_players_from_db(match_id=match_id)