import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors } from '@/constants/theme';
import { PREMIUM_PRODUCTS } from '@/constants/products';
import { useLocale, usePalette } from '@/localization';

export default function DiscoverScreen() {
  const { messages } = useLocale(); const palette = usePalette(); const m = messages.discover;
  const topics = [
    { id: 'ascendant', title: m.ascendant, route: '/rising-sign' as Href },
    { id: 'moon', title: m.moon, route: '/moon-sign' as Href },
    { id: 'venus', title: m.venus, route: '/venus-sign' as Href },
    { id: 'compatibility', title: m.compatibility, route: '/zodiac-compatibility' as Href },
    { id: 'synastry', title: m.synastry, meta: `${m.premium} · ${PREMIUM_PRODUCTS.synastry.prototypePrice}`, route: '/synastry' as Href },
    { id: 'transits', title: m.transits, route: '/daily-transits' as Href },
    { id: 'moon-calendar', title: m.moonCalendar, route: '/moon-calendar' as Href },
  ] as const;
  return <Screen>
    <SectionHeader eyebrow={m.eyebrow} title={m.title} description={m.description} />
    {topics.map((topic) => {
      const isEnabled = 'route' in topic;
      return <Pressable
        accessibilityRole={isEnabled ? 'button' : undefined}
        disabled={!isEnabled}
        key={topic.id}
        onPress={() => { if (isEnabled) router.push(topic.route); }}
        style={({ pressed }) => [styles.row, { backgroundColor: palette.surface, borderColor: palette.border }, pressed && styles.rowPressed]}
      >
        <View style={styles.copy}>
          <Text style={[styles.title, { color: palette.navy }]}>{topic.title}</Text>
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
