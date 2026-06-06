-- Tighten RLS by restricting policies to authenticated role only (deny anon)
-- appointments
DROP POLICY IF EXISTS "Users can manage appointments in their tenant" ON public.appointments;
DROP POLICY IF EXISTS "Users can view appointments in their tenant" ON public.appointments;
CREATE POLICY "Users can view appointments in their tenant" ON public.appointments FOR SELECT TO authenticated USING (is_member_of_tenant(auth.uid(), tenant_id));
CREATE POLICY "Users can manage appointments in their tenant" ON public.appointments FOR ALL TO authenticated USING (is_member_of_tenant(auth.uid(), tenant_id)) WITH CHECK (is_member_of_tenant(auth.uid(), tenant_id));
REVOKE ALL ON public.appointments FROM anon;

-- user_profiles
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile or owners/admins can update" ON public.user_profiles;
CREATE POLICY "Users can view profiles in their tenant" ON public.user_profiles FOR SELECT TO authenticated USING (is_member_of_tenant(auth.uid(), tenant_id));
CREATE POLICY "Users can insert their own profile" ON public.user_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile or owners/admins can update" ON public.user_profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id) OR is_owner_or_admin(auth.uid(), tenant_id));
REVOKE ALL ON public.user_profiles FROM anon;

-- audit_logs
DROP POLICY IF EXISTS "Users can view audit logs in their tenant" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Users can view audit logs in their tenant" ON public.audit_logs FOR SELECT TO authenticated USING (is_member_of_tenant(auth.uid(), tenant_id));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (is_member_of_tenant(auth.uid(), tenant_id));
REVOKE ALL ON public.audit_logs FROM anon;