import { Tabs } from 'expo-router';

export default function TabLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
    <Tabs.Screen name="index" options={{ title: 'Ana Sayfa' }} /><Tabs.Screen name="chart" options={{ title: 'Haritam' }} /><Tabs.Screen name="discover" options={{ title: 'Keşfet' }} /><Tabs.Screen name="daily" options={{ href: null, title: 'Günlük' }} /><Tabs.Screen name="profile" options={{ title: 'Profil' }} />
  </Tabs>;
}
