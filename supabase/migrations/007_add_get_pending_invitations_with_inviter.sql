-- Create function to get pending invitations with inviter info
-- This function returns pending invitations for the current user with inviter details

CREATE OR REPLACE FUNCTION public.get_pending_invitations_with_inviter()
RETURNS TABLE (
  id UUID,
  itinerary_id UUID,
  user_id UUID,
  invited_by UUID,
  permission TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  inviter_email TEXT,
  inviter_name TEXT,
  itinerary_title TEXT,
  itinerary_description TEXT,
  itinerary_start_date DATE,
  itinerary_end_date DATE,
  itinerary_total_budget DECIMAL(12, 2),
  itinerary_people_count INTEGER,
  itinerary_trip_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    COALESCE(inviter_au.email, '')::TEXT as inviter_email,
    COALESCE(
      NULLIF(inviter_au.raw_user_meta_data->>'full_name', ''),
      NULLIF(inviter_au.email, ''),
      'Unknown'
    )::TEXT as inviter_name,
    COALESCE(i.title, '')::TEXT as itinerary_title,
    COALESCE(i.description, '')::TEXT as itinerary_description,
    i.start_date as itinerary_start_date,
    i.end_date as itinerary_end_date,
    i.total_budget as itinerary_total_budget,
    i.people_count as itinerary_people_count,
    i.trip_data as itinerary_trip_data
  FROM public.itinerary_collaborators ic
  LEFT JOIN auth.users inviter_au ON ic.invited_by = inviter_au.id
  LEFT JOIN public.itineraries i ON ic.itinerary_id = i.id
  WHERE ic.user_id = auth.uid()
    AND ic.status = 'pending'
  ORDER BY ic.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_pending_invitations_with_inviter TO authenticated;
