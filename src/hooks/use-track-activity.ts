import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';

export const useTrackActivity = () => {
  const { user } = useAuth();

  const trackView = useCallback(async (productId: string) => {
    if (!user) return;
    await supabase.from('user_activity' as any).insert({
      user_id: user.id,
      product_id: productId,
      event_type: 'view',
    });
  }, [user]);

  const trackClick = useCallback(async (productId: string, linkUrl: string, linkText: string) => {
    if (!user) return;
    await supabase.from('user_activity' as any).insert({
      user_id: user.id,
      product_id: productId,
      event_type: 'click',
      link_url: linkUrl,
      link_text: linkText,
    });
  }, [user]);

  return { trackView, trackClick };
};
