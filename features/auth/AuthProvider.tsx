import type { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { getAuthErrorMessage } from './auth-errors';

type AuthActionResult = { ok: true; requiresEmailVerification?: boolean } | { ok: false; message: string };

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (input: { firstName: string; lastName: string; email: string; password: string }) => Promise<AuthActionResult>;
  signIn: (input: { email: string; password: string }) => Promise<AuthActionResult>;
  signOut: () => Promise<AuthActionResult>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const configurationError = 'Supabase public yapılandırması eksik. Mobil .env dosyasını kontrol et.';

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    }).finally(() => {
      if (active) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    session,
    user: session?.user ?? null,
    loading,
    signUp: async ({ firstName, lastName, email, password }) => {
      if (!supabase) return { ok: false, message: configurationError };
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { first_name: firstName.trim(), last_name: lastName.trim() } },
        });
        if (error) return { ok: false, message: getAuthErrorMessage(error) };
        return { ok: true, requiresEmailVerification: !data.session };
      } catch (error) {
        return { ok: false, message: getAuthErrorMessage(error) };
      }
    },
    signIn: async ({ email, password }) => {
      if (!supabase) return { ok: false, message: configurationError };
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        return error ? { ok: false, message: getAuthErrorMessage(error) } : { ok: true };
      } catch (error) {
        return { ok: false, message: getAuthErrorMessage(error) };
      }
    },
    signOut: async () => {
      if (!supabase) return { ok: false, message: configurationError };
      try {
        const { error } = await supabase.auth.signOut();
        return error ? { ok: false, message: getAuthErrorMessage(error) } : { ok: true };
      } catch (error) {
        return { ok: false, message: getAuthErrorMessage(error) };
      }
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
