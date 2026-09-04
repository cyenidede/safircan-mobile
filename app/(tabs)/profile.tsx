import { router, useFocusEffect } from 'expo-router';
import type { Href } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatUnreadBadge, useSocialNotifications } from '@/features/social/SocialNotificationProvider';
import { getCurrentRectification, type RectificationStatus } from '@/features/rectification/api';

const statusLabels: Record<RectificationStatus, string> = { draft: 'Taslak', submitted: 'Hesaplama sırasına alındı', in_review: 'Hesaplanıyor', completed: 'Hesaplandı' };

export default function ProfileScreen() {
  const { loading, session, signOut, user } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rectificationStatus, setRectificationStatus] = useState<RectificationStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const { refreshUnread, unreadCount } = useSocialNotifications();

  useEffect(() => { if (!session?.access_token) { setRectificationStatus(null); return; } let active = true; setStatusLoading(true); void getCurrentRectification(session.access_token).then((result) => { if (active) setRectificationStatus(result.request?.status ?? null); }).catch(() => undefined).finally(() => { if (active) setStatusLoading(false); }); return () => { active = false; }; }, [session?.access_token]);
  useFocusEffect(useCallback(() => { void refreshUnread(); }, [refreshUnread]));

  if (loading) return <Screen><ActivityIndicator color={colors.sapphire} size="large" /></Screen>;

  if (!user) return <Screen><ProfileHeader /><View style={styles.actions}><Pressable onPress={() => router.push('/sign-up')} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Üye Ol</Text></Pressable><Pressable onPress={() => router.push('/sign-in')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Giriş Yap</Text></Pressable></View><DevPremiumPreviewButton /></Screen>;

  const firstName = typeof user.user_metadata.first_name === 'string' ? user.user_metadata.first_name : '';
  const lastName = typeof user.user_metadata.last_name === 'string' ? user.user_metadata.last_name : '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Safir Can kullanıcısı';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toLocaleUpperCase('tr-TR') || 'SC';
  const handleSignOut = async () => { if (signingOut) return; setSigningOut(true); setError(null); const result = await signOut(); setSigningOut(false); if (!result.ok) setError(result.message); };

  return <Screen><ProfileHeader signedIn unreadCount={unreadCount} /><View style={styles.card}><View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View><View style={styles.copy}><Text style={styles.title}>{fullName}</Text><Text style={styles.text}>{user.email}</Text></View></View><View style={styles.entitlement}><Text style={styles.entitlementTitle}>Üyelik durumu</Text><Text style={styles.freeBadge}>ÜCRETSİZ</Text><Text style={styles.text}>Premium ödeme sistemi henüz etkin değil.</Text></View><View style={styles.entitlement}><Text style={styles.entitlementTitle}>Rektifikasyon</Text>{statusLoading ? <ActivityIndicator color={colors.sapphire} /> : rectificationStatus ? <><Text style={styles.statusBadge}>{statusLabels[rectificationStatus]}</Text><Text style={styles.text}>Doğum saati çalışmanın güncel durumunu buradan takip edebilirsin.</Text></> : <><Text style={styles.text}>Henüz gönderilmiş bir rektifikasyon talebin yok.</Text><Pressable onPress={() => router.push('/rectification')} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Rektifikasyonu Keşfet</Text></Pressable></>}</View>{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable disabled={signingOut} onPress={() => void handleSignOut()} style={({ pressed }) => [styles.signOutButton, (pressed || signingOut) && styles.pressed]}>{signingOut ? <ActivityIndicator color={colors.danger} /> : <Text style={styles.signOutText}>Çıkış Yap</Text>}</Pressable><DevPremiumPreviewButton /></Screen>;
}

function ProfileHeader({ signedIn = false, unreadCount = 0 }: { signedIn?: boolean; unreadCount?: number }) { return <View style={styles.headerRow}><View style={styles.headerCopy}><SectionHeader eyebrow="PROFİL" title="Safir Can deneyimin" description={signedIn ? 'Hesap bilgilerini ve üyelik durumunu buradan yönet.' : 'Haritanı kaydetmek ve kişisel deneyimini korumak için hesabına giriş yap.'} /></View><View style={styles.chatArea}><Pressable accessibilityLabel="Sohbet alanını aç" accessibilityRole="button" hitSlop={10} onPress={() => router.push('/community' as Href)} style={({ pressed }) => [styles.chatButton, pressed && styles.pressed]}><Ionicons color={colors.sapphire} name="chatbubbles-outline" size={25} />{unreadCount > 0 ? <View style={styles.matchBadge}><Text style={styles.matchBadgeText}>{formatUnreadBadge(unreadCount)}</Text></View> : null}</Pressable></View></View>; }

function DevPremiumPreviewButton() { if (!__DEV__) return null; return <Pressable accessibilityRole="button" onPress={() => router.push('/premium-preview' as Href)} style={styles.previewButton}><Text style={styles.previewButtonText}>Premium Ekranı Önizle</Text><Text style={styles.previewHint}>Yalnız development fixture görünümü</Text></Pressable>; }

const styles = StyleSheet.create({
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 }, headerCopy: { flex: 1 }, chatArea: { alignItems: 'center', width: 92 }, chatButton: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderColor: colors.border, borderRadius: 21, borderWidth: 1, height: 42, justifyContent: 'center', marginTop: 1, width: 42 }, matchBadge: { alignItems: 'center', backgroundColor: colors.danger, borderRadius: 10, justifyContent: 'center', minHeight: 19, minWidth: 19, paddingHorizontal: 4, position: 'absolute', right: -5, top: -5 }, matchBadgeText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 22, flexDirection: 'row', gap: 14, padding: 18 }, avatar: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 30, height: 60, justifyContent: 'center', width: 60 }, avatarText: { color: colors.sapphire, fontSize: 19, fontWeight: '800' }, copy: { flex: 1, gap: 5 }, title: { color: colors.navy, fontSize: 19, fontWeight: '700' }, text: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  entitlement: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, gap: 12, padding: 18 }, entitlementTitle: { color: colors.navy, fontSize: 21, fontWeight: '800' }, freeBadge: { alignSelf: 'flex-start', backgroundColor: colors.sapphireSoft, borderRadius: 99, color: colors.sapphire, fontSize: 12, fontWeight: '800', letterSpacing: 0.8, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 6 },
  statusBadge: { alignSelf: 'flex-start', backgroundColor: '#F4E8CE', borderRadius: 99, color: colors.gold, fontSize: 13, fontWeight: '800', overflow: 'hidden', paddingHorizontal: 11, paddingVertical: 7 },
  actions: { gap: 12 }, primaryButton: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, justifyContent: 'center', minHeight: 58 }, primaryButtonText: { color: colors.white, fontSize: 17, fontWeight: '800' }, secondaryButton: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', minHeight: 56 }, secondaryButtonText: { color: colors.sapphire, fontSize: 17, fontWeight: '700' },
  signOutButton: { alignItems: 'center', borderColor: '#D6A7A7', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 56 }, signOutText: { color: colors.danger, fontSize: 17, fontWeight: '700' }, error: { color: colors.danger, fontSize: 15 }, pressed: { opacity: 0.65 },
  previewButton: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: 16, gap: 3, justifyContent: 'center', minHeight: 58, paddingHorizontal: 14 }, previewButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' }, previewHint: { color: colors.sapphireSoft, fontSize: 11, fontWeight: '700' },
});
