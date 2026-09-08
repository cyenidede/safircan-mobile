import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { useLocale, usePalette } from '@/localization';

export default function ChartScreen() {
  const { messages } = useLocale(); const palette = usePalette(); const m = messages.chart;
  return <Screen><SectionHeader eyebrow={m.eyebrow} title={m.title} description={m.description} /><View style={[styles.emptyWheel, { borderColor: palette.sapphire }]}><Text style={styles.wheelGlyph}>✦</Text><Text style={[styles.emptyTitle, { color: palette.navy }]}>{m.empty}</Text><Text style={[styles.list, { color: palette.muted }]}>{m.planets}</Text></View><Pressable onPress={() => router.push('/birth-chart')} style={styles.button}><Text style={styles.buttonText}>{m.create}</Text></Pressable></Screen>;
}
const styles = StyleSheet.create({ emptyWheel: { alignItems: 'center', aspectRatio: 1, borderColor: colors.sapphire, borderRadius: 999, borderStyle: 'dashed', borderWidth: 1.5, gap: 14, justifyContent: 'center', marginHorizontal: 20, padding: 30 }, wheelGlyph: { color: colors.sapphire, fontSize: 46 }, emptyTitle: { color: colors.navy, fontSize: 20, fontWeight: '700', lineHeight: 28, textAlign: 'center' }, list: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, button: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56 }, buttonText: { color: colors.white, fontSize: 17, fontWeight: '800' } });
