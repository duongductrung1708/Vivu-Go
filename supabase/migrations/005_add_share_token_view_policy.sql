-- Add policy to allow viewing itineraries through share tokens
-- This fixes the issue where shared links don't work for other users

-- Create a function to get itinerary by share token (bypasses RLS)
-- This function verifies the token and returns the itinerary if valid
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
  share_permission TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share RECORD;
BEGIN
  -- Verify the share token exists and is active
  SELECT * INTO v_share
  FROM public.itinerary_shares
  WHERE share_token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- If token is valid, return the itinerary
  IF v_share IS NOT NULL THEN
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
      v_share.permission::TEXT as share_permission
    FROM public.itineraries i
    WHERE i.id = v_share.itinerary_id;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token TO anon;
