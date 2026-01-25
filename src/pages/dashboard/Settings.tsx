import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, Calendar, Users, Shield } from 'lucide-react';

export default function Settings() {
  const { profile, tenant, isOwnerOrAdmin } = useAuth();

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>
      
      {/* Integrations */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Vapi</h3>
                <p className="text-sm text-muted-foreground">AI voice agents</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-info/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-info" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Google Calendar</h3>
                <p className="text-sm text-muted-foreground">Sync appointments</p>
              </div>
              <Button variant="outline" size="sm">Connect</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Team */}
      {isOwnerOrAdmin && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Team & Roles</h2>
          <Card className="glass-card p-6">
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="font-medium">{profile?.display_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">{profile?.role}</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
