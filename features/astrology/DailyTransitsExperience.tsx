import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useLocale, usePalette } from '@/localization';
import { useAuth } from '@/features/auth/AuthProvider';
import { getDailyTransits, type DailyTransitsResponse } from './api/daily-transits';
import { resolveCurrentBirthProfile, type CurrentBirthInput } from './birthInputStorage';
import { dominantTransitTheme, formatTransitDate, presentTransit } from './transitPresentation';

type ViewState = 'loading' | 'profile-missing' | 'time-missing' | 'error' | 'ready';

export function DailyTransitsExperience() {
  const {messages}=useLocale(); const palette=usePalette(); const m=messages.dailyTransits;
  const { loading: authLoading, session } = useAuth();
  const [state, setState] = useState<ViewState>('loading');
  const [profile, setProfile] = useState<CurrentBirthInput | null>(null);
  const [result, setResult] = useState<DailyTransitsResponse | null>(null);

  const load = useCallback(async () => {
    if (authLoading) return;
    setState('loading');
    try {
      const nextProfile = await resolveCurrentBirthProfile(session?.access_token);
      setProfile(nextProfile);
      if (!nextProfile?.birth_date || !nextProfile.birth_place) { setState('profile-missing'); return; }
      if (nextProfile.birth_time_unknown || !nextProfile.birth_time) { setState('time-missing'); return; }
      setResult(await getDailyTransits(nextProfile));
      setState('ready');
    } catch {
      setState('error');
    }
  }, [authLoading, session?.access_token]);

  useEffect(() => { void load(); }, [load]);

  return <Screen>
    <View style={styles.hero}><Text style={styles.eyebrow}>{m.eyebrow}</Text><Text style={[styles.title,{color:palette.navy}]}>{m.title}</Text><Text style={[styles.description,{color:palette.muted}]}>{m.description}</Text></View>
    {state === 'loading' ? <StateCard><ActivityIndicator color={colors.sapphire} size="large" /><Text style={styles.stateTitle}>Günlük transitlerin hazırlanıyor…</Text></StateCard> : null}
    {state === 'profile-missing' ? <StateCard><Text style={[styles.stateTitle,{color:palette.navy}]}>{m.required}</Text><Action label={messages.accessRequired.action} onPress={() => router.push({ pathname: '/birth-chart', params: { returnTo: '/daily-transits' } })} /></StateCard> : null}
    {state === 'time-missing' ? <StateCard><Text style={styles.stateTitle}>Kişisel günlük transitlerin için doğum saatine ihtiyaç var.</Text><Text style={styles.stateText}>Doğum saatini bilmiyorsan yaşam olaylarından hesaplama çalışmasını kullanabilirsin.</Text><Action label="DOĞUM SAATİMİ BUL" onPress={() => router.push('/rectification')} /></StateCard> : null}
    {state === 'error' ? <StateCard><Text style={styles.stateTitle}>Günlük transitlerin şu anda hazırlanamadı.</Text><Text style={styles.stateText}>Biraz sonra tekrar deneyebilirsin.</Text><Action label="TEKRAR DENE" onPress={() => void load()} /></StateCard> : null}
    {state === 'ready' && result ? <TransitResults result={result} rectificationTime={profile?.birth_time_source === 'rectification'} onRefresh={() => void load()} /> : null}
  </Screen>;
}

function TransitResults({ result, rectificationTime, onRefresh }: { result: DailyTransitsResponse; rectificationTime: boolean; onRefresh: () => void }) {
  const transits = result.transits.map(presentTransit);
  const supportive = transits.find((item) => item.tone === 'supportive');
  const challenging = transits.find((item) => item.tone === 'challenging');
  return <>
    <View style={styles.summaryCard}><Text style={styles.date}>{formatTransitDate(result.date).toLocaleUpperCase('tr-TR')}</Text><Text style={styles.summaryLabel}>GÜNÜN ANA TEMASI</Text><Text style={styles.summaryTitle}>{dominantTransitTheme(transits)}</Text>{rectificationTime ? <Text style={styles.profileNote}>Rektifikasyonla bulunan doğum saatin kullanıldı.</Text> : null}</View>
    {supportive || challenging ? <View style={styles.highlights}>{supportive ? <Highlight label="DESTEKLEYİCİ ETKİ" text={supportive.title} tone="supportive" /> : null}{challenging ? <Highlight label="DİKKAT EDİLMESİ GEREKEN ETKİ" text={challenging.title} tone="challenging" /> : null}</View> : null}
    <View style={styles.list}><Text style={styles.sectionTitle}>Öne Çıkan Kişisel Transitlerin</Text>{transits.map((item, index) => <View key={`${item.title}-${index}`} style={styles.transitCard}><Text style={styles.area}>{item.area}</Text><Text style={styles.transitTitle}>{item.title}</Text><Text style={styles.transitText}>{item.text}</Text></View>)}</View>
    <Pressable accessibilityRole="button" onPress={onRefresh} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}><Text style={styles.refreshText}>YENİDEN KONTROL ET</Text></Pressable>
  </>;
}

function StateCard({ children }: React.PropsWithChildren) { const palette=usePalette(); return <View style={[styles.stateCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>{children}</View>; }
function Action({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionText}>{label}</Text></Pressable>; }
function Highlight({ label, text, tone }: { label: string; text: string; tone: 'supportive' | 'challenging' }) { return <View style={[styles.highlight, tone === 'challenging' && styles.highlightWarning]}><Text style={[styles.highlightLabel, tone === 'challenging' && styles.highlightWarningText]}>{label}</Text><Text style={styles.highlightText}>{text}</Text></View>; }

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 9, paddingTop: 4 }, eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 }, title: { color: colors.navy, fontSize: 30, fontWeight: '800', lineHeight: 36, textAlign: 'center' }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 390, textAlign: 'center' },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 13, padding: 20 }, stateTitle: { color: colors.navy, fontSize: 18, fontWeight: '800', lineHeight: 25, textAlign: 'center' }, stateText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' }, action: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 15, justifyContent: 'center', minHeight: 52, paddingHorizontal: 20 }, actionText: { color: colors.white, fontSize: 15, fontWeight: '800', textAlign: 'center' },
  summaryCard: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 23, gap: 8, padding: 21 }, date: { color: '#C8DCF3', fontSize: 12, fontWeight: '800', letterSpacing: 0.8, textAlign: 'center' }, summaryLabel: { color: '#DCEAF8', fontSize: 12, fontWeight: '800', letterSpacing: 1 }, summaryTitle: { color: colors.white, fontSize: 24, fontWeight: '800', lineHeight: 30, textAlign: 'center' }, profileNote: { color: '#E7EFF9', fontSize: 13, lineHeight: 19, textAlign: 'center' },
  highlights: { gap: 9 }, highlight: { backgroundColor: '#E9F4E9', borderRadius: 16, gap: 5, padding: 14 }, highlightWarning: { backgroundColor: '#F8E8E8' }, highlightLabel: { color: '#39733C', fontSize: 11, fontWeight: '900', letterSpacing: 0.7 }, highlightWarningText: { color: colors.danger }, highlightText: { color: colors.navy, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  list: { gap: 10 }, sectionTitle: { color: colors.navy, fontSize: 21, fontWeight: '800', lineHeight: 27 }, transitCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 7, padding: 16 }, area: { color: colors.sapphire, fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }, transitTitle: { color: colors.navy, fontSize: 18, fontWeight: '800', lineHeight: 24 }, transitText: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  refreshButton: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 15, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: 16 }, refreshText: { color: colors.sapphire, fontSize: 15, fontWeight: '800' }, pressed: { opacity: 0.68 },
});
