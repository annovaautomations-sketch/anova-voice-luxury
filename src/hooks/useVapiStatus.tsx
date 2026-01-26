import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';

interface VapiStatus {
  connected: boolean;
  lastSyncedAt: string | null;
  loading: boolean;
}

export function useVapiStatus() {
  const { sessionId } = useAuth();
  const [status, setStatus] = useState<VapiStatus>({
    connected: false,
    lastSyncedAt: null,
    loading: true,
  });

  const fetchStatus = useCallback(async () => {
    if (!sessionId) {
      setStatus({ connected: false, lastSyncedAt: null, loading: false });
      return;
    }
    
    setStatus(prev => ({ ...prev, loading: true }));
    try {
      const response = await supabase.functions.invoke('vapi-status', {
        headers: { 'x-session-id': sessionId },
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
  }, [sessionId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { ...status, refetch: fetchStatus };
}
