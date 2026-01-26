import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bot, Plus, Settings2, Volume2, Brain, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Assistant = Database['public']['Tables']['assistants']['Row'];

export default function Assistants() {
  const { user, isOwnerOrAdmin } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchAssistants();
    }
  }, [user?.tenant_id]);

  const fetchAssistants = async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('assistants')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssistants(data || []);
    } catch (error) {
      console.error('Error fetching assistants:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAssistant = async (id: string, isActive: boolean) => {
    if (!isOwnerOrAdmin) return;

    try {
      const { error } = await supabase
        .from('assistants')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      fetchAssistants();
    } catch (error) {
      console.error('Error toggling assistant:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Assistants</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assistants</h1>
          <p className="text-muted-foreground mt-1">Manage your AI voice agents</p>
        </div>
        {isOwnerOrAdmin && (
          <Button className="btn-glow gap-2" disabled>
            <Plus className="w-4 h-4" />
            New Assistant
          </Button>
        )}
      </div>

      {assistants.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No assistants yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your Vapi account in Settings to sync your AI voice assistants, 
            or create new ones directly from here.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/settings'}>
            Go to Settings
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assistants.map((assistant) => (
            <Card key={assistant.id} className="glass-card p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={assistant.is_active}
                    onCheckedChange={() => toggleAssistant(assistant.id, assistant.is_active)}
                    disabled={!isOwnerOrAdmin}
                  />
                  <Badge variant="outline" className={cn(
                    assistant.is_active 
                      ? 'border-primary/30 bg-primary/10 text-primary' 
                      : 'border-border bg-muted text-muted-foreground'
                  )}>
                    {assistant.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1">{assistant.name}</h3>
              
              <div className="space-y-2 mt-4">
                {assistant.voice && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Volume2 className="w-4 h-4" />
                    <span>Voice: {assistant.voice}</span>
                  </div>
                )}
                {assistant.model && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="w-4 h-4" />
                    <span>Model: {assistant.model}</span>
                  </div>
                )}
              </div>

              {assistant.first_message && (
                <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                  "{assistant.first_message}"
                </p>
              )}

              <div className="flex justify-end mt-4">
                <Button variant="ghost" size="sm" disabled className="gap-2">
                  <Settings2 className="w-4 h-4" />
                  Configure
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
