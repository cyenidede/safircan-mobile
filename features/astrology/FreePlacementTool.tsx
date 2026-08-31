import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, layout } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { createNatalChart } from './api/natal-chart';
import { resolveCurrentBirthProfile, saveCurrentBirthInput } from './birthInputStorage';
import { localizeZodiacSignUppercase } from './zodiac';

export type FreePlacementToolKind = 'ascendant' | 'moon' | 'venus';

const TOOL_CONFIG = {
  ascendant: { eyebrow: 'YÜKSELEN BURÇ', title: 'Yükselen Burcunu Hesapla', description: 'Dış dünyaya nasıl yansıdığını ve insanların seni ilk nasıl algıladığını keşfet.', resultLabel: 'Yükselenin', resultDescription: 'Yükselen burcun, dış dünyaya verdiğin ilk izlenimi ve hayata yaklaşım biçimini anlatır.' },
  moon: { eyebrow: 'AY BURCU', title: 'Ay Burcunu Hesapla', description: 'Duygusal ihtiyaçlarını, iç dünyanı ve kendini nasıl güvende hissettiğini keşfet.', resultLabel: 'Ay Burcun', resultDescription: 'Ay burcun, duygusal ihtiyaçlarını, iç dünyanı ve kendini güvende hissetme biçimini anlatır.' },
  venus: { eyebrow: 'VENÜS BURCU', title: 'Venüs Burcunu Hesapla', description: 'Aşk dilini, ilişkilerde neye değer verdiğini ve çekim biçimini keşfet.', resultLabel: 'Venüs Burcun', resultDescription: 'Venüs burcun, sevgini nasıl gösterdiğini ve ilişkilerde nelere değer verdiğini anlatır.' },
} satisfies Record<FreePlacementToolKind, { eyebrow: string; title: string; description: string; resultLabel: string; resultDescription: string }>;

type PickerMode = 'date' | 'time' | null;
type FormErrors = Partial<Record<'birthDate' | 'birthTime' | 'birthPlace', string>>;

