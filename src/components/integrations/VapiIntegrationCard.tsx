import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Phone,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useCustomAuth';

interface VapiIntegrationCardProps {
  isOwnerOrAdmin: boolean;
}

export function VapiIntegrationCard({ isOwnerOrAdmin }: VapiIntegrationCardProps) {
  const { sessionId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchStatus();
    }
  }, [sessionId]);

  const fetchStatus = async () => {
    if (!sessionId) return;
    
    setStatusLoading(true);
    try {
      const response = await supabase.functions.invoke('vapi-status', {
        headers: { 'x-session-id': sessionId },
      });

      if (response.data?.ok) {
        setConnected(response.data.connected);
        setLastSyncedAt(response.data.last_synced_at);
      }
    } catch (error) {
      console.error('Error fetching Vapi status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!apiKey.trim() || !sessionId) return;

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('vapi-connect', {
        body: { apiKey },
        headers: { 'x-session-id': sessionId },
      });

      if (response.data?.ok) {
        toast.success('Vapi connected successfully');
        setApiKey('');
        setIsOpen(false);
        setConnected(true);
      } else {
        toast.error(response.data?.message || 'Failed to connect Vapi');
      }
    } catch (error) {
      console.error('Error connecting Vapi:', error);
      toast.error('Failed to connect Vapi');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (days: number) => {
    if (!sessionId) {
      toast.error('Not authenticated');
      return;
    }
    
    setSyncing(true);
    try {
      const response = await supabase.functions.invoke('vapi-sync-calls', {
        body: { days },
        headers: { 'x-session-id': sessionId },
      });

      if (response.data?.ok) {
        toast.success(`Synced ${response.data.total} calls (${response.data.inserted} new, ${response.data.updated} updated)`);
        setLastSyncedAt(new Date().toISOString());
      } else {
        toast.error(response.data?.message || 'Failed to sync calls');
      }
    } catch (error) {
      console.error('Error syncing calls:', error);
      toast.error('Failed to sync calls');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    // For now, just show a message - full disconnect would need an edge function
    toast.info('To disconnect, remove the integration from Settings');
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center bg-primary/10 text-primary')}>
          <Phone className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">Vapi</h3>
            {statusLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : connected ? (
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/10">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted-foreground">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            AI voice agents for phone calls. Connect to sync call data.
          </p>
          <a
            href="https://docs.vapi.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
          >
            View documentation
            <ExternalLink className="w-3 h-3" />
          </a>
          
          {connected && lastSyncedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Last synced: {format(new Date(lastSyncedAt), 'MMM d, yyyy h:mm a')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {connected ? (
            <>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(7)}
                  disabled={!isOwnerOrAdmin || syncing}
                >
                  {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
                  7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSync(30)}
                  disabled={!isOwnerOrAdmin || syncing}
                >
                  30 days
                </Button>
              </div>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={!isOwnerOrAdmin} className="text-xs">
                    Update API Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Update Vapi API Key
                    </DialogTitle>
                    <DialogDescription>
                      Enter a new API key to update your Vapi connection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key</Label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Enter your Vapi API key"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConnect} disabled={!apiKey.trim() || loading} className="btn-glow">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Update
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={!isOwnerOrAdmin} className="btn-glow">
                  Connect
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Connect Vapi
                  </DialogTitle>
                  <DialogDescription>
                    Enter your Vapi API key to connect and sync call data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Enter your Vapi API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Find your API key in the Vapi dashboard under Settings → API Keys
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={!apiKey.trim() || loading} className="btn-glow">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Connect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </Card>
  );
}
