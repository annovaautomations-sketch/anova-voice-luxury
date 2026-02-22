import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';
import { useDataFetcher } from '@/hooks/useDataFetcher';
import { KPICard } from '@/components/dashboard/KPICard';
import { Users, UserPlus, Target, DollarSign } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { LEAD_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  status: string;
  score: number;
  budget: string | null;
  created_at: string;
}

const FUNNEL_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'APPOINTMENT_SCHEDULED', 'APPOINTMENT_COMPLETED', 'CLOSED_WON'];

const statusLabel = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

export default function LeadPipeline() {
  const { sessionId } = useAuth();
  const { fetchLeads } = useDataFetcher();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    fetchLeads().then(res => {
      if (res.ok) setLeads(res.leads || []);
      setLoading(false);
    });
  }, [sessionId, fetchLeads]);

  const funnelData = FUNNEL_STAGES.map(stage => ({
    stage,
    count: leads.filter(l => l.status === stage).length,
    color: LEAD_STATUS_COLORS[stage] || 'hsl(215,16%,47%)',
  }));

  const totalLeads = leads.length;
  const avgScore = totalLeads > 0 ? Math.round(leads.reduce((a, l) => a + l.score, 0) / totalLeads) : 0;
  const qualifiedRate = totalLeads > 0 ? Math.round((leads.filter(l => ['QUALIFIED', 'APPOINTMENT_SCHEDULED', 'APPOINTMENT_COMPLETED', 'CLOSED_WON'].includes(l.status)).length / totalLeads) * 100) : 0;

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
      <h1 className="text-2xl font-bold text-foreground">Lead Pipeline</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Leads" value={totalLeads} icon={<Users className="w-5 h-5" />} color="primary" />
        <KPICard title="New This Week" value={leads.filter(l => l.status === 'NEW').length} icon={<UserPlus className="w-5 h-5" />} color="info" />
        <KPICard title="Qualified Rate" value={`${qualifiedRate}%`} icon={<Target className="w-5 h-5" />} color="success" />
        <KPICard title="Avg Score" value={avgScore} icon={<DollarSign className="w-5 h-5" />} color="gold" />
      </div>

      {/* Funnel */}
      <div className="bg-card rounded-2xl p-6 shadow-card">
        <h3 className="font-semibold text-foreground mb-6">Conversion Funnel</h3>
        {totalLeads === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No leads yet. Connect your voice agent to start generating leads.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {funnelData.map((stage, i) => {
              const maxCount = Math.max(1, ...funnelData.map(s => s.count));
              const width = Math.max(10, (stage.count / maxCount) * 100);
              return (
                <div key={stage.stage} className="flex items-center gap-4">
                  <span className="text-xs font-medium text-muted-foreground w-40 truncate">{statusLabel(stage.stage)}</span>
                  <div className="flex-1 h-8 bg-secondary rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center px-3 transition-all duration-500"
                      style={{ width: `${width}%`, backgroundColor: stage.color }}
                    >
                      <span className="text-xs font-bold text-white">{stage.count}</span>
                    </div>
                  </div>
                  {i < funnelData.length - 1 && funnelData[i].count > 0 && (
                    <span className="text-xs text-muted-foreground w-12">
                      {Math.round((funnelData[i + 1].count / funnelData[i].count) * 100)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leads Table */}
      {leads.length > 0 && (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Phone</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Budget</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                          {lead.first_name.charAt(0)}{lead.last_name.charAt(0)}
                        </div>
                        <span className="font-medium">{lead.first_name} {lead.last_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.phone}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{statusLabel(lead.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2',
                        lead.score >= 75 ? 'ring-primary/30 text-primary' : lead.score >= 50 ? 'ring-warning/30 text-warning' : 'ring-muted-foreground/20 text-muted-foreground'
                      )}>
                        {lead.score}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{lead.budget || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{format(parseISO(lead.created_at), 'MMM d')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
