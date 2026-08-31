import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';

export default function RectificationProcessingScreen() {
  return <Screen>
    <View style={styles.content}>
      <View style={styles.icon}><Ionicons name="sparkles-outline" size={36} color={colors.white} /></View>
      <Text style={styles.title}>Doğum Saatin Hesaplanıyor</Text>
      <Text style={styles.text}>Yaşam olayların aday doğum saatleriyle güvenli sunucuda astrolojik olarak karşılaştırılacak.</Text>
      <Text style={styles.note}>Hesaplama tamamlandığında yalnızca en güçlü eşleşen saat ve yükselen burcun gösterilecek.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/profile')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>PROFİLE GİT</Text></Pressable>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ content: { alignItems: 'center', flex: 1, gap: 16, justifyContent: 'center', paddingBottom: 50 }, icon: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 36, height: 72, justifyContent: 'center', width: 72 }, title: { color: colors.navy, fontSize: 31, fontWeight: '800', textAlign: 'center' }, text: { color: colors.navy, fontSize: 18, lineHeight: 27, textAlign: 'center' }, note: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' }, button: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58, marginTop: 8 }, buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' }, pressed: { opacity: 0.7 } });
