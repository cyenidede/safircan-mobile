import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { PREMIUM_PRODUCTS } from '@/constants/products';

const topics = [
  { id: 'ascendant', title: 'Yükselen Burç', route: '/rising-sign' as Href },
  { id: 'moon', title: 'Ay Burcu', route: '/moon-sign' as Href },
  { id: 'venus', title: 'Venüs Burcu', route: '/venus-sign' as Href },
  { id: 'compatibility', title: 'Burç Uyumu', route: '/zodiac-compatibility' as Href },
  { id: 'synastry', title: PREMIUM_PRODUCTS.synastry.title, meta: `Premium · ${PREMIUM_PRODUCTS.synastry.prototypePrice}`, entitlement: 'synastry' as const, route: '/synastry' as Href },
  { id: 'transits', title: 'Günlük Transitler', route: '/daily-transits' as Href },
  { id: 'moon-calendar', title: 'Ay Takvimi', route: '/moon-calendar' as Href },
] as const;

export default function DiscoverScreen() {
  return <Screen>
    <SectionHeader eyebrow="KEŞFET" title="Astrolojiyi anlaşılır kıl" description="Doğum haritanı oluşturan temel kavramları keşfet." />
    {topics.map((topic) => {
      const isEnabled = 'route' in topic;
      return <Pressable
        accessibilityRole={isEnabled ? 'button' : undefined}
        disabled={!isEnabled}
        key={topic.id}
        onPress={() => { if (isEnabled) router.push(topic.route); }}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>{topic.title}</Text>
          {'meta' in topic ? <Text style={styles.meta}>{topic.meta}</Text> : null}
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>;
    })}
  </Screen>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', minHeight: 68, paddingHorizontal: 18 },
  rowPressed: { opacity: 0.72 },
  copy: { flex: 1, gap: 3 },
  title: { color: colors.navy, fontSize: 17, fontWeight: '700' },
  meta: { color: colors.gold, fontSize: 13, fontWeight: '800' },
  arrow: { color: colors.sapphire, fontSize: 30 },
});
