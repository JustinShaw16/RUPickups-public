from app.repositories import playerstats_repository


def get_player_stats() -> list[dict]:
    return playerstats_repository.get_all_player_stats()