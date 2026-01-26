import { useAuth } from '@/hooks/useCustomAuth';
import { useIntegrations } from '@/hooks/useIntegrations';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Shield, 
  Building2, 
  Globe,
  Mail,
  Loader2,
} from 'lucide-react';

const INTEGRATION_CONFIG = [
  {
    provider: 'vapi' as const,
    name: 'Vapi',
    description: 'AI voice agents for phone calls. Connect to receive call data and manage assistants.',
    requiresWebhookSecret: true,
    docsUrl: 'https://docs.vapi.ai',
  },
  {
    provider: 'google_calendar' as const,
    name: 'Google Calendar',
    description: 'Sync appointments and bookings with your Google Calendar.',
    requiresWebhookSecret: false,
    docsUrl: 'https://developers.google.com/calendar',
  },
  {
    provider: 'openai' as const,
    name: 'OpenAI',
    description: 'GPT models for enhanced conversation understanding and summaries.',
    requiresWebhookSecret: false,
    docsUrl: 'https://platform.openai.com/docs',
  },
  {
    provider: 'elevenlabs' as const,
    name: 'ElevenLabs',
    description: 'Natural voice synthesis for custom agent voices.',
    requiresWebhookSecret: false,
    docsUrl: 'https://elevenlabs.io/docs',
  },
  {
    provider: 'twilio' as const,
    name: 'Twilio',
    description: 'Phone number provisioning and SMS capabilities.',
    requiresWebhookSecret: true,
    docsUrl: 'https://www.twilio.com/docs',
  },
];

export default function Settings() {
  const { profile, tenant, isOwnerOrAdmin, user } = useAuth();
  const { isConnected, connectIntegration, disconnectIntegration, loading } = useIntegrations();

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your workspace settings, integrations, and team members.
        </p>
      </div>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="workspace">Workspace</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-1">Connected Services</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Connect external services to enhance your voice portal capabilities.
            </p>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-4">
                {INTEGRATION_CONFIG.map((config) => (
                  <IntegrationCard
                    key={config.provider}
                    provider={config.provider}
                    name={config.name}
                    description={config.description}
                    isConnected={isConnected(config.provider)}
                    onConnect={(apiKey, webhookSecret) => 
                      connectIntegration(config.provider, apiKey, webhookSecret)
                    }
                    onDisconnect={() => disconnectIntegration(config.provider)}
                    isOwnerOrAdmin={isOwnerOrAdmin}
                    requiresWebhookSecret={config.requiresWebhookSecret}
                    docsUrl={config.docsUrl}
                  />
                ))}
              </div>
            )}
          </div>

          {!isOwnerOrAdmin && (
            <Card className="glass-card p-4 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-warning" />
                <p className="text-sm text-muted-foreground">
                  Only workspace owners and admins can manage integrations.
                </p>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Workspace Tab */}
        <TabsContent value="workspace" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Workspace Details</h2>
            <Card className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center emerald-glow">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{tenant?.name || 'Loading...'}</h3>
                  <p className="text-sm text-muted-foreground">/{tenant?.slug}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Timezone</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{tenant?.timezone || 'America/Toronto'}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Created</p>
                  <span className="text-foreground">
                    {tenant?.created_at 
                      ? new Date(tenant.created_at).toLocaleDateString() 
                      : 'N/A'
                    }
                  </span>
                </div>
              </div>

              {isOwnerOrAdmin && (
                <>
                  <Separator />
                  <div className="flex justify-end">
                    <Button variant="outline" disabled>
                      Edit Workspace Settings
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Team Members</h2>
            <Card className="glass-card divide-y divide-border">
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{profile?.display_name || profile?.email}</p>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    profile?.role === 'OWNER' 
                      ? 'border-primary/30 bg-primary/10 text-primary' 
                      : profile?.role === 'ADMIN'
                      ? 'border-info/30 bg-info/10 text-info'
                      : 'border-border bg-muted text-muted-foreground'
                  }
                >
                  {profile?.role}
                </Badge>
              </div>
            </Card>

            {isOwnerOrAdmin && (
              <div className="flex justify-end mt-4">
                <Button disabled className="btn-glow">
                  Invite Team Member
                </Button>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2">Role Permissions</h3>
            <Card className="glass-card p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/10 text-primary">
                    OWNER
                  </Badge>
                  <p className="text-muted-foreground">
                    Full access including billing and workspace deletion
                  </p>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2 border-info/30 bg-info/10 text-info">
                    ADMIN
                  </Badge>
                  <p className="text-muted-foreground">
                    Manage team, integrations, and all data
                  </p>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">AGENT</Badge>
                  <p className="text-muted-foreground">
                    View and edit calls, appointments, and assistants
                  </p>
                </div>
                <div>
                  <Badge variant="outline" className="mb-2">VIEWER</Badge>
                  <p className="text-muted-foreground">
                    Read-only access to all data
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Account Details</h2>
            <Card className="glass-card p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground">
                  {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{profile?.display_name || 'User'}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Account ID</p>
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {user?.id?.slice(0, 8)}...
                  </code>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Auth Provider</p>
                  <span className="text-foreground">Google</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="glass-card p-6 border-destructive/30">
            <h3 className="text-lg font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              These actions are irreversible. Please be careful.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" disabled>
                Delete Account
              </Button>
              {isOwnerOrAdmin && (
                <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" disabled>
                  Delete Workspace
                </Button>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
