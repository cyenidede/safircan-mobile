import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export type PublicRectificationResult = {
  birthTime: string;
  ascendantSign: string;
};

export type RectifiedBirthTime = PublicRectificationResult & {
  birthTimeSource: 'rectification';
};

export function RectificationResultCard({ result, saving, onSave }: { result: PublicRectificationResult; saving?: boolean; onSave: (value: RectifiedBirthTime) => void }) {
  return <View style={styles.card}>
    <View style={styles.icon}><Ionicons name="time-outline" size={28} color={colors.gold} /></View>
    <Text style={styles.title}>Doğum Saatin Hesaplandı</Text>
    <Text style={styles.time}>{result.birthTime}</Text>
    <Text style={styles.label}>Yükselen Burcun</Text>
    <Text style={styles.sign}>{result.ascendantSign}</Text>
    <Text style={styles.note}>Bu saat, verdiğin yaşam olaylarının astrolojik olarak karşılaştırılmasıyla hesaplanan en güçlü eşleşmedir.</Text>
    <Pressable accessibilityRole="button" disabled={saving} onPress={() => onSave({ ...result, birthTimeSource: 'rectification' })} style={({ pressed }) => [styles.button, (pressed || saving) && styles.pressed]}><Text style={styles.buttonText}>{saving ? 'KAYDEDİLİYOR…' : 'DOĞUM SAATİMİ KAYDET'}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({ card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: 24, borderWidth: 1.5, gap: 10, padding: 22 }, icon: { alignItems: 'center', backgroundColor: '#F4E8CE', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 }, title: { color: colors.navy, fontSize: 26, fontWeight: '800', lineHeight: 32, textAlign: 'center' }, time: { color: colors.sapphire, fontSize: 48, fontWeight: '900', letterSpacing: 1.5 }, label: { color: colors.muted, fontSize: 15, fontWeight: '700' }, sign: { color: colors.navy, fontSize: 27, fontWeight: '800' }, note: { color: colors.muted, fontSize: 15, lineHeight: 22, marginVertical: 5, textAlign: 'center' }, button: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56, paddingHorizontal: 12 }, buttonText: { color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'center' }, pressed: { opacity: 0.68 } });
