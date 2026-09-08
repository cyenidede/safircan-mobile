import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors, darkColors } from '@/constants/theme';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { AstrologyChartProvider } from '@/features/astrology/AstrologyChartProvider';
import { IAPProvider } from '@/features/iap';
import { EntitlementProvider } from '@/features/premium/EntitlementProvider';
import { GlobalTabBar } from '@/components/GlobalTabBar';
import { SocialNotificationProvider } from '@/features/social/SocialNotificationProvider';
import { LocaleProvider, useLocale } from '@/localization';

export default function RootLayout() {
  return <SafeAreaProvider><AuthProvider><LocaleProvider><AppShell /></LocaleProvider></AuthProvider></SafeAreaProvider>;
}

function AppShell() {
  const { colorScheme, locale } = useLocale();
  const { messages } = useLocale();
  const palette = colorScheme === 'dark' ? darkColors : colors;
  const authHeader = { headerBackTitle: locale === 'tr' ? 'Geri' : 'Back', headerStyle: { backgroundColor: palette.background }, headerTintColor: palette.navy } as const;
  return <SocialNotificationProvider><EntitlementProvider><IAPProvider><AstrologyChartProvider><StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} /><View style={[styles.shell, { backgroundColor: palette.background }]}><View style={styles.content}><Stack screenOptions={{ contentStyle: { backgroundColor: palette.background }, headerShadowVisible: false }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="birth-chart" options={{ title: messages.routes.birthChart, ...authHeader }} />
    <Stack.Screen name="chart-result" options={{ title: messages.routes.chartResult, ...authHeader }} />
    <Stack.Screen name="full-chart" options={{ title: messages.routes.fullChart, ...authHeader }} />
    <Stack.Screen name="annual-forecast" options={{ title: messages.routes.annualForecast, ...authHeader }} />
    <Stack.Screen name="synastry" options={{ title: 'Sinastri', ...authHeader }} />
    <Stack.Screen name="rising-sign" options={{ title: messages.routes.rising, ...authHeader }} />
    <Stack.Screen name="moon-sign" options={{ title: messages.routes.moon, ...authHeader }} />
    <Stack.Screen name="venus-sign" options={{ title: messages.routes.venus, ...authHeader }} />
    <Stack.Screen name="zodiac-compatibility" options={{ title: messages.routes.compatibility, ...authHeader }} />
    <Stack.Screen name="daily-transits" options={{ title: messages.routes.transits, ...authHeader }} />
    <Stack.Screen name="moon-calendar" options={{ title: messages.routes.moonCalendar, ...authHeader }} />
    <Stack.Screen name="ask" options={{ headerShown: false }} />
    <Stack.Screen name="questions/index" options={{ title: messages.routes.questions, ...authHeader }} />
    <Stack.Screen name="questions/[id]" options={{ title: messages.routes.questionDetail, ...authHeader }} />
    <Stack.Screen name="community" options={{ title: 'SafirCan', ...authHeader }} />
    <Stack.Screen name="soulmate" options={{ title: 'Ruh Eşi', ...authHeader }} />
    <Stack.Screen name="private-chat" options={{ title: 'Özel Mesajlaşma', ...authHeader }} />
    <Stack.Screen name="zodiac-group" options={{ title: 'Burç Grubu', ...authHeader }} />
    <Stack.Screen name="social-profile" options={{ title: 'Sosyal Profil', ...authHeader }} />
    {__DEV__ ? <Stack.Screen name="premium-preview" options={{ title: messages.premiumPreview.preview, ...authHeader }} /> : null}
    <Stack.Screen name="premium" options={{ title: messages.routes.premium, ...authHeader }} />
    <Stack.Screen name="rectification" options={{ title: messages.routes.rectification, ...authHeader }} />
    <Stack.Screen name="rectification-form" options={{ title: messages.routes.rectificationForm, ...authHeader }} />
    <Stack.Screen name="rectification-review" options={{ title: messages.routes.rectificationReview, ...authHeader }} />
    <Stack.Screen name="rectification-success" options={{ headerShown: false }} />
    <Stack.Screen name="rectification-result" options={{ title: messages.routes.rectificationResult, ...authHeader }} />
    <Stack.Screen name="rectification-upsell" options={{ headerShown: false }} />
    <Stack.Screen name="sign-up" options={{ title: messages.routes.signUp, ...authHeader }} />
    <Stack.Screen name="sign-in" options={{ title: messages.routes.signIn, ...authHeader }} />
    <Stack.Screen name="settings" options={{ headerShown: false }} />
    <Stack.Screen name="legal/[document]" options={{ headerShown: false }} />
  </Stack></View><GlobalTabBar /></View></AstrologyChartProvider></IAPProvider></EntitlementProvider></SocialNotificationProvider>;
}

const styles = StyleSheet.create({ shell: { flex: 1 }, content: { flex: 1 } });
