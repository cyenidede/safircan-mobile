import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { memo, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors, layout } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { useLocale, usePalette } from '@/localization';
import { createSynastryReport, type SynastryPersonRequest } from './api';
import { formatSynastryIndicatorSummary } from './indicatorSummaryPresentation';
import type { SynastryQuestionAnswer, SynastryRelationshipType } from './types';

type PersonDraft = { name: string; birthDate: Date | null; birthTime: Date | null; birthPlace: string; unknownBirthTime: boolean };
type PersonErrors = Partial<Record<'name' | 'birthDate' | 'birthTime' | 'birthPlace', string>>;
type PickerTarget = { person: 'self' | 'other'; mode: 'date' | 'time' } | null;
const emptyPerson = (): PersonDraft => ({ name: '', birthDate: null, birthTime: null, birthPlace: '', unknownBirthTime: false });

function getDevelopmentPreviewAnswers(type: SynastryRelationshipType): readonly SynastryQuestionAnswer[] {
  if (!__DEV__) return [];
  const preview = require('./devSynastryPreviewFixture') as typeof import('./devSynastryPreviewFixture');
  return type === 'dating' ? preview.DEV_DATING_ANSWERS : preview.DEV_MARRIED_ANSWERS;
}

export function SynastryExperience() {
  const { locale, messages } = useLocale(); const palette=usePalette(); const m=messages.synastry;
  const { session } = useAuth();
  const [relationshipType, setRelationshipType] = useState<SynastryRelationshipType | null>(null);
  const [self, setSelf] = useState<PersonDraft>(emptyPerson);
  const [other, setOther] = useState<PersonDraft>(emptyPerson);
  const [selfErrors, setSelfErrors] = useState<PersonErrors>({});
  const [otherErrors, setOtherErrors] = useState<PersonErrors>({});
  const [picker, setPicker] = useState<PickerTarget>(null);
  const [results, setResults] = useState<readonly SynastryQuestionAnswer[] | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const otherLabel = relationshipType === 'married' ? m.spouse : m.partner;
  const currentPickerValue = picker
    ? ((picker.person === 'self' ? self : other)[picker.mode === 'date' ? 'birthDate' : 'birthTime'] ?? new Date())
    : new Date();

  const updatePerson = (person: 'self' | 'other', patch: Partial<PersonDraft>) => {
    const setDraft = person === 'self' ? setSelf : setOther;
    const setErrors = person === 'self' ? setSelfErrors : setOtherErrors;
    setDraft((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
  };

  const openPreview = (type: SynastryRelationshipType) => {
    if (!__DEV__) return;
    setRelationshipType(type);
    setSelf((current) => ({ ...current, name: current.name || 'Selin' }));
    setOther((current) => ({ ...current, name: current.name || 'Emre' }));
    setResults(getDevelopmentPreviewAnswers(type));
  };

  const submit = async () => {
    if (!relationshipType || submitting) return;
    const validation={name:messages.birthForm.firstNameError,birthDate:messages.birthForm.dateError,birthTime:messages.birthForm.timeError,birthPlace:messages.birthForm.placeRequired};
    const nextSelfErrors = validatePerson(self,validation);
    const nextOtherErrors = validatePerson(other,validation);
    setSelfErrors(nextSelfErrors);
    setOtherErrors(nextOtherErrors);
    if (Object.keys(nextSelfErrors).length || Object.keys(nextOtherErrors).length) return;
    if (!session?.access_token) {
      setPreviewMessage(m.signIn);
      return;
    }
    setSubmitting(true);
    setPreviewMessage(null);
    try {
      const response = await createSynastryReport({
        relationshipType,
        personA: personRequest(self),
        personB: personRequest(other),
      }, session.access_token);
      setResults(response.answers);
    } catch (error) {
      const kind = error instanceof Error ? error.message : 'temporary';
      setPreviewMessage(kind === 'auth'
        ? m.session
        : kind === 'entitlement'
          ? m.entitlement
          : kind === 'place'
            ? m.placeError : m.error);
    } finally {
      setSubmitting(false);
    }
  };

  if (results && relationshipType) {
    return <SynastryResults
      answers={results}
      names={{ self: self.name.trim() || m.you, other: other.name.trim() || (relationshipType === 'married' ? m.spouseName : m.partnerName) }}
      relationshipType={relationshipType}
      onBack={() => setResults(null)}
    />;
  }

  return <Screen>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>{m.eyebrow}</Text><Text style={[styles.heroTitle,{color:palette.navy}]}>{m.title}</Text><Text style={[styles.heroDescription,{color:palette.muted}]}>{m.description}</Text>
    </View>

    {!relationshipType ? <>
      <View style={styles.choiceList}>
        <RelationshipCard icon="heart" label={m.dating} onPress={() => setRelationshipType('dating')} /><RelationshipCard icon="diamond" label={m.married} onPress={() => setRelationshipType('married')} />
      </View>
      {__DEV__ ? <View style={[styles.previewPanel,{backgroundColor:palette.surface,borderColor:palette.gold}]}>
        <Text style={styles.previewTitle}>{m.preview}</Text><Text style={styles.previewCopy}>{m.previewCopy}</Text>
        <View style={styles.previewActions}>
          <SmallButton label={m.datingPreview} onPress={() => openPreview('dating')} /><SmallButton label={m.marriedPreview} onPress={() => openPreview('married')} />
        </View>
      </View> : null}
    </> : <>
      <Pressable accessibilityRole="button" onPress={() => setRelationshipType(null)} style={styles.changeType}>
        <Ionicons name="chevron-back" size={18} color={colors.sapphire} />
        <Text style={styles.changeTypeText}>{m.change}</Text>
      </Pressable>
      <PersonForm
        draft={self} errors={selfErrors} heading={m.yours} person="self"
        onOpenPicker={(mode) => setPicker({ person: 'self', mode })}
        onUpdate={(patch) => updatePerson('self', patch)}
      />
      <PersonForm
        draft={other} errors={otherErrors} heading={otherLabel} person="other"
        onOpenPicker={(mode) => setPicker({ person: 'other', mode })}
        onUpdate={(patch) => updatePerson('other', patch)}
      />
      {(self.unknownBirthTime || other.unknownBirthTime) ? <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={21} color={colors.sapphire} />
        <Text style={[styles.infoText,{color:palette.navy}]}>{m.unknownInfo}</Text>
      </View> : null}
      {picker ? <View style={Platform.OS === 'ios' ? styles.iosPicker : undefined}>
        <DateTimePicker
          value={currentPickerValue}
          mode={picker.mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          maximumDate={picker.mode === 'date' ? new Date() : undefined}
          locale={locale === 'tr' ? 'tr-TR' : 'en-US'}
          onValueChange={(_, date) => {
            updatePerson(picker.person, picker.mode === 'date' ? { birthDate: date } : { birthTime: date });
            if (Platform.OS === 'android') setPicker(null);
          }}
          onDismiss={() => setPicker(null)}
        />
        {Platform.OS === 'ios' ? <Pressable onPress={() => setPicker(null)} style={styles.pickerDone}><Text style={styles.pickerDoneText}>{messages.birthForm.done}</Text></Pressable> : null}
      </View> : null}
      {previewMessage ? <Text style={styles.previewMessage}>{previewMessage}</Text> : null}
      <Pressable accessibilityRole="button" disabled={submitting} onPress={() => void submit()} style={({ pressed }) => [styles.cta, (pressed || submitting) && styles.pressed]}>
        <Text style={styles.ctaText}>{submitting ? m.preparing : m.submit}</Text>
      </Pressable>
    </>}
  </Screen>;
}

function localDate(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function localTime(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

function personRequest(person: PersonDraft): SynastryPersonRequest {
  return {
    ...(person.name.trim() ? { name: person.name.trim() } : {}),
    birth_date: localDate(person.birthDate!),
    ...(person.unknownBirthTime ? {} : { birth_time: localTime(person.birthTime!) }),
    birth_time_unknown: person.unknownBirthTime,
    birth_place: person.birthPlace.trim(),
  };
}

function validatePerson(person: PersonDraft, labels: Record<'name'|'birthDate'|'birthTime'|'birthPlace',string>): PersonErrors {
  const errors: PersonErrors = {};
  if (!person.name.trim()) errors.name = labels.name;
  if (!person.birthDate) errors.birthDate = labels.birthDate;
  if (!person.unknownBirthTime && !person.birthTime) errors.birthTime = labels.birthTime;
  if (!person.birthPlace.trim()) errors.birthPlace = labels.birthPlace;
  return errors;
}

function RelationshipCard({ icon, label, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; onPress: () => void }) {
  const palette=usePalette(); return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.relationshipCard,{backgroundColor:palette.surface,borderColor:palette.border}, pressed && styles.pressed]}>
    <View style={styles.relationshipIcon}><Ionicons name={icon} size={25} color={colors.sapphire} /></View>
    <Text style={[styles.relationshipLabel,{color:palette.navy}]}>{label}</Text>
    <Ionicons name="chevron-forward" size={23} color={colors.sapphire} />
  </Pressable>;
}

function SmallButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={styles.smallButton}><Text style={styles.smallButtonText}>{label}</Text></Pressable>;
}

function PersonForm({ draft, errors, heading, person, onOpenPicker, onUpdate }: {
  draft: PersonDraft; errors: PersonErrors; heading: string; person: 'self' | 'other';
  onOpenPicker: (mode: 'date' | 'time') => void; onUpdate: (patch: Partial<PersonDraft>) => void;
}) {
  const {locale,messages}=useLocale(); const palette=usePalette(); const s=messages.synastry; const b=messages.birthForm;
  const unknownLabel = person === 'self' ? s.unknownMine : s.unknownOther;
  return <View style={[styles.formCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
    <Text style={[styles.formHeading,{color:palette.navy}]}>{heading}</Text>
    <LabeledInput label={b.firstName} value={draft.name} onChangeText={(name) => onUpdate({ name })} error={errors.name} />
    <PickerButton label={b.birthDate} value={draft.birthDate?.toLocaleDateString(locale==='tr'?'tr-TR':'en-US') ?? b.selectDate} onPress={() => onOpenPicker('date')} error={errors.birthDate} />
    {!draft.unknownBirthTime ? <PickerButton label={b.birthTime} value={draft.birthTime?.toLocaleTimeString(locale==='tr'?'tr-TR':'en-US', { hour: '2-digit', minute: '2-digit' }) ?? b.selectTime} onPress={() => onOpenPicker('time')} error={errors.birthTime} /> : null}
    <View style={[styles.switchRow,{backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1}]}>
      <Text style={[styles.switchLabel,{color:palette.navy}]}>{unknownLabel}</Text>
      <Switch value={draft.unknownBirthTime} onValueChange={(unknownBirthTime) => onUpdate({ unknownBirthTime, ...(unknownBirthTime ? { birthTime: null } : {}) })} trackColor={{ false: palette.border, true: palette.sapphire }} thumbColor={draft.unknownBirthTime ? palette.white : palette.muted} />
    </View>
    <LabeledInput label={person === 'self' ? s.placeMine : s.placeOther} placeholder={b.placePlaceholder} value={draft.birthPlace} onChangeText={(birthPlace) => onUpdate({ birthPlace })} error={errors.birthPlace} />
  </View>;
}

function LabeledInput({ label, error, ...props }: React.ComponentProps<typeof TextInput> & { label: string; error?: string }) {
  const palette=usePalette(); return <View style={styles.field}><Text style={[styles.label,{color:palette.navy}]}>{label}</Text><TextInput {...props} autoCapitalize="words" placeholderTextColor={palette.muted} style={[styles.input,{backgroundColor:palette.background,borderColor:palette.border,color:palette.navy}, error && styles.inputError]} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}

function PickerButton({ label, value, onPress, error }: { label: string; value: string; onPress: () => void; error?: string }) {
  const palette=usePalette(); return <View style={styles.field}><Text style={[styles.label,{color:palette.navy}]}>{label}</Text><Pressable accessibilityRole="button" onPress={onPress} style={[styles.input, styles.pickerButton,{backgroundColor:palette.background,borderColor:palette.border}, error && styles.inputError]}><Text style={[styles.pickerText,{color:palette.navy}]}>{value}</Text><Ionicons name="chevron-forward" size={20} color={palette.sapphire} /></Pressable>{error ? <Text style={styles.error}>{error}</Text> : null}</View>;
}

function SynastryResults({ answers, names, relationshipType, onBack }: { answers: readonly SynastryQuestionAnswer[]; names: { self: string; other: string }; relationshipType: SynastryRelationshipType; onBack: () => void }) {
  const {messages}=useLocale(); const palette=usePalette(); const m=messages.synastry; const subtitle = relationshipType === 'married' ? m.marriedSubtitle : m.datingSubtitle;
  return <Screen>
    <Pressable accessibilityRole="button" onPress={onBack} style={styles.changeType}><Ionicons name="chevron-back" size={18} color={colors.sapphire} /><Text style={styles.changeTypeText}>{m.back}</Text></Pressable>
    <View style={styles.hero}>
      {__DEV__ ? <Text style={styles.devBadge}>DEVELOPMENT PREVIEW</Text> : null}
      <Text style={styles.eyebrow}>{m.resultEyebrow}</Text><Text style={[styles.resultNames,{color:palette.navy}]}>{names.self} &amp; {names.other}</Text><Text style={[styles.heroDescription,{color:palette.muted}]}>{subtitle}</Text>
    </View>
    <View style={styles.questionsHeader}><Text style={[styles.questionsTitle,{color:palette.navy}]}>{m.questions}</Text><Text style={styles.questionsCount}>{answers.length} {m.answers}</Text></View>
    <View style={styles.questionList}>{answers.map((answer) => <QuestionCard key={answer.questionId} answer={answer} />)}</View>
  </Screen>;
}

const QuestionCard = memo(function QuestionCard({ answer }: { answer: SynastryQuestionAnswer }) {
  const {messages}=useLocale(); const palette=usePalette(); const m=messages.synastry;
  const [open, setOpen] = useState(false);
  const summaries = useMemo(
    () => answer.indicatorSummary.slice(0, 5).map(formatSynastryIndicatorSummary),
    [answer.indicatorSummary],
  );
  return <View style={[styles.questionCard,{backgroundColor:palette.surface,borderColor:palette.border}]}>
    <Text style={[styles.question,{color:palette.navy}]}>{answer.question}</Text>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen((value) => !value)} style={styles.answerToggle}>
      <Text style={styles.answerToggleText}>{open ? m.hide : m.show}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={17} color={colors.sapphire} />
    </Pressable>
    {open ? <View style={styles.answerBody}>
      <Text style={[styles.answerText,{color:palette.navy}]}>{answer.answer}</Text><Text style={styles.indicatorTitle}>{m.indicators}</Text>
      <View style={styles.indicators}>{summaries.map((summary) => <View key={summary} style={styles.indicator}><Text style={styles.indicatorText}>{summary}</Text></View>)}</View>
    </View> : null}
  </View>;
});

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 7, paddingVertical: 8 }, eyebrow: { color: colors.sapphire, fontSize: 12, fontWeight: '900', letterSpacing: 1 }, heroTitle: { color: colors.navy, fontSize: 34, fontWeight: '900', lineHeight: 40 }, heroDescription: { color: colors.muted, fontSize: 16, lineHeight: 23, maxWidth: 390, textAlign: 'center' },
  choiceList: { gap: 12 }, relationshipCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, flexDirection: 'row', minHeight: 78, paddingHorizontal: 17 }, relationshipIcon: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 18, height: 46, justifyContent: 'center', width: 46 }, relationshipLabel: { color: colors.navy, flex: 1, fontSize: 20, fontWeight: '900', marginLeft: 14 },
  previewPanel: { backgroundColor: '#F4EBDD', borderColor: '#D8BF8C', borderRadius: 18, borderWidth: 1, gap: 9, padding: 15 }, previewTitle: { color: colors.navy, fontSize: 17, fontWeight: '900' }, previewCopy: { color: colors.muted, fontSize: 14, lineHeight: 20 }, previewActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, smallButton: { backgroundColor: colors.navy, borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 13 }, smallButtonText: { color: colors.white, fontSize: 13, fontWeight: '800' },
  changeType: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', minHeight: 44 }, changeTypeText: { color: colors.sapphire, fontSize: 14, fontWeight: '800' }, formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 14, padding: 16 }, formHeading: { color: colors.navy, fontSize: 21, fontWeight: '900' }, field: { gap: 7 }, label: { color: colors.navy, fontSize: 15, fontWeight: '800' }, input: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.navy, fontSize: 16, minHeight: layout.controlHeight, paddingHorizontal: 15 }, inputError: { borderColor: colors.danger }, error: { color: colors.danger, fontSize: 13 }, pickerButton: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, pickerText: { color: colors.navy, fontSize: 16 }, switchRow: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 14, flexDirection: 'row', justifyContent: 'space-between', minHeight: 60, paddingHorizontal: 14 }, switchLabel: { color: colors.navy, flex: 1, fontSize: 15, fontWeight: '700', paddingRight: 10 }, infoCard: { alignItems: 'flex-start', backgroundColor: colors.sapphireSoft, borderRadius: 16, flexDirection: 'row', gap: 9, padding: 14 }, infoText: { color: colors.navy, flex: 1, fontSize: 14, lineHeight: 20 }, iosPicker: { backgroundColor: colors.surface, borderRadius: 18, overflow: 'hidden' }, pickerDone: { alignItems: 'center', justifyContent: 'center', minHeight: 48 }, pickerDoneText: { color: colors.sapphire, fontSize: 16, fontWeight: '800' }, previewMessage: { backgroundColor: colors.sapphireSoft, borderRadius: 14, color: colors.navy, fontSize: 14, lineHeight: 20, padding: 14 }, cta: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58, paddingHorizontal: 14 }, ctaText: { color: colors.white, fontSize: 15, fontWeight: '900' }, pressed: { opacity: 0.72 },
  devBadge: { backgroundColor: colors.gold, borderRadius: 99, color: colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.7, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 4 }, resultNames: { color: colors.navy, fontSize: 30, fontWeight: '900', lineHeight: 36, textAlign: 'center' }, questionsHeader: { gap: 3 }, questionsTitle: { color: colors.navy, fontSize: 22, fontWeight: '900', lineHeight: 28 }, questionsCount: { color: colors.sapphire, fontSize: 14, fontWeight: '800' }, questionList: { gap: 10 }, questionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, gap: 6, maxWidth: 430, padding: 14, width: '100%' }, question: { color: colors.navy, fontSize: 17, fontWeight: '900', lineHeight: 23 }, answerToggle: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 4, minHeight: 42 }, answerToggleText: { color: colors.sapphire, fontSize: 14, fontWeight: '800' }, answerBody: { gap: 10 }, answerText: { color: colors.navy, fontSize: 15, lineHeight: 21 }, indicatorTitle: { color: colors.gold, fontSize: 13, fontWeight: '900', marginTop: 2 }, indicators: { alignItems: 'flex-start', gap: 5 }, indicator: { backgroundColor: colors.sapphireSoft, borderRadius: 14, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 6 }, indicatorText: { color: colors.navy, flexShrink: 1, fontSize: 12, fontWeight: '700', lineHeight: 17 },
});
