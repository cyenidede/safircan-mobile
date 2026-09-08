import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  PREMIUM_PRODUCT_ORDER,
  PREMIUM_PRODUCTS,
  type PremiumProduct,
} from '@/constants/products';
import { colors } from '@/constants/theme';
import { useIAP } from '@/features/iap';
import { useLocale, usePalette } from '@/localization';

function ProductCard({
  product,
  highlighted,
  onSelect,
  displayPrice,
}: {
  product: PremiumProduct;
  highlighted?: boolean;
  onSelect: () => void;
  displayPrice: string | null;
}) {
  const palette=usePalette();
  return (
    <View style={[styles.productCard,{backgroundColor:palette.surface,borderColor:highlighted?palette.gold:palette.border},highlighted && styles.highlightedCard]}>
      {product.badge ? (
        <View style={styles.packageBadge}>
          <Text style={styles.packageBadgeText}>{product.badge}</Text>
        </View>
      ) : null}
      <View style={styles.productHeading}>
        <Text style={[styles.productTitle,{color:palette.navy}]}>{product.title}</Text>
        {displayPrice ? <Text style={[styles.price,{color:highlighted?palette.gold:palette.sapphire}]}>{displayPrice}</Text> : null}
      </View>
      <Text style={[styles.productDescription,{color:palette.muted}]}>{product.description}</Text>
      <View style={styles.featureList}>
        {product.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={19} color={highlighted ? palette.gold : palette.sapphire} />
            <Text style={[styles.featureText,{color:palette.navy}]}>{feature}</Text>
          </View>
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onSelect}
        style={({ pressed }) => [
          styles.cta,
          highlighted && styles.highlightedCta,
          pressed && styles.pressed,
        ]}>
        <Text style={styles.ctaText}>{product.ctaLabel}</Text>
      </Pressable>
    </View>
  );
}

