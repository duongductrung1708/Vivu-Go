-- Create itineraries table
CREATE TABLE IF NOT EXISTS public.itineraries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  total_budget DECIMAL(12, 2) DEFAULT 0,
  people_count INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  trip_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Store full trip data (days, places, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_itineraries_user_id ON public.itineraries(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_itineraries_created_at ON public.itineraries(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own itineraries (unless public)
CREATE POLICY "Users can view their own itineraries"
  ON public.itineraries
  FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Policy: Users can insert their own itineraries
CREATE POLICY "Users can insert their own itineraries"
  ON public.itineraries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own itineraries
CREATE POLICY "Users can update their own itineraries"
  ON public.itineraries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own itineraries
CREATE POLICY "Users can delete their own itineraries"
  ON public.itineraries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_itineraries_updated_at
  BEFORE UPDATE ON public.itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
