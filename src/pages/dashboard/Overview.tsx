import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { KPICard } from '@/components/dashboard/KPICard';
import { Phone, PhoneIncoming, Clock, CalendarCheck, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { format, subDays, startOfDay, parseISO } from 'date-fns';

interface Call {
  id: string;
  direction: string;
  started_at: string | null;
  duration_sec: number | null;
  status: string;
  outcome: string | null;
  cost_total: number | null;
  from_e164: string | null;
  to_e164: string | null;
  summary: string | null;
}

const PERIOD_OPTIONS = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

const OUTCOME_PALETTE = [
  { key: 'booked', label: 'Appointment Booked', color: 'hsl(160, 84%, 39%)' },
  { key: 'qualified', label: 'Callback Requested', color: 'hsl(217, 91%, 60%)' },
  { key: 'not_qualified', label: 'Not Interested', color: 'hsl(215, 16%, 60%)' },
  { key: 'other', label: 'Other', color: 'hsl(38, 92%, 50%)' },
];

export default function Overview() {
  const { user, sessionId } = useAuth();
  const { fetchCalls } = useDataFetcher();
  const [period, setPeriod] = useState(7);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    const start = subDays(new Date(), period).toISOString();
    fetchCalls({ limit: 500, startDate: start }).then((res) => {
      if (res.ok) setCalls(res.calls || []);
      setLoading(false);
    });
  }, [sessionId, period, fetchCalls]);

  const stats = useMemo(() => {
    const total = calls.length;
    const answered = calls.filter(c => c.status === 'ended' && (c.duration_sec || 0) > 0).length;
    const answeredRate = total > 0 ? Math.round((answered / total) * 100) : 0;
    const durations = calls.filter(c => c.duration_sec && c.duration_sec > 0).map(c => c.duration_sec!);
    const avgDur = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const booked = calls.filter(c => c.outcome === 'booked').length;
    const bookingRate = total > 0 ? Math.round((booked / total) * 100) : 0;
    const qualified = calls.filter(c => c.outcome === 'qualified' || c.outcome === 'booked').length;
    const conversionRate = total > 0 ? Math.round((qualified / total) * 100) : 0;
    return { total, answeredRate, avgDur, booked, bookingRate, conversionRate };
  }, [calls]);

  const callsByDay = useMemo(() => {
    const map: Record<string, { total: number; answered: number }> = {};
    for (let i = period - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
      map[d] = { total: 0, answered: 0 };
    }
    calls.forEach(c => {
      if (!c.started_at) return;
      const d = format(parseISO(c.started_at), 'yyyy-MM-dd');
      if (map[d]) {
        map[d].total++;
        if (c.status === 'ended' && (c.duration_sec || 0) > 0) map[d].answered++;
      }
    });
    return Object.entries(map).map(([date, v]) => ({ date: format(parseISO(date), 'MMM d'), ...v }));
  }, [calls, period]);

  const outcomeData = useMemo(() => {
    const counts: Record<string, number> = { booked: 0, qualified: 0, not_qualified: 0, other: 0 };
    calls.forEach(c => { counts[c.outcome || 'other'] = (counts[c.outcome || 'other'] || 0) + 1; });
    return OUTCOME_PALETTE.map(o => ({ name: o.label, value: counts[o.key] || 0, color: o.color }));
  }, [calls]);

  const callsByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
    calls.forEach(c => {
      if (!c.started_at) return;
      const h = parseISO(c.started_at).getHours();
      hours[h].count++;
    });
    return hours.map(h => ({ ...h, label: h.hour === 0 ? '12am' : h.hour < 12 ? `${h.hour}am` : h.hour === 12 ? '12pm' : `${h.hour - 12}pm` }));
  }, [calls]);

  const callsByDow = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = days.map(d => ({ day: d, count: 0 }));
    calls.forEach(c => {
      if (!c.started_at) return;
      counts[parseISO(c.started_at).getDay()].count++;
    });
    return counts;
  }, [calls]);

  const durationBuckets = useMemo(() => {
    const buckets = [
      { range: '<1 min', min: 0, max: 60, count: 0 },
      { range: '1-3 min', min: 60, max: 180, count: 0 },
      { range: '3-5 min', min: 180, max: 300, count: 0 },
      { range: '5-10 min', min: 300, max: 600, count: 0 },
      { range: '10+ min', min: 600, max: Infinity, count: 0 },
    ];
    calls.forEach(c => {
      const d = c.duration_sec || 0;
      const b = buckets.find(b => d >= b.min && d < b.max);
      if (b) b.count++;
    });
    return buckets;
  }, [calls]);

  const sparkline = useMemo(() => callsByDay.map(d => ({ value: d.total })), [callsByDay]);

  const fmtDuration = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;

  const chartTooltipStyle = { backgroundColor: 'white', borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' };

  if (loading) {
    return (
      <div className="space-y-6 fade-in">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <Skeleton className="lg:col-span-3 h-80 rounded-2xl" />
          <Skeleton className="lg:col-span-2 h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm">Welcome back, {user?.name?.split(' ')[0] || 'there'}</p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {PERIOD_OPTIONS.map(p => (
            <Button
              key={p.value}
              size="sm"
              variant={period === p.value ? 'default' : 'ghost'}
              className={period === p.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard title="Total Calls" value={stats.total} icon={<Phone className="w-5 h-5" />} color="primary" sparklineData={sparkline} />
        <KPICard title="Answer Rate" value={`${stats.answeredRate}%`} icon={<PhoneIncoming className="w-5 h-5" />} color="info" />
        <KPICard title="Avg Duration" value={fmtDuration(stats.avgDur)} icon={<Clock className="w-5 h-5" />} color="purple" />
        <KPICard title="Appts Booked" value={stats.booked} icon={<CalendarCheck className="w-5 h-5" />} color="gold" subtitle={`${stats.bookingRate}% booking rate`} />
        <KPICard title="Conversion Rate" value={`${stats.conversionRate}%`} icon={<Target className="w-5 h-5" />} color="success" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Call Volume</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={callsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(160,84%,39%)" strokeOpacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215,16%,47%)" />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="total" name="Total" stroke="hsl(160,84%,39%)" fill="hsl(160,84%,39%)" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="answered" name="Answered" stroke="hsl(217,91%,60%)" fill="hsl(217,91%,60%)" fillOpacity={0.1} strokeWidth={2} />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Call Outcomes</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={outcomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {outcomeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={chartTooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Calls by Hour</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={callsByHour}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={5} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="hsl(160,84%,39%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Calls by Day</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={callsByDow}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="hsl(161,94%,30%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h3 className="font-semibold text-foreground mb-4">Duration Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={durationBuckets} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="range" tick={{ fontSize: 11 }} width={70} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="hsl(258,90%,66%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
