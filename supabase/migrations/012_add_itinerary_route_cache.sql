-- Add route_cache column to persist Mapbox routes between sessions
-- This avoids refetching directions every time the itinerary is opened.

ALTER TABLE public.itineraries
ADD COLUMN IF NOT EXISTS route_cache JSONB NOT NULL DEFAULT '{}'::jsonb;

