import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';
import { toast } from 'sonner';

interface Integration {
  id: string;
  provider: 'vapi' | 'google_calendar' | 'openai' | 'elevenlabs' | 'twilio';
  status: 'connected' | 'disconnected';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useIntegrations() {
  const { sessionId, isOwnerOrAdmin } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = useCallback(async () => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/data-integrations`, {
        method: 'GET',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.ok) {
        setIntegrations(data.integrations || []);
      } else {
        console.error('Failed to fetch integrations:', data.message);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const getIntegration = (provider: Integration['provider']): Integration | undefined => {
    return integrations.find((i) => i.provider === provider);
  };

  const isConnected = (provider: Integration['provider']): boolean => {
    const integration = getIntegration(provider);
    return integration?.status === 'connected';
  };

  return {
    integrations,
    loading,
    getIntegration,
    isConnected,
    refetch: fetchIntegrations,
  };
}
