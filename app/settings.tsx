import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { colors, darkColors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocale, type LocalePreference, type ThemePreference } from '@/localization';

type Selector = 'theme' | 'locale' | null;
const themes: ThemePreference[] = ['system', 'light', 'dark'];
const locales: LocalePreference[] = ['system', 'tr', 'en'];

export default function SettingsScreen() {
  const { loading: authLoading, session } = useAuth();
  const preferences = useLocale();
  const [selector, setSelector] = useState<Selector>(null);
  const palette = preferences.colorScheme === 'dark' ? darkColors : colors;
  const messages = preferences.messages.settings;
  const disabled = preferences.preferencesLoading || preferences.preferencesSaving;
  const themeValue = preferences.theme === 'system'
    ? `${messages.system} (${preferences.systemColorScheme === 'dark' ? messages.dark : messages.light})`
    : messages[preferences.theme];
  const localeValue = preferences.localePreference === 'system'
    ? `${messages.systemLanguage} (${preferences.systemLocale === 'tr' ? messages.turkish : messages.english})`
    : preferences.localePreference === 'tr' ? messages.turkish : messages.english;

  useEffect(() => {
    if (!authLoading && !session) router.replace('/sign-in');
  }, [authLoading, session]);
  useFocusEffect(useCallback(() => {
    if (session?.access_token) void preferences.reloadPreferences();
  }, [preferences.reloadPreferences, session?.access_token]));

  if (authLoading || !session || preferences.preferencesLoading) {
    return <Screen scroll={false}><View style={styles.center}><ActivityIndicator color={palette.sapphire} size="large" /><Text style={[styles.helper, { color: palette.muted }]}>{preferences.messages.common.loading}</Text></View></Screen>;
  }

  const chooseTheme = (value: ThemePreference) => {
    setSelector(null);
    void preferences.setTheme(value);
  };
  const chooseLocale = (value: LocalePreference) => {
    setSelector(null);
    void preferences.setLocalePreference(value);
  };

  return <Screen bottomPadding={24}>
    <View style={styles.header}>
      <Pressable accessibilityLabel={messages.back} accessibilityRole="button" hitSlop={8} onPress={() => router.back()} style={({ pressed }) => [styles.backButton, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.dimmed]}><Ionicons name="chevron-back" size={23} color={palette.navy} /></Pressable>
      <View style={styles.headerCopy}><Text style={[styles.title, { color: palette.navy }]}>{messages.title}</Text><Text style={[styles.subtitle, { color: palette.muted }]}>{messages.description}</Text></View>
    </View>

    {preferences.preferencesError ? <View accessibilityRole="alert" style={[styles.errorBanner, { backgroundColor: palette.surface, borderColor: palette.border }]}><Ionicons name="alert-circle-outline" size={19} color={colors.danger} /><Text style={[styles.errorText, { color: colors.danger }]}>{preferences.preferencesError === 'load' ? messages.loadError : messages.saveError}</Text><Pressable accessibilityRole="button" disabled={disabled} hitSlop={8} onPress={() => void preferences.reloadPreferences()}><Text style={[styles.retryText, { color: palette.sapphire }]}>{preferences.messages.common.retry}</Text></Pressable></View> : null}

    <Section title={messages.appearance} palette={palette}><NavigationRow disabled={disabled} label={messages.theme} value={themeValue} onPress={() => setSelector('theme')} palette={palette} /></Section>
    <Section title={messages.language} palette={palette}><NavigationRow disabled={disabled} label={messages.appLanguage} value={localeValue} onPress={() => setSelector('locale')} palette={palette} /></Section>
    <Section title={messages.privacy} palette={palette}>
      <Toggle disabled={disabled} label={messages.hideLastName} value={preferences.hideLastName} onChange={(value) => void preferences.setHideLastName(value)} palette={palette} />
      <Divider palette={palette} />
      <Toggle disabled={disabled} label={messages.autoAcceptGroupInvites} value={preferences.autoAcceptGroupInvites} onChange={(value) => void preferences.setAutoAcceptGroupInvites(value)} palette={palette} />
    </Section>
    <Section title={messages.account} palette={palette}><View style={styles.row}><Text style={[styles.text, { color: palette.navy }]}>{messages.accountStatus}</Text><Text accessibilityLabel={`${messages.accountStatus}: ${messages[preferences.accountStatus]}`} style={[styles.status, { backgroundColor: palette.sapphireSoft, color: palette.sapphire }]}>{messages[preferences.accountStatus]}</Text></View></Section>
    <Section title={messages.legal} palette={palette}>{[
      ['/legal/privacy', messages.privacyPolicy],
      ['/legal/terms', messages.terms],
      ['/legal/kvkk', messages.kvkk],
    ].map(([href, label], index) => <View key={href}>{index ? <Divider palette={palette} /> : null}<Pressable accessibilityRole="button" onPress={() => router.push(href as never)} style={styles.row}><Text style={[styles.link, { color: palette.navy }]}>{label}</Text><Ionicons name="chevron-forward" size={18} color={palette.muted} /></Pressable></View>)}</Section>

    {preferences.preferencesSaving ? <View accessibilityLiveRegion="polite" style={styles.saving}><ActivityIndicator color={palette.sapphire} size="small" /><Text style={[styles.helper, { color: palette.muted }]}>{messages.saving}</Text></View> : null}
    <SelectorModal selector={selector} close={() => setSelector(null)} disabled={disabled} palette={palette} messages={messages} localePreference={preferences.localePreference} theme={preferences.theme} chooseLocale={chooseLocale} chooseTheme={chooseTheme} />
  </Screen>;
}

