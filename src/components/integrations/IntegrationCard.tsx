import { useState } from 'react';
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
  Calendar,
  Brain,
  Volume2,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type IntegrationProvider = Database['public']['Enums']['integration_provider'];

interface IntegrationCardProps {
  provider: IntegrationProvider;
  name: string;
  description: string;
  isConnected: boolean;
  onConnect: (apiKey: string, webhookSecret?: string) => Promise<boolean>;
  onDisconnect: () => Promise<boolean>;
  isOwnerOrAdmin: boolean;
  requiresWebhookSecret?: boolean;
  docsUrl?: string;
}

const iconMap = {
  vapi: Phone,
  google_calendar: Calendar,
  openai: Brain,
  elevenlabs: Volume2,
  twilio: PhoneCall,
};

const colorMap = {
  vapi: 'bg-primary/10 text-primary',
  google_calendar: 'bg-info/10 text-info',
  openai: 'bg-purple-500/10 text-purple-400',
  elevenlabs: 'bg-pink-500/10 text-pink-400',
  twilio: 'bg-destructive/10 text-destructive',
};

export function IntegrationCard({
  provider,
  name,
  description,
  isConnected,
  onConnect,
  onDisconnect,
  isOwnerOrAdmin,
  requiresWebhookSecret,
  docsUrl,
}: IntegrationCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const Icon = iconMap[provider] || Phone;

  const handleConnect = async () => {
    if (!apiKey.trim()) return;

    setLoading(true);
    const success = await onConnect(apiKey, webhookSecret || undefined);
    setLoading(false);

    if (success) {
      setApiKey('');
      setWebhookSecret('');
      setIsOpen(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    await onDisconnect();
    setLoading(false);
  };

  return (
    <Card className="glass-card p-6">
      <div className="flex items-start gap-4">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center', colorMap[provider])}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{name}</h3>
            {isConnected ? (
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
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
          {docsUrl && (
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
            >
              View documentation
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex gap-2">
          {isConnected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={!isOwnerOrAdmin || loading}
              className="text-destructive hover:text-destructive"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
            </Button>
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
                    <Icon className="w-5 h-5" />
                    Connect {name}
                  </DialogTitle>
                  <DialogDescription>
                    Enter your API credentials to connect {name} to your workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="relative">
                      <Input
                        id="api-key"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder="Enter your API key"
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
                  {requiresWebhookSecret && (
                    <div className="space-y-2">
                      <Label htmlFor="webhook-secret">Webhook Secret (optional)</Label>
                      <Input
                        id="webhook-secret"
                        type="password"
                        placeholder="Enter webhook secret"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                      />
                    </div>
                  )}
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
