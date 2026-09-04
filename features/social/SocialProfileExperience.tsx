import Ionicons from '@expo/vector-icons/Ionicons';
import { router, type Href, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { localizeZodiacSign } from '@/features/astrology/zodiac';
import { useAuth } from '@/features/auth/AuthProvider';
import { getPublicSocialProfile, getSocialHome, moderateUser, startConversation, type PublicSocialProfile, type SocialUsage, type SoulmateMatch } from './api';
import { orderedMatchCategories } from './soulmatePresentation';

const zodiacSymbols: Readonly<Record<string, string>> = { Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓' };
const relationshipStatusLabel = { single: 'Bekâr', married: 'Evli', prefer_not_to_say: 'Belirtmek istemiyor' } as const;
const relationshipIntentLabel = { serious: 'Ciddi ilişki', meet: 'Tanışma', friendship: 'Arkadaşlık' } as const;

export function SocialProfileExperience() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { session, user } = useAuth();
  const [profile, setProfile] = useState<PublicSocialProfile | null>(null);
  const [match, setMatch] = useState<SoulmateMatch | null>(null);
  const [usage, setUsage] = useState<SocialUsage | null>(null);
  const [error, setError] = useState('');
  const ownProfile = Boolean(user?.id && profile?.userId === user.id);

  useEffect(() => {
    if (!session?.access_token || !userId) return;
    Promise.all([getPublicSocialProfile(session.access_token, userId), getSocialHome(session.access_token)])
      .then(([result, social]) => { setProfile(result.profile); setMatch(result.match); setUsage(social.usage); })
      .catch(() => setError('Bu profil şu anda görüntülenemiyor.'));
  }, [session?.access_token, userId]);

  const chat = async () => {
    if (!session?.access_token || !profile) return;
    if (usage && !usage.allowed) { router.push({ pathname: '/premium', params: { product: 'messaging_subscription' } } as Href); return; }
    try {
      const result = await startConversation(session.access_token, profile.userId);
      router.push({ pathname: '/private-chat', params: { conversationId: result.conversationId, handle: profile.handle, targetUserId: profile.userId } } as unknown as Href);
    } catch { setError('Konuşma şu anda başlatılamadı.'); }
  };

  const report = (reportType: 'user' | 'photo') => {
    if (!session?.access_token || !profile || ownProfile) return;
    void moderateUser(session.access_token, { action:'report', reportedUserId:profile.userId, reportType, photoReference:reportType === 'photo' ? 'current_profile_photo' : undefined, reason:reportType === 'photo' ? 'Fotoğraf incelemesi' : 'Profil incelemesi' })
      .then(() => Alert.alert('Teşekkürler', 'Şikâyetin inceleme için alındı.'))
      .catch(() => Alert.alert('İşlem tamamlanamadı', 'Biraz sonra tekrar deneyebilirsin.'));
  };
  const block = () => {
    if (!session?.access_token || !profile || ownProfile) return;
    Alert.alert('Kullanıcıyı engelle', 'Bu kullanıcı artık eşleşmelerinde ve sohbetlerinde görünmeyecek.', [{ text:'Vazgeç', style:'cancel' }, { text:'Engelle', style:'destructive', onPress:() => void moderateUser(session.access_token, { action:'block', targetUserId:profile.userId }).then(() => router.back()) }]);
  };
  const securityMenu = () => {
    if (!profile || ownProfile) return;
    const options = [
      { text:'Engelle', style:'destructive' as const, onPress:block },
      { text:'Şikâyet Et', onPress:() => report('user') },
      ...(profile.photoUrl ? [{ text:'Fotoğrafı Şikâyet Et', onPress:() => report('photo') }] : []),
      { text:'Vazgeç', style:'cancel' as const },
    ];
    Alert.alert('Güvenlik', 'Yapmak istediğin işlemi seç.', options);
  };

  if (!profile && !error) return <Screen><ActivityIndicator color={colors.sapphire} size="large" /></Screen>;
  if (!profile) return <Screen><Text style={styles.error}>{error}</Text></Screen>;
  const categories = match ? orderedMatchCategories(match) : [];
  const sign = profile.sunSign ? `${localizeZodiacSign(profile.sunSign)} ${zodiacSymbols[profile.sunSign] ?? ''}`.trim() : null;
  return <Screen>
    <View style={styles.headerRow}><View style={styles.headerCopy}><SectionHeader eyebrow="GÜVENLİ PROFİL" title={profile.handle ? `@${profile.handle}` : 'SafirCan kullanıcısı'} description="Yalnız kullanıcının paylaşmayı seçtiği bilgiler gösterilir." /></View>{!ownProfile ? <Pressable accessibilityLabel="Güvenlik seçenekleri" hitSlop={8} onPress={securityMenu} style={styles.menu}><Ionicons color={colors.navy} name="ellipsis-horizontal" size={24} /></Pressable> : null}</View>
    <View style={styles.card}>{profile.photoUrl ? <Image resizeMode="cover" source={{ uri:profile.photoUrl }} style={styles.photo} /> : <View style={styles.photoPlaceholder}><Text style={styles.photoLetter}>S</Text></View>}{sign ? <Text style={styles.meta}>{sign}</Text> : null}{profile.city ? <Text style={styles.meta}>{profile.city}</Text> : null}{profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}<View style={styles.preferenceRow}><Text style={styles.preference}>{relationshipStatusLabel[profile.relationshipStatus]}</Text><Text style={styles.preference}>{relationshipIntentLabel[profile.relationshipIntent]}</Text></View></View>
    {match ? <View style={styles.match}><Text style={styles.matchTitle}>Astrolojik Uyumunuz</Text><Text style={styles.score}>%{Math.round(match.score)}</Text>{categories.map((item) => <View key={item.id} style={styles.row}><Text style={styles.rowLabel}>{item.label}</Text><Text style={styles.rowValue}>{item.level}</Text></View>)}</View> : null}
    {!ownProfile ? <Pressable onPress={() => void chat()} style={styles.primary}><Text style={styles.primaryText}>MESAJ GÖNDER</Text></Pressable> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </Screen>;
}

const styles = StyleSheet.create({headerRow:{alignItems:'flex-start',flexDirection:'row',gap:8},headerCopy:{flex:1},menu:{alignItems:'center',backgroundColor:colors.surface,borderRadius:20,height:40,justifyContent:'center',width:40},card:{alignItems:'center',backgroundColor:colors.surface,borderRadius:22,gap:10,padding:20},photo:{borderRadius:60,height:120,width:120},photoPlaceholder:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:60,height:120,justifyContent:'center',width:120},photoLetter:{color:colors.sapphire,fontSize:38,fontWeight:'900'},meta:{color:colors.muted,fontSize:15,fontWeight:'700',textAlign:'center'},bio:{color:colors.navy,fontSize:15,lineHeight:22,textAlign:'center'},preferenceRow:{flexDirection:'row',flexWrap:'wrap',gap:8,justifyContent:'center'},preference:{backgroundColor:colors.sapphireSoft,borderRadius:16,color:colors.sapphire,fontSize:13,fontWeight:'900',overflow:'hidden',paddingHorizontal:11,paddingVertical:7},match:{backgroundColor:colors.navy,borderRadius:22,gap:10,padding:20},matchTitle:{color:colors.white,fontSize:20,fontWeight:'900',textAlign:'center'},score:{color:colors.white,fontSize:42,fontWeight:'900',textAlign:'center'},row:{flexDirection:'row',gap:8,justifyContent:'space-between'},rowLabel:{color:'#DCEAF8',flex:1,fontSize:14},rowValue:{color:'#D9BF83',fontSize:14,fontWeight:'900',textAlign:'right'},primary:{alignItems:'center',backgroundColor:colors.sapphire,borderRadius:15,justifyContent:'center',minHeight:54},primaryText:{color:colors.white,fontWeight:'900'},error:{color:colors.danger,fontSize:15,lineHeight:22,textAlign:'center'}});
