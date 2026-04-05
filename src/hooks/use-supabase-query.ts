import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to handle Supabase query errors with automatic JWT refresh
 * Wraps any Supabase query to automatically retry if JWT has expired
 */
export const useSupabaseQuery = () => {
  const { refreshToken } = useAuth();

  const executeQuery = async <T,>(
    queryFn: () => Promise<{ data: T | null; error: any }>
  ): Promise<{ data: T | null; error: any }> => {
    try {
      const result = await queryFn();

      // Check if error is JWT related
      if (result.error?.message?.includes('JWT') || result.error?.message?.includes('expired')) {
        console.warn('[useSupabaseQuery] JWT error detected, attempting to refresh token');
        
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the query after token refresh
          console.debug('[useSupabaseQuery] Token refreshed, retrying query');
          return queryFn();
        } else {
          // Refresh failed, return original error
          return result;
        }
      }

      return result;
    } catch (err) {
      console.error('[useSupabaseQuery] Query execution error:', err);
      return { data: null, error: err };
    }
  };

  return { executeQuery };
};
