import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook to subscribe to real-time product changes
 * Listens for INSERT, UPDATE, DELETE events on products table
 */
export const useProductSubscription = (
  onProductsChange: () => void | Promise<void>
) => {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isSubscribedRef = useRef(false);

  const subscribe = useCallback(() => {
    if (isSubscribedRef.current) {
      console.log('[useProductSubscription] Already subscribed, skipping');
      return;
    }

    try {
      const channel = supabase
        .channel('products-changes', {
          config: {
            broadcast: { self: true },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'products',
          },
          async (payload) => {
            console.log('[useProductSubscription] Product change detected:', payload.eventType);
            await onProductsChange();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'product_features',
          },
          async (payload) => {
            console.log('[useProductSubscription] Product features change detected');
            await onProductsChange();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'product_integrations',
          },
          async (payload) => {
            console.log('[useProductSubscription] Product integrations change detected');
            await onProductsChange();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'product_links',
          },
          async (payload) => {
            console.log('[useProductSubscription] Product links change detected');
            await onProductsChange();
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[useProductSubscription] Successfully subscribed to product changes');
            isSubscribedRef.current = true;
          } else if (status === 'CLOSED') {
            console.log('[useProductSubscription] Subscription closed');
            isSubscribedRef.current = false;
          }
        });

      channelRef.current = channel;
    } catch (err) {
      console.error('[useProductSubscription] Failed to subscribe:', err);
    }
  }, [onProductsChange]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
      console.log('[useProductSubscription] Unsubscribed from product changes');
    }
  }, []);

  useEffect(() => {
    subscribe();

    return () => {
      unsubscribe();
    };
  }, [subscribe, unsubscribe]);

  return { subscribe, unsubscribe };
};
