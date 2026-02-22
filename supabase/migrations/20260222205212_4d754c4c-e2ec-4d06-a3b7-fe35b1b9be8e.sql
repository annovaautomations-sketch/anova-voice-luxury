
-- Create lead_status enum
CREATE TYPE public.lead_status AS ENUM (
  'NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED',
  'APPOINTMENT_SCHEDULED', 'APPOINTMENT_COMPLETED',
  'CLOSED_WON', 'CLOSED_LOST'
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status public.lead_status NOT NULL DEFAULT 'NEW',
  score INTEGER NOT NULL DEFAULT 0,
  budget TEXT,
  property_type TEXT,
  bedrooms INTEGER,
  price_min NUMERIC,
  price_max NUMERIC,
  preferred_areas TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view leads in their tenant"
  ON public.leads FOR SELECT
  USING (is_member_of_tenant(auth.uid(), tenant_id));

CREATE POLICY "Owners and admins can manage leads"
  ON public.leads FOR ALL
  USING (is_owner_or_admin(auth.uid(), tenant_id));

-- Updated at trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes
CREATE INDEX idx_leads_tenant_id ON public.leads(tenant_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_score ON public.leads(score DESC);

-- Also add a call_id reference to link calls to leads
ALTER TABLE public.calls ADD COLUMN lead_id UUID REFERENCES public.leads(id);
CREATE INDEX idx_calls_lead_id ON public.calls(lead_id);
