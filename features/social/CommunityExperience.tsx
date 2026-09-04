import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { randomUUID } from 'expo-crypto';
import { router, type Href, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { getAuthenticatedBirthProfile } from '@/features/astrology/api/birth-profile';
import { saveAuthenticatedBirthProfile } from '@/features/astrology/api/birth-profile';
import { resolveCurrentBirthProfile } from '@/features/astrology/birthInputStorage';
import { localizeZodiacSign } from '@/features/astrology/zodiac';
import { useAuth } from '@/features/auth/AuthProvider';
import { supabase } from '@/lib/supabase';
import { getSocialHome, getZodiacGroup, saveSocialPhoto, saveSocialProfile, socialErrorMessage, SocialApiError, type PublicSocialProfile, type RelationshipIntent, type RelationshipStatus, type SocialUsage } from './api';
import { isProvisioningPendingCode, resolveCommunityAccess, type CommunityAccessState } from './communityAccess';
import { SocialAccessState } from './SocialAccessState';
import { SocialNotificationsPanel } from './SocialNotificationsPanel';
import { useSocialNotifications } from './SocialNotificationProvider';

const validHandle = (value: string) => /^[a-z0-9_]{3,20}$/.test(value);
const statusOptions: Array<[RelationshipStatus, string]> = [['single','Bekâr'],['married','Evli'],['prefer_not_to_say','Belirtmek istemiyorum']];
const intentOptions: Array<[RelationshipIntent, string]> = [['meet','Tanışma'],['serious','Ciddi ilişki'],['friendship','Arkadaşlık']];
const zodiacSymbols: Readonly<Record<string, string>> = { Aries:'♈',Taurus:'♉',Gemini:'♊',Cancer:'♋',Leo:'♌',Virgo:'♍',Libra:'♎',Scorpio:'♏',Sagittarius:'♐',Capricorn:'♑',Aquarius:'♒',Pisces:'♓' };

export function CommunityExperience() {
  const { loading: authLoading, session, user } = useAuth();
  const { notifications, refreshUnread } = useSocialNotifications();
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<PublicSocialProfile | null>(null); const [usage, setUsage] = useState<SocialUsage | null>(null); const [error, setError] = useState('');
  const [accessState, setAccessState] = useState<CommunityAccessState>('loading');
  const [preferencesRequired, setPreferencesRequired] = useState(false);
  const [zodiacGroup, setZodiacGroup] = useState<{ sign: string; displayName: string } | null>(null);
  const [handle, setHandle] = useState(''); const [bio, setBio] = useState(''); const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus | null>(null); const [relationshipIntent, setRelationshipIntent] = useState<RelationshipIntent | null>(null); const [showZodiacSign, setShowZodiacSign] = useState(true);

  const load = useCallback(async () => {
    if (authLoading) return;
    if (!session?.access_token) { setLoading(false); return; }
    setLoading(true); setAccessState('loading'); setError('');
    setProfile(null); setUsage(null); setZodiacGroup(null); setPreferencesRequired(false);
    let birthFound = false; let birthSource = 'missing'; let provisionAttempted = false;
    const finishAccess = (nextState: CommunityAccessState, socialProfileFound = false, adultStatus: 'eligible' | 'underage' | 'pending' = 'pending', nextPreferencesRequired = false, provisionResult = 'not_needed') => {
      setAccessState(nextState);
      if (__DEV__) console.log(`[community-access] birthFound=${birthFound} birthSource=${birthSource} socialProfileStatus=${adultStatus} socialProfileFound=${socialProfileFound} provisionAttempted=${provisionAttempted} provisionResult=${provisionResult} preferencesRequired=${nextPreferencesRequired} renderState=${nextState}`);
    };
    try {
      let birthProfile = await getAuthenticatedBirthProfile(session.access_token);
      birthSource = birthProfile?.birth_time_source === 'rectification' ? 'rectification' : 'server';
      if (!birthProfile) {
        const local = await resolveCurrentBirthProfile();
        const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name.trim() : '';
        const lastName = typeof user?.user_metadata.last_name === 'string' ? user.user_metadata.last_name.trim() : '';
        if (local && firstName && lastName) {
          birthProfile = await saveAuthenticatedBirthProfile(session.access_token, { first_name: firstName, last_name: lastName, birth_date: local.birth_date, birth_time: local.birth_time, birth_time_unknown: local.birth_time_unknown, birth_place: local.birth_place });
          birthSource = 'local';
        }
      }
      if (__DEV__) console.log(`[community] birth-source=${birthProfile ? birthSource : 'missing'}`);
      birthFound = Boolean(birthProfile?.birth_date);
      if (!birthFound) { finishAccess(resolveCommunityAccess({ birthFound: false })); return; }

      try {
        let result: Awaited<ReturnType<typeof getSocialHome>> | null = null;
        for (let attempt = 0; attempt < 3 && !result; attempt += 1) {
          provisionAttempted = true;
          try { result = await getSocialHome(session.access_token); }
          catch (cause) {
            const code = cause instanceof SocialApiError ? cause.code : undefined;
            if (!isProvisioningPendingCode(code) || attempt === 2) throw cause;
            finishAccess('social_provisioning', false, 'pending', false, code ?? 'pending');
            await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
          }
        }
        if (!result) throw new Error('social_profile_provisioning_failed');
        const socialProfileFound = Boolean(result.profile);
        if (__DEV__) console.log(`[social-profile] provisioned=${socialProfileFound}`);
        setProfile(result.profile); setUsage(result.usage); setPreferencesRequired(result.preferencesRequired);
        setHandle(result.profile.handle ?? ''); setBio(result.profile.bio ?? '');
        setRelationshipStatus(result.preferencesRequired ? null : result.profile.relationshipStatus);
        setRelationshipIntent(result.preferencesRequired ? null : result.profile.relationshipIntent);
        setShowZodiacSign(result.profile.showZodiacSign ?? Boolean(result.profile.sunSign));
        if (!result.preferencesRequired) { const groupResult = await getZodiacGroup(session.access_token); setZodiacGroup(groupResult.group); }
        finishAccess(resolveCommunityAccess({ birthFound: true, socialProfileFound, preferencesRequired: result.preferencesRequired }), socialProfileFound, 'eligible', result.preferencesRequired, result.preferencesRequired ? 'preferences_required' : 'ready');
      } catch (cause) {
        const code = cause instanceof SocialApiError ? cause.code : 'network_error';
        const nextState = resolveCommunityAccess({ birthFound: true, socialErrorCode: code });
        const finalState = nextState === 'social_provisioning' ? 'error' : nextState;
        finishAccess(finalState, false, finalState === 'underage' ? 'underage' : 'pending', false, code ?? 'failed');
        if (finalState === 'error') setError(socialErrorMessage(cause, 'Şu anda profilin hazırlanamadı.'));
      }
    } catch (cause) {
      finishAccess('error');
      setError(socialErrorMessage(cause, 'SafirCan şu anda hazırlanamadı. Biraz sonra tekrar deneyebilirsin.'));
    } finally { setLoading(false); }
  }, [authLoading, session?.access_token, user?.user_metadata.first_name, user?.user_metadata.last_name]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useFocusEffect(useCallback(() => { if (session?.access_token) void refreshUnread(); }, [refreshUnread, session?.access_token]));

  const save = async () => {
    if (!session?.access_token || saving || !profile?.handle) return;
    const normalized = handle.trim().toLocaleLowerCase('en-US');
    if (!validHandle(normalized)) { setError('Kullanıcı adın 3–20 karakter olmalı; yalnız küçük harf, rakam ve alt çizgi kullanabilirsin.'); return; }
    if (!relationshipStatus || !relationshipIntent) { setError('Devam etmek için ilişki durumunu ve ne aradığını seçmen gerekiyor.'); return; }
    setSaving(true); setError('');
    try { await saveSocialProfile(session.access_token, { handle: normalized, bio, relationshipStatus, relationshipIntent, showZodiacSign, isActive: true }); setEditing(false); await load(); }
    catch (cause) { if (cause instanceof SocialApiError && cause.code === 'age_restricted') setAccessState('underage'); else setError(socialErrorMessage(cause, 'Profilin kaydedilemedi. Bilgilerini kontrol edip tekrar dene.')); }
    finally { setSaving(false); }
  };

  const choosePhoto = async () => {
    if (!session?.access_token || !user?.id || !supabase) return;
    setError(''); const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('Fotoğraf seçmek için galeri izni gerekiyor.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1,1], quality: 0.82 });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) { setError('Fotoğraf en fazla 5 MB olabilir.'); return; }
    const mime = asset.mimeType ?? 'image/jpeg';
    if (!['image/jpeg','image/png','image/webp'].includes(mime)) { setError('Yalnız JPG, PNG veya WEBP fotoğraf seçebilirsin.'); return; }
    setSaving(true);
    try { const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'; const path = `${user.id}/${randomUUID()}.${extension}`; const blob = await (await fetch(asset.uri)).blob(); const { error: uploadError } = await supabase.storage.from('social-profile-photos').upload(path, blob, { contentType: mime, upsert: false }); if (uploadError) throw uploadError; await saveSocialPhoto(session.access_token, path); await load(); }
    catch { setError('Fotoğrafın şu anda yüklenemedi. Biraz sonra tekrar deneyebilirsin.'); }
    finally { setSaving(false); }
  };

  if (authLoading || loading) return <Screen><View style={styles.loadingState}><ActivityIndicator color={colors.sapphire} size="large" />{accessState === 'social_provisioning' ? <Text style={styles.stateCopy}>SafirCan senin için hazırlanıyor…</Text> : null}</View></Screen>;
  if (!session) return <Screen><View style={styles.intro}><Text style={styles.eyebrow}>SAFİRCAN</Text><Text style={styles.description}>Ruh Eşi ve Burç Grupları için hesabına giriş yap.</Text></View><Pressable style={styles.primary} onPress={() => router.push('/sign-in')}><Text style={styles.primaryText}>GİRİŞ YAP</Text></Pressable></Screen>;
  if (accessState === 'underage') return <Screen><SocialAccessState kind="underage" onPress={() => router.back()} /></Screen>;
  if (accessState === 'birth_missing') return <Screen><SocialAccessState kind="birth_required" onPress={() => router.push('/birth-chart')} /></Screen>;
  if (accessState === 'error') return <Screen><View style={styles.stateCard}><Text style={styles.stateTitle}>Şu anda profilin hazırlanamadı</Text><Text style={styles.stateCopy}>{error || 'Biraz sonra tekrar deneyebilirsin.'}</Text><Pressable style={styles.primary} onPress={() => void load()}><Text style={styles.primaryText}>TEKRAR DENE</Text></Pressable></View></Screen>;
  const discoveryReady = Boolean(profile?.handle) && !preferencesRequired && Boolean(zodiacGroup);

  return <Screen><View style={styles.intro}><Text style={styles.eyebrow}>SAFİRCAN</Text><Text style={styles.description}>Gökyüzünün bugün dikkatini yönelttiği insanları keşfet.</Text></View>
    {profile ? <View style={styles.identity}><View style={styles.identityHeading}><Pressable onPress={() => void choosePhoto()}>{profile.photoUrl ? <Image source={{ uri: profile.photoUrl }} style={styles.photo} /> : <View style={styles.photoPlaceholder}><Text style={styles.avatarLetter}>S</Text></View>}</Pressable><View style={styles.identityCopy}><Text style={styles.identityLabel}>SAFİRCAN PROFİLİN</Text><Text style={styles.handle}>@{profile.handle}</Text></View>{!preferencesRequired && !editing ? <Pressable onPress={() => setEditing(true)} style={styles.editIcon}><Ionicons color={colors.sapphire} name="pencil-outline" size={20} /></Pressable> : null}</View>
      {editing ? <View style={styles.editForm}><View style={styles.handleInputRow}><Text style={styles.at}>@</Text><TextInput autoCapitalize="none" value={handle} onChangeText={(value) => setHandle(value.toLowerCase().replace(/[^a-z0-9_]/g,''))} style={styles.handleInput} maxLength={20} /></View><TextInput value={bio} onChangeText={setBio} placeholder="İstersen kısa bir tanıtım ekle" style={[styles.input,styles.multiline]} multiline maxLength={300} /><View style={styles.switchRow}><Text style={styles.switchText}>Burcumu göster</Text><Switch value={showZodiacSign} onValueChange={setShowZodiacSign} /></View><View style={styles.editActions}><Pressable onPress={() => setEditing(false)} style={[styles.secondary,styles.editActionButton]}><Text style={styles.secondaryText}>VAZGEÇ</Text></Pressable><Pressable disabled={saving} onPress={() => void save()} style={[styles.primary,styles.editActionButton]}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>KAYDET</Text>}</Pressable></View></View> : null}
    </View> : null}
    {profile && !preferencesRequired ? <SocialNotificationsPanel notifications={notifications} /> : null}
    {preferencesRequired ? <View style={styles.preferences}><Text style={styles.preferencesTitle}>Tercihlerini seç</Text><Text style={styles.copy}>Sana uygun insanları gösterebilmemiz için iki kısa seçim yap.</Text><OptionRow label="İlişki durumun" options={statusOptions} value={relationshipStatus} onChange={setRelationshipStatus} /><OptionRow label="Ne arıyorsun?" options={intentOptions} value={relationshipIntent} onChange={setRelationshipIntent} /><Pressable disabled={saving} onPress={() => void save()} style={styles.primary}>{saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>DEVAM ET</Text>}</Pressable></View> : null}
    {discoveryReady && usage ? <View style={styles.usage}><Text style={styles.usageTitle}>{usage.subscribed ? 'Sınırsız mesajlaşma aktif' : `10 ücretsiz mesajından ${usage.freeMessagesRemaining} kaldı`}</Text><Text style={styles.copy}>{usage.subscribed ? 'Ruh Eşi ve Burç Gruplarında mesaj sınırın yok.' : 'Özel sohbet ve burç grubu aynı ücretsiz mesaj hakkını kullanır.'}</Text></View> : null}
    {discoveryReady ? <SocialCard title="RUH EŞİNİ KEŞFET" text="Bugünün güçlü astrolojik eşleşmelerini gör." onPress={() => router.push('/soulmate' as Href)} /> : null}
    {discoveryReady && zodiacGroup ? <SocialCard eyebrow="BURÇ GRUBUN" title={`${localizeZodiacSign(zodiacGroup.sign)} Grubu ${zodiacSymbols[zodiacGroup.sign] ?? ''}`.trim()} text={`Senin gibi ${localizeZodiacSign(zodiacGroup.sign)} burcu kullanıcılarla sohbet et.`} cta="GRUBA GİT" onPress={() => router.push('/zodiac-group' as Href)} /> : null}
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </Screen>;
}

function OptionRow<T extends string>({ label, options, value, onChange }: { label: string; options: Array<[T,string]>; value: T | null; onChange: (value:T)=>void }) { return <View style={styles.optionBlock}><Text style={styles.optionLabel}>{label}</Text><View style={styles.optionWrap}>{options.map(([id,text]) => <Pressable key={id} onPress={() => onChange(id)} style={[styles.option, value === id && styles.optionActive]}><Text style={[styles.optionText, value === id && styles.optionTextActive]}>{text}</Text></Pressable>)}</View></View>; }
function SocialCard({ eyebrow, title, text, cta, onPress }: { eyebrow?:string;title:string;text:string;cta?:string;onPress:()=>void }) { return <Pressable onPress={onPress} style={styles.card}><View style={styles.cardCopy}>{eyebrow ? <Text style={styles.cardEyebrow}>{eyebrow}</Text> : null}<Text style={styles.cardTitle}>{title}</Text><Text style={styles.copy}>{text}</Text>{cta ? <Text style={styles.cardCta}>{cta}</Text> : null}</View><Text style={styles.arrow}>›</Text></Pressable>; }

const styles = StyleSheet.create({ intro:{gap:8},eyebrow:{color:colors.sapphire,fontSize:13,fontWeight:'800',letterSpacing:1.4},description:{color:colors.muted,fontSize:17,lineHeight:25},loadingState:{alignItems:'center',gap:14,justifyContent:'center',minHeight:220},stateCard:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:20,borderWidth:1,gap:12,margin:18,padding:20},stateTitle:{color:colors.navy,fontSize:20,fontWeight:'900',lineHeight:27,textAlign:'center'},stateCopy:{color:colors.muted,fontSize:15,lineHeight:22,textAlign:'center'},identity:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:20,borderWidth:1,gap:14,padding:17},identityHeading:{alignItems:'center',flexDirection:'row',gap:12},identityCopy:{flex:1,gap:3},identityLabel:{color:colors.sapphire,fontSize:11,fontWeight:'900',letterSpacing:1},handle:{color:colors.navy,fontSize:20,fontWeight:'900'},editIcon:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:18,height:36,justifyContent:'center',width:36},photo:{borderRadius:30,height:60,width:60},photoPlaceholder:{alignItems:'center',backgroundColor:colors.sapphireSoft,borderRadius:30,height:60,justifyContent:'center',width:60},avatarLetter:{color:colors.sapphire,fontSize:21,fontWeight:'900'},editForm:{gap:12},handleInputRow:{alignItems:'center',backgroundColor:colors.white,borderColor:colors.border,borderRadius:14,borderWidth:1,flexDirection:'row',minHeight:52,paddingHorizontal:14},at:{color:colors.sapphire,fontSize:18,fontWeight:'900'},handleInput:{color:colors.navy,flex:1,fontSize:16,minHeight:50},input:{backgroundColor:colors.white,borderColor:colors.border,borderRadius:14,borderWidth:1,color:colors.navy,fontSize:16,minHeight:52,paddingHorizontal:14},multiline:{minHeight:78,paddingTop:13,textAlignVertical:'top'},preferences:{backgroundColor:colors.surface,borderColor:colors.border,borderRadius:20,borderWidth:1,gap:12,padding:17},preferencesTitle:{color:colors.navy,fontSize:19,fontWeight:'900'},optionBlock:{gap:7},optionLabel:{color:colors.navy,fontSize:14,fontWeight:'800'},optionWrap:{flexDirection:'row',flexWrap:'wrap',gap:7},option:{borderColor:colors.border,borderRadius:18,borderWidth:1,paddingHorizontal:12,paddingVertical:8},optionActive:{backgroundColor:colors.sapphire,borderColor:colors.sapphire},optionText:{color:colors.navy,fontSize:13,fontWeight:'700'},optionTextActive:{color:colors.white},switchRow:{alignItems:'center',flexDirection:'row',justifyContent:'space-between'},switchText:{color:colors.navy,fontSize:15,fontWeight:'700'},editActions:{flexDirection:'row',gap:9},editActionButton:{flex:1},primary:{alignItems:'center',backgroundColor:colors.sapphire,borderRadius:15,justifyContent:'center',minHeight:52,paddingHorizontal:18},primaryText:{color:colors.white,fontSize:14,fontWeight:'900'},secondary:{alignItems:'center',borderColor:colors.border,borderRadius:15,borderWidth:1,justifyContent:'center',minHeight:52,paddingHorizontal:18},secondaryText:{color:colors.navy,fontSize:14,fontWeight:'900'},usage:{backgroundColor:colors.sapphireSoft,borderRadius:18,gap:5,padding:16},usageTitle:{color:colors.sapphire,fontSize:17,fontWeight:'900'},copy:{color:colors.muted,fontSize:15,lineHeight:22},card:{alignItems:'center',backgroundColor:colors.surface,borderColor:colors.border,borderRadius:20,borderWidth:1,flexDirection:'row',minHeight:96,padding:18},cardCopy:{flex:1,gap:6},cardEyebrow:{color:colors.gold,fontSize:11,fontWeight:'900',letterSpacing:1},cardTitle:{color:colors.navy,fontSize:18,fontWeight:'900'},cardCta:{color:colors.sapphire,fontSize:12,fontWeight:'900',letterSpacing:.7},arrow:{color:colors.sapphire,fontSize:32},error:{color:colors.danger,fontSize:14,lineHeight:21,textAlign:'center'} });
