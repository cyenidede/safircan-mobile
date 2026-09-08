import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import { Appearance, AppState } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPreferences, savePreferences } from '@/features/settings/api';
import {
  defaultUserPreferences,
  resolveLocale,
  resolveTheme,
  type ActiveLocale,
  type LocalePreference,
  type ThemePreference,
  type UserPreferences,
} from '@/features/settings/domain';
import tr from './messages/tr';
import en from './messages/en';
import { colors, darkColors } from '@/constants/theme';

export const supportedLocales = ['tr', 'en', 'ar', 'es', 'de', 'fr', 'el'] as const;
export type AppLocale = typeof supportedLocales[number];
export type { ActiveLocale, LocalePreference, ThemePreference } from '@/features/settings/domain';

type Messages = { [K in keyof typeof tr]: { [P in keyof (typeof tr)[K]]: string } };
const catalogs: Record<ActiveLocale, Messages> = { tr, en };
const storageKey = 'safircan.preferences.v1';

export function detectSystemLocale(): ActiveLocale {
  const language = Intl.DateTimeFormat().resolvedOptions().locale.split('-')[0]?.toLowerCase();
  return language === 'tr' ? 'tr' : 'en';
}

function normalizedScheme(value: ReturnType<typeof Appearance.getColorScheme>): 'light' | 'dark' | null {
  return value === 'dark' ? 'dark' : value === 'light' ? 'light' : null;
}

type PreferenceError = 'load' | 'save' | null;
type Value = UserPreferences & {
  locale: ActiveLocale;
  localePreference: LocalePreference;
  messages: Messages;
  colorScheme: 'light' | 'dark';
  systemLocale: ActiveLocale;
  systemColorScheme: 'light' | 'dark';
  preferencesLoading: boolean;
  preferencesSaving: boolean;
  preferencesError: PreferenceError;
  reloadPreferences: () => Promise<void>;
  setLocalePreference: (value: LocalePreference) => Promise<boolean>;
  setTheme: (value: ThemePreference) => Promise<boolean>;
  setHideLastName: (value: boolean) => Promise<boolean>;
  setAutoAcceptGroupInvites: (value: boolean) => Promise<boolean>;
};

const Context = createContext<Value | null>(null);

function readCachedPreferences(raw: string | null): UserPreferences | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<UserPreferences>;
    if ((value.localeSource !== 'system' && value.localeSource !== 'manual') ||
        (value.theme !== 'system' && value.theme !== 'light' && value.theme !== 'dark') ||
        typeof value.hideLastName !== 'boolean' || typeof value.autoAcceptGroupInvites !== 'boolean' ||
        (value.accountStatus !== 'active' && value.accountStatus !== 'suspended' && value.accountStatus !== 'deletion_pending')) return null;
    const preferredLocale = value.preferredLocale === 'tr' || value.preferredLocale === 'en' ? value.preferredLocale : null;
    if (value.localeSource === 'manual' && !preferredLocale) return null;
    return {
      preferredLocale: value.localeSource === 'system' ? null : preferredLocale,
      localeSource: value.localeSource,
      theme: value.theme,
      hideLastName: value.hideLastName,
      autoAcceptGroupInvites: value.autoAcceptGroupInvites,
      accountStatus: value.accountStatus,
    };
  } catch {
    return null;
  }
}

export function LocaleProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences);
  const [cacheReady, setCacheReady] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState<PreferenceError>(null);
  const [systemScheme, setSystemScheme] = useState<'light' | 'dark' | null>(normalizedScheme(Appearance.getColorScheme()));
  const [systemLocale, setSystemLocale] = useState<ActiveLocale>(detectSystemLocale());
  const stateRef = useRef(preferences);
  const savingRef = useRef(false);
  const loadGeneration = useRef(0);

  useEffect(() => { stateRef.current = preferences; }, [preferences]);
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(normalizedScheme(colorScheme)));
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setSystemLocale(detectSystemLocale());
      setSystemScheme(normalizedScheme(Appearance.getColorScheme()));
    });
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey).then((raw) => {
      const cached = readCachedPreferences(raw);
      if (active && cached) setPreferences(cached);
    }).finally(() => { if (active) setCacheReady(true); });
    return () => { active = false; };
  }, []);

  const reloadPreferences = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setPreferencesLoading(false);
      return;
    }
    const generation = ++loadGeneration.current;
    setPreferencesLoading(true);
    setPreferencesError(null);
    try {
      const next = await getPreferences(token);
      if (generation !== loadGeneration.current) return;
      setPreferences(next);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      if (generation === loadGeneration.current) setPreferencesError('load');
    } finally {
      if (generation === loadGeneration.current) setPreferencesLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!cacheReady) return;
    if (!session?.access_token) {
      loadGeneration.current += 1;
      setPreferencesLoading(false);
      return;
    }
    void reloadPreferences();
  }, [cacheReady, reloadPreferences, session?.access_token]);

  const persist = useCallback(async (createNext: (current: UserPreferences) => UserPreferences) => {
    const token = session?.access_token;
    if (!token || savingRef.current) return false;
    savingRef.current = true;
    setPreferencesSaving(true);
    setPreferencesError(null);
    const previous = stateRef.current;
    const next = createNext(previous);
    stateRef.current = next;
    setPreferences(next);
    try {
      await savePreferences(token, next);
      await AsyncStorage.setItem(storageKey, JSON.stringify(next));
      return true;
    } catch {
      stateRef.current = previous;
      setPreferences(previous);
      await AsyncStorage.setItem(storageKey, JSON.stringify(previous)).catch(() => undefined);
      setPreferencesError('save');
      return false;
    } finally {
      savingRef.current = false;
      setPreferencesSaving(false);
    }
  }, [session?.access_token]);

  const resolvedSystemScheme = systemScheme === 'dark' ? 'dark' : 'light';
  const locale = resolveLocale(preferences.localeSource, preferences.preferredLocale, systemLocale);
  const localePreference: LocalePreference = preferences.localeSource === 'system'
    ? 'system'
    : preferences.preferredLocale ?? 'system';

  const value = useMemo<Value>(() => ({
    ...preferences,
    locale,
    localePreference,
    systemLocale,
    systemColorScheme: resolvedSystemScheme,
    messages: catalogs[locale],
    colorScheme: resolveTheme(preferences.theme, resolvedSystemScheme),
    preferencesLoading,
    preferencesSaving,
    preferencesError,
    reloadPreferences,
    setLocalePreference: (next) => persist((current) => ({
      ...current,
      localeSource: next === 'system' ? 'system' : 'manual',
      preferredLocale: next === 'system' ? null : next,
    })),
    setTheme: (theme) => persist((current) => ({ ...current, theme })),
    setHideLastName: (hideLastName) => persist((current) => ({ ...current, hideLastName })),
    setAutoAcceptGroupInvites: (autoAcceptGroupInvites) => persist((current) => ({ ...current, autoAcceptGroupInvites })),
  }), [locale, localePreference, persist, preferences, preferencesError, preferencesLoading, preferencesSaving, reloadPreferences, resolvedSystemScheme, systemLocale]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLocale() {
  const value = useContext(Context);
  if (!value) throw new Error('useLocale must be used within LocaleProvider');
  return value;
}

export function usePalette() {
  const { colorScheme } = useLocale();
  return colorScheme === 'dark' ? darkColors : colors;
}

export function formatDate(value: Date | string, locale: ActiveLocale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(locale === 'tr' ? 'tr-TR' : 'en-US', options).format(new Date(value));
}

export function formatNumber(value: number, locale: ActiveLocale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(locale === 'tr' ? 'tr-TR' : 'en-US', options).format(value);
}
