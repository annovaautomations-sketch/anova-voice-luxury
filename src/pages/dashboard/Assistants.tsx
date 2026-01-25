import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Bot } from 'lucide-react';

export default function Assistants() {
  const { profile } = useAuth();
  const [assistants, setAssistants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.tenant_id) {
      supabase.from('assistants').select('*').eq('tenant_id', profile.tenant_id)
        .then(({ data }) => { setAssistants(data || []); setLoading(false); });
    }
  }, [profile?.tenant_id]);

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Assistants</h1>
      <div className="glass-card rounded-xl p-8 text-center">
        <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect Vapi to sync your assistants</p>
      </div>
    </div>
  );
}