export function FreePlacementTool({ kind }: { kind: FreePlacementToolKind }) {
  const config = TOOL_CONFIG[kind];
  const { session } = useAuth();
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [birthTime, setBirthTime] = useState<Date | null>(null);
  const [birthPlace, setBirthPlace] = useState('');
  const [unknownBirthTime, setUnknownBirthTime] = useState(false);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [rectificationPrefill, setRectificationPrefill] = useState(false);
  const userEdited = useRef(false);

  useEffect(() => {
    let active = true;
    void resolveCurrentBirthProfile(session?.access_token).then((profile) => {
      if (!active || userEdited.current || !profile) return;
      const savedDate = parseDate(profile.birth_date);
      const savedTime = profile.birth_time ? parseTime(profile.birth_time) : null;
      if (!savedDate || (!profile.birth_time_unknown && !savedTime)) return;
      setBirthDate(savedDate);
      setBirthTime(savedTime);
      setBirthPlace(profile.birth_place);
      setUnknownBirthTime(profile.birth_time_unknown);
      setRectificationPrefill(profile.birth_time_source === 'rectification');
    }).catch(() => undefined);
    return () => { active = false; };
  }, [session?.access_token]);

  const markEdited = () => {
    userEdited.current = true;
    setSubmitError(null);
    setResult(null);
  };

  const validate = () => {
    const next: FormErrors = {};
    if (!birthDate) next.birthDate = 'Doğum tarihini seçmelisin.';
    if (!unknownBirthTime && !birthTime) next.birthTime = 'Doğum saatini seçmelisin.';
    if (!birthPlace.trim()) next.birthPlace = 'Doğum yerini yazmalısın.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (submitting || !validate() || !birthDate) return;
    if (unknownBirthTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const request = { birth_date: formatDate(birthDate), birth_time: unknownBirthTime ? null : birthTime ? formatTime(birthTime) : null, birth_time_unknown: unknownBirthTime, birthTimeKnown: !unknownBirthTime, birth_place: birthPlace.trim() };
      const response = await createNatalChart(request);
      const placement = kind === 'ascendant' ? response.chart.ascendant : response.chart[kind];
      if (!placement?.sign) throw new Error('temporary');
      await saveCurrentBirthInput(request).catch(() => undefined);
      setResult(placement.sign);
    } catch (error) {
      setSubmitError(error instanceof Error && error.message === 'place' ? 'Doğum yerini bulamadık. Şehir ve ülke adıyla tekrar dene.' : 'Şu anda hesaplama yapamıyoruz. Lütfen biraz sonra tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  const unknownMessage = kind === 'ascendant'
    ? 'Yükselen burcunu hesaplamak için doğum saatine ihtiyaç var.'
    : kind === 'moon'
      ? 'Ay burcu gün içinde değişebildiği için kesin sonuç için doğum saati gerekir.'
      : 'Doğum bilgilerini daha kesin değerlendirebilmek için doğum saatine ihtiyaç var.';

  return <Screen>
    <View style={styles.hero}><Text style={styles.eyebrow}>{config.eyebrow}</Text><Text style={styles.title}>{config.title}</Text><Text style={styles.description}>{config.description}</Text></View>
    {result ? <View style={styles.resultCard}>
      <Text style={styles.resultLabel}>{config.resultLabel}</Text><Text style={styles.resultSign}>{localizeZodiacSignUppercase(result)}</Text><Text style={styles.resultDescription}>{config.resultDescription}</Text>
      <Pressable accessibilityRole="button" onPress={() => { setResult(null); setErrors({}); }} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>TEKRAR HESAPLA</Text></Pressable>
    </View> : <View style={styles.formCard}>
      {rectificationPrefill ? <Text style={styles.prefillNotice}>Doğum saatin rektifikasyon sonucundan dolduruldu.</Text> : null}
      <PickerField label="Doğum Tarihi" value={birthDate ? birthDate.toLocaleDateString('tr-TR') : 'Tarih seç'} error={errors.birthDate} onPress={() => setPicker('date')} />
      {!unknownBirthTime ? <PickerField label="Doğum Saati" value={birthTime ? birthTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Saat seç'} error={errors.birthTime} onPress={() => setPicker('time')} /> : null}
      <View style={styles.switchRow}><Text style={styles.switchLabel}>Doğum saatimi bilmiyorum</Text><Switch accessibilityLabel="Doğum saatimi bilmiyorum" value={unknownBirthTime} onValueChange={(value) => { markEdited(); setUnknownBirthTime(value); if (value) setBirthTime(null); setErrors((current) => ({ ...current, birthTime: undefined })); }} trackColor={{ false: colors.border, true: '#8BAFD6' }} thumbColor={unknownBirthTime ? colors.sapphire : colors.white} /></View>
      <View style={styles.field}><Text style={styles.label}>Doğum Yeri</Text><TextInput autoCapitalize="words" onChangeText={(value) => { markEdited(); setBirthPlace(value); setErrors((current) => ({ ...current, birthPlace: undefined })); }} placeholder="Şehir, ülke" placeholderTextColor="#8B90A0" style={[styles.input, errors.birthPlace && styles.inputError]} value={birthPlace} />{errors.birthPlace ? <Text style={styles.error}>{errors.birthPlace}</Text> : null}</View>
      {picker ? <View style={Platform.OS === 'ios' ? styles.iosPicker : undefined}><DateTimePicker value={(picker === 'date' ? birthDate : birthTime) ?? new Date()} mode={picker} display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={picker === 'date' ? new Date() : undefined} locale="tr-TR" is24Hour onValueChange={(_, value) => { markEdited(); if (picker === 'date') { setBirthDate(value); setErrors((current) => ({ ...current, birthDate: undefined })); } else { setBirthTime(value); setErrors((current) => ({ ...current, birthTime: undefined })); } if (Platform.OS === 'android') setPicker(null); }} onDismiss={() => setPicker(null)} />{Platform.OS === 'ios' ? <Pressable style={styles.pickerDone} onPress={() => setPicker(null)}><Text style={styles.pickerDoneText}>Tamam</Text></Pressable> : null}</View> : null}
      {unknownBirthTime ? <View style={styles.infoCard}><Text style={styles.infoText}>{unknownMessage}</Text><Pressable accessibilityRole="button" onPress={() => router.push('/rectification')} style={styles.rectificationButton}><Text style={styles.rectificationButtonText}>DOĞUM SAATİMİ BUL</Text></Pressable></View> : null}
      {submitError ? <Text accessibilityRole="alert" style={styles.submitError}>{submitError}</Text> : null}
      {!unknownBirthTime ? <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}>{submitting ? <View style={styles.loadingRow}><ActivityIndicator color={colors.white} /><Text style={styles.submitText}>HESAPLANIYOR…</Text></View> : <Text style={styles.submitText}>HESAPLA</Text>}</Pressable> : null}
    </View>}
  </Screen>;
}

function PickerField({ label, value, error, onPress }: { label: string; value: string; error?: string; onPress: () => void }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" onPress={onPress} style={[styles.input, styles.pickerField, error && styles.inputError]}><Text style={styles.pickerText}>{value}</Text><Text style={styles.chevron}>›</Text></Pressable>{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }
function formatDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function formatTime(date: Date) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
function parseDate(value: string) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return null; const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12); return Number.isNaN(date.getTime()) ? null : date; }
function parseTime(value: string) { const match = /^(\d{2}):(\d{2})/.exec(value); if (!match) return null; const date = new Date(); date.setHours(Number(match[1]), Number(match[2]), 0, 0); return Number.isNaN(date.getTime()) ? null : date; }

const styles = StyleSheet.create({ hero: { alignItems: 'center', gap: 9, paddingTop: 4 }, eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 }, title: { color: colors.navy, fontSize: 29, fontWeight: '800', lineHeight: 35, textAlign: 'center' }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 390, textAlign: 'center' }, formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 17, padding: 18 }, field: { gap: 8 }, label: { color: colors.navy, fontSize: 16, fontWeight: '700' }, input: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 15, borderWidth: 1, color: colors.navy, fontSize: 17, minHeight: layout.controlHeight, paddingHorizontal: 16 }, inputError: { borderColor: colors.danger }, pickerField: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, pickerText: { color: colors.navy, fontSize: 17 }, chevron: { color: colors.sapphire, fontSize: 29 }, error: { color: colors.danger, fontSize: 14 }, switchRow: { alignItems: 'center', backgroundColor: colors.white, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', minHeight: 62, paddingHorizontal: 16 }, switchLabel: { color: colors.navy, flex: 1, fontSize: 16, fontWeight: '600' }, prefillNotice: { backgroundColor: colors.sapphireSoft, borderRadius: 13, color: colors.navy, fontSize: 14, lineHeight: 20, padding: 12 }, iosPicker: { backgroundColor: colors.white, borderRadius: 18, overflow: 'hidden', paddingBottom: 8 }, pickerDone: { alignItems: 'center', justifyContent: 'center', minHeight: 48 }, pickerDoneText: { color: colors.sapphire, fontSize: 17, fontWeight: '700' }, infoCard: { backgroundColor: colors.sapphireSoft, borderRadius: 16, gap: 12, padding: 15 }, infoText: { color: colors.navy, fontSize: 15, lineHeight: 22, textAlign: 'center' }, rectificationButton: { alignItems: 'center', minHeight: 48, justifyContent: 'center' }, rectificationButtonText: { color: colors.sapphire, fontSize: 15, fontWeight: '800' }, submit: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 56, paddingHorizontal: 12 }, submitText: { color: colors.white, fontSize: 16, fontWeight: '800' }, loadingRow: { alignItems: 'center', flexDirection: 'row', gap: 9 }, submitError: { backgroundColor: '#F8E8E8', borderRadius: 14, color: colors.danger, fontSize: 15, lineHeight: 22, padding: 14 }, resultCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, gap: 13, paddingHorizontal: 20, paddingVertical: 28 }, resultLabel: { color: colors.sapphire, fontSize: 16, fontWeight: '800' }, resultSign: { color: colors.navy, fontSize: 38, fontWeight: '900', letterSpacing: 1.1, textAlign: 'center' }, resultDescription: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 360, textAlign: 'center' }, secondaryButton: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 15, borderWidth: 1, justifyContent: 'center', marginTop: 5, minHeight: 52, paddingHorizontal: 24 }, secondaryButtonText: { color: colors.sapphire, fontSize: 15, fontWeight: '800' }, pressed: { opacity: 0.68 } });
