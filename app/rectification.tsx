import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PREMIUM_PRODUCTS } from '@/constants/products';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useEntitlements } from '@/features/premium/EntitlementProvider';
import { useIAP } from '@/features/iap';
import { loadRectificationDraft } from '@/features/rectification/draftStorage';
import { useLocale, usePalette } from '@/localization';
import { useRectificationText } from '@/features/rectification/presentation';

export default function RectificationScreen() {
  const palette=usePalette(); const {messages}=useLocale(); const t=useRectificationText();
  const { user } = useAuth();
  const { hasEntitlement } = useEntitlements();
  const [hasDraft, setHasDraft] = useState(false);
  const [notice, setNotice] = useState('');
  const canStart = hasEntitlement('birth_time_rectification');
  const product = PREMIUM_PRODUCTS.birth_time_rectification;
  const { displayPrice, purchase, purchasing } = useIAP();
  const price = displayPrice(product.id);
  const firstName = typeof user?.user_metadata.first_name === 'string'
    ? user.user_metadata.first_name.trim()
    : '';

  useEffect(() => {
    if (!canStart) return;
    void loadRectificationDraft().then((draft) => setHasDraft(Boolean(draft && draft.status === 'draft')));
  }, [canStart]);

  const handlePrimaryAction = async () => {
    if (canStart) {
      router.push('/rectification-form');
      return;
    }
    const result = await purchase(product.id);
    if (!result.ok) setNotice(result.message);
  };

  return <Screen>
    <View style={styles.hero}>
      <View style={[styles.icon,{backgroundColor:palette.sapphireSoft}]}><Ionicons name="time-outline" size={30} color={palette.gold} /></View>
      <Text style={[styles.eyebrow,{color:palette.sapphire}]}>{t('DOĞUM SAATİ REKTİFİKASYONU')}</Text>
      <Text style={[styles.title,{color:palette.navy}]}>{t('Doğum Saatini Hesaplayalım')}</Text>
      <Text style={[styles.description,{color:palette.muted}]}>{t('Yaşamındaki önemli olayları astrolojik olarak karşılaştıran otomatik rektifikasyon çalışması.')}</Text>
    </View>

    {user ? <View style={[styles.accountCard,{backgroundColor:palette.sapphireSoft,borderColor:palette.border}]}>
      <Ionicons name="person-circle-outline" size={24} color={colors.sapphire} />
      <View style={styles.accountCopy}>
        <Text style={[styles.accountTitle,{color:palette.navy}]}>{t(firstName ? `${firstName}, hesabın hazır` : 'Hesabın hazır')}</Text>
        <Text style={[styles.accountText,{color:palette.muted}]}>{user.email}</Text>
      </View>
    </View> : null}

    <View style={[styles.card,{backgroundColor:palette.surface,borderColor:palette.border}]}>
      <View style={styles.productHeading}><Text style={[styles.productTitle,{color:palette.navy}]}>{t(product.title)}</Text>{price ? <Text style={[styles.price,{color:palette.gold}]}>{price}</Text> : null}</View>
      <Text style={[styles.cardTitle,{color:palette.navy}]}>{t('Nasıl ilerleyecek?')}</Text>
      <View style={styles.steps}>
        <Step number="1" text={t('Rektifikasyon ürününü satın al.')} />
        <Step number="2" text={t('Satın alma hakkın doğrulandıktan sonra 8 adımlık formu tamamla.')} />
        <Step number="3" text={t('Otomatik hesaplama tamamlandığında tek doğum saatini gör ve profiline kaydet.')} />
      </View>
      <Text style={[styles.paidNotice,{backgroundColor:palette.sapphireSoft,color:palette.navy}]}>{t('Form, ödeme tamamlanmadan açılmaz.')}</Text>
      <Pressable accessibilityRole="button" disabled={purchasing === product.id} onPress={() => { void handlePrimaryAction(); }} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
        <Text style={styles.ctaText}>{canStart ? t(hasDraft ? 'FORMA DEVAM ET' : '8 ADIMLIK FORMA BAŞLA') : purchasing === product.id ? t('APP STORE AÇILIYOR…') : price ? `${messages.premiumScreen.rectificationCta} — ${price}` : messages.premiumScreen.rectificationCta}</Text>
      </Pressable>
      {notice ? <View accessibilityLiveRegion="polite" style={styles.notice}><Ionicons name="information-circle-outline" size={20} color={colors.sapphire} /><Text style={styles.noticeText}>{notice}</Text></View> : null}
    </View>
  </Screen>;
}

function Step({ number, text }: { number: string; text: string }) {
  const palette=usePalette(); return <View style={styles.step}><View style={[styles.stepNumber,{backgroundColor:palette.sapphireSoft}]}><Text style={[styles.stepNumberText,{color:palette.sapphire}]}>{number}</Text></View><Text style={[styles.stepText,{color:palette.navy}]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 10, paddingTop: 6 }, icon: { alignItems: 'center', backgroundColor: '#F4E8CE', borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }, eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '800', letterSpacing: 1.1, textAlign: 'center' }, title: { color: colors.navy, fontSize: 29, fontWeight: '800', lineHeight: 35, textAlign: 'center' }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' }, accountCard: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 17, flexDirection: 'row', gap: 11, padding: 14 }, accountCopy: { flex: 1, gap: 2 }, accountTitle: { color: colors.navy, fontSize: 15, fontWeight: '800' }, accountText: { color: colors.muted, fontSize: 14 }, card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 14, padding: 19 }, productHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' }, productTitle: { color: colors.navy, flex: 1, fontSize: 21, fontWeight: '800' }, price: { color: colors.gold, fontSize: 23, fontWeight: '900' }, cardTitle: { color: colors.navy, fontSize: 21, fontWeight: '800' }, steps: { gap: 13 }, step: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 }, stepNumber: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 15, height: 30, justifyContent: 'center', width: 30 }, stepNumberText: { color: colors.sapphire, fontSize: 14, fontWeight: '900' }, stepText: { color: colors.navy, flex: 1, fontSize: 15, lineHeight: 22 }, paidNotice: { backgroundColor: '#F4E8CE', borderRadius: 13, color: colors.navy, fontSize: 15, fontWeight: '700', lineHeight: 21, padding: 12, textAlign: 'center' }, cta: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56, paddingHorizontal: 12 }, ctaText: { color: colors.white, fontSize: 16, fontWeight: '800', textAlign: 'center' }, notice: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 16, flexDirection: 'row', gap: 9, padding: 14 }, noticeText: { color: colors.navy, flex: 1, fontSize: 15, lineHeight: 21 }, pressed: { opacity: 0.72 },
});
