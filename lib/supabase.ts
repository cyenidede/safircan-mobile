import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

type SupabaseStorage = {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
};

// Expo Router route discovery can evaluate this module in Node. Using the
// AsyncStorage web implementation there reaches for `window`, so SSR gets a
// deliberately non-persistent adapter. It must never retain one request's
// session for a later request.
const serverStorage: SupabaseStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

const browserStorage: SupabaseStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') return null;
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(key, value); } catch { /* Storage can be unavailable in privacy mode. */ }
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.removeItem(key); } catch { /* Storage can be unavailable in privacy mode. */ }
  },
};

const authStorage: SupabaseStorage = Platform.OS === 'web'
  ? (typeof window === 'undefined' ? serverStorage : browserStorage)
  : AsyncStorage;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
