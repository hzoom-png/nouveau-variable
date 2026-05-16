-- Supprime toutes les signatures existantes
drop function if exists consume_tokens(uuid, text);
drop function if exists consume_tokens(uuid, integer, text);

create or replace function consume_tokens(
  p_user_id uuid,
  p_tool    text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_cost        int;
  v_balance     int;
  v_new_balance int;
begin
  v_cost := case p_tool
    when 'terrain'    then 30
    when 'deallink'   then 20
    when 'replique'   then 25
    when 'sidehustle' then 40
    when 'keyaccount' then 15
    else 10
  end;

  select tokens_balance into v_balance
  from profiles
  where id = p_user_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Profil introuvable', 'tokensLeft', 0);
  end if;

  if coalesce(v_balance, 0) < v_cost then
    return jsonb_build_object(
      'success', false,
      'error', 'Tokens insuffisants',
      'tokensLeft', coalesce(v_balance, 0)
    );
  end if;

  v_new_balance := coalesce(v_balance, 0) - v_cost;

  update profiles
  set
    tokens_balance    = v_new_balance,
    tokens_total_used = coalesce(tokens_total_used, 0) + v_cost
  where id = p_user_id;

  -- Log non-fatal : si la table a un schéma inattendu, on ne bloque pas le débit
  begin
    insert into tokens_transactions (user_id, tool_name, tokens_used, description)
    values (p_user_id, p_tool, v_cost, 'Utilisation ' || p_tool);
  exception when others then
    null;
  end;

  return jsonb_build_object('success', true, 'tokensLeft', v_new_balance);
end;
$$;
