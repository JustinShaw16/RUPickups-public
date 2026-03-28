create or replace function increment_wins(p_user_id uuid, p_sport text)
returns void
language sql
as $$
  update player_stats
  set wins = wins + 1
  where user_id = p_user_id
    and sport = p_sport;
$$;