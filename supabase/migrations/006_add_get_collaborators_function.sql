-- Create function to get collaborators with user info
-- This bypasses RLS and allows fetching user email/name from auth.users
-- But still checks if user has permission to view the itinerary

CREATE OR REPLACE FUNCTION public.get_itinerary_collaborators(p_itinerary_id UUID)
RETURNS TABLE (
  id UUID,
  itinerary_id UUID,
  user_id UUID,
  invited_by UUID,
  permission TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_email TEXT,
  user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has permission to view this itinerary
  -- (owner, public, or collaborator)
  IF NOT (
    EXISTS (
      SELECT 1 FROM public.itineraries i
      WHERE i.id = p_itinerary_id
      AND (
        i.user_id = auth.uid()
        OR i.is_public = true
        OR EXISTS (
          SELECT 1 FROM public.itinerary_collaborators ic_check
          WHERE ic_check.itinerary_id = p_itinerary_id
          AND ic_check.user_id = auth.uid()
          AND ic_check.status = 'accepted'
        )
      )
    )
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT 
    ic.id,
    ic.itinerary_id,
    ic.user_id,
    ic.invited_by,
    ic.permission,
    ic.status,
    ic.created_at,
    ic.updated_at,
    COALESCE(au.email, '')::TEXT as user_email,
    COALESCE(
      NULLIF(au.raw_user_meta_data->>'full_name', ''),
      NULLIF(au.email, ''),
      'Unknown'
    )::TEXT as user_name
  FROM public.itinerary_collaborators ic
  LEFT JOIN auth.users au ON ic.user_id = au.id
  WHERE ic.itinerary_id = p_itinerary_id
  ORDER BY ic.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_itinerary_collaborators TO authenticated;
