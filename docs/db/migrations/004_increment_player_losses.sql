create or replace function increment_losses(p_user_id UUID, p_sport text)
returns void
language sql
as $$
    update player_stats
    set losses = losses + 1
    where user_id = p_user_id
        and sport = p_sport;
$$;