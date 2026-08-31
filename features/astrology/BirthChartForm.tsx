import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { colors, layout } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAstrologyChart } from './AstrologyChartProvider';
import { createNatalChart } from './api/natal-chart';
import { resolveCurrentBirthProfile, saveCurrentBirthInput } from './birthInputStorage';
import type { BirthChartFormErrors, BirthChartFormValues } from './types';
import { validateBirthChart } from './validation';
import { getDateOnlySunSign } from './sunSign';

const initialValues: BirthChartFormValues = { firstName: '', lastName: '', birthDate: null, birthTime: null, birthPlace: '', unknownBirthTime: false };
type PickerMode = 'date' | 'time' | null;

export function BirthChartForm() {
  const { setRequest, setResult } = useAstrologyChart();
  const { session } = useAuth();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const returnToDaily = params.returnTo === '/daily-transits';
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<BirthChartFormErrors>({});
  const [picker, setPicker] = useState<PickerMode>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rectificationPrefill, setRectificationPrefill] = useState(false);
  const userEdited = useRef(false);

  useEffect(() => {
    let active = true;
    void resolveCurrentBirthProfile(session?.access_token).then((profile) => {
      if (!active || userEdited.current || !profile) return;
      const birthDate = parseDate(profile.birth_date);
      const birthTime = profile.birth_time ? parseTime(profile.birth_time) : null;
      if (!birthDate || (!profile.birth_time_unknown && !birthTime)) return;
      setValues({ firstName: profile.first_name ?? '', lastName: profile.last_name ?? '', birthDate, birthTime, birthPlace: profile.birth_place, unknownBirthTime: profile.birth_time_unknown });
      setRectificationPrefill(profile.birth_time_source === 'rectification');
    }).catch(() => undefined);
    return () => { active = false; };
  }, [session?.access_token]);

  const update = <K extends keyof BirthChartFormValues>(key: K, value: BirthChartFormValues[K]) => {
    userEdited.current = true;
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSubmitError(null);
  };

  const onPickerChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPicker(null);
    if (event.type !== 'dismissed' && date && picker) update(picker === 'date' ? 'birthDate' : 'birthTime', date);
  };

  const submit = async () => {
    if (submitting) return;
    const nextErrors = validateBirthChart(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !values.birthDate) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (values.unknownBirthTime) {
        const sun = getDateOnlySunSign(values.birthDate);
        setResult({
          success: true,
          mode: 'sun-only',
          birthTimeKnown: false,
          birthDate: formatDate(values.birthDate),
          birthPlace: values.birthPlace.trim(),
          sun: sun.status === 'known' ? { sign: sun.sign } : null,
          requiresBirthTime: sun.status === 'time-required',
        });
        await saveCurrentBirthInput({ birth_date: formatDate(values.birthDate), birth_time: null, birth_time_unknown: true, birthTimeKnown: false, birth_place: values.birthPlace.trim() }).catch(() => undefined);
        router.push(returnToDaily ? '/daily-transits' : '/chart-result');
        return;
      }

      const request = {
        birth_date: formatDate(values.birthDate),
        birth_time: values.birthTime ? formatTime(values.birthTime) : null,
        birth_time_unknown: false,
        birthTimeKnown: true as const,
        birth_place: values.birthPlace.trim(),
      };
      const result = await createNatalChart(request);
      await saveCurrentBirthInput(request).catch(() => undefined);
      setRequest(request);
      setResult(result);
      router.push(returnToDaily ? '/daily-transits' : '/chart-result');
    } catch (error) {
      setSubmitError(error instanceof Error && error.message === 'place'
        ? 'Doğum yerini bulamadık. Şehir ve ülke adıyla tekrar dene.'
        : 'Şu anda haritanı oluşturamıyoruz. Lütfen biraz sonra tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  return <View style={styles.form}>
    <Field label="Ad" value={values.firstName} onChangeText={(text) => update('firstName', text)} error={errors.firstName} autoCapitalize="words" />
    <Field label="Soyad" value={values.lastName} onChangeText={(text) => update('lastName', text)} error={errors.lastName} autoCapitalize="words" />
    {rectificationPrefill ? <Text style={styles.prefillNotice}>Doğum saatin rektifikasyon sonucundan dolduruldu.</Text> : null}
    <PickerField label="Doğum Tarihi" value={values.birthDate ? values.birthDate.toLocaleDateString('tr-TR') : 'Tarih seç'} onPress={() => setPicker('date')} error={errors.birthDate} />
    {!values.unknownBirthTime ? <PickerField label="Doğum Saati" value={values.birthTime ? values.birthTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Saat seç'} onPress={() => setPicker('time')} error={errors.birthTime} /> : null}
    <View style={styles.switchRow}><Text style={styles.switchLabel}>Doğum saatimi bilmiyorum</Text><Switch accessibilityLabel="Doğum saatimi bilmiyorum" value={values.unknownBirthTime} onValueChange={(value) => { update('unknownBirthTime', value); if (value) update('birthTime', null); }} trackColor={{ false: colors.border, true: '#8BAFD6' }} thumbColor={values.unknownBirthTime ? colors.sapphire : colors.white} /></View>
    <Field label="Doğum Yeri" value={values.birthPlace} onChangeText={(text) => update('birthPlace', text)} error={errors.birthPlace} placeholder="Şehir, ülke" autoCapitalize="words" />
    {picker ? <View style={Platform.OS === 'ios' ? styles.iosPicker : undefined}><DateTimePicker value={(picker === 'date' ? values.birthDate : values.birthTime) ?? new Date()} mode={picker} display={Platform.OS === 'ios' ? 'spinner' : 'default'} maximumDate={picker === 'date' ? new Date() : undefined} locale="tr-TR" onChange={onPickerChange} />{Platform.OS === 'ios' ? <Pressable style={styles.pickerDone} onPress={() => setPicker(null)}><Text style={styles.pickerDoneText}>Tamam</Text></Pressable> : null}</View> : null}
    {submitError ? <Text accessibilityRole="alert" style={styles.submitError}>{submitError}</Text> : null}
    <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.submit, (pressed || submitting) && styles.pressed]}>{submitting ? <View style={styles.loadingRow}><ActivityIndicator color={colors.white} /><Text style={styles.submitText}>Gökyüzü konumların hesaplanıyor…</Text></View> : <Text style={styles.submitText}>HARİTAMI OLUŞTUR</Text>}</Pressable>
  </View>;
}

function formatDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
function formatTime(date: Date) { return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; }
function parseDate(value: string) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return null; const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12); return Number.isNaN(date.getTime()) ? null : date; }
function parseTime(value: string) { const match = /^(\d{2}):(\d{2})/.exec(value); if (!match) return null; const date = new Date(); date.setHours(Number(match[1]), Number(match[2]), 0, 0); return Number.isNaN(date.getTime()) ? null : date; }

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string; error?: string };
function Field({ label, error, ...props }: FieldProps) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} placeholderTextColor="#8B90A0" style={[styles.input, error && styles.inputError]} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }
function PickerField({ label, value, onPress, error, disabled }: { label: string; value: string; onPress: () => void; error?: string; disabled?: boolean }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.input, styles.pickerField, disabled && styles.disabled, error && styles.inputError]}><Text style={[styles.pickerText, disabled && styles.disabledText]}>{disabled ? 'Saat bilgisi kullanılmayacak' : value}</Text><Text style={styles.chevron}>›</Text></Pressable>{error ? <Text style={styles.error}>{error}</Text> : null}</View>; }

