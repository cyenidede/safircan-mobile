import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { useLocale, usePalette } from '@/localization';
import { useAccountLifecycle } from '@/features/account/AccountLifecycleProvider';

export default function AccountDeletionScreen() {
  const { locale } = useLocale();
  const palette = usePalette();
  const account = useAccountLifecycle();
  const [confirmed, setConfirmed] = useState(false);
  const tr = locale === 'tr';
  const graceDays = account.lifecycle?.deletionGraceDays;

  return (
    <Screen>
      <Pressable onPress={() => router.back()} style={styles.back}>
        <Text style={[styles.backText, { color: palette.sapphire }]}>{tr ? 'Geri' : 'Back'}</Text>
      </Pressable>
      <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <Text style={[styles.title, { color: palette.navy }]}>
          {tr ? 'Hesabını silme talebi oluştur' : 'Request account deletion'}
        </Text>
        {graceDays ? (
          <>
            <Text style={[styles.copy, { color: palette.muted }]}>
              {tr
                ? `Hesabın hemen silinmez. ${graceDays} gün boyunca talebini iptal edebilirsin. Bu sürede profilin gizlenir ve hesabın kullanıma kapanır.`
                : `Your account will not be deleted immediately. You can cancel the request for ${graceDays} days. During this period, your profile will be hidden and your account will be unavailable.`}
            </Text>
            {!confirmed ? (
              <Pressable onPress={() => setConfirmed(true)} style={[styles.primary, { backgroundColor: palette.sapphire }]}>
                <Text style={styles.buttonText}>{tr ? 'Silme Talebine Devam Et' : 'Continue'}</Text>
              </Pressable>
            ) : (
              <>
                <Text style={[styles.warning, { color: palette.danger }]}>
                  {tr
                    ? 'Bu işlem hesabını bekleme süresi sonunda kalıcı silme sürecine alır.'
                    : 'This schedules your account for permanent deletion after the grace period.'}
                </Text>
                <Pressable disabled={account.busy} onPress={() => void account.requestDeletion()} style={[styles.primary, { backgroundColor: palette.danger }]}>
                  <Text style={styles.buttonText}>{tr ? 'HESABIMI SİLME TALEBİ OLUŞTUR' : 'REQUEST ACCOUNT DELETION'}</Text>
                </Pressable>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.copy, { color: palette.muted }]}>
              {tr ? 'Hesap bilgilerin yüklenemedi. Devam etmeden önce tekrar dene.' : 'Your account details could not be loaded. Try again before continuing.'}
            </Text>
            <Pressable disabled={account.loading} onPress={() => void account.reload()} style={[styles.primary, { backgroundColor: palette.sapphire }]}>
              <Text style={styles.buttonText}>{tr ? 'Tekrar Dene' : 'Try Again'}</Text>
            </Pressable>
          </>
        )}
        {account.error ? (
          <Text style={[styles.warning, { color: palette.danger }]}>
            {tr ? 'Talep oluşturulamadı. Yakın zamanda yeniden giriş yapman gerekebilir.' : 'The request could not be created. You may need to sign in again.'}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { minHeight: 44, justifyContent: 'center' },
  backText: { fontSize: 16, fontWeight: '700' },
  card: { borderRadius: 22, borderWidth: 1, gap: 18, padding: 20 },
  title: { fontSize: 27, fontWeight: '900' },
  copy: { fontSize: 16, lineHeight: 24 },
  warning: { fontSize: 15, lineHeight: 22 },
  primary: { alignItems: 'center', borderRadius: 15, justifyContent: 'center', minHeight: 56, padding: 12 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center' },
});
