import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { LockedSection } from '@/features/premium';
export default function DailyScreen() { const router = useRouter(); return <Screen><SectionHeader eyebrow="GÜNLÜK" title="Bugünün gökyüzü" description="Günlük transitlerin temel etkilerini sakin ve net bir dille takip et." /><View style={styles.card}><Text style={styles.date}>BUGÜN</Text><Text style={styles.title}>Gökyüzünün ritmini fark et</Text><Text style={styles.text}>Kişisel günlük yorumların, doğum haritan oluşturulduktan sonra burada görünecek.</Text></View><LockedSection title="Gelişmiş Transitler" onUnlock={() => router.push({ pathname: '/premium', params: { selectedFeature: 'Gelişmiş Transitler' } })} /></Screen>; }
const styles = StyleSheet.create({ card: { backgroundColor: colors.sapphire, borderRadius: 24, gap: 12, padding: 22 }, date: { color: '#C8DCF3', fontSize: 13, fontWeight: '800', letterSpacing: 1.2 }, title: { color: colors.white, fontSize: 24, fontWeight: '800' }, text: { color: '#E7EFF9', fontSize: 17, lineHeight: 25 } });
