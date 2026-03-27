from uuid import UUID

from app.db.supabase_client import get_supabase_client
from app.repositories.matchplayers_repository import insert_match_player, delete_match_players
def get_match_players() -> list[dict]:
    db = get_supabase_client()

    response = (
        db
        .table("match_players")
        .select("*")
        .execute()
    )

    return response.data or []

def insert_match_player_to_db(match_id: str, player_id: str, team: str):
    insert_match_player(match_id=match_id, player_id=player_id, team=team)

def delete_match_players_from_db(match_id: str):
    delete_match_players(match_id=match_id)