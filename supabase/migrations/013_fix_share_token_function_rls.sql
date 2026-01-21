-- Fix get_itinerary_by_share_token to properly bypass RLS
-- This ensures the function can read itineraries even when RLS policies would normally block access

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
AS $$
DECLARE
  v_share RECORD;
  v_itinerary RECORD;
BEGIN
  -- Verify the share token exists and is active
  -- This query bypasses RLS because we're in a SECURITY DEFINER function
  SELECT * INTO v_share
  FROM public.itinerary_shares
  WHERE share_token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- If token is valid, get the itinerary
  IF v_share IS NOT NULL THEN
    -- Query itinerary directly (SECURITY DEFINER bypasses RLS)
    SELECT * INTO v_itinerary
    FROM public.itineraries
    WHERE id = v_share.itinerary_id;

    -- If itinerary exists, return it with share info
    IF v_itinerary IS NOT NULL THEN
      RETURN QUERY
      SELECT 
        v_itinerary.id,
        v_itinerary.user_id,
        v_itinerary.title,
        v_itinerary.description,
        v_itinerary.start_date,
        v_itinerary.end_date,
        v_itinerary.total_budget,
        v_itinerary.people_count,
        v_itinerary.is_public,
        v_itinerary.trip_data,
        v_itinerary.created_at,
        v_itinerary.updated_at,
        v_share.permission::TEXT as share_permission,
        v_share.id as share_id,
        v_share.created_by as share_created_by,
        v_share.created_at as share_created_at,
        v_share.expires_at as share_expires_at;
    END IF;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token(TEXT) TO anon;
