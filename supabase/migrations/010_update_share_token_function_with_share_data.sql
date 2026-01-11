-- Update get_itinerary_by_share_token function to return share data
-- This allows the frontend to get all necessary data without querying itinerary_shares directly
-- which may be blocked by RLS policies

-- Drop the existing function first because we're changing the return type
DROP FUNCTION IF EXISTS public.get_itinerary_by_share_token(TEXT);

-- Create the updated function with new return type
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
BEGIN
  -- Verify the share token exists and is active
  -- This query bypasses RLS because we're in a SECURITY DEFINER function
  SELECT * INTO v_share
  FROM public.itinerary_shares
  WHERE share_token = p_token
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
  LIMIT 1;

  -- If token is valid, return the itinerary with share info
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
      v_share.permission::TEXT as share_permission,
      v_share.id as share_id,
      v_share.created_by as share_created_by,
      v_share.created_at as share_created_at,
      v_share.expires_at as share_expires_at
    FROM public.itineraries i
    WHERE i.id = v_share.itinerary_id;
  END IF;
END;
$$;

-- Grant execute permissions (in case they were not granted before)
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_share_token TO anon;
