import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, layout } from '@/constants/theme';
import { PremiumBadge } from './PremiumBadge';
import { useLocale, usePalette } from '@/localization';

type LockedSectionProps = {
  title: string;
  description?: string;
  onUnlock?: () => void;
  compact?: boolean;
  emphasized?: boolean;
};

export function LockedSection({
  title,
  description,
  onUnlock,
  compact = false,
  emphasized = false,
}: LockedSectionProps) {
  const { locale } = useLocale();
  const palette = usePalette();
  const resolvedDescription = description ?? (locale === 'tr' ? 'Haritandaki bu alanın ayrıntılı yorumunu keşfet.' : 'Explore the detailed reading for this area of your chart.');
  if (compact) {
    return (
      <Pressable accessibilityRole="button" onPress={onUnlock} style={({ pressed }) => [styles.compactCard,emphasized && styles.emphasizedCard,{backgroundColor:palette.surface,borderColor:emphasized?palette.gold:palette.border},pressed && styles.pressed]}>
        <View style={[styles.compactIcon,{backgroundColor:palette.sapphireSoft}]}><Ionicons name="lock-closed" size={16} color={palette.gold} /></View>
        <View style={styles.compactCopy}><Text style={[styles.compactTitle,{color:palette.navy}]}>{title}</Text><Text numberOfLines={1} style={[styles.compactDescription,{color:palette.muted}]}>{resolvedDescription}</Text></View>
        <View style={styles.compactEnd}><PremiumBadge /><Ionicons name="chevron-forward" size={20} color={palette.sapphire} /></View>
      </Pressable>
    );
  }
  return (
    <View style={[styles.card,{backgroundColor:palette.surface,borderColor:palette.border}]}>
      <View style={styles.topRow}>
        <View style={[styles.icon,{backgroundColor:palette.sapphireSoft}]}><Ionicons name="lock-closed" size={19} color={palette.gold} /></View>
        <PremiumBadge />
      </View>
      <Text style={[styles.title,{color:palette.navy}]}>{title}</Text>
      <Text style={[styles.description,{color:palette.muted}]}>{resolvedDescription}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onUnlock}
        style={({ pressed }) => [styles.button,{borderColor:palette.sapphire},pressed && styles.pressed]}>
        <Text style={[styles.buttonText,{color:palette.sapphire}]}>{locale==='tr'?'Premium ile Aç':'Unlock with Premium'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: layout.radius, borderWidth: 1, gap: 12, padding: 18 },
  topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  icon: { alignItems: 'center', backgroundColor: '#F4E8CE', borderRadius: 20, height: 38, justifyContent: 'center', width: 38 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '700' },
  description: { color: colors.muted, fontSize: 16, lineHeight: 23 },
  button: { alignItems: 'center', borderColor: colors.sapphire, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', minHeight: 52 },
  buttonText: { color: colors.sapphire, fontSize: 16, fontWeight: '700' },
  pressed: { opacity: 0.7 },
  compactCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 74, paddingHorizontal: 13, paddingVertical: 10 },
  compactIcon: { alignItems: 'center', backgroundColor: '#F4E8CE', borderRadius: 17, height: 34, justifyContent: 'center', width: 34 },
  compactCopy: { flex: 1, gap: 3 }, compactTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' }, compactDescription: { color: colors.muted, fontSize: 13 },
  compactEnd: { alignItems: 'center', flexDirection: 'row', gap: 3 },
  emphasizedCard: { backgroundColor: '#FFFAEE', borderColor: colors.gold, borderWidth: 1.5 },
});