export default function PremiumScreen() {
  const { messages }=useLocale(); const palette=usePalette(); const m=messages.premiumScreen;
  const router = useRouter();
  const params = useLocalSearchParams<{ selectedFeature?: string | string[] }>();
  const [notice, setNotice] = useState('');
  const { displayPrice, purchase, restorePurchases, purchasing, restoring } = useIAP();
  const selectedFeature = Array.isArray(params.selectedFeature)
    ? params.selectedFeature[0]
    : params.selectedFeature;

  const selectedFeatureNote = selectedFeature
    ? m.included.replace('{feature}',selectedFeature)
    : null;
  const localizedProduct=(product:PremiumProduct):PremiumProduct=>{
    const prefix=product.id==='annual_forecast'?'annual':product.id==='full_chart'?'full':product.id==='synastry'?'synastry':product.id==='messaging_subscription'?'messaging':'rectification';
    const title=m[`${prefix}Title` as keyof typeof m] as string; const description=m[`${prefix}Description` as keyof typeof m] as string; const ctaLabel=m[`${prefix}Cta` as keyof typeof m] as string;
    const featuresKey=`${prefix}Features` as keyof typeof m; const features=featuresKey in m?(m[featuresKey] as string).split('|'):product.features;
    const badge=prefix==='full'?m.fullBadge:product.badge;
    return {...product,title,description,ctaLabel,features,badge};
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={[styles.eyebrow,{color:palette.sapphire}]}>{m.eyebrow}</Text>
        <Text style={[styles.heroTitle,{color:palette.navy}]}>{m.title}</Text>
        <Text style={[styles.heroDescription,{color:palette.muted}]}>{m.description}</Text>
        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={18} color={palette.gold} />
          <Text style={[styles.trustText,{color:palette.navy}]}>{m.trust}</Text>
        </View>
      </View>

      {selectedFeatureNote ? (
        <View style={[styles.contextNote,{backgroundColor:palette.sapphireSoft}]}>
          <Ionicons name="sparkles-outline" size={20} color={palette.sapphire} />
          <Text style={[styles.contextText,{color:palette.navy}]}>{selectedFeatureNote}</Text>
        </View>
      ) : null}

      <View style={styles.products}>
        {PREMIUM_PRODUCT_ORDER.map((productId) => {
          const product = PREMIUM_PRODUCTS[productId];
          return (
            <ProductCard
              key={product.id}
              product={localizedProduct(product)}
              highlighted={product.id === 'full_chart'}
              displayPrice={displayPrice(product.id)}
              onSelect={() => { void purchase(product.id).then((result) => { if (!result.ok) setNotice(m.purchaseError); }); }}
            />
          );
        })}
      </View>

      <View style={[styles.serviceCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <View style={styles.serviceTop}>
          <View style={[styles.serviceIcon,{backgroundColor:palette.sapphireSoft}]}><Ionicons name="time-outline" size={23} color={palette.gold} /></View>
          <Text style={[styles.serviceLabel,{color:palette.gold}]}>{m.separate}</Text>
        </View>
        <Text style={[styles.productTitle,{color:palette.navy}]}>{m.rectificationTitle}</Text>
        <Text style={[styles.productDescription,{color:palette.muted}]}>{m.rectificationDescription}</Text>
        {displayPrice('birth_time_rectification') ? <Text style={styles.servicePrice}>{displayPrice('birth_time_rectification')}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => router.push('/rectification')} style={({ pressed }) => [styles.serviceCta,{borderColor:palette.sapphire},pressed && styles.pressed]}><Text style={[styles.serviceCtaText,{color:palette.sapphire}]}>{m.rectificationCta}</Text></Pressable>
      </View>

      <Pressable accessibilityRole="button" disabled={restoring || Boolean(purchasing)} onPress={() => { void restorePurchases().then((result) => setNotice(result.ok ? m.restored : m.purchaseError)); }} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}><Text style={[styles.restoreText,{color:palette.sapphire}]}>{restoring ? m.restoring : m.restore}</Text></Pressable>

      {notice ? (
        <View accessibilityLiveRegion="polite" style={[styles.notice,{backgroundColor:palette.sapphireSoft}]}>
          <Ionicons name="information-circle-outline" size={20} color={palette.sapphire} />
          <Text style={[styles.noticeText,{color:palette.navy}]}>{notice}</Text>
        </View>
      ) : null}

      <View style={[styles.comparison,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <Text style={[styles.comparisonTitle,{color:palette.navy}]}>{m.comparisonTitle}</Text>
        <Text style={[styles.comparisonText,{color:palette.muted}]}>{m.comparisonAnnual}</Text>
        <View style={[styles.divider,{backgroundColor:palette.border}]} />
        <Text style={[styles.comparisonText,{color:palette.muted}]}>{m.comparisonFull}</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingBottom: 2, paddingTop: 4 },
  eyebrow: { color: colors.sapphire, fontSize: 13, fontWeight: '800', letterSpacing: 1.3 },
  heroTitle: { color: colors.navy, fontSize: 30, fontWeight: '800', lineHeight: 36, textAlign: 'center' },
  heroDescription: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 500, textAlign: 'center' },
  trustRow: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 4 },
  trustText: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  contextNote: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 16, flexDirection: 'row', gap: 10, padding: 14 },
  contextText: { color: colors.navy, flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  products: { gap: 18 },
  productCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 14, padding: 18 },
  highlightedCard: { borderColor: colors.gold, borderWidth: 2, shadowColor: colors.navy, shadowOffset: { height: 5, width: 0 }, shadowOpacity: 0.09, shadowRadius: 12, elevation: 3 },
  packageBadge: { alignSelf: 'flex-start', backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 6 },
  packageBadgeText: { color: colors.white, fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  productHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  productTitle: { color: colors.navy, flex: 1, fontSize: 22, fontWeight: '800', lineHeight: 28 },
  price: { color: colors.sapphire, fontSize: 21, fontWeight: '900' },
  highlightedPrice: { color: colors.gold },
  productDescription: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  featureList: { gap: 9 },
  featureRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 9 },
  featureText: { color: colors.navy, flex: 1, fontSize: 15, lineHeight: 20 },
  cta: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 54, paddingHorizontal: 14 },
  highlightedCta: { backgroundColor: colors.navy },
  ctaText: { color: colors.white, fontSize: 15, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  pressed: { opacity: 0.82 },
  notice: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 16, flexDirection: 'row', gap: 9, padding: 14 },
  noticeText: { color: colors.navy, flex: 1, fontSize: 15, lineHeight: 21 },
  comparison: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 12, padding: 18 },
  comparisonTitle: { color: colors.navy, fontSize: 20, fontWeight: '800' },
  comparisonText: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth },
  serviceCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 12, padding: 18 }, serviceTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, serviceIcon: { alignItems: 'center', backgroundColor: '#F4E8CE', borderRadius: 21, height: 42, justifyContent: 'center', width: 42 }, serviceLabel: { color: colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 }, servicePrice: { color: colors.gold, fontSize: 22, fontWeight: '900' }, serviceCta: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', minHeight: 54 }, serviceCtaText: { color: colors.sapphire, fontSize: 15, fontWeight: '900', letterSpacing: 0.4 },
  restoreButton: { alignItems: 'center', justifyContent: 'center', minHeight: 48 }, restoreText: { color: colors.sapphire, fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
});
