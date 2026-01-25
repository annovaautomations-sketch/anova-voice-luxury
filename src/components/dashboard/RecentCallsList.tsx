import { formatDistanceToNow } from 'date-fns';
import { Phone, PhoneIncoming, PhoneOutgoing, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OUTCOME_COLORS } from '@/lib/constants';

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

interface RecentCallsListProps {
  calls: Call[];
  loading?: boolean;
}

export function RecentCallsList({ calls, loading }: RecentCallsListProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="log-entry animate-pulse">
            <div className="w-8 h-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Phone className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground">No calls yet</p>
        <p className="text-sm text-muted-foreground/70">Calls will appear here once your agents start working</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/50">
      {calls.map((call) => (
        <div key={call.id} className="log-entry">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-foreground">
                {call.direction === 'inbound' ? call.from_e164 : call.to_e164 || 'Unknown'}
              </span>
              {call.outcome && (
                <span className={cn(
                  'text-xs font-medium px-2 py-0.5 rounded-full bg-muted',
                  OUTCOME_COLORS[call.outcome]
                )}>
                  {call.outcome.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {call.summary || 'No summary available'}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-muted-foreground">
              {call.started_at
                ? formatDistanceToNow(new Date(call.started_at), { addSuffix: true })
                : 'N/A'}
            </p>
            {call.duration_sec !== null && (
              <p className="text-xs text-muted-foreground/70 flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {Math.floor(call.duration_sec / 60)}:{String(call.duration_sec % 60).padStart(2, '0')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
