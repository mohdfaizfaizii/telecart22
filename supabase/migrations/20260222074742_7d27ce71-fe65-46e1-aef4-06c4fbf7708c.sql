
-- Fix overly permissive policies
DROP POLICY "System inserts roles" ON public.user_roles;
DROP POLICY "System inserts logs" ON public.activity_logs;

-- user_roles inserts should only happen via the trigger (security definer)
-- No direct insert policy needed for regular users

-- activity_logs: only authenticated users can insert their own logs
CREATE POLICY "Authenticated inserts logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
