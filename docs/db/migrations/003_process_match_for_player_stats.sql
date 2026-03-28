create or replace function process_match(
  p_winner_ids uuid[],
  p_loser_ids uuid[],
  p_sport text
)
returns void
language plpgsql
as $$
begin
  insert into player_stats (user_id, sport, wins, losses)
  select unnest(p_winner_ids), p_sport, 1, 0
  on conflict (user_id, sport)
  do update set wins = player_stats.wins + 1;

  update player_stats
  set current_streak = coalesce(current_streak, 0) + 1
  where user_id = any(p_winner_ids)
    and sport = p_sport;

  insert into player_stats (user_id, sport, wins, losses)
  select unnest(p_loser_ids), p_sport, 0, 1
  on conflict (user_id, sport)
  do update set losses = player_stats.losses + 1;

  update player_stats
  set current_streak = 0
  where user_id = any(p_loser_ids)
    and sport = p_sport;

end;
$$;