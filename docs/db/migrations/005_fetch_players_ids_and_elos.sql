create or replace function get_players_current_elos(
  p_ids uuid[],
  m_sport text
)
returns table(
  p_id uuid,
  p_elo int
)
language plpgsql
as $$
begin
  return query
  select user_id, elo
  from player_stats
  where user_id = any(p_ids)
    and sport = m_sport;
end;
$$;