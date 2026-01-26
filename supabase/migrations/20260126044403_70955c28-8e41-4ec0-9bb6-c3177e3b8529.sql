-- Add google_sub column to user_profiles if not exists
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS google_sub TEXT UNIQUE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS picture_url TEXT;

-- Create sessions table for custom auth
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions(expires_at);

-- Enable RLS on sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Sessions policies - only the user can see their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.sessions
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own sessions"
ON public.sessions
FOR DELETE
USING (user_id = auth.uid());

-- Service role can manage all sessions (for edge functions)
CREATE POLICY "Service role can manage sessions"
ON public.sessions
FOR ALL
USING (true)
WITH CHECK (true);