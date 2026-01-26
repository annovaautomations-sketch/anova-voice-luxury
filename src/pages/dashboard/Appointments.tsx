import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { APPOINTMENT_STATUS_COLORS } from '@/lib/constants';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.tenant_id) {
      supabase.from('appointments').select('*').eq('tenant_id', user.tenant_id)
        .order('start_iso', { ascending: false }).limit(50)
        .then(({ data }) => { setAppointments(data || []); setLoading(false); });
    }
  }, [user?.tenant_id]);

  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Appointments</h1>
      <div className="glass-card rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50">
              <TableHead>Lead</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appointments.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-12">
                <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-muted-foreground">No appointments yet</p>
              </TableCell></TableRow>
            ) : appointments.map((apt) => (
              <TableRow key={apt.id} className="border-border/50">
                <TableCell>{apt.lead_name}</TableCell>
                <TableCell className="font-mono text-sm">{apt.lead_phone}</TableCell>
                <TableCell>{format(new Date(apt.start_iso), 'MMM d, h:mm a')}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn('bg-muted/50', APPOINTMENT_STATUS_COLORS[apt.status as keyof typeof APPOINTMENT_STATUS_COLORS])}>
                    {apt.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
