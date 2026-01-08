-- Function to invite collaborator by email
-- This function looks up the user by email and creates a collaboration invitation
CREATE OR REPLACE FUNCTION invite_collaborator_by_email(
  p_itinerary_id UUID,
  p_email TEXT,
  p_permission TEXT,
  p_invited_by UUID
)
RETURNS public.itinerary_collaborators AS $$
DECLARE
  v_user_id UUID;
  v_result public.itinerary_collaborators;
BEGIN
  -- Find user by email from auth.users
  -- Note: This requires the function to run with SECURITY DEFINER to access auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_email
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email %', p_email;
  END IF;

  IF v_user_id = p_invited_by THEN
    RAISE EXCEPTION 'Cannot invite yourself';
  END IF;

  -- Check if collaboration already exists
  IF EXISTS (
    SELECT 1 FROM public.itinerary_collaborators
    WHERE itinerary_id = p_itinerary_id
    AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User is already invited or collaborating';
  END IF;

  -- Insert collaboration
  INSERT INTO public.itinerary_collaborators (
    itinerary_id,
    user_id,
    invited_by,
    permission,
    status
  )
  VALUES (
    p_itinerary_id,
    v_user_id,
    p_invited_by,
    p_permission,
    'pending'
  )
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION invite_collaborator_by_email TO authenticated;
