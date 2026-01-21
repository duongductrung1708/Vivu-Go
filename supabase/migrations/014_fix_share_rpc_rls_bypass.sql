-- Ensure share-token RPC can read non-public itineraries.
--
-- Symptoms:
-- - POST /rest/v1/rpc/get_itinerary_by_share_token returns 200 with []
--   even though itinerary_shares has a valid row for the token.
--
-- Root cause:
-- - RLS on public.itineraries filters out rows for anon/authenticated callers.
-- - SECURITY DEFINER only bypasses RLS if the function runs as a role that can bypass it.
--
-- Fix:
-- - Recreate function with row_security disabled.
-- - Set function owner to postgres (bypasses RLS).

DROP FUNCTION IF EXISTS public.get_itinerary_by_share_token(TEXT);

CREATE OR REPLACE FUNCTION public.get_itinerary_by_share_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_budget DECIMAL(12, 2),
  people_count INTEGER,
  is_public BOOLEAN,
  trip_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  share_permission TEXT,
  share_id UUID,
  share_created_by UUID,
  share_created_at TIMESTAMP WITH TIME ZONE,
  share_expires_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  v_share RECORD;
BEGIN
  SELECT * INTO v_share
  FROM public.itinerary_shares
  WHERE share_token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  IF v_share IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    i.id,
    i.user_id,
    i.title,
    i.description,
    i.start_date,
    i.end_date,
    i.total_budget,
    i.people_count,
    i.is_public,
    i.trip_data,
    i.created_at,
    i.updated_at,
    v_share.permission::TEXT as share_permission,
    v_share.id as share_id,
    v_share.created_by as share_created_by,
    v_share.created_at as share_created_at,
    v_share.expires_at as share_expires_at
  FROM public.itineraries i
  WHERE i.id = v_share.itinerary_id;
END;
$$;

-- Make sure the function runs as a role that bypasses RLS.
ALTER FUNCTION public.get_itinerary_by_share_token(TEXT) OWNER TO postgres;

GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token(TEXT) TO anon;

