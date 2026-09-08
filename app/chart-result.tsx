import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { useAstrologyChart } from '@/features/astrology/AstrologyChartProvider';
import type { AstrologyChartResult, FreeNatalPlanet, SunOnlyChartResult } from '@/features/astrology/api/types';
import { getPlacementComment, getPlacementCommentForLocale, type FreePlacementKey } from '@/features/astrology/placementComments';
import { localizeZodiacSign, localizeZodiacSignForLocale } from '@/features/astrology/zodiac';
import { useAuth } from '@/features/auth/AuthProvider';
import { LockedSection } from '@/features/premium';
import { useEntitlements } from '@/features/premium/EntitlementProvider';
import { useLocale, usePalette } from '@/localization';

export default function ChartResultScreen() {
  const { locale, messages } = useLocale(); const palette=usePalette(); const free=messages.chartResultFree;
  const localizedPremiumItems = messages.chartResultLocked.titles.split('|').map((title,index)=>[title,messages.chartResultLocked.descriptions.split('|')[index]] as const);
  const { result } = useAstrologyChart();
  const { user } = useAuth();
  const { hasEntitlement } = useEntitlements();
  const [showAllPremium, setShowAllPremium] = useState(false);
  if (!result) return <Screen><SectionHeader title="Harita sonucu bulunamadı" description="Doğum bilgilerini girerek haritanı yeniden oluşturabilirsin." /><Pressable onPress={() => router.replace('/birth-chart')} style={styles.button}><Text style={styles.buttonText}>Haritamı Oluştur</Text></Pressable></Screen>;
  if (isSunOnlyResult(result)) return <SunOnlyResult result={result} />;

  const planetLabels=free.planets.split('|');
  const placements: Array<[FreePlacementKey, string, FreeNatalPlanet | null]> = [['sun', planetLabels[0], result.chart.sun], ['moon', planetLabels[1], result.chart.moon], ['ascendant', planetLabels[2], result.chart.ascendant], ['mercury', planetLabels[3], result.chart.mercury], ['venus', planetLabels[4], result.chart.venus], ['mars', planetLabels[5], result.chart.mars]];
  const openPremium = (selectedFeature?: string) => router.push({
    pathname: '/premium',
    params: selectedFeature ? { selectedFeature } : {},
  });
  const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name.trim() : '';
  const resultTitle = firstName ? free.namedTitle.replace('{name}',locale==='tr'?possessiveName(firstName):firstName) : free.title;

  return <Screen>
    <SectionHeader eyebrow={free.eyebrow} title={resultTitle} description={free.description} />
    {result.warning ? <Text style={styles.warning}>{result.warning}</Text> : null}
    <View style={styles.placements}>{placements.map(([key, label, planet]) => <View key={key} style={[styles.placement,{backgroundColor:palette.surface,borderColor:palette.border}]}><View style={styles.placementTop}><View style={styles.placementNameRow}><Text style={[styles.label,{color:palette.sapphire}]}>{label}</Text><Text style={[styles.separator,{color:palette.muted}]}> — </Text><Text numberOfLines={1} style={[styles.sign,{color:palette.navy}]}>{planet ? localizeZodiacSignForLocale(planet.sign,locale) : free.unavailable}</Text></View>{planet ? <Text style={[styles.degree,{color:palette.muted}]}>{formatDegree(planet.degree)}</Text> : null}</View>{planet ? <Text numberOfLines={2} style={[styles.comment,{color:palette.muted}]}>{getPlacementCommentForLocale(key, planet.sign,locale)}</Text> : <Text numberOfLines={2} style={[styles.comment,{color:palette.muted}]}>{free.unknownPlacement}</Text>}</View>)}</View>
    {hasEntitlement('full_chart') ? <Pressable accessibilityRole="button" onPress={() => router.push('/full-chart')} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>{free.fullAccess}</Text></Pressable> : hasEntitlement('annual_forecast') ? <Pressable accessibilityRole="button" onPress={() => router.push('/annual-forecast')} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>{free.annualAccess}</Text></Pressable> : <View style={styles.premiumSection}>
      <Text style={[styles.premiumTitle,{color:palette.navy}]}>{free.moreTitle}</Text>
      <Text style={[styles.premiumDescription,{color:palette.muted}]}>{free.moreDescription}</Text>
      <View style={styles.premiumCards}>{localizedPremiumItems.slice(0, 6).map(([title, description], index) => <LockedSection compact emphasized={index === 0} key={title} title={title} description={description} onUnlock={() => openPremium(title)} />)}</View>
      <Pressable accessibilityRole="button" onPress={() => openPremium()} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>{free.unlock}</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAllPremium }} onPress={() => setShowAllPremium((current) => !current)} style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}><Text style={[styles.showAllText,{color:palette.sapphire}]}>{showAllPremium ? free.hideAll : free.viewAll}</Text><Ionicons name={showAllPremium ? 'chevron-up' : 'chevron-down'} size={20} color={palette.sapphire} /></Pressable>
      {showAllPremium ? <View style={styles.premiumCards}>{localizedPremiumItems.slice(6).map(([title, description]) => <LockedSection compact key={title} title={title} description={description} onUnlock={() => openPremium(title)} />)}</View> : null}
    </View>}
  </Screen>;
}

