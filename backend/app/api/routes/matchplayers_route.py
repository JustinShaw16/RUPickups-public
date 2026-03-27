from fastapi import APIRouter, status
from uuid import UUID
from app.services.matchplayers_service import get_match_players, insert_match_players_to_db, delete_match_players_from_db
from app.models.matchplayers import MatchPlayerResponse, CreateMatchPlayersRequest

router = APIRouter()

@router.get("/player_manifest", response_model=list[MatchPlayerResponse])
def get_list_of_match_players():
    return get_match_players()

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_match_players(payload: CreateMatchPlayersRequest):
    insert_match_players_to_db(
        match_id=str(payload.match_id),
        team_A_player_ids=[str(a) for a in payload.team_A_player_ids],
        team_B_player_ids=[str(b) for b in payload.team_B_player_ids]
    )

    return {"ok": True}

@router.delete("/", status_code=status.HTTP_200_OK)
def delete_match_players(match_id: str):
    delete_match_players_from_db(match_id=match_id)