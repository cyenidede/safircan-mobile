import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PREMIUM_PRODUCTS } from '@/constants/products';
import { colors } from '@/constants/theme';
import { compatibility } from '@/features/astrology/compatibility';
import { localizeZodiacSign, localizeZodiacSignForLocale, ZODIAC_SIGNS } from '@/features/astrology/zodiac';
import { useLocale, usePalette } from '@/localization';

export default function ZodiacCompatibilityScreen() {
  const {locale,messages}=useLocale(); const palette=usePalette(); const m=messages.compatibility;
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof compatibility> | null>(null);
  const product = PREMIUM_PRODUCTS.synastry;

  const calculate = () => {
    if (!first || !second) { setShowErrors(true); return; }
    setShowErrors(false);
    setResult(compatibility(first, second));
  };

  return <Screen>
    <View style={styles.hero}><Text style={styles.eyebrow}>{m.eyebrow}</Text><Text style={[styles.title,{color:palette.navy}]}>{m.title}</Text><Text style={[styles.description,{color:palette.muted}]}>{m.description}</Text></View>

    {!result ? <View style={[styles.formCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
      <SignSelector label={m.yours} locale={locale} value={first} onChange={(value) => { setFirst(value); setShowErrors(false); }} />
      <SignSelector label={m.partner} locale={locale} value={second} onChange={(value) => { setSecond(value); setShowErrors(false); }} />
      {showErrors ? <Text accessibilityRole="alert" style={styles.error}>{m.chooseBoth}</Text> : null}
      <Pressable accessibilityRole="button" onPress={calculate} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>{m.calculate}</Text></Pressable>
    </View> : <>
      <View style={[styles.resultCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
        <Text style={[styles.resultTitle,{color:palette.navy}]}>{localizeZodiacSignForLocale(first ?? '',locale)} &amp; {localizeZodiacSignForLocale(second ?? '',locale)} {m.result}</Text>
        <Text style={[styles.scoreLabel,{color:palette.muted}]}>{m.score}</Text><Text style={styles.score}>%{result.general}</Text>
        <View style={styles.scoreGrid}><Score label={m.love} value={result.love} /><Score label={m.communication} value={result.communication} /><Score label={m.passion} value={result.passion} /><Score label={m.longTerm} value={result.longTerm} /></View>
        <Text style={[styles.resultText,{color:palette.navy}]}>{result.text}</Text>
        <Text style={[styles.disclaimer,{color:palette.muted}]}>{m.disclaimer}</Text>
        <Pressable accessibilityRole="button" onPress={() => setResult(null)} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{m.recalculate}</Text></Pressable>
      </View>
      <View style={[styles.premiumCard,{backgroundColor:palette.surface,borderColor:palette.gold}]}>
        <Text style={[styles.premiumTitle,{color:palette.navy}]}>{m.premiumPrompt}</Text>
        <View style={styles.productRow}><Text style={[styles.productName,{color:palette.navy}]}>{locale === 'en' ? 'Professional Synastry' : product.title}</Text><Text style={styles.price}>{product.prototypePrice}</Text></View>
        <Text style={styles.premiumBadge}>PREMIUM</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/synastry')} style={({ pressed }) => [styles.premiumButton, pressed && styles.pressed]}><Text style={styles.premiumButtonText}>{m.premiumCta}</Text></Pressable>
      </View>
    </>}
  </Screen>;
}

function SignSelector({ label, value, onChange, locale }: { label: string; value: string | null; onChange: (value: string) => void; locale:'tr'|'en' }) {
  const palette=usePalette(); return <View style={styles.selector}><Text style={[styles.selectorLabel,{color:palette.navy}]}>{label}</Text><View style={styles.signGrid}>{ZODIAC_SIGNS.map((sign) => <Pressable accessibilityRole="radio" accessibilityState={{ checked: value === sign.id }} key={sign.id} onPress={() => onChange(sign.id)} style={({ pressed }) => [styles.signChip,{backgroundColor:palette.surface,borderColor:palette.border}, value === sign.id && styles.signChipSelected, pressed && styles.pressed]}><Text style={[styles.signText,{color:palette.navy}, value === sign.id && styles.signTextSelected]}>{localizeZodiacSignForLocale(sign.id,locale)}</Text></Pressable>)}</View></View>;
}

function Score({ label, value }: { label: string; value: number }) { const palette=usePalette(); return <View style={[styles.scoreItem,{backgroundColor:palette.sapphireSoft}]}><Text style={[styles.scoreItemLabel,{color:palette.navy}]}>{label}</Text><Text style={styles.scoreItemValue}>%{value}</Text></View>; }

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 9, paddingTop: 4 }, eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 }, title: { color: colors.navy, fontSize: 31, fontWeight: '800', lineHeight: 37, textAlign: 'center' }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 22, padding: 18 }, selector: { gap: 11 }, selectorLabel: { color: colors.navy, fontSize: 18, fontWeight: '800' }, signGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, signChip: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderRadius: 18, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 }, signChipSelected: { backgroundColor: colors.sapphire, borderColor: colors.sapphire }, signText: { color: colors.navy, fontSize: 15, fontWeight: '700' }, signTextSelected: { color: colors.white },
  error: { backgroundColor: '#F8E8E8', borderRadius: 13, color: colors.danger, fontSize: 15, lineHeight: 21, padding: 12 }, primaryButton: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56, paddingHorizontal: 12 }, primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  resultCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 23, borderWidth: 1, gap: 13, padding: 19 }, resultTitle: { color: colors.navy, fontSize: 24, fontWeight: '800', lineHeight: 30, textAlign: 'center' }, scoreLabel: { color: colors.muted, fontSize: 15, fontWeight: '700' }, score: { color: colors.sapphire, fontSize: 45, fontWeight: '900' }, scoreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%' }, scoreItem: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 14, flexBasis: '47%', flexGrow: 1, gap: 3, minHeight: 67, justifyContent: 'center', padding: 9 }, scoreItemLabel: { color: colors.navy, fontSize: 13, fontWeight: '700', textAlign: 'center' }, scoreItemValue: { color: colors.sapphire, fontSize: 18, fontWeight: '900' }, resultText: { color: colors.navy, fontSize: 16, lineHeight: 24 }, disclaimer: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, secondaryButton: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 15, borderWidth: 1, justifyContent: 'center', minHeight: 50, paddingHorizontal: 22 }, secondaryButtonText: { color: colors.sapphire, fontSize: 15, fontWeight: '800' },
  premiumCard: { backgroundColor: '#FBF3E3', borderColor: '#E4C98F', borderRadius: 21, borderWidth: 1, gap: 12, padding: 18 }, premiumTitle: { color: colors.navy, fontSize: 17, fontWeight: '700', lineHeight: 24 }, productRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' }, productName: { color: colors.navy, flex: 1, fontSize: 19, fontWeight: '800' }, price: { color: colors.gold, fontSize: 20, fontWeight: '900' }, premiumBadge: { alignSelf: 'flex-start', color: colors.gold, fontSize: 12, fontWeight: '900', letterSpacing: 0.8 }, premiumButton: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: 15, justifyContent: 'center', minHeight: 52, paddingHorizontal: 12 }, premiumButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' }, pressed: { opacity: 0.68 },
});
