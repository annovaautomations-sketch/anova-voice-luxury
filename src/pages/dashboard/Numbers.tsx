import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Hash, Plus, Bot, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type PhoneNumber = Database['public']['Tables']['phone_numbers']['Row'];
type Assistant = Database['public']['Tables']['assistants']['Row'];

export default function Numbers() {
  const { profile, isOwnerOrAdmin } = useAuth();
  const [numbers, setNumbers] = useState<PhoneNumber[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchData();
    }
  }, [profile?.tenant_id]);

  const fetchData = async () => {
    if (!profile?.tenant_id) return;

    try {
      const [numbersRes, assistantsRes] = await Promise.all([
        supabase
          .from('phone_numbers')
          .select('*')
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('assistants')
          .select('*')
          .eq('tenant_id', profile.tenant_id),
      ]);

      if (numbersRes.error) throw numbersRes.error;
      if (assistantsRes.error) throw assistantsRes.error;

      setNumbers(numbersRes.data || []);
      setAssistants(assistantsRes.data || []);
    } catch (error) {
      console.error('Error fetching numbers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssistantName = (assistantId: string | null) => {
    if (!assistantId) return 'Unassigned';
    const assistant = assistants.find((a) => a.id === assistantId);
    return assistant?.name || 'Unknown';
  };

  const toggleNumber = async (id: string, isActive: boolean) => {
    if (!isOwnerOrAdmin) return;

    try {
      const { error } = await supabase
        .from('phone_numbers')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error toggling number:', error);
    }
  };

  const formatPhoneNumber = (number: string) => {
    // Format E.164 to readable format
    if (number.startsWith('+1') && number.length === 12) {
      return `+1 (${number.slice(2, 5)}) ${number.slice(5, 8)}-${number.slice(8)}`;
    }
    return number;
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Phone Numbers</h1>
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
          <h1 className="text-2xl font-bold">Phone Numbers</h1>
          <p className="text-muted-foreground mt-1">Manage your inbound and outbound lines</p>
        </div>
        {isOwnerOrAdmin && (
          <Button className="btn-glow gap-2" disabled>
            <Plus className="w-4 h-4" />
            Add Number
          </Button>
        )}
      </div>

      {numbers.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Hash className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No phone numbers yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Connect your Vapi or Twilio account in Settings to provision phone numbers 
            for your voice agents.
          </p>
          <Button variant="outline" onClick={() => window.location.href = '/dashboard/settings'}>
            Go to Settings
          </Button>
        </Card>
      ) : (
        <Card className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-muted-foreground">Number</TableHead>
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Assistant</TableHead>
                <TableHead className="text-muted-foreground">Provider</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {numbers.map((number) => (
                <TableRow key={number.id} className="border-border/50">
                  <TableCell className="font-mono">
                    {formatPhoneNumber(number.phone_number)}
                  </TableCell>
                  <TableCell>{number.name || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-muted-foreground" />
                      <span className={cn(
                        number.assistant_id ? 'text-foreground' : 'text-muted-foreground'
                      )}>
                        {getAssistantName(number.assistant_id)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50">
                      {number.provider || 'twilio'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      number.is_active 
                        ? 'border-primary/30 bg-primary/10 text-primary' 
                        : 'border-border bg-muted text-muted-foreground'
                    )}>
                      {number.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch
                      checked={number.is_active}
                      onCheckedChange={() => toggleNumber(number.id, number.is_active)}
                      disabled={!isOwnerOrAdmin}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
