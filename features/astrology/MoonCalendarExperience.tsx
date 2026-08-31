import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { getMoonCalendar, type MoonCalendarResponse } from './api/moon-calendar';
import { localizeZodiacSign } from './zodiac';

const TIME_ZONE = 'Europe/Istanbul';

function currentMonth() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit' }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

function moveMonth(month: string, amount: number) {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1, 12));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthTitle(month: string) {
  return new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric', timeZone: TIME_ZONE }).format(new Date(`${month}-15T12:00:00+03:00`));
}

function phaseDate(instant: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE }).format(new Date(instant));
}

export function MoonCalendarExperience() {
  const [month, setMonth] = useState(currentMonth);
  const [result, setResult] = useState<MoonCalendarResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try { setResult(await getMoonCalendar(month)); } catch { setError(true); } finally { setLoading(false); }
  }, [month]);

  useEffect(() => { void load(); }, [load]);

  return <Screen>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>AYIN DÖNGÜSÜ</Text>
      <Text style={styles.title}>Ay Takvimi</Text>
      <Text style={styles.description}>Ay’ın evrelerini ve ay boyunca öne çıkan gökyüzü döngülerini keşfet.</Text>
    </View>
    <View style={styles.navigation}>
      <MonthButton label="‹ Önceki" onPress={() => setMonth((value) => moveMonth(value, -1))} />
      <Text style={styles.monthTitle}>{monthTitle(month)}</Text>
      <MonthButton label="Sonraki ›" onPress={() => setMonth((value) => moveMonth(value, 1))} />
    </View>
    {loading ? <View style={styles.stateCard}><ActivityIndicator color={colors.sapphire} size="large" /><Text style={styles.stateText}>Ay takvimi hazırlanıyor…</Text></View> : null}
    {error ? <View style={styles.stateCard}><Text style={styles.stateTitle}>Ay takvimi şu anda hazırlanamadı.</Text><Text style={styles.stateText}>Biraz sonra tekrar deneyebilirsin.</Text><Pressable accessibilityRole="button" onPress={() => void load()} style={styles.retry}><Text style={styles.retryText}>TEKRAR DENE</Text></Pressable></View> : null}
    {!loading && !error && result ? <>
      {month === currentMonth() ? <View style={styles.todayCard}>
        <Text style={styles.todayEyebrow}>BUGÜN AY</Text>
        <Text style={styles.todayPhase}>{result.calendar.today.phase}</Text>
        <Text style={styles.todayLine}>Ay Burcu: {localizeZodiacSign(result.calendar.today.sign)}</Text>
        <Text style={styles.todayLine}>Aydınlanma: %{result.calendar.today.illumination}</Text>
        {result.calendar.today.nextPhase ? <Text style={styles.nextPhase}>Sıradaki ana faz: {result.calendar.today.nextPhase.label} · {result.calendar.today.nextPhase.daysRemaining} gün</Text> : null}
      </View> : null}
      <View style={styles.list}>
        {result.calendar.phases.map((phase) => <View key={`${phase.id}-${phase.instant}`} style={styles.phaseCard}>
          <Text style={styles.phaseDate}>{phaseDate(phase.instant)}</Text>
          <Text style={styles.phaseTitle}>{phase.label}</Text>
          <Text style={styles.phaseSign}>Ay Burcu: {localizeZodiacSign(phase.sign)}</Text>
          <Text style={styles.phaseMeaning}>{phase.meaning}</Text>
        </View>)}
      </View>
    </> : null}
  </Screen>;
}

function MonthButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.monthButton, pressed && styles.pressed]}><Text numberOfLines={1} style={styles.monthButtonText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 9, paddingTop: 4 },
  eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  title: { color: colors.navy, fontSize: 30, fontWeight: '800', lineHeight: 36, textAlign: 'center' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 390, textAlign: 'center' },
  navigation: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  monthButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexShrink: 0, justifyContent: 'center', minHeight: 44, paddingHorizontal: 11 },
  monthButtonText: { color: colors.sapphire, fontSize: 13, fontWeight: '800' },
  monthTitle: { color: colors.navy, flex: 1, fontSize: 17, fontWeight: '800', lineHeight: 22, textAlign: 'center', textTransform: 'capitalize' },
  stateCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 12, padding: 22 },
  stateTitle: { color: colors.navy, fontSize: 18, fontWeight: '800', lineHeight: 24, textAlign: 'center' },
  stateText: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  retry: { backgroundColor: colors.sapphire, borderRadius: 14, minHeight: 48, paddingHorizontal: 20, justifyContent: 'center' },
  retryText: { color: colors.white, fontSize: 14, fontWeight: '800' },
  todayCard: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 22, gap: 7, padding: 20 },
  todayEyebrow: { color: '#DCEAF8', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  todayPhase: { color: colors.white, fontSize: 24, fontWeight: '800', lineHeight: 30 },
  todayLine: { color: colors.white, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  nextPhase: { color: '#E7EFF9', fontSize: 14, lineHeight: 20, marginTop: 4, textAlign: 'center' },
  list: { gap: 11 },
  phaseCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 6, padding: 17 },
  phaseDate: { color: colors.sapphire, fontSize: 13, fontWeight: '800', lineHeight: 19, textTransform: 'capitalize' },
  phaseTitle: { color: colors.navy, fontSize: 21, fontWeight: '800', lineHeight: 27 },
  phaseSign: { color: colors.gold, fontSize: 15, fontWeight: '800', lineHeight: 21 },
  phaseMeaning: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  pressed: { opacity: 0.65 },
});
