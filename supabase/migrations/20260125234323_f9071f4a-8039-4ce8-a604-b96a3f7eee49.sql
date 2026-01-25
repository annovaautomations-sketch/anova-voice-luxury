-- Create role enum
CREATE TYPE public.app_role AS ENUM ('OWNER', 'ADMIN', 'AGENT', 'VIEWER');

-- Create integration provider enum
CREATE TYPE public.integration_provider AS ENUM ('vapi', 'google_calendar', 'openai', 'elevenlabs', 'twilio');

-- Create integration status enum
CREATE TYPE public.integration_status AS ENUM ('connected', 'disconnected');

-- Create call direction enum
CREATE TYPE public.call_direction AS ENUM ('inbound', 'outbound');

-- Create call status enum
CREATE TYPE public.call_status AS ENUM ('queued', 'ringing', 'in-progress', 'forwarding', 'ended');

-- Create call outcome enum
CREATE TYPE public.call_outcome AS ENUM ('booked', 'qualified', 'not_qualified', 'other');

-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('booked', 'rescheduled', 'cancelled');

-- 1. Tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User profiles table (linked to auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'VIEWER',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- 3. User roles table (for RBAC security - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, role)
);

-- 4. Integrations table
CREATE TABLE public.integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider public.integration_provider NOT NULL,
  status public.integration_status NOT NULL DEFAULT 'disconnected',
  api_key_encrypted TEXT,
  webhook_secret_encrypted TEXT,
  config_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, provider)
);

-- 5. Assistants table (from Vapi)
CREATE TABLE public.assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vapi_assistant_id TEXT UNIQUE,
  name TEXT NOT NULL,
  model TEXT,
  voice TEXT,
  first_message TEXT,
  system_prompt TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Phone numbers table
CREATE TABLE public.phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vapi_number_id TEXT UNIQUE,
  phone_number TEXT NOT NULL,
  name TEXT,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
  provider TEXT DEFAULT 'twilio',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Calls table
CREATE TABLE public.calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vapi_call_id TEXT UNIQUE NOT NULL,
  assistant_id UUID REFERENCES public.assistants(id) ON DELETE SET NULL,
  number_id UUID REFERENCES public.phone_numbers(id) ON DELETE SET NULL,
  direction public.call_direction NOT NULL,
  from_e164 TEXT,
  to_e164 TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_sec INTEGER,
  status public.call_status NOT NULL DEFAULT 'queued',
  outcome public.call_outcome,
  transcript_text TEXT,
  recording_url TEXT,
  summary TEXT,
  cost_total DECIMAL(10, 4),
  extracted_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Call events table
CREATE TABLE public.call_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  vapi_call_id TEXT NOT NULL,
  provider_event_id TEXT UNIQUE,
  type TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Appointments table
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  lead_phone TEXT NOT NULL,
  lead_email TEXT,
  lead_name TEXT NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'booked',
  start_iso TIMESTAMPTZ NOT NULL,
  end_iso TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Toronto',
  event_id TEXT,
  event_link TEXT,
  booking_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Audit logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_calls_tenant_started ON public.calls(tenant_id, started_at DESC);
CREATE INDEX idx_calls_tenant_assistant ON public.calls(tenant_id, assistant_id, started_at DESC);
CREATE INDEX idx_appointments_tenant_phone ON public.appointments(tenant_id, lead_phone);
CREATE INDEX idx_call_events_vapi_call ON public.call_events(vapi_call_id);
CREATE INDEX idx_user_profiles_user ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_tenant ON public.user_profiles(tenant_id);
CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Security definer function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.user_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Security definer function to check tenant membership
CREATE OR REPLACE FUNCTION public.is_member_of_tenant(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = _user_id AND tenant_id = _tenant_id
  )
$$;

-- Security definer function to get user role in tenant
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID, _tenant_id UUID)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_profiles
  WHERE user_id = _user_id AND tenant_id = _tenant_id
  LIMIT 1
$$;

