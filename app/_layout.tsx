import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AstrologyChartProvider } from '@/features/astrology/AstrologyChartProvider';
import { IAPProvider } from '@/features/iap';
import { EntitlementProvider } from '@/features/premium/EntitlementProvider';
import { GlobalTabBar } from '@/components/GlobalTabBar';
import { SocialNotificationProvider } from '@/features/social/SocialNotificationProvider';

export default function RootLayout() {
  const authHeader = { headerBackTitle: 'Geri', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.navy } as const;
  return <SafeAreaProvider><AuthProvider><SocialNotificationProvider><EntitlementProvider><IAPProvider><AstrologyChartProvider><StatusBar style="dark" /><View style={styles.shell}><View style={styles.content}><Stack screenOptions={{ contentStyle: { backgroundColor: colors.background }, headerShadowVisible: false }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="birth-chart" options={{ title: 'Doğum Haritam', ...authHeader }} />
    <Stack.Screen name="chart-result" options={{ title: 'Harita Sonucum', ...authHeader }} />
    <Stack.Screen name="full-chart" options={{ title: 'Tam Doğum Haritan', ...authHeader }} />
    <Stack.Screen name="annual-forecast" options={{ title: '12 Aylık Öngörün', ...authHeader }} />
    <Stack.Screen name="synastry" options={{ title: 'Sinastri', ...authHeader }} />
    <Stack.Screen name="rising-sign" options={{ title: 'Yükselen Burç', ...authHeader }} />
    <Stack.Screen name="moon-sign" options={{ title: 'Ay Burcu', ...authHeader }} />
    <Stack.Screen name="venus-sign" options={{ title: 'Venüs Burcu', ...authHeader }} />
    <Stack.Screen name="zodiac-compatibility" options={{ title: 'Burç Uyumu', ...authHeader }} />
    <Stack.Screen name="daily-transits" options={{ title: 'Günlük Transitler', ...authHeader }} />
    <Stack.Screen name="moon-calendar" options={{ title: 'Ay Takvimi', ...authHeader }} />
    <Stack.Screen name="ask" options={{ headerShown: false }} />
    <Stack.Screen name="questions/index" options={{ title: 'Sorularım', ...authHeader }} />
    <Stack.Screen name="questions/[id]" options={{ title: 'Soru Detayı', ...authHeader }} />
    <Stack.Screen name="community" options={{ title: 'SafirCan', ...authHeader }} />
    <Stack.Screen name="soulmate" options={{ title: 'Ruh Eşi', ...authHeader }} />
    <Stack.Screen name="private-chat" options={{ title: 'Özel Mesajlaşma', ...authHeader }} />
    <Stack.Screen name="zodiac-group" options={{ title: 'Burç Grubu', ...authHeader }} />
    <Stack.Screen name="social-profile" options={{ title: 'Sosyal Profil', ...authHeader }} />
    {__DEV__ ? <Stack.Screen name="premium-preview" options={{ title: 'Premium Önizleme', ...authHeader }} /> : null}
    <Stack.Screen name="premium" options={{ title: 'Safir Can Premium', ...authHeader }} />
    <Stack.Screen name="rectification" options={{ title: 'Doğum Saati', ...authHeader }} />
    <Stack.Screen name="rectification-form" options={{ title: 'Rektifikasyon Formu', ...authHeader }} />
    <Stack.Screen name="rectification-review" options={{ title: 'Cevaplarını Gözden Geçir', ...authHeader }} />
    <Stack.Screen name="rectification-success" options={{ headerShown: false }} />
    <Stack.Screen name="rectification-result" options={{ title: 'Doğum Saati Sonucun', ...authHeader }} />
    <Stack.Screen name="rectification-upsell" options={{ headerShown: false }} />
    <Stack.Screen name="sign-up" options={{ title: 'Üye Ol', ...authHeader }} />
    <Stack.Screen name="sign-in" options={{ title: 'Giriş Yap', ...authHeader }} />
  </Stack></View><GlobalTabBar /></View></AstrologyChartProvider></IAPProvider></EntitlementProvider></SocialNotificationProvider></AuthProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({ shell: { backgroundColor: colors.background, flex: 1 }, content: { flex: 1 } });
