from uuid import UUID

from app.db.supabase_client import get_supabase_client

from app.repositories.matches_repository import player_ids_and_elos


def get_matches() -> list[dict]:
    db = get_supabase_client()

    response = (
        db
        .table("matches")
        .select("*")
        .execute()
    )

    return response.data or []


def get_match_by_id(match_id: UUID) -> dict | None:
    db = get_supabase_client()

    response = (
        db
        .table("matches")
        .select("*")
        .eq("match_id", str(match_id))
        .limit(1)
        .execute()
    )

    rows = response.data or []
    return rows[0] if rows else None


def create_match(lobby_id: UUID) -> dict:
    db = get_supabase_client()

    latest = (
        db
        .table("matches")
        .select("match_number")
        .eq("lobby_id", str(lobby_id))
        .order("match_number", desc=True)
        .limit(1)
        .execute()
    )

    latest_rows = latest.data or []
    next_match_number = (latest_rows[0]["match_number"] + 1) if latest_rows else 1

    created = (
        db
        .table("matches")
        .insert(
            {
                "lobby_id": str(lobby_id),
                "match_number": next_match_number,
                "status": "scheduled",
            }
        )
        .execute()
    )

    created_rows = created.data or []
    if not created_rows:
        raise RuntimeError("Failed to create match.")

    return created_rows[0]

def create_balanced_teams(match_players: list[str], match_sport: str):
    list_of_player_ids_and_elos = player_ids_and_elos(match_players=match_players, match_sport=match_sport)

    sorted_greatest_to_least_elos = sorted(
        list_of_player_ids_and_elos,
        key=lambda x: x[1],
        reverse=True
    )

    team_a = []
    team_b = []

    sum_a = 0
    sum_b = 0

    for player in sorted_greatest_to_least_elos:
        if sum_a <= sum_b:
            team_a.append(player)
            sum_a += player[1]
        else:
            team_b.append(player)
            sum_b += player[1]

    print("PLAYERS INPUT:", match_players)
    print("RPC RESULT:", list_of_player_ids_and_elos)


    return team_a, team_b