function SunOnlyResult({ result }: { result: SunOnlyChartResult }) {
  const { user } = useAuth();
  const [showRectification, setShowRectification] = useState(true);
  const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name.trim() : '';
  const title = firstName
    ? `${possessiveName(firstName)} Haritasına İlk Bakış`
    : 'Haritana İlk Bakış';
  const sign = result.sun?.sign;

  return <Screen>
    <SectionHeader eyebrow="İLK BAKIŞ" title={title} description="Doğduğunda gökyüzündeki ilk izler." />
    <View style={styles.placements}>
      <View style={styles.placement}>
        <View style={styles.placementTop}>
          <View style={styles.placementNameRow}>
            <Text style={styles.label}>Güneş</Text>
            <Text style={styles.separator}> — </Text>
            <Text numberOfLines={1} style={styles.sign}>{sign ? localizeZodiacSign(sign) : 'Doğum saati gerekli'}</Text>
          </View>
        </View>
        {sign
          ? <Text numberOfLines={2} style={styles.comment}>{getPlacementComment('sun', sign)}</Text>
          : <Text style={styles.safeMessage}>Doğum tarihin Güneş’in burç değiştirebildiği günlerden birine denk geliyor. Kesin burcunu söyleyebilmek için doğum saatine ihtiyaç var.</Text>}
      </View>
    </View>

    {showRectification ? <View style={styles.rectificationCard}>
      <View style={styles.rectificationIcon}><Ionicons name="time-outline" size={24} color={colors.gold} /></View>
      <Text style={styles.rectificationTitle}>Doğum Saatini Netleştirelim</Text>
      <Text style={styles.rectificationText}>Doğum saatin netleştiğinde yükselen burcun, evlerin, kariyer alanın ve haritandaki önemli astrolojik göstergeler çok daha doğru hesaplanabilir.{'\n\n'}Otomatik rektifikasyon, yaşamındaki önemli olayları karşılaştırarak en güçlü eşleşen doğum saatini hesaplar.</Text>
      <Text style={styles.rectificationQuestion}>Doğum saatini hesaplatmak ister misin?</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push('/rectification')} style={({ pressed }) => [styles.rectificationButton, pressed && styles.pressed]}><Text style={styles.buttonText}>DOĞUM SAATİMİ BUL</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={() => setShowRectification(false)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>Şimdilik Güneş Burcumu Gör</Text></Pressable>
    </View> : null}
  </Screen>;
}

function formatDegree(value: number) { const degree = Math.floor(value); const minute = Math.round((value - degree) * 60); return `${degree}° ${String(minute).padStart(2, '0')}′`; }
function isSunOnlyResult(result: AstrologyChartResult): result is SunOnlyChartResult { return 'mode' in result && result.mode === 'sun-only'; }
function possessiveName(name: string) {
  const lower = name.toLocaleLowerCase('tr-TR');
  const lastVowel = [...lower].reverse().find((letter) => 'aeıioöuü'.includes(letter)) ?? 'e';
  const vowel = 'aeıioöuü'.includes(lower.at(-1) ?? '');
  const suffix = lastVowel === 'a' || lastVowel === 'ı' ? (vowel ? 'nın' : 'ın')
    : lastVowel === 'o' || lastVowel === 'u' ? (vowel ? 'nun' : 'un')
      : lastVowel === 'ö' || lastVowel === 'ü' ? (vowel ? 'nün' : 'ün')
        : vowel ? 'nin' : 'in';
  return `${name}’${suffix}`;
}

const styles = StyleSheet.create({
  placements: { gap: 9 }, placement: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, gap: 5, paddingHorizontal: 14, paddingVertical: 10 }, placementTop: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'space-between' }, placementNameRow: { alignItems: 'baseline', flex: 1, flexDirection: 'row' }, label: { color: colors.sapphire, fontSize: 14, fontWeight: '800' }, separator: { color: colors.muted, fontSize: 14, fontWeight: '600' }, sign: { color: colors.navy, flexShrink: 1, fontSize: 17, fontWeight: '800' }, degree: { color: colors.muted, fontSize: 12, fontWeight: '600' }, comment: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  warning: { backgroundColor: '#F4E8CE', borderRadius: 14, color: colors.gold, fontSize: 15, lineHeight: 22, padding: 14 }, premiumSection: { gap: 12, marginTop: 8 }, premiumTitle: { color: colors.navy, fontSize: 25, fontWeight: '800' }, premiumDescription: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: 2 }, premiumCards: { gap: 9 },
  button: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58 }, buttonText: { color: colors.white, fontSize: 17, fontWeight: '800' }, premiumButton: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58, marginTop: 3 }, premiumButtonText: { color: colors.white, fontSize: 16, fontWeight: '800', letterSpacing: 0.4 }, showAllButton: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', minHeight: 52 }, showAllText: { color: colors.sapphire, fontSize: 16, fontWeight: '700' }, pressed: { opacity: 0.68 },
  safeMessage: { color: colors.muted, fontSize: 14, lineHeight: 20 }, rectificationCard: { backgroundColor: colors.surface, borderColor: colors.gold, borderRadius: 22, borderWidth: 1.5, gap: 13, padding: 19 }, rectificationIcon: { alignItems: 'center', backgroundColor: '#F4E8CE', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, rectificationTitle: { color: colors.navy, fontSize: 23, fontWeight: '800', lineHeight: 29 }, rectificationText: { color: colors.muted, fontSize: 15, lineHeight: 22 }, rectificationQuestion: { color: colors.navy, fontSize: 17, fontWeight: '800', lineHeight: 23 }, rectificationButton: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56, paddingHorizontal: 12 }, secondaryButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50 }, secondaryButtonText: { color: colors.sapphire, fontSize: 16, fontWeight: '700' },
});
