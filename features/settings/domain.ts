export type ActiveLocale = 'tr' | 'en';
export type LocaleSource = 'system' | 'manual';
export type LocalePreference = 'system' | ActiveLocale;
export type ThemePreference = 'system' | 'light' | 'dark';
export type AccountStatus = 'active' | 'suspended' | 'deletion_pending';

export type UserPreferences = {
  preferredLocale: ActiveLocale | null;
  localeSource: LocaleSource;
  theme: ThemePreference;
  hideLastName: boolean;
  autoAcceptGroupInvites: boolean;
  accountStatus: AccountStatus;
};

export const defaultUserPreferences: UserPreferences = {
  preferredLocale: null,
  localeSource: 'system',
  theme: 'system',
  hideLastName: false,
  autoAcceptGroupInvites: false,
  accountStatus: 'active',
};

export function resolveLocale(localeSource: LocaleSource, preferredLocale: ActiveLocale | null, systemLocale: ActiveLocale): ActiveLocale {
  return localeSource === 'manual' && preferredLocale ? preferredLocale : systemLocale;
}

export function resolveTheme(theme: ThemePreference, systemScheme: 'light' | 'dark'): 'light' | 'dark' {
  return theme === 'system' ? systemScheme : theme;
}

export type PreferencesApiRow = {
  preferred_locale: string | null;
  locale_source: string;
  theme: string;
  hide_last_name: unknown;
  auto_accept_group_invites: unknown;
  account_status: string;
};

export function deserializePreferences(row: PreferencesApiRow): UserPreferences | null {
  const preferredLocale = row.preferred_locale === 'tr' || row.preferred_locale === 'en' ? row.preferred_locale : null;
  if (row.locale_source !== 'system' && row.locale_source !== 'manual') return null;
  if (row.locale_source === 'manual' && !preferredLocale) return null;
  if (row.theme !== 'system' && row.theme !== 'light' && row.theme !== 'dark') return null;
  if (typeof row.hide_last_name !== 'boolean' || typeof row.auto_accept_group_invites !== 'boolean') return null;
  if (row.account_status !== 'active' && row.account_status !== 'suspended' && row.account_status !== 'deletion_pending') return null;
  return {
    preferredLocale: row.locale_source === 'system' ? null : preferredLocale,
    localeSource: row.locale_source,
    theme: row.theme,
    hideLastName: row.hide_last_name,
    autoAcceptGroupInvites: row.auto_accept_group_invites,
    accountStatus: row.account_status,
  };
}

export function serializePreferences(preferences: UserPreferences) {
  return {
    preferred_locale: preferences.localeSource === 'system' ? null : preferences.preferredLocale,
    locale_source: preferences.localeSource,
    theme: preferences.theme,
    hide_last_name: preferences.hideLastName,
    auto_accept_group_invites: preferences.autoAcceptGroupInvites,
  };
}
