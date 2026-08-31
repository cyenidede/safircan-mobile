import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';

export default function HomeScreen() {
  const { loading, user } = useAuth();
  const firstName = typeof user?.user_metadata.first_name === 'string' ? user.user_metadata.first_name : '';
  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.mark}><Text style={styles.markText}>S</Text></View>
        <Text style={styles.brand}>SAFİR CAN</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.orbit}>
          <View style={styles.orbitInner}>
            <Ionicons name="sparkles" size={30} color={colors.sapphire} />
          </View>
        </View>

        <View style={styles.heroTitleContainer}>
          <Text
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            numberOfLines={1}
            style={styles.heroTitle}>
            Safir’in Aynalı Dünyasına
          </Text>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={styles.heroTitle}>
            Hoş Geldin
          </Text>
        </View>
        <Text style={styles.heroText}>
          Doğum haritanı oluştur, günlük gökyüzünü takip et ve astrolojik yolculuğunu sade bir deneyimle keşfet.
        </Text>

        {!loading && user ? <View style={styles.actions}>
          <Text style={styles.welcomeText}>Hoş Geldin{firstName ? `, ${firstName}` : ''}</Text>
          <Pressable accessibilityRole="button" onPress={() => router.push('/chart')} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Haritama Git</Text>
            <Ionicons name="arrow-forward" size={21} color={colors.white} />
          </Pressable>
        </View> : !loading ? <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/sign-up')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Üye Ol</Text>
            <Ionicons name="arrow-forward" size={21} color={colors.white} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/sign-in')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Giriş Yap</Text>
          </Pressable>

          <Pressable
            accessibilityRole="link"
            onPress={() => router.push('/discover')}
            hitSlop={10}
            style={({ pressed }) => [styles.guestLink, pressed && styles.pressed]}>
            <Text style={styles.guestLinkText}>Misafir olarak keşfet</Text>
            <Ionicons name="chevron-forward" size={17} color={colors.sapphire} />
          </Pressable>
        </View> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 10, paddingVertical: 4 },
  mark: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 14, height: 34, justifyContent: 'center', width: 34 },
  markText: { color: colors.white, fontSize: 19, fontWeight: '800' },
  brand: { color: colors.navy, fontSize: 17, fontWeight: '800', letterSpacing: 2.4 },
  hero: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 28, borderWidth: 1, gap: 20, marginTop: 18, paddingHorizontal: 24, paddingVertical: 30 },
  orbit: { alignItems: 'center', borderColor: colors.sapphireSoft, borderRadius: 60, borderWidth: 1, height: 88, justifyContent: 'center', width: 88 },
  orbitInner: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderRadius: 40, height: 64, justifyContent: 'center', width: 64 },
  heroTitleContainer: { alignItems: 'center', marginVertical: -3, width: '100%' },
  heroTitle: { color: colors.navy, flexShrink: 1, fontSize: 28, fontWeight: '800', letterSpacing: -0.7, lineHeight: 34, textAlign: 'center', width: '100%' },
  heroText: { color: colors.muted, fontSize: 17, lineHeight: 26, maxWidth: 330, textAlign: 'center' },
  actions: { gap: 12, marginTop: 4, width: '100%' },
  welcomeText: { color: colors.navy, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 16, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 58, paddingHorizontal: 18 },
  primaryButtonText: { color: colors.white, fontSize: 17, fontWeight: '800' },
  secondaryButton: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', minHeight: 54, paddingHorizontal: 18 },
  secondaryButtonText: { color: colors.sapphire, fontSize: 16, fontWeight: '700' },
  guestLink: { alignItems: 'center', flexDirection: 'row', gap: 3, justifyContent: 'center', minHeight: 48 },
  guestLinkText: { color: colors.sapphire, fontSize: 15, fontWeight: '600' },
  pressed: { opacity: 0.68 },
});
