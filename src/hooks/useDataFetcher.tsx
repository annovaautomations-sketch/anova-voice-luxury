import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';

interface FetchOptions {
  limit?: number;
  startDate?: string;
  endDate?: string;
  id?: string;
}

export function useDataFetcher() {
  const { sessionId } = useAuth();

  const fetchCalls = useCallback(async (options: FetchOptions = {}) => {
    if (!sessionId) {
      console.error('No session ID available');
      return { ok: false, calls: [], message: 'Not authenticated' };
    }

    try {
      const params = new URLSearchParams();
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.startDate) params.set('startDate', options.startDate);
      if (options.endDate) params.set('endDate', options.endDate);
      if (options.id) params.set('id', options.id);

      const response = await supabase.functions.invoke('data-calls', {
        headers: { 'x-session-id': sessionId },
        body: null,
        method: 'GET',
      });

      // Handle query params by using the full URL approach
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const fullUrl = `${supabaseUrl}/functions/v1/data-calls?${params.toString()}`;
      
      const fetchResponse = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
      });

      const data = await fetchResponse.json();
      return data;
    } catch (error) {
      console.error('Error fetching calls:', error);
      return { ok: false, calls: [], message: 'Failed to fetch calls' };
    }
  }, [sessionId]);

  const fetchCall = useCallback(async (callId: string) => {
    if (!sessionId) {
      return { ok: false, call: null, message: 'Not authenticated' };
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const fullUrl = `${supabaseUrl}/functions/v1/data-calls?id=${callId}`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching call:', error);
      return { ok: false, call: null, message: 'Failed to fetch call' };
    }
  }, [sessionId]);

  const fetchIntegrations = useCallback(async () => {
    if (!sessionId) {
      return { ok: false, integrations: [], message: 'Not authenticated' };
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const fullUrl = `${supabaseUrl}/functions/v1/data-integrations`;
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'x-session-id': sessionId,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching integrations:', error);
      return { ok: false, integrations: [], message: 'Failed to fetch integrations' };
    }
  }, [sessionId]);

  const syncVapiCalls = useCallback(async (days: number = 7) => {
    if (!sessionId) {
      return { ok: false, message: 'Not authenticated' };
    }

    try {
      const response = await supabase.functions.invoke('vapi-sync-calls', {
        body: { days },
        headers: { 'x-session-id': sessionId },
      });

      return response.data;
    } catch (error) {
      console.error('Error syncing calls:', error);
      return { ok: false, message: 'Failed to sync calls' };
    }
  }, [sessionId]);

  return {
    fetchCalls,
    fetchCall,
    fetchIntegrations,
    syncVapiCalls,
  };
}
