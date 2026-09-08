import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { loadRectificationDraft, saveRectificationDraft } from '@/features/rectification/draftStorage';
import type { RectificationDraft } from '@/features/rectification/types';
import { clearRectificationDraft } from '@/features/rectification/draftStorage';
import { calculateRectification, RectificationRequestError, submitRectification } from '@/features/rectification/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { useEntitlements } from '@/features/premium/EntitlementProvider';
import { validateRectificationDraft } from '@/features/rectification/validation';
import { usePalette } from '@/localization';
import { useRectificationText } from '@/features/rectification/presentation';

const sections: Array<{ title: string; step: number; summary: (draft: RectificationDraft) => string }> = [
  { title: 'Doğum bilgileri', step: 1, summary: (d) => `${d.birth.date || 'Tarih yok'} • ${d.birth.city || 'İl yok'}` },
  { title: 'Aile', step: 2, summary: (d) => d.family.none ? 'Belirgin olay yok' : `${d.family.events.length} olay` },
  { title: 'Eğitim', step: 3, summary: (d) => `${d.education.events.length} önemli değişiklik` },
  { title: 'Taşınmalar', step: 4, summary: (d) => d.moves.none ? 'Önemli taşınma yok' : `${d.moves.events.length} taşınma` },
  { title: 'Kariyer', step: 5, summary: (d) => `${d.career.jobs.length} iş, ${d.career.events.length} kariyer olayı` },
  { title: 'İlişki / aile', step: 6, summary: (d) => `${d.relationships.events.length} ilişki olayı, ${d.relationships.children.length} çocuk kaydı` },
  { title: 'Sağlık / hukuki', step: 7, summary: (d) => `${d.majorEvents.healthEvents.length} sağlık, ${d.majorEvents.legalEvents.length} hukuki kayıt` },
  { title: 'Finans', step: 8, summary: (d) => `${d.finance.events.length} finansal olay` },
];

