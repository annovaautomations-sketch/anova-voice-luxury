import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useCustomAuth';
import { useVapiStatus } from '@/hooks/useVapiStatus';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Search, Phone, PhoneIncoming, PhoneOutgoing, X, RefreshCw, Settings, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { OUTCOME_COLORS, STATUS_COLORS } from '@/lib/constants';
import { toast } from 'sonner';

interface Call {
  id: string;
  vapi_call_id: string;
  direction: 'inbound' | 'outbound';
  from_e164: string | null;
  to_e164: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_sec: number | null;
  status: string;
  outcome: 'booked' | 'qualified' | 'not_qualified' | 'other' | null;
  summary: string | null;
  assistant_id: string | null;
}

export default function Calls() {
  const { user, isOwnerOrAdmin, sessionId } = useAuth();
  const navigate = useNavigate();
  const { connected: vapiConnected, loading: vapiStatusLoading, refetch: refetchVapiStatus } = useVapiStatus();
  const { fetchCalls, syncVapiCalls } = useDataFetcher();
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  useEffect(() => {
    if (sessionId) {
      loadCalls();
    }
  }, [sessionId]);

  const loadCalls = async () => {
    setLoading(true);
    try {
      const result = await fetchCalls({ limit: 100 });
      if (result.ok) {
        setCalls(result.calls as Call[]);
      } else {
        console.error('Failed to fetch calls:', result.message);
      }
    } catch (error) {
      console.error('Error loading calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCalls = calls.filter((call) => {
    const matchesSearch =
      search === '' ||
      call.vapi_call_id.toLowerCase().includes(search.toLowerCase()) ||
      call.from_e164?.includes(search) ||
      call.to_e164?.includes(search);

    const matchesOutcome =
      outcomeFilter === 'all' || call.outcome === outcomeFilter;

    const matchesDirection =
      directionFilter === 'all' || call.direction === directionFilter;

    return matchesSearch && matchesOutcome && matchesDirection;
  });

  const clearFilters = () => {
    setSearch('');
    setOutcomeFilter('all');
    setDirectionFilter('all');
  };

  const hasFilters = search || outcomeFilter !== 'all' || directionFilter !== 'all';

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncVapiCalls(7);
      if (result?.ok) {
        toast.success(`Synced ${result.total} calls`);
        await loadCalls();
        refetchVapiStatus();
      } else {
        toast.error(result?.message || 'Failed to sync calls');
      }
    } catch (error) {
      console.error('Error syncing calls:', error);
      toast.error('Failed to sync calls');
    } finally {
      setSyncing(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '-';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // Show connect prompt if Vapi is not connected
  if (!vapiStatusLoading && !vapiConnected) {
    return (
      <div className="space-y-6 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Calls</h1>
            <p className="text-muted-foreground mt-1">View and analyze all voice calls</p>
          </div>
        </div>

        {/* Connect Vapi Card */}
        <Card className="glass-card p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connect Vapi to View Calls</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            To sync and view your call data, connect your Vapi account in Settings.
          </p>
          <Link to="/dashboard/settings">
            <Button className="btn-glow">
              <Settings className="w-4 h-4 mr-2" />
              Go to Settings
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calls</h1>
          <p className="text-muted-foreground mt-1">View and analyze all voice calls</p>
        </div>
        {isOwnerOrAdmin && (
          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Sync Now
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by phone or call ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border"
            />
          </div>
          <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue placeholder="Outcome" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Outcomes</SelectItem>
              <SelectItem value="booked">Booked</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="not_qualified">Not Qualified</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={directionFilter} onValueChange={setDirectionFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Directions</SelectItem>
              <SelectItem value="inbound">Inbound</SelectItem>
              <SelectItem value="outbound">Outbound</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="icon" onClick={clearFilters}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Calls Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Direction</TableHead>
              <TableHead className="text-muted-foreground">Phone</TableHead>
              <TableHead className="text-muted-foreground">Started</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-border/50">
                  <TableCell colSpan={6}>
                    <div className="h-12 bg-muted/20 rounded animate-pulse" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredCalls.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <Phone className="w-8 h-8 text-muted-foreground/50" />
                    <p className="text-muted-foreground">No calls found</p>
                    <p className="text-sm text-muted-foreground">Click "Sync Now" to fetch your calls from Vapi</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCalls.map((call) => (
                <TableRow
                  key={call.id}
                  className="border-border/50 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/dashboard/calls/${call.id}`)}
                >
                  <TableCell>
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      call.direction === 'inbound' ? 'bg-info/10 text-info' : 'bg-primary/10 text-primary'
                    )}>
                      {call.direction === 'inbound' ? (
                        <PhoneIncoming className="w-4 h-4" />
                      ) : (
                        <PhoneOutgoing className="w-4 h-4" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {call.direction === 'inbound' ? call.from_e164 : call.to_e164 || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {call.started_at
                      ? format(new Date(call.started_at), 'MMM d, h:mm a')
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatDuration(call.duration_sec)}
                  </TableCell>
                  <TableCell>
                    <span className={cn('text-sm', STATUS_COLORS[call.status as keyof typeof STATUS_COLORS] || 'text-muted-foreground')}>
                      {call.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {call.outcome ? (
                      <Badge variant="outline" className={cn(
                        'border-transparent bg-muted/50',
                        OUTCOME_COLORS[call.outcome]
                      )}>
                        {call.outcome.replace('_', ' ')}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
