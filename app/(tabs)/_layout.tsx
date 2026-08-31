import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/constants/theme';

const icons = { index: ['home-outline', 'home'], chart: ['planet-outline', 'planet'], discover: ['compass-outline', 'compass'], daily: ['today-outline', 'today'], profile: ['person-outline', 'person'] } as const;

export default function TabLayout() {
  return <Tabs screenOptions={({ route }) => ({ headerShown: false, tabBarActiveTintColor: colors.sapphire, tabBarInactiveTintColor: colors.muted, tabBarLabelStyle: { fontSize: 12, fontWeight: '600' }, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 84, paddingBottom: 22, paddingTop: 8 }, tabBarIcon: ({ color, focused, size }) => { const pair = icons[route.name as keyof typeof icons] ?? icons.index; return <Ionicons color={color} name={pair[focused ? 1 : 0]} size={Math.max(size, 24)} />; } })}>
    <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} /><Tabs.Screen name="chart" options={{ title: 'Haritam' }} /><Tabs.Screen name="discover" options={{ title: 'Keşfet' }} /><Tabs.Screen name="daily" options={{ title: 'Günlük' }} /><Tabs.Screen name="profile" options={{ title: 'Profil' }} />
  </Tabs>;
}
