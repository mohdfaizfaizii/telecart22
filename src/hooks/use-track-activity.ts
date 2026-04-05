import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

// Utility function to check if a UUID is valid
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

export const useTrackActivity = () => {
  const { user } = useAuth();

  const trackView = useCallback(async (productId: string) => {
    if (!user || !isValidUUID(productId)) return;
    try {
      await supabase.from('user_activity' as any).insert({
        user_id: user.id,
        product_id: productId,
        event_type: 'view',
      });
    } catch (error: any) {
      // Handle JWT expired errors gracefully
      if (error?.message?.includes('JWT') || error?.message?.includes('expired')) {
        console.debug('[useTrackActivity] JWT expired, skipping activity tracking');
      } else {
        console.debug('Failed to track view:', error);
      }
    }
  }, [user]);

  const trackClick = useCallback(async (productId: string, linkUrl: string, linkText: string) => {
    if (!user || !isValidUUID(productId)) return;
    try {
      await supabase.from('user_activity' as any).insert({
        user_id: user.id,
        product_id: productId,
        event_type: 'click',
        link_url: linkUrl,
        link_text: linkText,
      });
    } catch (error: any) {
      // Handle JWT expired errors gracefully
      if (error?.message?.includes('JWT') || error?.message?.includes('expired')) {
        console.debug('[useTrackActivity] JWT expired, skipping activity tracking');
      } else {
        console.debug('Failed to track click:', error);
      }
    }
  }, [user]);

  return { trackView, trackClick };
};
