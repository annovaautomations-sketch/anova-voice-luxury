import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CallDetailPanel } from '@/components/panels/CallDetailPanel';
import { Phone, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Call {
  id: string;
  vapi_call_id: string;
  direction: string;
  from_e164: string | null;
  to_e164: string | null;
  started_at: string | null;
  duration_sec: number | null;
  status: string;
  outcome: string | null;
  summary: string | null;
  cost_total: number | null;
  transcript_text: string | null;
  recording_url: string | null;
}

const fmtDuration = (s: number | null) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${String(sec).padStart(2, '0')}s`;
};

const outcomeBadge = (outcome: string | null) => {
  const styles: Record<string, string> = {
    booked: 'bg-primary/10 text-primary',
    qualified: 'bg-info/10 text-info',
    not_qualified: 'bg-warning/10 text-warning',
    other: 'bg-muted text-muted-foreground',
  };
  return styles[outcome || 'other'] || styles.other;
};

export default function CallHistory() {
  const { sessionId } = useAuth();
  const { fetchCalls } = useDataFetcher();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<string>('all');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchCalls({ limit: 200 }).then(res => {
      if (res.ok) setCalls(res.calls || []);
      setLoading(false);
    });
  }, [sessionId, fetchCalls]);

  const filtered = calls.filter(c => {
    if (direction !== 'all' && c.direction !== direction) return false;
    if (search) {
      const q = search.toLowerCase();
      return (c.from_e164 || '').includes(q) || (c.to_e164 || '').includes(q) || (c.summary || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Call History</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} total calls</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by phone or summary..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {['all', 'inbound', 'outbound'].map(d => (
            <Button key={d} size="sm" variant={direction === d ? 'default' : 'ghost'}
              className={cn(direction === d ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              onClick={() => setDirection(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Date & Time</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Duration</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Direction</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Outcome</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Cost</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Phone className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No calls found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(call => (
                  <tr
                    key={call.id}
                    className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCall(call)}
                  >
                    <td className="px-4 py-3 font-medium">{call.direction === 'inbound' ? call.from_e164 : call.to_e164 || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {call.started_at ? format(parseISO(call.started_at), 'MMM d, h:mm a') : '—'}
                    </td>
                    <td className="px-4 py-3">{fmtDuration(call.duration_sec)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={cn('text-xs', call.direction === 'inbound' ? 'border-info/30 text-info' : 'border-purple/30 text-purple')}>
                        {call.direction}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('status-badge', outcomeBadge(call.outcome))}>
                        {call.outcome || 'other'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">${(call.cost_total || 0).toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selectedCall && <CallDetailPanel call={selectedCall} onClose={() => setSelectedCall(null)} />}
    </div>
  );
}
