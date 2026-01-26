-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service role can manage sessions" ON public.sessions;

-- Add INSERT policy for sessions (edge functions will use service role key which bypasses RLS)
-- Users can only insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON public.sessions
FOR INSERT
WITH CHECK (user_id = auth.uid());