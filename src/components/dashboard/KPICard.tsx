import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

type ColorKey = 'primary' | 'info' | 'purple' | 'gold' | 'success' | 'warning' | 'destructive';

const colorMap: Record<ColorKey, { border: string; bg: string; text: string; hex: string }> = {
  primary:     { border: 'border-l-primary',     bg: 'bg-primary/10',     text: 'text-primary',     hex: 'hsl(160, 84%, 39%)' },
  info:        { border: 'border-l-info',        bg: 'bg-info/10',        text: 'text-info',        hex: 'hsl(217, 91%, 60%)' },
  purple:      { border: 'border-l-purple',      bg: 'bg-purple/10',      text: 'text-purple',      hex: 'hsl(258, 90%, 66%)' },
  gold:        { border: 'border-l-gold',        bg: 'bg-gold/10',        text: 'text-gold',        hex: 'hsl(43, 66%, 52%)' },
  success:     { border: 'border-l-success',     bg: 'bg-success/10',     text: 'text-success',     hex: 'hsl(160, 84%, 39%)' },
  warning:     { border: 'border-l-warning',     bg: 'bg-warning/10',     text: 'text-warning',     hex: 'hsl(38, 92%, 50%)' },
  destructive: { border: 'border-l-destructive', bg: 'bg-destructive/10', text: 'text-destructive', hex: 'hsl(0, 84%, 60%)' },
};

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: ColorKey;
  trend?: number;
  subtitle?: string;
  sparklineData?: { value: number }[];
}

export function KPICard({ title, value, icon, color = 'primary', trend, subtitle, sparklineData }: KPICardProps) {
  const c = colorMap[color];

  return (
    <div className={cn('bg-card rounded-2xl p-5 shadow-card border-l-4 relative overflow-hidden', c.border)}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {trend !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', trend >= 0 ? 'text-primary' : 'text-destructive')}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
              <span className="text-muted-foreground ml-1">vs prev</span>
            </div>
          )}
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-xl flex-shrink-0', c.bg)}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>
      {sparklineData && sparklineData.length > 1 && (
        <div className="absolute bottom-0 right-0 w-24 h-10 opacity-50">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <Area type="monotone" dataKey="value" stroke={c.hex} fill={c.hex} fillOpacity={0.2} strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