function Section({ title, children, palette }: { title: string; children: React.ReactNode; palette: typeof colors | typeof darkColors }) {
  return <View style={styles.sectionWrap}><Text style={[styles.heading, { color: palette.muted }]}>{title}</Text><View style={[styles.section, { backgroundColor: palette.surface, borderColor: palette.border }]}>{children}</View></View>;
}

function NavigationRow({ label, value, onPress, disabled, palette }: { label: string; value: string; onPress: () => void; disabled: boolean; palette: typeof colors | typeof darkColors }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.row, (pressed || disabled) && styles.dimmed]}><Text style={[styles.text, { color: palette.navy }]}>{label}</Text><View style={styles.valueArea}><Text numberOfLines={1} style={[styles.value, { color: palette.muted }]}>{value}</Text><Ionicons name="chevron-forward" size={18} color={palette.muted} /></View></Pressable>;
}

function Toggle({ label, value, onChange, disabled, palette }: { label: string; value: boolean; onChange: (value: boolean) => void; disabled: boolean; palette: typeof colors | typeof darkColors }) {
  return <View style={styles.row}><Text style={[styles.toggleLabel, { color: palette.navy }]}>{label}</Text><Switch accessibilityLabel={label} disabled={disabled} value={value} onValueChange={onChange} trackColor={{ false: palette.border, true: palette.sapphireSoft }} thumbColor={value ? palette.sapphire : '#F4F4F4'} /></View>;
}

function Divider({ palette }: { palette: typeof colors | typeof darkColors }) {
  return <View style={[styles.divider, { backgroundColor: palette.border }]} />;
}

function SelectorModal({ selector, close, disabled, palette, messages, localePreference, theme, chooseLocale, chooseTheme }: { selector: Selector; close: () => void; disabled: boolean; palette: typeof colors | typeof darkColors; messages: ReturnType<typeof useLocale>['messages']['settings']; localePreference: LocalePreference; theme: ThemePreference; chooseLocale: (value: LocalePreference) => void; chooseTheme: (value: ThemePreference) => void }) {
  const isTheme = selector === 'theme';
  const options = isTheme ? themes : locales;
  return <Modal animationType="fade" onRequestClose={close} transparent visible={selector !== null}><Pressable accessibilityRole="button" accessibilityLabel={messages.close} onPress={close} style={styles.scrim}><Pressable accessibilityRole="none" onPress={() => undefined} style={[styles.modalCard, { backgroundColor: palette.surface, borderColor: palette.border }]}><View style={styles.modalHeader}><Text style={[styles.modalTitle, { color: palette.navy }]}>{isTheme ? messages.chooseTheme : messages.chooseLanguage}</Text><Pressable accessibilityLabel={messages.close} accessibilityRole="button" hitSlop={8} onPress={close}><Ionicons name="close" size={23} color={palette.muted} /></Pressable></View>{options.map((value) => {
    const selected = isTheme ? theme === value : localePreference === value;
    const label = isTheme ? messages[value as ThemePreference] : value === 'system' ? messages.systemLanguage : value === 'tr' ? messages.turkish : messages.english;
    return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} disabled={disabled} key={value} onPress={() => isTheme ? chooseTheme(value as ThemePreference) : chooseLocale(value as LocalePreference)} style={({ pressed }) => [styles.modalRow, pressed && styles.dimmed]}><Text style={[styles.text, { color: palette.navy }]}>{label}</Text>{selected ? <Ionicons name="checkmark" size={22} color={palette.sapphire} /> : null}</Pressable>;
  })}</Pressable></Pressable></Modal>;
}

const styles = StyleSheet.create({
  header: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 },
  backButton: { alignItems: 'center', borderRadius: 18, borderWidth: 1, height: 38, justifyContent: 'center', width: 38 },
  headerCopy: { flex: 1, gap: 2, paddingTop: 1 },
  title: { fontSize: 25, fontWeight: '900', lineHeight: 30 },
  subtitle: { fontSize: 14, lineHeight: 19 },
  sectionWrap: { gap: 6 },
  section: { borderRadius: 15, borderWidth: 1, overflow: 'hidden', paddingHorizontal: 13 },
  heading: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, paddingLeft: 3, textTransform: 'uppercase' },
  row: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between', minHeight: 48 },
  text: { flex: 1, fontSize: 15.5, lineHeight: 21 },
  toggleLabel: { flex: 1, fontSize: 15, lineHeight: 20 },
  valueArea: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 3, justifyContent: 'flex-end', maxWidth: '62%' },
  value: { flexShrink: 1, fontSize: 14, textAlign: 'right' },
  link: { flex: 1, fontSize: 15, fontWeight: '600' },
  divider: { height: StyleSheet.hairlineWidth },
  status: { borderRadius: 99, fontSize: 13, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  center: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center' },
  helper: { fontSize: 13.5, lineHeight: 18 },
  errorBanner: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, minHeight: 44, paddingHorizontal: 11, paddingVertical: 7 },
  errorText: { flex: 1, fontSize: 13, lineHeight: 17 },
  retryText: { fontSize: 13, fontWeight: '800' },
  saving: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 36 },
  dimmed: { opacity: 0.55 },
  scrim: { backgroundColor: 'rgba(4, 12, 28, 0.48)', flex: 1, justifyContent: 'flex-end', padding: 14 },
  modalCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 44 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  modalRow: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 50 },
});
