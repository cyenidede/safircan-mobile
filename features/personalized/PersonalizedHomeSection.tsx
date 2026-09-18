import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocale, usePalette } from '@/localization';
import type { MonthlyResult, PersonalizedCurrent, PersonalizedKind, SkyAnswerResult, WeeklyResult } from './domain';
import { usePersonalizedCurrent } from './usePersonalizedCurrent';

type Messages = ReturnType<typeof useLocale>['messages']['personalized'];

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
    <Text style={styles.actionText}>{label}</Text><Ionicons name="chevron-forward" color={colors.white} size={17} />
  </Pressable>;
}

function TextBlock({ title, body, color }: { title?: string; body: string; color: string }) {
  return <View style={styles.textBlock}>{title ? <Text selectable style={[styles.blockTitle, { color }]}>{title}</Text> : null}<Text selectable style={[styles.body, { color }]}>{body}</Text></View>;
}

function WeeklyFull({ result, messages, color }: { result: WeeklyResult; messages: Messages; color: string }) {
  return <View style={styles.result}>
    <TextBlock body={result.overview} color={color} />
    <TextBlock title={result.mainTheme.title} body={result.mainTheme.detail} color={color} />
    {result.relationships ? <TextBlock title={messages.relationships} body={result.relationships} color={color} /> : null}
    {result.workAndMoney ? <TextBlock title={messages.workAndMoney} body={result.workAndMoney} color={color} /> : null}
    {result.attention ? <TextBlock title={messages.attention} body={result.attention} color={color} /> : null}
    {result.importantDates.map((item, index) => <TextBlock key={`${item.startDate}:${index}`} title={`${item.label} · ${item.startDate}${item.endDate ? ` — ${item.endDate}` : ''}`} body={item.guidance} color={color} />)}
    <TextBlock title={messages.closing} body={result.closing} color={color} />
  </View>;
}

function MonthlyFull({ result, messages, color }: { result: MonthlyResult; messages: Messages; color: string }) {
  return <View style={styles.result}>
    <TextBlock body={result.overview} color={color} />
    {result.mainThemes.map((item, index) => <TextBlock key={`${item.title}:${index}`} title={item.title} body={item.detail} color={color} />)}
    {result.relationships ? <TextBlock title={messages.relationships} body={result.relationships} color={color} /> : null}
    {result.careerAndMoney ? <TextBlock title={messages.careerAndMoney} body={result.careerAndMoney} color={color} /> : null}
    {result.attention ? <TextBlock title={messages.attention} body={result.attention} color={color} /> : null}
    {result.importantWindows.map((item, index) => <TextBlock key={`${item.startDate}:${index}`} title={`${item.title} · ${item.startDate}${item.endDate ? ` — ${item.endDate}` : ''}`} body={item.guidance} color={color} />)}
    <TextBlock title={messages.closing} body={result.closing} color={color} />
  </View>;
}

function SkyFull({ result, messages, color }: { result: SkyAnswerResult; messages: Messages; color: string }) {
  return <View style={styles.result}>
    <TextBlock title={result.full.theme} body={result.full.answer} color={color} />
    <TextBlock title={messages.whyNow} body={result.full.whyNow} color={color} />
    <TextBlock title={messages.focus} body={result.full.focus} color={color} />
    {result.full.caution ? <TextBlock title={messages.attention} body={result.full.caution} color={color} /> : null}
    {result.full.timeWindow ? <TextBlock title={`${result.full.timeWindow.label} · ${result.full.timeWindow.startDate}${result.full.timeWindow.endDate ? ` — ${result.full.timeWindow.endDate}` : ''}`} body={messages.timeWindow} color={color} /> : null}
  </View>;
}

