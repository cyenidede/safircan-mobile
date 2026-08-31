import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AstrologyChartProvider } from '@/features/astrology/AstrologyChartProvider';
import { IAPProvider } from '@/features/iap';
import { EntitlementProvider } from '@/features/premium/EntitlementProvider';

export default function RootLayout() {
  const authHeader = { headerBackTitle: 'Geri', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.navy } as const;
  return <SafeAreaProvider><AuthProvider><EntitlementProvider><IAPProvider><AstrologyChartProvider><StatusBar style="dark" /><Stack screenOptions={{ contentStyle: { backgroundColor: colors.background }, headerShadowVisible: false }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="birth-chart" options={{ title: 'Doğum Haritam', ...authHeader }} />
    <Stack.Screen name="chart-result" options={{ title: 'Harita Sonucum', ...authHeader }} />
    <Stack.Screen name="full-chart" options={{ title: 'Tam Doğum Haritan', ...authHeader }} />
    <Stack.Screen name="annual-forecast" options={{ title: '12 Aylık Öngörün', ...authHeader }} />
    <Stack.Screen name="synastry" options={{ title: 'Sinastri', ...authHeader }} />
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
  </Stack></AstrologyChartProvider></IAPProvider></EntitlementProvider></AuthProvider></SafeAreaProvider>;
}
