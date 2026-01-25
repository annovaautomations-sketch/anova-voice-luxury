import { Hash } from 'lucide-react';

export default function Numbers() {
  return (
    <div className="space-y-6 fade-in">
      <h1 className="text-2xl font-bold">Phone Numbers</h1>
      <div className="glass-card rounded-xl p-8 text-center">
        <Hash className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Connect Vapi to sync your phone numbers</p>
      </div>
    </div>
  );
}
