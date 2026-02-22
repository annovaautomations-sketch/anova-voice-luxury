import { X, Phone, Clock, Calendar, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

interface CallDetailPanelProps {
  call: Call;
  onClose: () => void;
}

export function CallDetailPanel({ call, onClose }: CallDetailPanelProps) {
  const fmtDuration = (s: number | null) => {
    if (!s) return '—';
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <>
      <div className="slide-over-backdrop" onClick={onClose} />
      <div className="slide-over-panel">
        <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Call Details</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Call Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Phone className="w-4 h-4" />} label="Caller" value={call.from_e164 || '—'} />
            <InfoItem icon={<Phone className="w-4 h-4" />} label="Called" value={call.to_e164 || '—'} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date" value={call.started_at ? format(parseISO(call.started_at), 'MMM d, yyyy') : '—'} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label="Time" value={call.started_at ? format(parseISO(call.started_at), 'h:mm a') : '—'} />
            <InfoItem icon={<Clock className="w-4 h-4" />} label="Duration" value={fmtDuration(call.duration_sec)} />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Direction</p>
              <Badge variant="outline" className={cn('text-xs', call.direction === 'inbound' ? 'border-info/30 text-info' : 'border-purple/30 text-purple')}>
                {call.direction === 'inbound' ? <ArrowDownLeft className="w-3 h-3 mr-1" /> : <ArrowUpRight className="w-3 h-3 mr-1" />}
                {call.direction}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Outcome</p>
              <span className={cn('status-badge', call.outcome === 'booked' ? 'bg-primary/10 text-primary' : call.outcome === 'qualified' ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground')}>
                {call.outcome || 'other'}
              </span>
            </div>
            <InfoItem icon={null} label="Cost" value={`$${(call.cost_total || 0).toFixed(2)}`} />
          </div>

          {/* Recording */}
          {call.recording_url && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Recording</h3>
              <audio controls className="w-full" src={call.recording_url}>
                Your browser does not support audio.
              </audio>
            </div>
          )}

          {/* AI Summary */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">AI Summary</h3>
            {call.summary ? (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-sm italic text-foreground/80">
                {call.summary}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No summary available</p>
            )}
          </div>

          {/* Transcript */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Transcript</h3>
            {call.transcript_text ? (
              <div className="bg-secondary rounded-xl p-4 max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-foreground/80">
                {call.transcript_text}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No transcript available</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">{icon}{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
