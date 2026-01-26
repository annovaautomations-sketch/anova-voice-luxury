import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Calendar, TrendingUp, Clock, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';
import { useVapiStatus } from '@/hooks/useVapiStatus';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentCallsList } from '@/components/dashboard/RecentCallsList';
import { OutcomeChart } from '@/components/dashboard/OutcomeChart';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { startOfDay, endOfDay, subDays } from 'date-fns';

interface CallStats {
  callsToday: number;
  bookedToday: number;
  bookRate7d: number;
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
}

export default function Overview() {
  const { user } = useAuth();
  const { connected: vapiConnected, loading: vapiStatusLoading } = useVapiStatus();
  const [stats, setStats] = useState<CallStats>({
    callsToday: 0,
    bookedToday: 0,
    bookRate7d: 0,
    avgDuration: 0,
  });
  const [recentCalls, setRecentCalls] = useState<Call[]>([]);
  const [outcomeData, setOutcomeData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenant_id) {
      fetchDashboardData();
    }
  }, [user?.tenant_id]);

  const fetchDashboardData = async () => {
    if (!user?.tenant_id) return;

    try {
      const today = new Date();
      const startToday = startOfDay(today).toISOString();
      const endToday = endOfDay(today).toISOString();
      const start7d = subDays(today, 7).toISOString();

      // Fetch calls for today
      const { data: todayCalls, error: todayError } = await supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .gte('started_at', startToday)
        .lte('started_at', endToday);

      if (todayError) throw todayError;

      // Fetch calls for last 7 days
      const { data: weekCalls, error: weekError } = await supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .gte('started_at', start7d);

      if (weekError) throw weekError;

      // Fetch recent calls
      const { data: recent, error: recentError } = await supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', user.tenant_id)
        .order('started_at', { ascending: false })
        .limit(10);

      if (recentError) throw recentError;

      // Calculate stats
      const callsToday = todayCalls?.length || 0;
      const bookedToday = todayCalls?.filter(c => c.outcome === 'booked').length || 0;
      
      const totalWeekCalls = weekCalls?.length || 0;
      const bookedWeekCalls = weekCalls?.filter(c => c.outcome === 'booked').length || 0;
      const bookRate7d = totalWeekCalls > 0 ? Math.round((bookedWeekCalls / totalWeekCalls) * 100) : 0;
      
      const callsWithDuration = weekCalls?.filter(c => c.duration_sec !== null && c.duration_sec > 0) || [];
      const avgDuration = callsWithDuration.length > 0
        ? Math.round(callsWithDuration.reduce((acc, c) => acc + (c.duration_sec || 0), 0) / callsWithDuration.length)
        : 0;

      setStats({
        callsToday,
        bookedToday,
        bookRate7d,
        avgDuration,
      });

      setRecentCalls((recent || []) as Call[]);

      // Calculate outcome distribution
      const outcomes = {
        booked: weekCalls?.filter(c => c.outcome === 'booked').length || 0,
        qualified: weekCalls?.filter(c => c.outcome === 'qualified').length || 0,
        not_qualified: weekCalls?.filter(c => c.outcome === 'not_qualified').length || 0,
        other: weekCalls?.filter(c => c.outcome === 'other').length || 0,
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
          title="Booked Today"
          value={stats.bookedToday}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Book Rate (7d)"
          value={`${stats.bookRate7d}%`}
          icon={<TrendingUp className="w-5 h-5" />}
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