export default function RectificationReviewScreen() {
  const palette=usePalette(); const t=useRectificationText();
  const [draft, setDraft] = useState<RectificationDraft | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { session } = useAuth();
  const { hasEntitlement, loading: entitlementLoading } = useEntitlements();
  const canUseRectification = hasEntitlement('birth_time_rectification');
  useEffect(() => { if (!entitlementLoading && !canUseRectification) router.replace('/rectification'); }, [canUseRectification, entitlementLoading]);
  useEffect(() => { if (entitlementLoading || !canUseRectification) return; void loadRectificationDraft().then(setDraft); }, [canUseRectification, entitlementLoading]);
  if (entitlementLoading || !canUseRectification) return <Screen><Text style={[styles.loading,{color:palette.muted}]}>{t('Satın alma hakkın doğrulanıyor…')}</Text></Screen>;
  if (!draft) return <Screen><Text style={[styles.loading,{color:palette.muted}]}>{t('Cevapların yükleniyor…')}</Text></Screen>;
  const submit = async () => {
    const validation = validateRectificationDraft(draft);
    if (validation.firstStep !== null) { router.replace({ pathname: '/rectification-form', params: { step: String(validation.firstStep), validation: '1' } }); return; }
    if (!draft.consent) { setError('Talebini gönderebilmek için veri işleme onayını vermelisin.'); return; }
    if (!session?.access_token) { setError('Oturumunun süresi doldu. Lütfen tekrar giriş yap.'); return; }
    if (submitting) return;
    setSubmitting(true); setError('');
    try { const submittedRequest = await submitRectification(draft, session.access_token); const requestId = submittedRequest.request?.id; if (!requestId) throw new RectificationRequestError('network'); await calculateRectification(requestId, session.access_token); await clearRectificationDraft(); router.replace({ pathname: '/rectification-result', params: { requestId } }); }
    catch (requestError) { if (requestError instanceof RectificationRequestError && requestError.message === 'validation' && Object.keys(requestError.fields).length) { const step = requestError.fields.birth_date || requestError.fields.birth_city || requestError.fields.known_time_start || requestError.fields.known_time_end ? '1' : '8'; router.replace({ pathname: '/rectification-form', params: { step, validation: '1' } }); return; } setError(requestError instanceof Error && requestError.message === 'auth' ? 'Oturumunun süresi doldu. Lütfen tekrar giriş yap.' : requestError instanceof Error && requestError.message === 'entitlement' ? 'Doğum saati hesaplama satın alma hakkın doğrulanamadı.' : requestError instanceof Error && requestError.message === 'insufficient' ? 'Doğum saatini hesaplayabilmek için birkaç önemli tarih daha gerekiyor.' : requestError instanceof Error && requestError.message === 'validation' ? 'Lütfen işaretli alanları kontrol et.' : 'Şu anda doğum saatini hesaplayamıyoruz. Cevapların cihazında kayıtlı; lütfen daha sonra tekrar dene.'); }
    finally { setSubmitting(false); }
  };
  return <Screen>
    <View style={styles.header}><Text style={[styles.eyebrow,{color:palette.sapphire}]}>{t('SON KONTROL')}</Text><Text style={[styles.title,{color:palette.navy}]}>{t('Cevaplarını Gözden Geçir')}</Text><Text style={[styles.description,{color:palette.muted}]}>{t('Hesaplamayı başlatmadan önce her bölümü kontrol edebilir ve istediğin adıma dönebilirsin.')}</Text></View>
    <View style={styles.sections}>{sections.map((section) => <View key={section.step} style={[styles.sectionCard,{backgroundColor:palette.surface,borderColor:palette.border}]}><View style={styles.sectionCopy}><Text style={[styles.sectionTitle,{color:palette.navy}]}>{t(section.title)}</Text><Text style={[styles.sectionSummary,{color:palette.muted}]}>{t(section.summary(draft))}</Text></View><Pressable accessibilityRole="button" onPress={() => router.replace({ pathname: '/rectification-form', params: { step: String(section.step) } })} style={styles.editButton}><Text style={styles.editText}>{t('Düzenle')}</Text></Pressable></View>)}</View>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: draft.consent }} onPress={() => setDraft({ ...draft, consent: !draft.consent })} style={[styles.consent,{backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1}]}><Ionicons name={draft.consent ? 'checkbox' : 'square-outline'} size={27} color={draft.consent ? palette.sapphire : palette.muted} /><Text style={[styles.consentText,{color:palette.navy}]}>{t('Rektifikasyon çalışmasının yapılabilmesi için verdiğim bilgilerin bu amaçla işlenmesini kabul ediyorum.')}<Text style={{ color: palette.danger, fontWeight: '900' }}> *</Text></Text></Pressable>
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://safircan.com/gizlilik')} style={styles.privacy}><Text style={[styles.privacyText,{color:palette.sapphire}]}>{t('Gizlilik Politikası')}</Text><Ionicons name="open-outline" size={17} color={colors.sapphire} /></Pressable>
    {error ? <Text accessibilityRole="alert" style={[styles.error,{color:palette.danger,backgroundColor:palette.surface}]}>{t(error)}</Text> : null}
    <View style={styles.actions}><Pressable onPress={() => router.replace({ pathname: '/rectification-form', params: { step: '8' } })} style={styles.back}><Text style={styles.backText}>{t('Geri')}</Text></Pressable><Pressable disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}><Text style={styles.submitText}>{t(submitting?'Hazırlanıyor…':'OTOMATİK HESAPLAMAYI BAŞLAT')}</Text></Pressable></View>
  </Screen>;
}

const styles = StyleSheet.create({ header: { gap: 8 }, eyebrow: { color: colors.sapphire, fontSize: 13, fontWeight: '800', letterSpacing: 1 }, title: { color: colors.navy, fontSize: 28, fontWeight: '800', lineHeight: 34 }, description: { color: colors.muted, fontSize: 16, lineHeight: 23 }, loading: { color: colors.muted, fontSize: 17 }, sections: { gap: 9 }, sectionCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 72, padding: 13 }, sectionCopy: { flex: 1, gap: 3 }, sectionTitle: { color: colors.navy, fontSize: 16, fontWeight: '800' }, sectionSummary: { color: colors.muted, fontSize: 14 }, editButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46, paddingHorizontal: 8 }, editText: { color: colors.sapphire, fontSize: 15, fontWeight: '800' }, consent: { alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: 17, flexDirection: 'row', gap: 11, padding: 15 }, consentText: { color: colors.navy, flex: 1, fontSize: 15, lineHeight: 22 }, privacy: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 6, minHeight: 44 }, privacyText: { color: colors.sapphire, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' }, error: { backgroundColor: '#F8E8E8', borderRadius: 14, color: colors.danger, fontSize: 15, lineHeight: 21, padding: 13 }, actions: { flexDirection: 'row', gap: 10 }, back: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', minHeight: 58, paddingHorizontal: 20 }, backText: { color: colors.sapphire, fontSize: 16, fontWeight: '800' }, submit: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, flex: 1, justifyContent: 'center', minHeight: 58, paddingHorizontal: 10 }, submitText: { color: colors.white, fontSize: 15, fontWeight: '800', textAlign: 'center' }, pressed: { opacity: 0.65 } });
