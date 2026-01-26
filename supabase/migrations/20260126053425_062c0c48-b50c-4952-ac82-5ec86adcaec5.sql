-- Add last_synced_at column to integrations table
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS last_synced_at timestamp with time zone;