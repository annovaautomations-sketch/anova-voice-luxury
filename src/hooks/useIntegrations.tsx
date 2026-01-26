import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useCustomAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Integration = Database['public']['Tables']['integrations']['Row'];
type IntegrationProvider = Database['public']['Enums']['integration_provider'];

export function useIntegrations() {
  const { user, isOwnerOrAdmin } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    if (!user?.tenant_id) return;

    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('tenant_id', user.tenant_id);

      if (error) throw error;
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.tenant_id) {
      fetchIntegrations();
    }
  }, [user?.tenant_id]);

  const getIntegration = (provider: IntegrationProvider): Integration | undefined => {
    return integrations.find((i) => i.provider === provider);
  };

  const isConnected = (provider: IntegrationProvider): boolean => {
    const integration = getIntegration(provider);
    return integration?.status === 'connected';
  };

  const connectIntegration = async (provider: IntegrationProvider, apiKey: string, webhookSecret?: string) => {
    if (!user?.tenant_id || !isOwnerOrAdmin) {
      toast.error('You do not have permission to manage integrations');
      return false;
    }

    try {
      const existing = getIntegration(provider);

      if (existing) {
        // Update existing integration
        const { error } = await supabase
          .from('integrations')
          .update({
            api_key_encrypted: apiKey, // In production, encrypt this on the server
            webhook_secret_encrypted: webhookSecret,
            status: 'connected',
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new integration
        const { error } = await supabase.from('integrations').insert({
          tenant_id: user.tenant_id,
          provider,
          api_key_encrypted: apiKey,
          webhook_secret_encrypted: webhookSecret,
          status: 'connected',
        });

        if (error) throw error;
      }

      await fetchIntegrations();
      toast.success(`${provider} connected successfully`);
      return true;
    } catch (error) {
      console.error('Error connecting integration:', error);
      toast.error('Failed to connect integration');
      return false;
    }
  };

  const disconnectIntegration = async (provider: IntegrationProvider) => {
    if (!user?.tenant_id || !isOwnerOrAdmin) {
      toast.error('You do not have permission to manage integrations');
      return false;
    }

    try {
      const integration = getIntegration(provider);
      if (!integration) return false;

      const { error } = await supabase
        .from('integrations')
        .update({
          status: 'disconnected',
          api_key_encrypted: null,
          webhook_secret_encrypted: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      if (error) throw error;

      await fetchIntegrations();
      toast.success(`${provider} disconnected`);
      return true;
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      toast.error('Failed to disconnect integration');
      return false;
    }
  };

  return {
    integrations,
    loading,
    getIntegration,
    isConnected,
    connectIntegration,
    disconnectIntegration,
    refetch: fetchIntegrations,
  };
}
