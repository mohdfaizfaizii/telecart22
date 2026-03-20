import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';

export const useLoginGuard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const requireAuth = useCallback(
    (callback?: () => void) => {
      if (!user) {
        const redirectPath = location.pathname + location.search;
        navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
        return false;
      }
      callback?.();
      return true;
    },
    [user, navigate, location]
  );

  const guardedHref = useCallback(
    (url: string) => {
      if (!user && !url.startsWith('http')) {
        return `/auth?redirect=${encodeURIComponent(url)}`;
      }
      return url;
    },
    [user]
  );

  return { isAuthenticated: !!user, requireAuth, guardedHref };
};
