import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VapiStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  loading: boolean;
}

export function useVapiStatus() {
  const [status, setStatus] = useState<VapiStatus>({
    connected: false,
    lastSyncedAt: null,
    loading: true,
  });

  const fetchStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus({ connected: false, lastSyncedAt: null, loading: false });
        return;
      }

      const response = await supabase.functions.invoke('vapi-status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.data?.ok) {
        setStatus({
          connected: response.data.connected,
          lastSyncedAt: response.data.last_synced_at,
          loading: false,
        });
      } else {
        setStatus({ connected: false, lastSyncedAt: null, loading: false });
      }
    } catch (error) {
      console.error('Error fetching Vapi status:', error);
      setStatus({ connected: false, lastSyncedAt: null, loading: false });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { ...status, refetch: fetchStatus };
}
