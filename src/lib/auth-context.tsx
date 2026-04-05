import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'brand' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  fullName: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'brand' | 'user') => Promise<{ user: User | null; session: Session | null }>;
  signIn: (email: string, password: string) => Promise<void>;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  signOut: () => Promise<void>;  refreshToken: () => Promise<boolean>;}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();
    setRole(data?.role ?? null);
  };

  // Ensure reset/signup email links point to your app domain instead of any 3rd-party boilerplate URL
  const AUTH_REDIRECT_URL = `${window.location.origin}/auth`;

  useEffect(() => {
    // Handle token refresh errors
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.debug('[auth-context] Auth state changed:', event);
      
      // Handle token refresh or recovery
      if (event === 'TOKEN_REFRESHED') {
        console.debug('[auth-context] Token refreshed successfully');
      } else if (event === 'SIGNED_OUT' || !session) {
        setSession(null);
        setUser(null);
        setRole(null);
        setFullName(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      setFullName(session?.user?.user_metadata?.full_name ?? null);
      if (session?.user) {
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Attempt to refresh token on app load
        supabase.auth.refreshSession().catch(err => {
          console.debug('[auth-context] Token refresh failed:', err);
        });
      }
      setSession(session);
      setUser(session?.user ?? null);
      setFullName(session?.user?.user_metadata?.full_name ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: 'brand' | 'user') => {
    // routes user to your app domain after confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: AUTH_REDIRECT_URL,
      },
    });
    if (error) throw error;
    return { user: data.user, session: data.session };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // Temporarily disable OTP-based magic-link email for forgot-password (per request)
  const sendOtp = async (email: string) => {
    // no-op: do not send OTP link for now
    console.info('[auth-context] sendOtp is disabled for now:', email);
    return;
    // If you want to re-enable, uncomment:
    // const { error } = await supabase.auth.signInWithOtp({
    //   email,
    //   options: { emailRedirectTo: AUTH_REDIRECT_URL },
    // });
    // if (error) throw error;
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw error;
  };

  const updateProfile = async (name: string) => {
    if (!user) throw new Error('Not authenticated');

    const trimmedName = name.trim();
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });
    if (error) throw error;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: trimmedName, updated_at: new Date().toISOString() })
      .eq('user_id', user.id);
    if (profileError) throw profileError;

    setUser(data.user ?? user);
    setFullName(trimmedName);
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('[auth-context] Token refresh failed:', error);
        // If refresh fails, sign out the user
        await signOut();
        return false;
      }
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
        console.debug('[auth-context] Token refreshed successfully');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[auth-context] Token refresh exception:', err);
      await signOut();
      return false;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, fullName, loading, signUp, signIn, sendOtp, verifyOtp, updateProfile, updatePassword, signOut, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
};
