from uuid import UUID

from app.repositories import playerstats_repository


def get_player_stats() -> list[dict]:
    return playerstats_repository.get_all_player_stats()

def increment_users_wins(user_ids: list[UUID], sport: str):
    playerstats_repository.update_win_count(user_ids=user_ids, sport=sport)

def increment_users_losses(user_ids: list[UUID], sport: str):
    playerstats_repository.update_loss_count(user_ids=user_ids, sport=sport)

