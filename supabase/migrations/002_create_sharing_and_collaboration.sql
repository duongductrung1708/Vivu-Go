-- Create itinerary_shares table for shareable links
CREATE TABLE IF NOT EXISTS public.itinerary_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT NOT NULL UNIQUE, -- Unique token for the share link
  permission TEXT NOT NULL DEFAULT 'read', -- 'read' or 'edit'
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration date
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_itinerary_shares_token ON public.itinerary_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_itinerary_shares_itinerary_id ON public.itinerary_shares(itinerary_id);

-- Create itinerary_collaborators table for invited users
CREATE TABLE IF NOT EXISTS public.itinerary_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission TEXT NOT NULL DEFAULT 'read', -- 'read' or 'edit'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(itinerary_id, user_id) -- One collaboration per user per itinerary
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_itinerary_collaborators_itinerary_id ON public.itinerary_collaborators(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_collaborators_user_id ON public.itinerary_collaborators(user_id);

-- Enable Row Level Security
ALTER TABLE public.itinerary_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for itinerary_shares
CREATE POLICY "Users can view shares for their itineraries"
  ON public.itinerary_shares
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_shares.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active shares by token"
  ON public.itinerary_shares
  FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Users can create shares for their itineraries"
  ON public.itinerary_shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_shares.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update shares for their itineraries"
  ON public.itinerary_shares
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_shares.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_shares.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares for their itineraries"
  ON public.itinerary_shares
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_shares.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Policies for itinerary_collaborators
CREATE POLICY "Users can view collaborations for their itineraries"
  ON public.itinerary_collaborators
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
      AND (itineraries.user_id = auth.uid() OR itinerary_collaborators.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can invite collaborators to their itineraries"
  ON public.itinerary_collaborators
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
    AND invited_by = auth.uid()
    AND user_id != auth.uid() -- Cannot invite yourself
  );

CREATE POLICY "Users can update their own collaboration status"
  ON public.itinerary_collaborators
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Itinerary owners can update collaborators"
  ON public.itinerary_collaborators
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

CREATE POLICY "Itinerary owners can remove collaborators"
  ON public.itinerary_collaborators
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = itinerary_collaborators.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
  );

-- Update itineraries policies to allow collaborators to view/edit
CREATE POLICY "Collaborators can view itineraries"
  ON public.itineraries
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR is_public = true
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
    )
  );

CREATE POLICY "Collaborators can update itineraries"
  ON public.itineraries
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
      AND itinerary_collaborators.permission = 'edit'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = itineraries.id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
      AND itinerary_collaborators.permission = 'edit'
    )
  );

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random 32-character token
  token := encode(gen_random_bytes(16), 'hex');
  RETURN token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at for itinerary_shares
CREATE TRIGGER update_itinerary_shares_updated_at
  BEFORE UPDATE ON public.itinerary_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for itinerary_collaborators
CREATE TRIGGER update_itinerary_collaborators_updated_at
  BEFORE UPDATE ON public.itinerary_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
