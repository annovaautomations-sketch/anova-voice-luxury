import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { KPICard } from '@/components/dashboard/KPICard';
import { CalendarCheck, CheckCircle, XCircle, AlertTriangle, Calendar, Clock, MapPin, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface Appointment {
  id: string;
  lead_name: string;
  lead_phone: string;
  lead_email: string | null;
  status: string;
  start_iso: string;
  end_iso: string;
  timezone: string;
}

const statusStyles: Record<string, { badge: string; border: string }> = {
  booked: { badge: 'bg-primary/10 text-primary', border: 'border-l-primary' },
  rescheduled: { badge: 'bg-warning/10 text-warning', border: 'border-l-warning' },
  cancelled: { badge: 'bg-destructive/10 text-destructive', border: 'border-l-destructive' },
};

export default function Appointments() {
  const { sessionId } = useAuth();
  const { fetchAppointments } = useDataFetcher();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchAppointments().then(res => {
      if (res.ok) setAppointments(res.appointments || []);
      setLoading(false);
    });
  }, [sessionId, fetchAppointments]);

  const filtered = filter === 'all' ? appointments : appointments.filter(a => a.status === filter);
  const bookedCount = appointments.filter(a => a.status === 'booked').length;
  const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

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
        <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {['all', 'booked', 'rescheduled', 'cancelled'].map(s => (
            <Button key={s} size="sm" variant={filter === s ? 'default' : 'ghost'}
              className={cn(filter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}
              onClick={() => setFilter(s)}>{s.charAt(0).toUpperCase() + s.slice(1)}</Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total" value={appointments.length} icon={<CalendarCheck className="w-5 h-5" />} color="primary" />
        <KPICard title="Booked" value={bookedCount} icon={<CheckCircle className="w-5 h-5" />} color="success" />
        <KPICard title="Cancelled" value={cancelledCount} icon={<XCircle className="w-5 h-5" />} color="destructive" />
        <KPICard title="Booking Rate" value={appointments.length > 0 ? `${Math.round((bookedCount / appointments.length) * 100)}%` : '—'} icon={<AlertTriangle className="w-5 h-5" />} color="gold" />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-card p-12 text-center text-muted-foreground">
          <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No appointments found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(appt => {
            const style = statusStyles[appt.status] || statusStyles.booked;
            return (
              <div key={appt.id} className={cn('bg-card rounded-2xl shadow-card p-5 border-l-4', style.border)}>
                <div className="flex items-start justify-between mb-3">
                  <Badge className={cn('text-xs', style.badge)}>{appt.status}</Badge>
                </div>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">{appt.lead_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{format(parseISO(appt.start_iso), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(parseISO(appt.start_iso), 'h:mm a')} — {format(parseISO(appt.end_iso), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{appt.lead_phone}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
