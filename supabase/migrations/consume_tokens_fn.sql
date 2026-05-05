-- Fonction atomique de consommation de tokens
-- Utilise FOR UPDATE pour éviter les race conditions entre requêtes simultanées
-- À appliquer dans le dashboard Supabase > SQL Editor

CREATE OR REPLACE FUNCTION consume_tokens(
  p_user_id uuid,
  p_cost     integer,
  p_tool     text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance    integer;
  v_total_used integer;
  v_new_balance integer;
BEGIN
  SELECT tokens_balance, tokens_total_used
  INTO   v_balance, v_total_used
  FROM   profiles
  WHERE  id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Profil introuvable', 'tokens_left', 0);
  END IF;

  IF v_balance < p_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', format('Solde insuffisant — il te reste %s tokens (coût : %s).', v_balance, p_cost),
      'tokens_left', v_balance
    );
  END IF;

  v_new_balance := v_balance - p_cost;

  UPDATE profiles
  SET tokens_balance    = v_new_balance,
      tokens_total_used = v_total_used + p_cost
  WHERE id = p_user_id;

  INSERT INTO tokens_transactions(user_id, tool, tokens_used, tokens_before, tokens_after)
  VALUES (p_user_id, p_tool, p_cost, v_balance, v_new_balance);

  RETURN json_build_object('success', true, 'tokens_left', v_new_balance);
END;
$$;
