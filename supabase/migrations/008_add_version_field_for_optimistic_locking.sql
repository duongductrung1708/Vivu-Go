-- Add version field for optimistic locking to prevent data loss during concurrent edits
-- This allows detection of conflicts when multiple users edit simultaneously

ALTER TABLE public.itineraries 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Create index on version for faster conflict detection
CREATE INDEX IF NOT EXISTS idx_itineraries_version ON public.itineraries(version);

-- Function to increment version on update
CREATE OR REPLACE FUNCTION increment_itinerary_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to increment version
DROP TRIGGER IF EXISTS increment_itinerary_version_trigger ON public.itineraries;
CREATE TRIGGER increment_itinerary_version_trigger
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION increment_itinerary_version();

-- Update existing records to have version = 1
UPDATE public.itineraries SET version = 1 WHERE version IS NULL;
