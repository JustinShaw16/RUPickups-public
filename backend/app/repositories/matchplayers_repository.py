from uuid import UUID

from app.db.supabase_admin_client import get_supabase_admin_client
from app.db.supabase_client import get_supabase_client

from app.repositories.playerstats_repository import DEFAULT_STARTING_ELO

def insert_match_player(match_id: str, player_id: str, team: str):
    client = get_supabase_admin_client()

    lobby_id = (
        client
        .table("matches")
        .select("lobby_id")
        .eq("match_id", match_id)
        .single()
        .execute()
    ).data["lobby_id"]

    if not lobby_id:
        raise Exception("Match not found")

    sport = (
        client
        .table("lobby")
        .select("sport")
        .eq("lobby_id", lobby_id)
        .single()
        .execute()
    ).data["sport"]

    elo_res = (
        client
        .table("player_stats")
        .select("elo")
        .eq("user_id", player_id)
        .eq("sport", sport)
        .execute()
    )

    if not elo_res.data:
        new_stat = {
            "user_id": player_id,
            "sport": sport,
            "elo": DEFAULT_STARTING_ELO,
            "wins": 0,
            "losses": 0
        }

        client.table("player_stats").insert(new_stat).execute()

    initial_player_elo = elo_res.data[0]["elo"] if elo_res.data else DEFAULT_STARTING_ELO

    payload = {
        "match_id": match_id,
        "player_id": player_id,
        "team": team,
        "elo_before": initial_player_elo,
        "elo_after": None
    }

    client.table("match_players").upsert(payload, on_conflict="match_id,player_id").execute()

def delete_match_players(match_id: str):
    client = get_supabase_admin_client()
    client.table("match_players").delete().eq("match_id", match_id).execute()