const styles = StyleSheet.create({ form: { gap: 18 }, field: { gap: 8 }, label: { color: colors.navy, fontSize: 16, fontWeight: '700' }, input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, color: colors.navy, fontSize: 17, minHeight: layout.controlHeight, paddingHorizontal: 16 }, inputError: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 14 }, prefillNotice: { backgroundColor: colors.sapphireSoft, borderRadius: 13, color: colors.navy, fontSize: 14, lineHeight: 20, padding: 12 }, pickerField: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, pickerText: { color: colors.navy, fontSize: 17 }, chevron: { color: colors.sapphire, fontSize: 29 }, disabled: { backgroundColor: '#EEEAE1' }, disabledText: { color: colors.muted }, switchRow: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 15, flexDirection: 'row', justifyContent: 'space-between', minHeight: 64, paddingHorizontal: 16 }, switchLabel: { color: colors.navy, flex: 1, fontSize: 16, fontWeight: '600' }, iosPicker: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden', paddingBottom: 10 }, pickerDone: { alignItems: 'center', minHeight: 48, justifyContent: 'center' }, pickerDoneText: { color: colors.sapphire, fontSize: 17, fontWeight: '700' }, submit: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58, marginTop: 4, paddingHorizontal: 12 }, submitText: { color: colors.white, fontSize: 15, fontWeight: '800', letterSpacing: 0.2 }, loadingRow: { alignItems: 'center', flexDirection: 'row', gap: 9 }, submitError: { backgroundColor: '#F8E8E8', borderRadius: 14, color: colors.danger, fontSize: 15, lineHeight: 22, padding: 14 }, pressed: { opacity: 0.65 } });
