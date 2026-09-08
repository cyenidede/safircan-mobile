import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { PREMIUM_PRODUCTS } from '@/constants/products';
import { getAuthenticatedBirthProfile } from '@/features/astrology/api/birth-profile';
import { localizeZodiacSignForLocale } from '@/features/astrology/zodiac';
import { useLocale, usePalette } from '@/localization';
import { useAuth } from '@/features/auth/AuthProvider';
import { getSocialHome, getSoulmates, SocialApiError, startConversation, type SocialUsage, type SoulmateCandidate } from './api';
import { mergeSoulmateCandidates, orderedMatchCategories, shouldShowSoulmateSummary, soulmateReason } from './soulmatePresentation';
import { SocialAccessState } from './SocialAccessState';
import { useSocialNotifications } from './SocialNotificationProvider';

type ViewState = 'loading' | 'ready' | 'empty' | 'profile_required' | 'birth_required' | 'auth_required' | 'age_restricted' | 'error';
const zodiacSymbols: Readonly<Record<string, string>> = { Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓' };

export function SoulmateExperience() {
  const { locale, messages } = useLocale(); const palette = usePalette(); const m = messages.soulmate;
  const { session } = useAuth();
  const { markRead } = useSocialNotifications();
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [items, setItems] = useState<SoulmateCandidate[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const [usage, setUsage] = useState<SocialUsage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async (nextPage = 1) => {
    if (!session?.access_token) { setViewState('auth_required'); return; }
    if (nextPage === 1) setViewState('loading'); else setLoadingMore(true);
    setMessage('');
    try {
      const birthProfile = await getAuthenticatedBirthProfile(session.access_token);
      if (!birthProfile?.birth_date) { setViewState('birth_required'); return; }
      const social = await getSocialHome(session.access_token);
      setUsage(social.usage);
      if (social.preferencesRequired) { setViewState('profile_required'); return; }
      const result = await getSoulmates(session.access_token, nextPage);
      const candidates = Array.isArray(result.candidates) ? result.candidates : [];
      setItems((current) => mergeSoulmateCandidates(nextPage === 1 ? [] : current, candidates));
      setPage(nextPage);
      setHasMore(result.hasMore);
      if (nextPage === 1) setNewCount(Math.max(0, result.newCount));
      if (nextPage === 1) void markRead('soulmate_match');
      if (result.status === 'profile_required') setViewState('profile_required');
      else if (!candidates.length && nextPage === 1) setViewState('empty');
      else setViewState('ready');
    } catch (cause) {
      if (cause instanceof SocialApiError && cause.status === 401) setViewState('auth_required');
      else if (cause instanceof SocialApiError && cause.status === 403 && cause.code === 'age_restricted') setViewState('age_restricted');
      else setViewState('error');
    } finally { setLoadingMore(false); }
  }, [markRead, session?.access_token]);

  useEffect(() => { void load(); }, [load]);

  const openChat = async (candidate: SoulmateCandidate) => {
    if (!session?.access_token) return;
    if (usage && !usage.allowed) {
      router.push({ pathname: '/premium', params: { product: 'messaging_subscription' } } as Href);
      return;
    }
    try {
      const result = await startConversation(session.access_token, candidate.profile.userId);
      router.push({ pathname: '/private-chat', params: { conversationId: result.conversationId, handle: candidate.profile.handle, targetUserId: candidate.profile.userId } } as unknown as Href);
    } catch (cause) {
      if (cause instanceof SocialApiError && cause.code === 'quota_exceeded') {
        router.push({ pathname: '/premium', params: { product: 'messaging_subscription' } } as Href);
        return;
      }
      setMessage(cause instanceof SocialApiError && (cause.code === 'handle_required' || cause.status === 409)
        ? m.profileRequired : m.chatError);
    }
  };

  return <Screen>
    <SectionHeader eyebrow={m.eyebrow} title={m.title} description={m.description} />
    {viewState === 'ready' && shouldShowSoulmateSummary(items.length, newCount) ? <View style={[styles.summary,{backgroundColor:palette.sapphireSoft}]}><Text style={styles.summaryText}>{`${newCount} ${m.summary}`}</Text>{usage && (usage.subscribed || usage.freeMessagesRemaining > 0) ? <Text style={[styles.quota,{color:palette.muted}]}>{usage.subscribed ? m.unlimited : `${usage.freeMessagesRemaining} ${m.remaining}`}</Text> : null}</View> : null}
    {items.map((candidate) => <SoulmateCard candidate={candidate} key={candidate.profile.userId} onChat={() => void openChat(candidate)} />)}
    {viewState === 'loading' ? <View style={styles.loading}><ActivityIndicator color={colors.sapphire} size="large" /><Text style={[styles.loadingText,{color:palette.muted}]}>{m.loading}</Text></View> : null}
    {viewState === 'empty' ? <StateCard title={m.empty} detail={m.emptyDetail} /> : null}
    {viewState === 'profile_required' ? <StateCard title={m.preferences} detail={m.preferencesDetail} action={m.choosePreferences} onPress={() => router.push('/community' as Href)} /> : null}
    {viewState === 'birth_required' ? <SocialAccessState kind="birth_required" onPress={() => router.push('/birth-chart')} /> : null}
    {viewState === 'auth_required' ? <StateCard title={m.auth} action={m.signIn} onPress={() => router.push('/profile' as Href)} /> : null}
    {viewState === 'age_restricted' ? <SocialAccessState kind="underage" onPress={() => router.back()} /> : null}
    {viewState === 'error' ? <StateCard title={m.error} action={messages.common.retry.toUpperCase()} onPress={() => void load()} /> : null}
    {message ? <StateCard title={message} /> : null}
    {viewState === 'ready' && hasMore ? <Pressable disabled={loadingMore} onPress={() => void load(page + 1)} style={[styles.more,{borderColor:palette.sapphire}]}>{loadingMore ? <ActivityIndicator color={colors.sapphire} /> : <Text style={[styles.secondaryText,{color:palette.navy}]}>{m.more}</Text>}</Pressable> : null}
  </Screen>;
}

function SoulmateCard({ candidate, onChat }: { candidate: SoulmateCandidate; onChat: () => void }) {
  const {locale,messages}=useLocale(); const palette=usePalette(); const m=messages.soulmate;
  const { match, profile } = candidate;
  const categories = orderedMatchCategories(match,locale);
  const reason = soulmateReason(match);
  const sign = profile.sunSign ? `${localizeZodiacSignForLocale(profile.sunSign,locale)} ${zodiacSymbols[profile.sunSign] ?? ''}`.trim() : null;
  return <View style={[styles.card,{backgroundColor:palette.surface,borderColor:palette.border}]}>
    <View style={styles.heading}>
      {profile.photoUrl ? <Image resizeMode="cover" source={{ uri: profile.photoUrl }} style={styles.photo} /> : <View style={styles.photoPlaceholder}><Text style={styles.photoLetter}>S</Text></View>}
      <View style={styles.identity}><Text ellipsizeMode="tail" numberOfLines={1} style={[styles.handle,{color:palette.navy}]}>{profile.handle ? `@${profile.handle}` : m.user}</Text>{sign ? <Text style={[styles.meta,{color:palette.muted}]}>{sign}</Text> : null}{profile.city ? <Text numberOfLines={1} style={[styles.meta,{color:palette.muted}]}>{profile.city}</Text> : null}</View>
    </View>
    {Number.isFinite(match.score) ? <View style={[styles.overall,{backgroundColor:palette.background}]}><Text style={styles.score}>%{Math.round(match.score)}</Text><Text style={styles.scoreLabel}>{m.compatibility}</Text></View> : null}
    {profile.bio ? <Text style={[styles.bio,{color:palette.navy}]}>{profile.bio}</Text> : null}
    {categories.length ? <View style={styles.categories}>{categories.map((category) => <View key={category.id} style={[styles.category,{borderBottomColor:palette.border}]}><Text style={[styles.categoryLabel,{color:palette.navy}]}>{category.label}</Text><Text style={styles.categoryLevel}>{category.level}</Text></View>)}</View> : null}
    {reason ? <View style={[styles.reason,{backgroundColor:palette.background}]}><Text style={styles.reasonTitle}>{m.reason}</Text><Text style={[styles.reasonText,{color:palette.navy}]}>{reason}</Text></View> : null}
    <View style={styles.actions}><Pressable onPress={() => router.push({ pathname: '/social-profile', params: { userId: profile.userId } } as unknown as Href)} style={[styles.secondary,{borderColor:palette.border}]}><Text style={[styles.secondaryText,{color:palette.navy}]}>{m.profile}</Text></Pressable><Pressable onPress={onChat} style={styles.primary}><Text style={styles.primaryText}>{m.message}</Text></Pressable></View>
  </View>;
}

function StateCard({ title, detail, action, onPress }: { title: string; detail?: string; action?: string; onPress?: () => void }) {
  const palette=usePalette(); return <View style={[styles.state,{backgroundColor:palette.surface,borderColor:palette.border,borderWidth:1}]}><Text style={[styles.stateText,{color:palette.navy}]}>{title}</Text>{detail ? <Text style={[styles.stateDetail,{color:palette.muted}]}>{detail}</Text> : null}{action && onPress ? <Pressable onPress={onPress} style={[styles.secondary,{borderColor:palette.border}]}><Text style={[styles.secondaryText,{color:palette.navy}]}>{action}</Text></Pressable> : null}</View>;
}

const styles = StyleSheet.create({ summary:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:18,gap:4,padding:13},summaryText:{color:colors.sapphire,fontSize:15,fontWeight:'900',textAlign:'center'},quota:{color:colors.muted,fontSize:12,fontWeight:'700',textAlign:'center'},card:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:24,borderWidth:1,gap:16,padding:18},heading:{alignItems:'center',flexDirection:'row',gap:14},photo:{borderRadius:40,height:80,width:80},photoPlaceholder:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:40,height:80,justifyContent:'center',width:80},photoLetter:{color:colors.sapphire,fontSize:27,fontWeight:'900'},identity:{flex:1,gap:4,minWidth:0},handle:{color:colors.navy,fontSize:20,fontWeight:'900'},meta:{color:colors.muted,fontSize:14,lineHeight:19},overall:{alignItems:'center',backgroundColor:colors.navy,borderRadius:20,gap:1,paddingVertical:16},score:{color:colors.white,fontSize:46,fontWeight:'900',lineHeight:52},scoreLabel:{color:'#D9BF83',fontSize:11,fontWeight:'900',letterSpacing:1.2},bio:{color:colors.navy,fontSize:15,lineHeight:22},categories:{gap:10},category:{alignItems:'center',borderBottomColor:colors.border,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',gap:8,justifyContent:'space-between',paddingBottom:9},categoryLabel:{color:colors.navy,flex:1,fontSize:14,fontWeight:'700'},categoryLevel:{color:colors.sapphire,fontSize:13,fontWeight:'900',textAlign:'right'},reason:{backgroundColor:colors.background,borderRadius:16,gap:5,padding:14},reasonTitle:{color:colors.gold,fontSize:10,fontWeight:'900',letterSpacing:1},reasonText:{color:colors.navy,fontSize:14,lineHeight:21},actions:{flexDirection:'row',flexWrap:'wrap',gap:9},primary:{alignItems:'center',backgroundColor:colors.sapphire,borderRadius:14,flexBasis:145,flexGrow:1,justifyContent:'center',minHeight:50,paddingHorizontal:12},primaryText:{color:colors.white,fontSize:13,fontWeight:'900',textAlign:'center'},secondary:{alignItems:'center',borderColor:colors.border,borderRadius:14,borderWidth:1,flexBasis:130,flexGrow:1,justifyContent:'center',minHeight:50,paddingHorizontal:12},secondaryText:{color:colors.navy,fontSize:13,fontWeight:'900',textAlign:'center'},loading:{alignItems:'center',gap:12,minHeight:180,justifyContent:'center'},loadingText:{color:colors.muted,fontSize:15,textAlign:'center'},state:{backgroundColor:colors.surface,borderRadius:20,gap:10,padding:20},stateText:{color:colors.navy,fontSize:16,fontWeight:'800',lineHeight:23,textAlign:'center'},stateDetail:{color:colors.muted,fontSize:14,lineHeight:21,textAlign:'center'},more:{alignItems:'center',borderColor:colors.sapphire,borderRadius:14,borderWidth:1,justifyContent:'center',minHeight:50} });
