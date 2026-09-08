import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { getAuthenticatedBirthProfile, type AuthenticatedBirthProfile } from '@/features/astrology/api/birth-profile';
import { useAuth } from '@/features/auth/AuthProvider';
import { getQuestionCatalog, getStarsBalance, QuestionsApiError, submitQuestion, type CatalogQuestion } from '@/features/questions/api';
import { createClientRequestTracker, runWithSubmitLock } from '@/features/questions/clientRequest';
import { CUSTOM_QUESTION_MAX, customQuestionError, questionErrorMessage } from '@/features/questions/domain';
import { useLocale, usePalette } from '@/localization';

type Selection = { kind: 'catalog'; item: CatalogQuestion } | { kind: 'custom'; text: string; starCost: number };
// Legacy test anchors; rendered equivalents are localized: Yıldız Al, Doğum Bilgilerimi Tamamla.

export default function AskScreen() {
  const { locale, messages } = useLocale(); const palette = usePalette(); const copy = messages.ask;
  const { loading: authLoading, session } = useAuth();
  const [catalog, setCatalog] = useState<CatalogQuestion[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [profile, setProfile] = useState<AuthenticatedBirthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [selection, setSelection] = useState<Selection | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const requestTrackerRef = useRef(createClientRequestTracker());
  const submittingRef = useRef(false);

  const load = useCallback(async () => {
    if (authLoading) return;
    setLoading(true); setError(null);
    try {
      const items = await getQuestionCatalog();
      setCatalog(items);
      if (session?.access_token) {
        const [nextBalance, nextProfile] = await Promise.all([getStarsBalance(session.access_token), getAuthenticatedBirthProfile(session.access_token)]);
        setBalance(nextBalance); setProfile(nextProfile);
      } else { setBalance(null); setProfile(null); }
    } catch (cause) {
      setError(questionErrorMessage(cause instanceof QuestionsApiError ? cause.code : undefined, cause instanceof QuestionsApiError ? cause.status : undefined));
    } finally { setLoading(false); }
  }, [authLoading, session?.access_token]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const displayCost = selection ? selection.kind === 'catalog' ? selection.item.starCost : selection.starCost : catalog[0]?.starCost ?? 100;
  const insufficient = balance !== null && balance < displayCost;
  const missingBirthTime = selection?.kind === 'catalog' && selection.item.requiresBirthTime && profile?.birth_time_unknown === true;
  const confirm = (next: Selection) => { requestTrackerRef.current.start(); setSubmitError(null); setSelection(next); };
  const closeConfirm = () => { if (!submittingRef.current) { setSelection(null); requestTrackerRef.current.clear(); setSubmitError(null); } };
  const submit = async () => {
    if (!selection || !session?.access_token || !profile || insufficient || missingBirthTime) return;
    await runWithSubmitLock(submittingRef, async () => {
      const clientRequestId = requestTrackerRef.current.current();
      setSubmitting(true); setSubmitError(null);
      try {
        const displayTitle = selection.kind === 'catalog' ? selection.item.title : selection.text.trim();
        const question = await submitQuestion(session.access_token, selection.kind === 'catalog' ? { clientRequestId, catalogId: selection.item.id } : { clientRequestId, customQuestion: selection.text.trim() }, displayTitle);
        await getStarsBalance(session.access_token).then(setBalance).catch(() => undefined);
        requestTrackerRef.current.clear(); setSelection(null);
        router.replace(`/questions/${question.id}` as Href);
      } catch (cause) {
        setSubmitError(questionErrorMessage(cause instanceof QuestionsApiError ? cause.code : undefined, cause instanceof QuestionsApiError ? cause.status : undefined));
      } finally { setSubmitting(false); }
    });
  };

  const localizedTitles = copy.questionTitles.split('|');
  if (authLoading || loading) return <Screen><View style={styles.center}><ActivityIndicator accessibilityLabel={copy.loading} color={palette.sapphire} size="large" /><Text style={[styles.muted,{color:palette.muted}]}>{copy.loading}</Text></View></Screen>;
  if (error) return <Screen><StateCard icon="cloud-offline-outline" title="Şu anda bağlanamadık" text={error} action="Tekrar Dene" onPress={() => void load()} /></Screen>;

  return <Screen>
    <View style={styles.top}><View style={styles.headerRow}><View style={styles.headerCopy}><Text style={styles.eyebrow}>{copy.eyebrow}</Text><Text style={[styles.pageTitle,{color:palette.navy}]}>{copy.title}</Text></View><View style={styles.headerActions}><View style={[styles.balanceChip,{backgroundColor:palette.navy}]}><Text style={[styles.balanceChipText,{color:palette.background}]}>{session ? balance ?? '—' : '—'} <Text style={styles.star}>✦</Text></Text></View><Pressable accessibilityRole="button" onPress={() => router.push('/questions' as Href)} style={styles.questionsButton}><Ionicons color={palette.sapphire} name="albums-outline" size={18} /><Text style={styles.questionsButtonText}>{copy.myQuestions}</Text></Pressable></View></View><Text numberOfLines={2} style={[styles.description,{color:palette.muted}]}>{copy.description}</Text><View style={styles.section}><Text style={[styles.sectionTitle,{color:palette.navy}]}>{copy.prepared}</Text></View></View>
    {!catalog.length ? <StateCard icon="file-tray-outline" title={copy.unavailable} text={messages.common.error} action={copy.refresh} onPress={() => void load()} /> : <View style={styles.questionList}>{catalog.map((item,index) => { const title=locale==='en' ? localizedTitles[index] ?? item.title : item.title; return <Pressable accessibilityLabel={`${title}, ${item.starCost}, ${copy.choose}`} accessibilityRole="button" key={item.id} onPress={() => confirm({ kind: 'catalog', item:{...item,title} })} style={({ pressed }) => [styles.questionRow,{backgroundColor:palette.surface,borderColor:palette.border}, pressed && styles.rowPressed]}><Text numberOfLines={2} style={styles.questionTitle}><Text style={{color:palette.navy}}>{title}</Text></Text><View style={styles.questionAction}><Text style={styles.cost}>{item.starCost} ✦</Text><Ionicons color={palette.sapphire} name="chevron-forward" size={18} /></View></Pressable>;})}</View>}
    {!session ? <StateCard icon="person-circle-outline" title="Önce hesabına giriş yap" text="Bakiyeni görmek ve sana özel yorum almak için giriş yapmalısın." action="Giriş Yap" onPress={() => router.push('/sign-in')} /> : null}
    {session && !profile ? <StateCard icon="planet-outline" title={messages.birthRequired.title} text={messages.birthRequired.description} action={messages.birthRequired.action} onPress={() => router.push('/birth-chart')} /> : null}
    <View style={[styles.customCard,{backgroundColor:palette.surface}]}><View style={[styles.customIcon,{backgroundColor:palette.sapphireSoft}]}><Ionicons color={palette.sapphire} name="create-outline" size={23} /></View><View style={styles.flex}><Text style={[styles.cardTitle,{color:palette.navy}]}>{copy.custom}</Text></View><Pressable accessibilityRole="button" onPress={() => setCustomOpen((value) => !value)} style={styles.outlineButton}><Text style={styles.outlineButtonText}>{customOpen ? copy.close : copy.write}</Text></Pressable></View>
    {customOpen ? <View style={[styles.editor,{backgroundColor:palette.surface,borderColor:palette.border}]}><TextInput accessibilityLabel={copy.custom} maxLength={CUSTOM_QUESTION_MAX} multiline onChangeText={setCustomText} placeholder={messages.askDeep.placeholder} placeholderTextColor={palette.muted} style={[styles.input,{borderColor:palette.border,color:palette.navy}]} textAlignVertical="top" value={customText} /><Text style={[styles.counter,{color:palette.muted}]}>{customText.length} / {CUSTOM_QUESTION_MAX}</Text>{customText.length > 0 && customQuestionError(customText) ? <Text accessibilityRole="alert" style={styles.errorText}>{customQuestionError(customText)}</Text> : null}<Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(customQuestionError(customText)) }} disabled={Boolean(customQuestionError(customText))} onPress={() => confirm({ kind: 'custom', text: customText, starCost: catalog[0]?.starCost ?? 100 })} style={[styles.primaryButton, Boolean(customQuestionError(customText)) && styles.disabled]}><Text style={styles.primaryButtonText}>{messages.askDeep.prepare}</Text></Pressable></View> : null}
    <View style={[styles.how,{backgroundColor:palette.surface,borderColor:palette.border}]}><Text style={[styles.sectionTitle,{color:palette.navy}]}>{copy.how}</Text>{copy.steps.split('|').map((text, index) => <View key={text} style={styles.step}><View style={[styles.stepNumber,{backgroundColor:palette.sapphireSoft}]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={[styles.stepText,{color:palette.navy}]}>{text}</Text></View>)}</View>
    <Modal animationType="slide" onRequestClose={closeConfirm} transparent visible={Boolean(selection)}><View style={styles.modalBackdrop}><View accessibilityViewIsModal style={[styles.modalSheet,{backgroundColor:palette.background}]}><View style={[styles.modalHandle,{backgroundColor:palette.border}]} /><Text style={styles.modalEyebrow}>{messages.askDeep.confirm}</Text><Text style={[styles.modalTitle,{color:palette.navy}]}>{selection?.kind === 'catalog' ? selection.item.title : selection?.text}</Text><View style={[styles.summaryRow,{borderBottomColor:palette.border}]}><Text style={[styles.summaryLabel,{color:palette.muted}]}>{messages.askDeep.price}</Text><Text style={[styles.summaryValue,{color:palette.navy}]}>{displayCost} ✦</Text></View><View style={[styles.summaryRow,{borderBottomColor:palette.border}]}><Text style={[styles.summaryLabel,{color:palette.muted}]}>{messages.askDeep.balance}</Text><Text style={[styles.summaryValue,{color:palette.navy}]}>{balance ?? '—'} ✦</Text></View><Text style={[styles.info,{color:palette.muted}]}>{messages.askDeep.info}</Text>{!session ? <Text style={styles.errorText}>{messages.auth.signIn}</Text> : !profile ? <Text style={styles.errorText}>{messages.askDeep.completeBirth}</Text> : missingBirthTime ? <Text style={styles.errorText}>{messages.birthForm.timeError}</Text> : insufficient ? <Text style={styles.errorText}>{displayCost} ✦</Text> : submitError ? <Text accessibilityRole="alert" style={styles.errorText}>{submitError}</Text> : null}{insufficient ? <Pressable accessibilityRole="button" onPress={() => Alert.alert(messages.askDeep.getStars, messages.common.error)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{messages.askDeep.getStars}</Text></Pressable> : !profile && session ? <Pressable accessibilityRole="button" onPress={() => { closeConfirm(); router.push('/birth-chart'); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{messages.birthRequired.action}</Text></Pressable> : missingBirthTime ? <Pressable accessibilityRole="button" onPress={() => { closeConfirm(); router.push('/birth-chart'); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{messages.birthForm.birthTime}</Text></Pressable> : !session ? <Pressable accessibilityRole="button" onPress={() => { closeConfirm(); router.push('/sign-in'); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>{messages.auth.signIn}</Text></Pressable> : <Pressable accessibilityRole="button" accessibilityState={{ busy: submitting, disabled: submitting }} disabled={submitting} onPress={() => void submit()} style={[styles.primaryButton, submitting && styles.disabled]}>{submitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>{displayCost} ✦ · {copy.title}</Text>}</Pressable>}<Pressable accessibilityRole="button" disabled={submitting} onPress={closeConfirm} style={styles.cancelButton}><Text style={[styles.cancelText,{color:palette.navy}]}>{messages.common.cancel}</Text></Pressable></View></View></Modal>
  </Screen>;
}

function StateCard({ action, icon, onPress, text, title }: { action: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; text: string; title: string }) { const palette=usePalette(); return <View style={[styles.stateCard,{backgroundColor:palette.surface,borderColor:palette.border}]}><Ionicons color={palette.sapphire} name={icon} size={29} /><View style={styles.flex}><Text style={[styles.cardTitle,{color:palette.navy}]}>{title}</Text><Text style={[styles.cardText,{color:palette.muted}]}>{text}</Text><Pressable accessibilityRole="button" onPress={onPress} style={styles.stateAction}><Text style={styles.stateActionText}>{action}</Text></Pressable></View></View>; }

const styles = StyleSheet.create({
  flex:{flex:1},center:{alignItems:'center',flex:1,gap:12,justifyContent:'center',minHeight:300},muted:{color:colors.muted,fontSize:16},top:{gap:5},headerRow:{alignItems:'flex-start',flexDirection:'row',gap:10},headerCopy:{flex:1,paddingTop:2},headerActions:{alignItems:'flex-end',gap:3},eyebrow:{color:colors.sapphire,fontSize:12,fontWeight:'900',letterSpacing:1.3},pageTitle:{color:colors.navy,fontSize:28,fontWeight:'900',letterSpacing:-.6,lineHeight:33},description:{color:colors.muted,fontSize:15,lineHeight:21},balanceChip:{alignItems:'center',backgroundColor:colors.navy,borderRadius:13,justifyContent:'center',minHeight:36,minWidth:68,paddingHorizontal:10},balanceChipText:{color:colors.white,fontSize:15,fontWeight:'900'},star:{color:'#E3B85B'},questionsButton:{alignItems:'center',borderRadius:10,flexDirection:'row',gap:4,minHeight:40,paddingHorizontal:5},questionsButtonText:{color:colors.sapphire,fontSize:14,fontWeight:'800'},stateCard:{alignItems:'flex-start',backgroundColor:colors.surface,borderColor:colors.border,borderRadius:18,borderWidth:1,flexDirection:'row',gap:12,padding:15},cardTitle:{color:colors.navy,fontSize:18,fontWeight:'800',lineHeight:24},cardText:{color:colors.muted,fontSize:15,lineHeight:21,marginTop:3},stateAction:{alignSelf:'flex-start',minHeight:44,justifyContent:'center',marginTop:6},stateActionText:{color:colors.sapphire,fontSize:16,fontWeight:'800'},customCard:{alignItems:'center',backgroundColor:colors.surface,borderColor:colors.sapphire,borderRadius:17,borderWidth:1,flexDirection:'row',gap:9,minHeight:64,paddingHorizontal:12,paddingVertical:9},customIcon:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:14,height:42,justifyContent:'center',width:42},outlineButton:{borderColor:colors.sapphire,borderRadius:11,borderWidth:1.5,justifyContent:'center',minHeight:44,paddingHorizontal:14},outlineButtonText:{color:colors.sapphire,fontSize:15,fontWeight:'800'},editor:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:18,borderWidth:1,gap:9,padding:14},input:{borderColor:colors.border,borderRadius:13,borderWidth:1,color:colors.navy,fontSize:17,lineHeight:25,minHeight:140,padding:13},counter:{color:colors.muted,fontSize:14,fontWeight:'700',textAlign:'right'},errorText:{color:colors.danger,fontSize:15,fontWeight:'700',lineHeight:22},primaryButton:{alignItems:'center',backgroundColor:colors.sapphire,borderRadius:14,justifyContent:'center',minHeight:52,paddingHorizontal:18},primaryButtonText:{color:colors.white,fontSize:17,fontWeight:'900'},disabled:{opacity:.45},section:{marginTop:3},sectionTitle:{color:colors.navy,fontSize:20,fontWeight:'900'},questionList:{gap:6},questionRow:{alignItems:'center',backgroundColor:colors.surface,borderColor:colors.border,borderRadius:15,borderWidth:1,flexDirection:'row',gap:4,minHeight:64,paddingHorizontal:8,paddingVertical:6},rowPressed:{opacity:.68},questionTitle:{color:colors.navy,flex:1,fontSize:14,fontWeight:'700',lineHeight:19},questionAction:{alignItems:'center',flexDirection:'row',flexShrink:0,gap:0},cost:{color:colors.gold,fontSize:13,fontWeight:'900'},how:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:18,borderWidth:1,gap:11,padding:15},step:{alignItems:'center',flexDirection:'row',gap:10},stepNumber:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:15,height:30,justifyContent:'center',width:30},stepNumberText:{color:colors.sapphire,fontSize:14,fontWeight:'900'},stepText:{color:colors.navy,flex:1,fontSize:15,lineHeight:21},modalBackdrop:{backgroundColor:'rgba(16,29,58,.42)',flex:1,justifyContent:'flex-end'},modalSheet:{backgroundColor:colors.background,borderTopLeftRadius:26,borderTopRightRadius:26,gap:10,paddingBottom:18,paddingHorizontal:20,paddingTop:9},modalHandle:{alignSelf:'center',backgroundColor:colors.border,borderRadius:3,height:5,width:44},modalEyebrow:{color:colors.sapphire,fontSize:12,fontWeight:'900',letterSpacing:1.2,marginTop:2},modalTitle:{color:colors.navy,fontSize:20,fontWeight:'900',lineHeight:27},summaryRow:{alignItems:'center',borderBottomColor:colors.border,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',justifyContent:'space-between',paddingVertical:6},summaryLabel:{color:colors.muted,fontSize:15},summaryValue:{color:colors.navy,fontSize:17,fontWeight:'900'},info:{color:colors.muted,fontSize:14,lineHeight:21},cancelButton:{alignItems:'center',justifyContent:'center',minHeight:44},cancelText:{color:colors.navy,fontSize:16,fontWeight:'800'},
});
