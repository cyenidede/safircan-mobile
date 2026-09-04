import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';
import { localizeZodiacSign } from '@/features/astrology/zodiac';
import { getAuthenticatedBirthProfile } from '@/features/astrology/api/birth-profile';
import { useAuth } from '@/features/auth/AuthProvider';
import { ChatComposer } from './ChatComposer';
import { getZodiacGroup, sendZodiacGroupMessage, socialErrorMessage, SocialApiError, type GroupMessage, type SocialUsage } from './api';
import { SocialAccessState } from './SocialAccessState';

export function ZodiacGroupExperience() {
  const { session, user } = useAuth();
  const [group, setGroup] = useState<{ sign: string; displayName: string } | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [usage, setUsage] = useState<SocialUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [restricted, setRestricted] = useState<'underage' | 'birth_required' | 'profile_required' | null>(null);

  const load = useCallback(async () => { if (!session?.access_token) { setLoading(false); return; } try { const birthProfile = await getAuthenticatedBirthProfile(session.access_token); if (!birthProfile?.birth_date) { setRestricted('birth_required'); return; } const result = await getZodiacGroup(session.access_token); setRestricted(null); setGroup(result.group); setMessages(result.messages); setUsage(result.usage); } catch (error) { if (error instanceof SocialApiError && error.code === 'age_restricted') setRestricted('underage'); else if (error instanceof SocialApiError && (error.code === 'profile_required' || error.code === 'handle_required')) setRestricted('profile_required'); else setFeedback('Burç grubun şu anda yüklenemedi. Biraz sonra tekrar deneyebilirsin.'); } finally { setLoading(false); } }, [session?.access_token]);
  useEffect(() => { void load(); }, [load]);
  const send = async (body: string) => { if (!session?.access_token) return false; setSending(true); setFeedback(''); try { const result = await sendZodiacGroupMessage(session.access_token, body); setUsage(result.usage); await load(); return true; } catch (error) { if (error instanceof SocialApiError && error.usage) setUsage(error.usage); setFeedback(socialErrorMessage(error, 'Mesaj gönderilemedi. Biraz sonra tekrar deneyebilirsin.')); return false; } finally { setSending(false); } };

  return <SafeAreaView edges={['bottom']} style={styles.safe}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={92} style={styles.safe}>
    <View style={styles.header}><Text style={styles.title}>{group?.displayName ?? 'Burç Grubun'}</Text><Text style={styles.subtitle}>{group ? `${localizeZodiacSign(group.sign)} burcundaki kullanıcılarla sohbet et.` : 'Kendi Güneş burcu grubunda sohbet et.'}</Text></View>
    {loading ? <ActivityIndicator color={colors.sapphire} size="large" style={styles.loading} /> : restricted === 'underage' ? <SocialAccessState kind="underage" onPress={() => router.back()} /> : restricted === 'birth_required' ? <SocialAccessState kind="birth_required" onPress={() => router.push('/chart' as Href)} /> : restricted === 'profile_required' ? <View style={styles.restricted}><Text style={styles.restrictedTitle}>Önce sosyal tercihlerini seçmen gerekiyor</Text><Pressable onPress={() => router.push('/community' as Href)} style={styles.restrictedButton}><Text style={styles.restrictedButtonText}>TERCİHLERİMİ SEÇ</Text></Pressable></View> : <FlatList contentContainerStyle={styles.list} data={messages} keyExtractor={(item) => item.id} renderItem={({ item }) => { const mine = item.sender.userId === user?.id; return <View style={[styles.message, mine && styles.mine]}><Pressable disabled={mine} onPress={() => router.push({ pathname: '/social-profile', params: { userId: item.sender.userId } } as unknown as Href)} style={styles.messageHeader}><Text style={[styles.sender, mine && styles.mineText]}>{item.sender.handle ? `@${item.sender.handle}` : mine ? 'Sen' : 'SafirCan kullanıcısı'}</Text>{item.sender.sunSign ? <Text style={[styles.sign, mine && styles.mineMuted]}>{localizeZodiacSign(item.sender.sunSign)}</Text> : null}</Pressable><Text style={[styles.body, mine && styles.mineText]}>{item.body}</Text><Text style={[styles.time, mine && styles.mineMuted]}>{new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(item.createdAt))}</Text></View>; }} />}
    {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}{!loading && !restricted ? <ChatComposer usage={usage} sending={sending} onSend={send} /> : null}
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { backgroundColor: colors.background, flex: 1 }, header: { borderBottomColor: colors.border, borderBottomWidth: 1, gap: 3, padding: 15 }, title: { color: colors.navy, fontSize: 23, fontWeight: '900' }, subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 }, loading: { flex: 1 }, list: { gap: 10, padding: 14 }, message: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, maxWidth: '88%', padding: 12 }, mine: { alignSelf: 'flex-end', backgroundColor: colors.sapphire, borderColor: colors.sapphire }, messageHeader: { alignItems: 'center', flexDirection: 'row', gap: 7, marginBottom: 5 }, sender: { color: colors.navy, fontSize: 13, fontWeight: '900' }, sign: { color: colors.gold, fontSize: 11, fontWeight: '800' }, body: { color: colors.navy, fontSize: 15, lineHeight: 21 }, time: { color: colors.muted, fontSize: 10, marginTop: 5, textAlign: 'right' }, mineText: { color: colors.white }, mineMuted: { color: '#DCEAF8' }, feedback: { color: colors.danger, fontSize: 13, lineHeight: 18, paddingHorizontal: 14, textAlign: 'center' }, restricted:{gap:14,padding:20},restrictedTitle:{color:colors.navy,fontSize:17,fontWeight:'800',lineHeight:24,textAlign:'center'},restrictedButton:{alignItems:'center',backgroundColor:colors.sapphire,borderRadius:14,justifyContent:'center',minHeight:50,paddingHorizontal:16},restrictedButtonText:{color:colors.white,fontSize:13,fontWeight:'900'} });
