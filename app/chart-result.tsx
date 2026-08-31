import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { useAstrologyChart } from '@/features/astrology/AstrologyChartProvider';
import type { AstrologyChartResult, FreeNatalPlanet, SunOnlyChartResult } from '@/features/astrology/api/types';
import { getPlacementComment, type FreePlacementKey } from '@/features/astrology/placementComments';
import { useAuth } from '@/features/auth/AuthProvider';
import { LockedSection } from '@/features/premium';
import { useEntitlements } from '@/features/premium/EntitlementProvider';

const signNames: Record<string, string> = { Aries: 'Koç', Taurus: 'Boğa', Gemini: 'İkizler', Cancer: 'Yengeç', Leo: 'Aslan', Virgo: 'Başak', Libra: 'Terazi', Scorpio: 'Akrep', Sagittarius: 'Yay', Capricorn: 'Oğlak', Aquarius: 'Kova', Pisces: 'Balık' };

const premiumItems = [
  ['12 Aylık Yıllık Öngörün', 'Önündeki 12 ayın öne çıkan fırsat ve dönüşüm temalarını keşfet.'],
  ['Aşk ve İlişki Haritan', 'Aşkta neye ihtiyaç duyduğunu ve tekrar eden ilişki kalıplarını keşfet.'],
  ['Evlilik Potansiyelin', 'Uzun ilişki ve evlilik göstergelerinin haritanda nasıl çalıştığını gör.'],
  ['Hayatına Çektiğin Partner Tipi', 'Seni en çok hangi karakterde insanların etkilediğini keşfet.'],
  ['Kariyer ve Başarı Yolun', 'Hangi alanlarda daha kolay yükseldiğini ve görünür olduğunu keşfet.'],
  ['Para Kazanma Potansiyelin', 'Para akışını güçlendiren ve zorlayan göstergelerini gör.'],
  ['Doğuştan Gelen Yeteneklerin', 'Haritanda henüz yeterince kullanmadığın güçlü taraflarını keşfet.'],
  ['En Güçlü ve En Zorlayıcı Yönlerin', 'Doğal avantajlarınla gelişim isteyen alanlarını birlikte gör.'],
  ['Karmik Göstergelerin', 'Geçmişten taşıdığın temaların bugünkü seçimlerine nasıl yansıdığını incele.'],
  ['Chiron – En Hassas Noktan', 'Hassasiyetinin zamanla nasıl bir anlayış ve güce dönüşebileceğini keşfet.'],
  ['Lilith – Bastırdığın Tarafın', 'Geri planda tuttuğun bağımsız ve güçlü yönlerinle tanış.'],
  ['12 Ev Analizi', 'Hayatının farklı alanlarında hangi temaların öne çıktığını keşfet.'],
] as const;

export default function ChartResultScreen() {
  const { result } = useAstrologyChart();
  const { user } = useAuth();
  const { hasEntitlement } = useEntitlements();
  const [showAllPremium, setShowAllPremium] = useState(false);
  if (!result) return <Screen><SectionHeader title="Harita sonucu bulunamadı" description="Doğum bilgilerini girerek haritanı yeniden oluşturabilirsin." /><Pressable onPress={() => router.replace('/birth-chart')} style={styles.button}><Text style={styles.buttonText}>Haritamı Oluştur</Text></Pressable></Screen>;
  if (isSunOnlyResult(result)) return <SunOnlyResult result={result} />;

  const placements: Array<[FreePlacementKey, string, FreeNatalPlanet | null]> = [['sun', 'Güneş', result.chart.sun], ['moon', 'Ay', result.chart.moon], ['ascendant', 'Yükselen', result.chart.ascendant], ['mercury', 'Merkür', result.chart.mercury], ['venus', 'Venüs', result.chart.venus], ['mars', 'Mars', result.chart.mars]];
  const openPremium = (selectedFeature?: string) => router.push({
    pathname: '/premium',
    params: selectedFeature ? { selectedFeature } : {},
  });
  const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name.trim() : '';
  const resultTitle = firstName ? `${possessiveName(firstName)} Temel Yerleşimleri` : 'Haritanın Temel Yerleşimleri';

  return <Screen>
    <SectionHeader eyebrow="ÜCRETSİZ HARİTAN" title={resultTitle} description="Doğduğunda gökyüzündeki izler." />
    {result.warning ? <Text style={styles.warning}>{result.warning}</Text> : null}
    <View style={styles.placements}>{placements.map(([key, label, planet]) => <View key={key} style={styles.placement}><View style={styles.placementTop}><View style={styles.placementNameRow}><Text style={styles.label}>{label}</Text><Text style={styles.separator}> — </Text><Text numberOfLines={1} style={styles.sign}>{planet ? signNames[planet.sign] ?? planet.sign : 'Hesaplanamadı'}</Text></View>{planet ? <Text style={styles.degree}>{formatDegree(planet.degree)}</Text> : null}</View>{planet ? <Text numberOfLines={2} style={styles.comment}>{getPlacementComment(key, planet.sign)}</Text> : <Text numberOfLines={2} style={styles.comment}>Doğum saati bilinmediğinde bu yerleşim güvenilir biçimde hesaplanamaz.</Text>}</View>)}</View>
    {hasEntitlement('full_chart') ? <Pressable accessibilityRole="button" onPress={() => router.push('/full-chart')} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>TAM DOĞUM HARİTAMI GÖR</Text></Pressable> : hasEntitlement('annual_forecast') ? <Pressable accessibilityRole="button" onPress={() => router.push('/annual-forecast')} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>12 AYLIK ÖNGÖRÜMÜ GÖR</Text></Pressable> : <View style={styles.premiumSection}>
      <Text style={styles.premiumTitle}>Haritanda Daha Fazlası Var</Text>
      <Text style={styles.premiumDescription}>İlişkilerin, kariyer yönün, para potansiyelin, karmik derslerin ve önündeki 12 aylık dönem haritanda daha derin katmanlarda saklı.</Text>
      <View style={styles.premiumCards}>{premiumItems.slice(0, 6).map(([title, description], index) => <LockedSection compact emphasized={index === 0} key={title} title={title} description={description} onUnlock={() => openPremium(title)} />)}</View>
      <Pressable accessibilityRole="button" onPress={() => openPremium()} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>TÜM HARİTAMI AÇ</Text></Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAllPremium }} onPress={() => setShowAllPremium((current) => !current)} style={({ pressed }) => [styles.showAllButton, pressed && styles.pressed]}><Text style={styles.showAllText}>{showAllPremium ? 'Premium Başlıklarını Gizle' : 'Tüm Premium Başlıklarını Gör'}</Text><Ionicons name={showAllPremium ? 'chevron-up' : 'chevron-down'} size={20} color={colors.sapphire} /></Pressable>
      {showAllPremium ? <View style={styles.premiumCards}>{premiumItems.slice(6).map(([title, description]) => <LockedSection compact key={title} title={title} description={description} onUnlock={() => openPremium(title)} />)}</View> : null}
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
            <Text numberOfLines={1} style={styles.sign}>{sign ? signNames[sign] ?? sign : 'Doğum saati gerekli'}</Text>
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
