import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired' | 'no_subscription';
  isExpired: boolean;
  hasAccess: boolean;
  loading: boolean;
}

export const useSubscriptionStatus = (businessId?: string) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    status: 'no_subscription',
    isExpired: false,
    hasAccess: false,
    loading: true
  });

  useEffect(() => {
    if (!businessId) {
      setSubscriptionStatus({
        status: 'no_subscription',
        isExpired: false,
        hasAccess: true,
        loading: false
      });
      return;
    }

    checkSubscriptionStatus();
  }, [businessId]);

  const checkSubscriptionStatus = async () => {
    try {
      setSubscriptionStatus(prev => ({ ...prev, loading: true }));

      // Abonelik durumunu kontrol et
      const { data: statusData, error: statusError } = await supabase
        .rpc('get_subscription_status', { business_uuid: businessId });

      if (statusError) {
        console.error('Subscription status error:', statusError);
        setSubscriptionStatus({
          status: 'no_subscription',
          isExpired: true,
          hasAccess: false,
          loading: false
        });
        return;
      }

      const status = statusData || 'no_subscription';
      const isExpired = status === 'expired' || status === 'no_subscription';
      const hasAccess = status === 'trial' || status === 'active';

      setSubscriptionStatus({
        status,
        isExpired,
        hasAccess,
        loading: false
      });

    } catch (error) {
      console.error('Error checking subscription status:', error);
      setSubscriptionStatus({
        status: 'no_subscription',
        isExpired: true,
        hasAccess: false,
        loading: false
      });
    }
  };

  return {
    ...subscriptionStatus,
    refresh: checkSubscriptionStatus
  };
};
