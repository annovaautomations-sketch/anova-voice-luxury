import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Calendar, TrendingUp, Clock, AlertCircle, Settings, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useCustomAuth';
import { useVapiStatus } from '@/hooks/useVapiStatus';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentCallsList } from '@/components/dashboard/RecentCallsList';
import { OutcomeChart } from '@/components/dashboard/OutcomeChart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface CallStats {
  callsToday: number;
  totalCalls: number;
  totalCost: number;
  avgDuration: number;
}

interface Call {
  id: string;
  vapi_call_id: string;
  direction: 'inbound' | 'outbound';
  from_e164: string | null;
  to_e164: string | null;
  started_at: string | null;
  duration_sec: number | null;
  status: string;
  outcome: 'booked' | 'qualified' | 'not_qualified' | 'other' | null;
  summary: string | null;
  cost_total: number | null;
}

export default function Overview() {
  const { user, sessionId } = useAuth();
  const { connected: vapiConnected, loading: vapiStatusLoading } = useVapiStatus();
  const { fetchCalls } = useDataFetcher();
  const [stats, setStats] = useState<CallStats>({
    callsToday: 0,
    totalCalls: 0,
    totalCost: 0,
    avgDuration: 0,
  });
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [outcomeData, setOutcomeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionId) {
      fetchDashboardData();
    }
  }, [sessionId]);

  const fetchDashboardData = async () => {
    try {
      const today = new Date();
      const startToday = startOfDay(today).toISOString();
      const start7d = subDays(today, 7).toISOString();

      // Fetch all calls from last 7 days
      const result = await fetchCalls({ 
        limit: 500,
        startDate: start7d,
      });

      if (!result.ok) {
        console.error('Failed to fetch calls:', result.message);
        setLoading(false);
        return;
      }

      const calls = result.calls as Call[];
      
      // Filter today's calls
      const todayCalls = calls.filter(c => 
        c.started_at && new Date(c.started_at) >= new Date(startToday)
      );

      // Calculate stats
      const callsToday = todayCalls.length;
      const totalCalls = calls.length;
      
      const totalCost = calls.reduce((acc, c) => acc + (c.cost_total || 0), 0);
      
      const callsWithDuration = calls.filter(c => c.duration_sec !== null && c.duration_sec > 0);
      const avgDuration = callsWithDuration.length > 0
        ? Math.round(callsWithDuration.reduce((acc, c) => acc + (c.duration_sec || 0), 0) / callsWithDuration.length)
        : 0;

      setStats({
        callsToday,
        totalCalls,
        totalCost,
        avgDuration,
      });

      // Get recent calls (latest 10)
      setRecentCalls(calls.slice(0, 10));

      // Calculate outcome distribution
      const outcomes = {
        booked: calls.filter(c => c.outcome === 'booked').length,
        qualified: calls.filter(c => c.outcome === 'qualified').length,
        not_qualified: calls.filter(c => c.outcome === 'not_qualified').length,
        other: calls.filter(c => c.outcome === 'other' || !c.outcome).length,
      };

      setOutcomeData([
        { name: 'Booked', value: outcomes.booked, color: 'hsl(152, 90%, 36%)' },
        { name: 'Qualified', value: outcomes.qualified, color: 'hsl(200, 80%, 50%)' },
        { name: 'Not Qualified', value: outcomes.not_qualified, color: 'hsl(38, 92%, 50%)' },
        { name: 'Other', value: outcomes.other, color: 'hsl(150, 15%, 60%)' },
      ]);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  // Show connect prompt banner if Vapi is not connected
  const showConnectBanner = !vapiStatusLoading && !vapiConnected;

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}
        </p>
      </div>

      {/* Connect Vapi Banner */}
      {showConnectBanner && (
        <Card className="glass-card p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-warning" />
              <p className="text-sm text-muted-foreground">
                Connect Vapi in Settings to sync your call data and populate the dashboard.
              </p>
            </div>
            <Link to="/dashboard/settings">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Calls Today"
          value={stats.callsToday}
          icon={<Phone className="w-5 h-5" />}
        />
        <StatCard
          title="Total Calls (7d)"
          value={stats.totalCalls}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Total Cost (7d)"
          value={formatCost(stats.totalCost)}
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatCard
          title="Avg Duration"
          value={formatDuration(stats.avgDuration)}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Calls */}
        <div className="lg:col-span-2 glass-card rounded-xl">
          <div className="p-4 border-b border-border/50">
            <h2 className="font-semibold text-foreground">Recent Calls</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            <RecentCallsList calls={recentCalls} loading={loading} />
          </div>
        </div>

        {/* Outcome Breakdown */}
        <div className="glass-card rounded-xl p-4">
          <h2 className="font-semibold text-foreground mb-4">Outcomes (7d)</h2>
          <OutcomeChart data={outcomeData} />
        </div>
      </div>
    </div>
  );
}
