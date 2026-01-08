-- Fix infinite recursion in RLS policies
-- The issue is that policies reference each other creating a loop

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Collaborators can view itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Collaborators can update itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can update their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can insert their own itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Users can delete their own itineraries" ON public.itineraries;

-- Drop ALL policies for itinerary_collaborators
DROP POLICY IF EXISTS "Users can view collaborations for their itineraries" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Users can invite collaborators to their itineraries" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Users can update their own collaboration status" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Itinerary owners can update collaborators" ON public.itinerary_collaborators;
DROP POLICY IF EXISTS "Itinerary owners can remove collaborators" ON public.itinerary_collaborators;

-- Drop ALL policies for itinerary_shares
DROP POLICY IF EXISTS "Users can view shares for their itineraries" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Anyone can view active shares by token" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Users can create shares for their itineraries" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Users can update shares for their itineraries" ON public.itinerary_shares;
DROP POLICY IF EXISTS "Users can delete shares for their itineraries" ON public.itinerary_shares;

-- Create a helper function to check if user owns itinerary (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_owns_itinerary(p_itinerary_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.itineraries
    WHERE id = p_itinerary_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Create a helper function to check if user is collaborator (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_is_collaborator(p_itinerary_id UUID, p_permission TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.itinerary_collaborators
    WHERE itinerary_id = p_itinerary_id
    AND user_id = auth.uid()
    AND status = 'accepted'
    AND (p_permission IS NULL OR permission = p_permission)
  );
END;
$$;

-- Recreate itineraries policies without recursion
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_public = true
    OR public.user_is_collaborator(id)
  );

CREATE POLICY "Users can insert their own itineraries"
  ON public.itineraries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR public.user_is_collaborator(id, 'edit')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.user_is_collaborator(id, 'edit')
  );

CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Recreate itinerary_collaborators policies without recursion
CREATE POLICY "Users can view collaborations for their itineraries"
  ON public.itinerary_collaborators
  FOR SELECT
  USING (
    public.user_owns_itinerary(itinerary_id)
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can invite collaborators to their itineraries"
  ON public.itinerary_collaborators
  FOR INSERT
  WITH CHECK (
    public.user_owns_itinerary(itinerary_id)
    AND invited_by = auth.uid()
    AND user_id != auth.uid()
  );

CREATE POLICY "Users can update their own collaboration status"
  ON public.itinerary_collaborators
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Itinerary owners can update collaborators"
  ON public.itinerary_collaborators
  FOR UPDATE
  USING (public.user_owns_itinerary(itinerary_id))
  WITH CHECK (public.user_owns_itinerary(itinerary_id));

CREATE POLICY "Itinerary owners can remove collaborators"
  ON public.itinerary_collaborators
  FOR DELETE
  USING (public.user_owns_itinerary(itinerary_id));

-- Recreate itinerary_shares policies without recursion
CREATE POLICY "Users can view shares for their itineraries"
  ON public.itinerary_shares
  FOR SELECT
  USING (public.user_owns_itinerary(itinerary_id));

CREATE POLICY "Anyone can view active shares by token"
  ON public.itinerary_shares
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can create shares for their itineraries"
  ON public.itinerary_shares
  FOR INSERT
  WITH CHECK (
    public.user_owns_itinerary(itinerary_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update shares for their itineraries"
  ON public.itinerary_shares
  FOR UPDATE
  USING (public.user_owns_itinerary(itinerary_id))
  WITH CHECK (public.user_owns_itinerary(itinerary_id));

CREATE POLICY "Users can delete shares for their itineraries"
  ON public.itinerary_shares
  FOR DELETE
  USING (public.user_owns_itinerary(itinerary_id));

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.user_owns_itinerary TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_is_collaborator TO authenticated;
