import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';

export default function ChartScreen() {
  return <Screen><SectionHeader eyebrow="HARİTAM" title="Gökyüzü imzanı oluştur" description="Gezegenlerin doğduğun andaki konumunu görmek için bilgilerini ekle." /><View style={styles.emptyWheel}><Text style={styles.wheelGlyph}>✦</Text><Text style={styles.emptyTitle}>Doğum haritan burada görünecek</Text><Text style={styles.list}>Güneş · Ay · Yükselen · Merkür · Venüs · Mars</Text></View><Pressable onPress={() => router.push('/birth-chart')} style={styles.button}><Text style={styles.buttonText}>Haritamı Oluştur</Text></Pressable></Screen>;
}
const styles = StyleSheet.create({ emptyWheel: { alignItems: 'center', aspectRatio: 1, borderColor: colors.sapphire, borderRadius: 999, borderStyle: 'dashed', borderWidth: 1.5, gap: 14, justifyContent: 'center', marginHorizontal: 20, padding: 30 }, wheelGlyph: { color: colors.sapphire, fontSize: 46 }, emptyTitle: { color: colors.navy, fontSize: 20, fontWeight: '700', lineHeight: 28, textAlign: 'center' }, list: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, button: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56 }, buttonText: { color: colors.white, fontSize: 17, fontWeight: '800' } });
