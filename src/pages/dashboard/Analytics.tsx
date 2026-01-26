import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';
import { Card } from '@/components/ui/card';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Phone,
  Calendar,
  TrendingUp,
  Clock,
  BarChart3,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { startOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

interface DailyStats {
  date: string;
  calls: number;
  booked: number;
  avgDuration: number;
}

interface OutcomeData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  primary: 'hsl(152, 90%, 36%)',
  info: 'hsl(200, 80%, 50%)',
  warning: 'hsl(38, 92%, 50%)',
  muted: 'hsl(150, 15%, 40%)',
};

export default function Analytics() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [outcomeData, setOutcomeData] = useState<OutcomeData[]>([]);
  const [totals, setTotals] = useState({
    totalCalls: 0,
    totalBooked: 0,
    avgBookRate: 0,
    avgDuration: 0,
    trend: 0,
  });

  useEffect(() => {
    if (profile?.tenant_id) {
      fetchAnalytics();
    }
  }, [profile?.tenant_id]);

  const fetchAnalytics = async () => {
    if (!profile?.tenant_id) return;

    try {
      const endDate = new Date();
      const startDate = subDays(endDate, 30);

      const { data: calls, error } = await supabase
        .from('calls')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });

      if (error) throw error;

      // Generate daily stats
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyMap = new Map<string, { calls: number; booked: number; durations: number[] }>();

      days.forEach((day) => {
        dailyMap.set(format(day, 'yyyy-MM-dd'), { calls: 0, booked: 0, durations: [] });
      });

      calls?.forEach((call) => {
        if (!call.started_at) return;
        const dayKey = format(new Date(call.started_at), 'yyyy-MM-dd');
        const dayData = dailyMap.get(dayKey);
        if (dayData) {
          dayData.calls++;
          if (call.outcome === 'booked') dayData.booked++;
          if (call.duration_sec) dayData.durations.push(call.duration_sec);
        }
      });

      const dailyStatsArray: DailyStats[] = [];
      dailyMap.forEach((value, key) => {
        dailyStatsArray.push({
          date: format(new Date(key), 'MMM d'),
          calls: value.calls,
          booked: value.booked,
          avgDuration:
            value.durations.length > 0
              ? Math.round(value.durations.reduce((a, b) => a + b, 0) / value.durations.length)
              : 0,
        });
      });

      setDailyStats(dailyStatsArray);

      // Calculate totals
      const totalCalls = calls?.length || 0;
      const totalBooked = calls?.filter((c) => c.outcome === 'booked').length || 0;
      const callsWithDuration = calls?.filter((c) => c.duration_sec && c.duration_sec > 0) || [];
      const avgDuration =
        callsWithDuration.length > 0
          ? Math.round(
              callsWithDuration.reduce((acc, c) => acc + (c.duration_sec || 0), 0) /
                callsWithDuration.length
            )
          : 0;

      // Calculate 7-day trend
      const last7 = calls?.filter((c) => c.started_at && new Date(c.started_at) >= subDays(endDate, 7)) || [];
      const prev7 = calls?.filter((c) => {
        if (!c.started_at) return false;
        const date = new Date(c.started_at);
        return date >= subDays(endDate, 14) && date < subDays(endDate, 7);
      }) || [];
      
      const trend = prev7.length > 0 
        ? Math.round(((last7.length - prev7.length) / prev7.length) * 100) 
        : 0;

      setTotals({
        totalCalls,
        totalBooked,
        avgBookRate: totalCalls > 0 ? Math.round((totalBooked / totalCalls) * 100) : 0,
        avgDuration,
        trend,
      });

      // Calculate outcome distribution
      const outcomes = {
        booked: calls?.filter((c) => c.outcome === 'booked').length || 0,
        qualified: calls?.filter((c) => c.outcome === 'qualified').length || 0,
        not_qualified: calls?.filter((c) => c.outcome === 'not_qualified').length || 0,
        other: calls?.filter((c) => c.outcome === 'other' || !c.outcome).length || 0,
      };

      setOutcomeData([
        { name: 'Booked', value: outcomes.booked, color: COLORS.primary },
        { name: 'Qualified', value: outcomes.qualified, color: COLORS.info },
        { name: 'Not Qualified', value: outcomes.not_qualified, color: COLORS.warning },
        { name: 'Other', value: outcomes.other, color: COLORS.muted },
      ]);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const hasData = totals.totalCalls > 0;

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">Performance overview for the last 30 days</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Calls"
          value={totals.totalCalls}
          icon={<Phone className="w-5 h-5" />}
          trend={totals.trend !== 0 ? {
            value: Math.abs(totals.trend),
            label: 'vs last 7d',
            positive: totals.trend > 0,
          } : undefined}
        />
        <StatCard
          title="Total Booked"
          value={totals.totalBooked}
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          title="Book Rate"
          value={`${totals.avgBookRate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          title="Avg Duration"
          value={formatDuration(totals.avgDuration)}
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {!hasData ? (
        <Card className="glass-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No data yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Analytics will populate as your voice agents handle calls. 
            Connect Vapi in Settings to start receiving call data.
          </p>
        </Card>
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calls Over Time */}
            <Card className="glass-card p-6 lg:col-span-2">
              <h3 className="font-semibold mb-4">Calls Over Time</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(152, 90%, 36%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(152, 90%, 36%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 20%, 12%)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(150, 15%, 40%)"
                      tick={{ fill: 'hsl(150, 15%, 60%)', fontSize: 12 }}
                    />
                    <YAxis
                      stroke="hsl(150, 15%, 40%)"
                      tick={{ fill: 'hsl(150, 15%, 60%)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(160, 20%, 4%)',
                        border: '1px solid hsl(160, 20%, 12%)',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      stroke="hsl(152, 90%, 36%)"
                      strokeWidth={2}
                      fill="url(#callsGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Outcome Distribution */}
            <Card className="glass-card p-6">
              <h3 className="font-semibold mb-4">Outcome Distribution</h3>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {outcomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(160, 20%, 4%)',
                        border: '1px solid hsl(160, 20%, 12%)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {outcomeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-mono text-foreground ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Booking Trend */}
          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Daily Bookings</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 20%, 12%)" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(150, 15%, 40%)"
                    tick={{ fill: 'hsl(150, 15%, 60%)', fontSize: 12 }}
                  />
                  <YAxis
                    stroke="hsl(150, 15%, 40%)"
                    tick={{ fill: 'hsl(150, 15%, 60%)', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(160, 20%, 4%)',
                      border: '1px solid hsl(160, 20%, 12%)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="booked" fill="hsl(152, 90%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
