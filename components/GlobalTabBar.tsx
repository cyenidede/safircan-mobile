import { Ionicons } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

type TabId = 'home' | 'chart' | 'ask' | 'discover' | 'profile';
type Tab = { id: TabId; label: string; href: Href; icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap };

const tabs: Tab[] = [
  { id: 'home', label: 'Ana Sayfa', href: '/', icon: 'home-outline', activeIcon: 'home' },
  { id: 'chart', label: 'Haritam', href: '/chart', icon: 'planet-outline', activeIcon: 'planet' },
  { id: 'ask', label: 'Sor', href: '/ask' as Href, icon: 'sparkles-outline', activeIcon: 'sparkles' },
  { id: 'discover', label: 'Keşfet', href: '/discover', icon: 'compass-outline', activeIcon: 'compass' },
  { id: 'profile', label: 'Profil', href: '/profile', icon: 'person-outline', activeIcon: 'person' },
];

const hiddenRoutes = new Set(['/sign-in', '/sign-up', '/rectification-success', '/rectification-upsell']);
const chartRoutes = ['/chart', '/birth-chart', '/chart-result', '/full-chart', '/annual-forecast', '/premium', '/premium-preview', '/rectification', '/rectification-form', '/rectification-review', '/rectification-result'];
const discoverRoutes = ['/discover', '/rising-sign', '/moon-sign', '/venus-sign', '/zodiac-compatibility', '/synastry'];
const profileRoutes = ['/profile', '/community', '/soulmate', '/private-chat', '/zodiac-group', '/social-profile'];

function activeTab(pathname: string): TabId {
  if (profileRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return 'profile';
  if (pathname === '/ask' || pathname === '/questions' || pathname.startsWith('/questions/')) return 'ask';
  if (discoverRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return 'discover';
  if (chartRoutes.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return 'chart';
  return 'home';
}

export function GlobalTabBar() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  if (hiddenRoutes.has(pathname) || keyboardVisible) return null;
  const active = activeTab(pathname);
  const navigate = (tab: Tab) => {
    if (__DEV__) console.log(`[global-tabs] press=${tab.id}`);
    if (router.canDismiss()) router.dismissAll();
    router.replace(tab.href);
  };

  return <View accessibilityRole="tablist" style={[styles.bar, { height: 62 + insets.bottom, paddingBottom: insets.bottom }]}>
    {tabs.map((tab) => {
      const selected = tab.id === active;
      return <Pressable accessibilityLabel={tab.label} accessibilityRole="tab" accessibilityState={{ selected }} hitSlop={4} key={tab.id} onPress={() => navigate(tab)} style={({ pressed }) => [styles.item, tab.id === 'ask' && styles.askItem, pressed && styles.pressed]}>
        <View style={tab.id === 'ask' ? [styles.askIcon, selected && styles.askIconActive] : undefined}><Ionicons color={tab.id === 'ask' ? (selected ? colors.white : colors.sapphire) : selected ? colors.sapphire : colors.muted} name={selected ? tab.activeIcon : tab.icon} size={tab.id === 'ask' ? 25 : 24} /></View>
        <Text style={[styles.label, selected && styles.activeLabel]}>{tab.label}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  bar: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, elevation: 16, flexDirection: 'row', paddingTop: 7, zIndex: 20 },
  item: { alignItems: 'center', flex: 1, gap: 3, justifyContent: 'center', minHeight: 54, minWidth: 0 },
  askItem: { marginTop: -10 },
  askIcon: { alignItems: 'center', backgroundColor: colors.sapphireSoft, borderColor: colors.surface, borderRadius: 22, borderWidth: 3, height: 44, justifyContent: 'center', width: 44 },
  askIconActive: { backgroundColor: colors.sapphire },
  label: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  activeLabel: { color: colors.sapphire },
  pressed: { opacity: 0.65 },
});
