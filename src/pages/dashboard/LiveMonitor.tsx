import { useState } from 'react';
import { Phone, Radio, Activity } from 'lucide-react';

export default function LiveMonitor() {
  const [activeCalls] = useState<unknown[]>([]);

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Live Monitor</h1>
        <span className="flex items-center gap-2 text-sm text-primary">
          <span className="w-2 h-2 rounded-full bg-primary pulse-live" />
          {activeCalls.length} calls active
        </span>
      </div>

      {/* Active Calls */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Radio className="w-4 h-4 text-primary" />
          Active Calls
        </h3>
        {activeCalls.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Phone className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No active calls</p>
            <p className="text-sm">Active calls will appear here in real-time when your AI agent is on a call.</p>
          </div>
        ) : null}
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-2xl shadow-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-info" />
          Recent Activity
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Real-time activity feed will appear here as events occur.</p>
        </div>
      </div>
    </div>
  );
}
