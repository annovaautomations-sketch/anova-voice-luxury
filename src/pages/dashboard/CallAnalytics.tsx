import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { KPICard } from '@/components/dashboard/KPICard';
import { Phone, Clock, Target, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Call {
  id: string;
  direction: string;
  started_at: string | null;
  duration_sec: number | null;
  status: string;
  outcome: string | null;
}

const PERIODS = [{ label: '7D', value: 7 }, { label: '30D', value: 30 }, { label: '90D', value: 90 }];
const tooltipStyle = { backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' };

export default function CallAnalytics() {
  const { sessionId } = useAuth();
  const { fetchCalls } = useDataFetcher();
  const [period, setPeriod] = useState(7);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchCalls({ limit: 500, startDate: subDays(new Date(), period).toISOString() }).then(res => {
      if (res.ok) setCalls(res.calls || []);
      setLoading(false);
    });
  }, [sessionId, period, fetchCalls]);

  const stats = useMemo(() => {
    const total = calls.length;
    const durations = calls.filter(c => c.duration_sec && c.duration_sec > 0).map(c => c.duration_sec!);
    const avgDur = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const booked = calls.filter(c => c.outcome === 'booked').length;
    const apptRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    return { total, avgDur, apptRate };
  }, [calls]);

  const volumeTrend = useMemo(() => {
    const map: Record<string, { inbound: number; outbound: number }> = {};
    for (let i = period - 1; i >= 0; i--) {
      map[format(subDays(new Date(), i), 'yyyy-MM-dd')] = { inbound: 0, outbound: 0 };
    }
    calls.forEach(c => {
      if (!c.started_at) return;
      const d = format(parseISO(c.started_at), 'yyyy-MM-dd');
      if (map[d]) map[d][c.direction === 'inbound' ? 'inbound' : 'outbound']++;
    });
    return Object.entries(map).map(([date, v]) => ({ date: format(parseISO(date), 'MMM d'), ...v }));
  }, [calls, period]);

  // Heatmap data: 7 days × 24 hours
  const heatmap = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    calls.forEach(c => {
      if (!c.started_at) return;
      const d = parseISO(c.started_at);
      grid[d.getDay()][d.getHours()]++;
    });
    return grid;
  }, [calls]);
  const heatmapMax = useMemo(() => Math.max(1, ...heatmap.flat()), [heatmap]);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Call Analytics</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {PERIODS.map(p => (
            <Button key={p.value} size="sm" variant={period === p.value ? 'default' : 'ghost'}
              className={cn(period === p.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              onClick={() => setPeriod(p.value)}>{p.label}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Calls" value={stats.total} icon={<Phone className="w-5 h-5" />} color="primary" />
        <KPICard title="Avg Duration" value={fmtDuration(stats.avgDur)} icon={<Clock className="w-5 h-5" />} color="purple" />
        <KPICard title="Avg Lead Score" value="—" icon={<Target className="w-5 h-5" />} color="info" />
        <KPICard title="Appointment Rate" value={`${stats.apptRate}%`} icon={<CalendarCheck className="w-5 h-5" />} color="gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Call Volume Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={volumeTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend />
              <Line type="monotone" dataKey="inbound" name="Inbound" stroke="hsl(160,84%,39%)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="outbound" name="Outbound" stroke="hsl(217,91%,60%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Performance Heatmap</h3>
          <div className="overflow-x-auto">
            <div className="grid gap-[2px]" style={{ gridTemplateColumns: '40px repeat(24, 1fr)' }}>
              <div />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[9px] text-muted-foreground text-center">{h % 6 === 0 ? (h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h-12}p`) : ''}</div>
              ))}
              {dayLabels.map((day, di) => (
                <>
                  <div key={`l-${di}`} className="text-[10px] text-muted-foreground flex items-center">{day}</div>
                  {Array.from({ length: 24 }, (_, hi) => {
                    const val = heatmap[di][hi];
                    const intensity = val / heatmapMax;
                    return (
                      <div
                        key={`${di}-${hi}`}
                        className="aspect-square rounded-sm"
                        style={{ backgroundColor: `hsl(160, 84%, 39%, ${intensity * 0.8 + 0.05})` }}
                        title={`${day} ${hi}:00 — ${val} calls`}
                      />
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