-- Security definer function to check if user is owner or admin
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = _user_id 
    AND tenant_id = _tenant_id 
    AND role IN ('OWNER', 'ADMIN')
  )
$$;

-- RLS Policies for tenants
CREATE POLICY "Users can view their tenant"
  ON public.tenants FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), id));

CREATE POLICY "Owners and admins can update tenant"
  ON public.tenants FOR UPDATE
  USING (public.is_owner_or_admin(auth.uid(), id));

-- RLS Policies for user_profiles
CREATE POLICY "Users can view profiles in their tenant"
  ON public.user_profiles FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile or owners/admins can update any"
  ON public.user_profiles FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR public.is_owner_or_admin(auth.uid(), tenant_id)
  );

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their tenant"
  ON public.user_roles FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Owners and admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.is_owner_or_admin(auth.uid(), tenant_id));

-- RLS Policies for integrations
CREATE POLICY "Owners and admins can view integrations"
  ON public.integrations FOR SELECT
  USING (public.is_owner_or_admin(auth.uid(), tenant_id));

CREATE POLICY "Owners and admins can manage integrations"
  ON public.integrations FOR ALL
  USING (public.is_owner_or_admin(auth.uid(), tenant_id));

-- RLS Policies for assistants
CREATE POLICY "Users can view assistants in their tenant"
  ON public.assistants FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Owners and admins can manage assistants"
  ON public.assistants FOR ALL
  USING (public.is_owner_or_admin(auth.uid(), tenant_id));

-- RLS Policies for phone_numbers
CREATE POLICY "Users can view numbers in their tenant"
  ON public.phone_numbers FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Owners and admins can manage numbers"
  ON public.phone_numbers FOR ALL
  USING (public.is_owner_or_admin(auth.uid(), tenant_id));

-- RLS Policies for calls
CREATE POLICY "Users can view calls in their tenant"
  ON public.calls FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "System can insert calls"
  ON public.calls FOR INSERT
  WITH CHECK (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Owners and admins can update calls"
  ON public.calls FOR UPDATE
  USING (public.is_owner_or_admin(auth.uid(), tenant_id));

-- RLS Policies for call_events
CREATE POLICY "Users can view call events in their tenant"
  ON public.call_events FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "System can insert call events"
  ON public.call_events FOR INSERT
  WITH CHECK (public.is_member_of_tenant(auth.uid(), tenant_id));

-- RLS Policies for appointments
CREATE POLICY "Users can view appointments in their tenant"
  ON public.appointments FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Users can manage appointments in their tenant"
  ON public.appointments FOR ALL
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

-- RLS Policies for audit_logs
CREATE POLICY "Users can view audit logs in their tenant"
  ON public.audit_logs FOR SELECT
  USING (public.is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_member_of_tenant(auth.uid(), tenant_id));

-- Function to handle new user signup - creates tenant and profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get user email from auth metadata
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(user_email, '@', 1));
  
  -- Create a new tenant for this user
  INSERT INTO public.tenants (name, slug)
  VALUES (
    user_name || '''s Workspace',
    lower(replace(user_name, ' ', '-')) || '-' || substr(gen_random_uuid()::text, 1, 8)
  )
  RETURNING id INTO new_tenant_id;
  
  -- Create user profile with OWNER role
  INSERT INTO public.user_profiles (user_id, tenant_id, email, role, display_name)
  VALUES (NEW.id, new_tenant_id, user_email, 'OWNER', user_name);
  
  -- Also add to user_roles table for RBAC
  INSERT INTO public.user_roles (user_id, tenant_id, role)
  VALUES (NEW.id, new_tenant_id, 'OWNER');
  
  RETURN NEW;
END;
$$;

-- Trigger to create tenant and profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assistants_updated_at
  BEFORE UPDATE ON public.assistants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_phone_numbers_updated_at
  BEFORE UPDATE ON public.phone_numbers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calls_updated_at
  BEFORE UPDATE ON public.calls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();