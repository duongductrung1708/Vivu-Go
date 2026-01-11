-- Enable Realtime for itineraries table
-- This allows real-time collaboration where multiple users can see changes instantly

-- Add table to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.itineraries;

-- Note: Realtime is enabled by default for new Supabase projects
-- If the above command fails, the table might already be in the publication
-- You can verify by checking: SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
