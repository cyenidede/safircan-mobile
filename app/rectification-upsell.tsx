import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PREMIUM_PRODUCTS } from '@/constants/products';
import { colors } from '@/constants/theme';
import { useIAP } from '@/features/iap';

export default function RectificationUpsellScreen() {
  const product = PREMIUM_PRODUCTS.full_chart;
  const { displayPrice } = useIAP();
  const price = displayPrice(product.id);
  return <Screen>
    <View style={styles.content}>
      <Text style={styles.eyebrow}>DOĞUM SAATİN KAYDEDİLDİ</Text>
      <Text style={styles.title}>Artık Tam Doğum Haritanı Oluşturabiliriz</Text>
      <Text style={styles.description}>Doğum saatin netleştiğine göre yükselen burcundan 12 evine, gezegen açılarından ilişki ve kariyer göstergelerine kadar haritanın tüm derin katmanlarını açabilirsin.</Text>
      <View style={styles.priceCard}><Text style={styles.packageTitle}>{product.title}</Text>{price ? <Text style={styles.price}>{price}</Text> : null}<Text style={styles.packageText}>Tüm Premium natal analizleri ve 12 aylık yıllık öngörü dahildir.</Text></View>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/premium', params: { selectedFeature: 'Tam doğum haritası ve 12 aylık öngörü' } })} style={({ pressed }) => [styles.button, pressed && styles.pressed]}><Text style={styles.buttonText}>{price ? `${product.ctaLabel} — ${price}` : product.ctaLabel}</Text></Pressable>
      <Text style={styles.note}>Doğum saati rektifikasyonu ve tam harita iki ayrı satın almadır.</Text>
    </View>
  </Screen>;
}

const styles = StyleSheet.create({ content: { alignItems: 'center', flex: 1, gap: 17, justifyContent: 'center', paddingBottom: 34 }, eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textAlign: 'center' }, title: { color: colors.navy, fontSize: 30, fontWeight: '800', lineHeight: 37, textAlign: 'center' }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' }, priceCard: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: 22, borderWidth: 1.5, gap: 8, padding: 19 }, packageTitle: { color: colors.navy, fontSize: 20, fontWeight: '800' }, price: { color: colors.gold, fontSize: 31, fontWeight: '900' }, packageText: { color: colors.muted, fontSize: 15, lineHeight: 21, textAlign: 'center' }, button: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.navy, borderRadius: 16, justifyContent: 'center', minHeight: 58, paddingHorizontal: 12 }, buttonText: { color: colors.white, fontSize: 16, fontWeight: '900', textAlign: 'center' }, note: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }, pressed: { opacity: 0.72 } });