function StatusContent({ item, kind, messages, onRefresh, color }: { item: PersonalizedCurrent; kind: PersonalizedKind; messages: Messages; onRefresh: () => void; color: string }) {
  const previewText = kind === 'sky_answer' ? (item.content.preview as { hint: string }).hint : (item.content.preview as { summary: string }).summary;
  return <>
    <Text selectable style={[styles.cardTitle, { color }]}>{item.content.preview.headline}</Text>
    <Text selectable style={styles.preview}>{previewText}</Text>
    {item.status === 'processing' ? <Text style={styles.status}>{messages.processing}</Text> : null}
    {item.status === 'unavailable' ? <><Text style={styles.status}>{messages.unavailable}</Text><ActionButton label={messages.checkAgain} onPress={onRefresh} /></> : null}
    {item.status === 'preview_ready' ? <ActionButton label={kind === 'sky_answer' ? messages.openSky : messages.explorePremium} onPress={() => router.push(kind === 'sky_answer' ? '/ask' : '/premium')} /> : null}
    {item.status === 'ready' && kind === 'weekly' ? <WeeklyFull result={item.content.fullResult as WeeklyResult} messages={messages} color={color} /> : null}
    {item.status === 'ready' && kind === 'monthly' ? <MonthlyFull result={item.content.fullResult as MonthlyResult} messages={messages} color={color} /> : null}
    {item.status === 'ready' && kind === 'sky_answer' ? <SkyFull result={item.content.fullResult as SkyAnswerResult} messages={messages} color={color} /> : null}
  </>;
}

export function PersonalizedHomeSection() {
  const { session } = useAuth();
  const { locale, messages } = useLocale();
  const palette = usePalette();
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const { state, blockingIssue, refresh } = usePersonalizedCurrent(session?.access_token, locale);
  if (!session?.access_token) return null;
  if (blockingIssue) return <View style={styles.section}>
    <Text style={[styles.heading, { color: palette.navy }]}>{messages.personalized.title}</Text>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={styles.status}>{messages.common.error}</Text>
      {blockingIssue === 'auth_required' ? <ActionButton label={messages.auth.signIn} onPress={() => router.push('/sign-in')} /> : null}
    </View>
  </View>;
  const periodState = state[period];
  const skyState = state.sky_answer;
  const renderCardBody = (kind: PersonalizedKind, value: typeof periodState) => {
    if (value.loading && !value.data) return <ActivityIndicator color={colors.sapphire} />;
    if (value.error) return <><Text style={styles.status}>{value.error === 'temporary_unavailable' ? messages.personalized.unavailable : messages.personalized.loadError}</Text><ActionButton label={messages.personalized.checkAgain} onPress={() => void refresh(kind)} /></>;
    return value.data ? <StatusContent item={value.data} kind={kind} messages={messages.personalized} onRefresh={() => void refresh(kind)} color={palette.navy} /> : null;
  };
  return <View style={styles.section}>
    <Text style={[styles.heading, { color: palette.navy }]}>{messages.personalized.title}</Text>
    <View accessibilityRole="tablist" style={[styles.segmented, { backgroundColor: palette.sapphireSoft }]}>
      {(['weekly', 'monthly'] as const).map((kind) => <Pressable key={kind} accessibilityRole="tab" accessibilityState={{ selected: period === kind }} onPress={() => setPeriod(kind)} style={[styles.segment, period === kind && styles.segmentSelected]}><Text style={[styles.segmentText, period === kind && styles.segmentTextSelected]}>{kind === 'weekly' ? messages.personalized.weekly : messages.personalized.monthly}</Text></Pressable>)}
    </View>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>{renderCardBody(period, periodState)}</View>
    <Text style={[styles.heading, { color: palette.navy }]}>{messages.personalized.skyTitle}</Text>
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>{renderCardBody('sky_answer', skyState)}</View>
  </View>;
}

const styles = StyleSheet.create({
  section: { gap: 12 }, heading: { fontSize: 20, fontWeight: '800' },
  segmented: { borderRadius: 14, flexDirection: 'row', padding: 4 }, segment: { alignItems: 'center', borderRadius: 11, flex: 1, minHeight: 42, justifyContent: 'center' }, segmentSelected: { backgroundColor: colors.sapphire }, segmentText: { color: colors.sapphire, fontSize: 15, fontWeight: '700' }, segmentTextSelected: { color: colors.white },
  card: { borderCurve: 'continuous', borderRadius: 22, borderWidth: 1, gap: 12, minHeight: 92, padding: 18 }, cardTitle: { fontSize: 18, fontWeight: '800', lineHeight: 24 }, preview: { color: colors.muted, fontSize: 15, lineHeight: 22 }, status: { color: colors.muted, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  action: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.sapphire, borderRadius: 13, flexDirection: 'row', gap: 4, minHeight: 44, paddingHorizontal: 14 }, actionText: { color: colors.white, fontSize: 14, fontWeight: '800' }, pressed: { opacity: 0.68 },
  result: { gap: 14 }, textBlock: { gap: 4 }, blockTitle: { fontSize: 15, fontWeight: '800', lineHeight: 21 }, body: { fontSize: 15, lineHeight: 23 },
});
