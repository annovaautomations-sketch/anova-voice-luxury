import { useCallback } from 'react';
import { useAuth } from '@/hooks/useCustomAuth';

interface FetchOptions {
  limit?: number;
  startDate?: string;
  endDate?: string;
  id?: string;
}

function getBaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL;
}

export function useDataFetcher() {
  const { sessionId } = useAuth();

  const authedFetch = useCallback(async (fnName: string, params?: URLSearchParams) => {
    if (!sessionId) return { ok: false, message: 'Not authenticated' };
    const url = `${getBaseUrl()}/functions/v1/${fnName}${params ? `?${params}` : ''}`;
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'x-session-id': sessionId, 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (error) {
      console.error(`Error fetching ${fnName}:`, error);
      return { ok: false, message: `Failed to fetch ${fnName}` };
    }
  }, [sessionId]);

  const fetchCalls = useCallback(async (options: FetchOptions = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.startDate) params.set('startDate', options.startDate);
    if (options.endDate) params.set('endDate', options.endDate);
    if (options.id) params.set('id', options.id);
    return authedFetch('data-calls', params);
  }, [authedFetch]);

  const fetchCall = useCallback(async (callId: string) => {
    const params = new URLSearchParams({ id: callId });
    return authedFetch('data-calls', params);
  }, [authedFetch]);

  const fetchIntegrations = useCallback(async () => {
    return authedFetch('data-integrations');
  }, [authedFetch]);

  const fetchLeads = useCallback(async () => {
    return authedFetch('data-leads');
  }, [authedFetch]);

  const fetchAppointments = useCallback(async () => {
    return authedFetch('data-appointments');
  }, [authedFetch]);

  const syncVapiCalls = useCallback(async (days: number = 7) => {
    if (!sessionId) return { ok: false, message: 'Not authenticated' };
    const url = `${getBaseUrl()}/functions/v1/vapi-sync-calls`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'x-session-id': sessionId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      return await res.json();
    } catch (error) {
      console.error('Error syncing calls:', error);
      return { ok: false, message: 'Failed to sync calls' };
    }
  }, [sessionId]);

  return { fetchCalls, fetchCall, fetchIntegrations, fetchLeads, fetchAppointments, syncVapiCalls };
}
