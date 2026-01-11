-- Create packing_items table for shared packing lists
CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  itinerary_id UUID NOT NULL REFERENCES public.itineraries(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT, -- Optional category (e.g., "Documents", "Clothing", "Electronics")
  is_checked BOOLEAN DEFAULT false,
  checked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  checked_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sort_order INTEGER DEFAULT 0 -- For custom ordering
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packing_items_itinerary_id ON public.packing_items(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_packing_items_created_by ON public.packing_items(created_by);
CREATE INDEX IF NOT EXISTS idx_packing_items_is_checked ON public.packing_items(is_checked);
CREATE INDEX IF NOT EXISTS idx_packing_items_sort_order ON public.packing_items(itinerary_id, sort_order);

-- Enable Row Level Security
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view packing items for itineraries they own, are collaborators of, or are shared with
CREATE POLICY "Users can view packing items for accessible itineraries"
  ON public.packing_items
  FOR SELECT
  USING (
    -- Owner can view
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = packing_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
    -- Collaborator can view
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = packing_items.itinerary_id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
    )
    -- Shared via token (read permission)
    OR EXISTS (
      SELECT 1 FROM public.itinerary_shares
      WHERE itinerary_shares.itinerary_id = packing_items.itinerary_id
      AND itinerary_shares.is_active = true
      AND (itinerary_shares.expires_at IS NULL OR itinerary_shares.expires_at > NOW())
    )
  );

-- Policy: Users can insert packing items for itineraries they can edit
CREATE POLICY "Users can insert packing items for editable itineraries"
  ON public.packing_items
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (
      -- Owner can insert
      EXISTS (
        SELECT 1 FROM public.itineraries
        WHERE itineraries.id = packing_items.itinerary_id
        AND itineraries.user_id = auth.uid()
      )
      -- Collaborator with edit permission can insert
      OR EXISTS (
        SELECT 1 FROM public.itinerary_collaborators
        WHERE itinerary_collaborators.itinerary_id = packing_items.itinerary_id
        AND itinerary_collaborators.user_id = auth.uid()
        AND itinerary_collaborators.status = 'accepted'
        AND itinerary_collaborators.permission = 'edit'
      )
    )
  );

-- Policy: Users can update packing items for itineraries they can edit
CREATE POLICY "Users can update packing items for editable itineraries"
  ON public.packing_items
  FOR UPDATE
  USING (
    -- Owner can update
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = packing_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
    -- Collaborator with edit permission can update
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = packing_items.itinerary_id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
      AND itinerary_collaborators.permission = 'edit'
    )
  )
  WITH CHECK (
    -- Owner can update
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = packing_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
    -- Collaborator with edit permission can update
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = packing_items.itinerary_id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
      AND itinerary_collaborators.permission = 'edit'
    )
  );

-- Policy: Users can delete packing items for itineraries they can edit
CREATE POLICY "Users can delete packing items for editable itineraries"
  ON public.packing_items
  FOR DELETE
  USING (
    -- Owner can delete
    EXISTS (
      SELECT 1 FROM public.itineraries
      WHERE itineraries.id = packing_items.itinerary_id
      AND itineraries.user_id = auth.uid()
    )
    -- Collaborator with edit permission can delete
    OR EXISTS (
      SELECT 1 FROM public.itinerary_collaborators
      WHERE itinerary_collaborators.itinerary_id = packing_items.itinerary_id
      AND itinerary_collaborators.user_id = auth.uid()
      AND itinerary_collaborators.status = 'accepted'
      AND itinerary_collaborators.permission = 'edit'
    )
  );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_packing_items_updated_at
  BEFORE UPDATE ON public.packing_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for packing_items
ALTER PUBLICATION supabase_realtime ADD TABLE public.packing_items;
