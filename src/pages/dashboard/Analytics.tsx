import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Analytics</h1>
      <div className="glass-card rounded-xl p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Analytics will populate as calls come in</p>
      </div>
    </div>
  );
}
