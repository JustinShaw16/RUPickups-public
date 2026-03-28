from uuid import UUID

from app.repositories import playerstats_repository


def get_player_stats() -> list[dict]:
    return playerstats_repository.get_all_player_stats()

def increment_user_wins(user_id: UUID, sport: str):
    playerstats_repository.update_win_count(user_id=user_id, sport=sport)

def increment_user_losses(user_id: UUID, sport: str):
    playerstats_repository.update_loss_count(user_id=user_id, sport=sport)

