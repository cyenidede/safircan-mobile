import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatDate, useLocale, usePalette } from '@/localization';
import { useAccountLifecycle } from './AccountLifecycleProvider';
import { deletionDate } from './domain';

export function AccountLifecycleGate({ children }: PropsWithChildren) {
  const { session, signOut } = useAuth();
  const account = useAccountLifecycle();
  const { locale } = useLocale();
  const palette = usePalette();
  const tr = locale === 'tr';

  if (!session) return children;
  if (account.loading && !account.lifecycle) {
    return <View style={[styles.center, { backgroundColor: palette.background }]}><ActivityIndicator color={palette.sapphire} /></View>;
  }
  if (!account.lifecycle) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.title, { color: palette.navy }]}>{tr ? 'Hesap durumu yüklenemedi' : 'Account status unavailable'}</Text>
          <Text style={[styles.copy, { color: palette.muted }]}>{tr ? 'Güvenli şekilde devam edebilmek için tekrar dene.' : 'Try again before continuing securely.'}</Text>
          <Pressable disabled={account.loading} onPress={() => void account.reload()} style={[styles.primary, { backgroundColor: palette.sapphire }]}>
            <Text style={styles.primaryText}>{tr ? 'Tekrar Dene' : 'Try Again'}</Text>
          </Pressable>
          <SignOutButton tr={tr} color={palette.sapphire} onPress={() => void signOut()} />
        </View>
      </View>
    );
  }
  if (account.lifecycle.state === 'active') return children;

  const pending = account.lifecycle.state === 'deletion_pending';
  const suspended = account.lifecycle.state === 'suspended';
  const title = suspended
    ? (tr ? 'Hesabın askıya alındı' : 'Your account is suspended')
    : pending
      ? (tr ? 'Silme talebin oluşturuldu' : 'Your deletion request was created')
      : (tr ? 'Hesabın duraklatıldı' : 'Your account is paused');
  const copy = suspended
    ? (tr ? 'Bu hesap güvenlik veya yönetim nedeniyle kullanıma kapatıldı. Destek ile iletişime geçebilirsin.' : 'This account has been restricted for security or administrative reasons. Contact support for help.')
    : pending
      ? (tr ? 'Bekleme süresi boyunca talebini iptal edebilirsin.' : 'You can cancel your request during the grace period.')
      : (tr ? 'Profilin şu anda diğer kullanıcılara gösterilmiyor. Verilerin ve satın almaların korunuyor.' : 'Your profile is currently hidden from other users. Your data and purchases are preserved.');

  return (
    <View style={[styles.center, { backgroundColor: palette.background }]}>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.navy }]}>{title}</Text>
        <Text style={[styles.copy, { color: palette.muted }]}>{copy}</Text>
        {pending && account.lifecycle.deletionRequestedAt ? (
          <>
            <Text style={[styles.meta, { color: palette.muted }]}>{tr ? 'Talep tarihi' : 'Request date'}: {formatDate(account.lifecycle.deletionRequestedAt, locale)}</Text>
            <Text style={[styles.meta, { color: palette.muted }]}>{tr ? 'Planlanan silme tarihi' : 'Scheduled deletion date'}: {formatDate(deletionDate(account.lifecycle.deletionRequestedAt, account.lifecycle.deletionGraceDays), locale)}</Text>
          </>
        ) : null}
        {!suspended ? (
          <Pressable disabled={account.busy} onPress={() => void (pending ? account.cancelDeletion() : account.resume())} style={[styles.primary, { backgroundColor: palette.sapphire }]}>
            <Text style={styles.primaryText}>{pending ? (tr ? 'Silme Talebini İptal Et' : 'Cancel Deletion Request') : (tr ? 'Hesabımı Yeniden Etkinleştir' : 'Reactivate My Account')}</Text>
          </Pressable>
        ) : null}
        <SignOutButton tr={tr} color={palette.sapphire} onPress={() => void signOut()} />
        {account.error ? <Text style={[styles.error, { color: palette.danger }]}>{tr ? 'İşlem tamamlanamadı. Tekrar dene.' : 'The action could not be completed. Try again.'}</Text> : null}
      </View>
    </View>
  );
}

function SignOutButton({ tr, color, onPress }: { tr: boolean; color: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.secondary}><Text style={[styles.secondaryText, { color }]}>{tr ? 'Çıkış Yap' : 'Sign Out'}</Text></Pressable>;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 22 },
  card: { borderRadius: 22, borderWidth: 1, gap: 16, maxWidth: 430, padding: 22, width: '100%' },
  title: { fontSize: 27, fontWeight: '900' },
  copy: { fontSize: 16, lineHeight: 24 },
  meta: { fontSize: 14 },
  primary: { alignItems: 'center', borderRadius: 15, justifyContent: 'center', minHeight: 54, padding: 12 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  secondary: { alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  secondaryText: { fontSize: 16, fontWeight: '800' },
  error: { fontSize: 14, textAlign: 'center' },
});
