import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, layout } from '@/constants/theme';
import { PremiumBadge } from './PremiumBadge';

type LockedSectionProps = {
  title: string;
  description?: string;
  onUnlock?: () => void;
  compact?: boolean;
  emphasized?: boolean;
};

export function LockedSection({
  title,
  description = 'Haritandaki bu alanın ayrıntılı yorumunu keşfet.',
  onUnlock,
  compact = false,
  emphasized = false,
}: LockedSectionProps) {
  if (compact) {
    return (
      <Pressable accessibilityRole="button" onPress={onUnlock} style={({ pressed }) => [styles.compactCard, emphasized && styles.emphasizedCard, pressed && styles.pressed]}>
        <View style={styles.compactIcon}><Ionicons name="lock-closed" size={16} color={colors.gold} /></View>
        <View style={styles.compactCopy}><Text style={styles.compactTitle}>{title}</Text><Text numberOfLines={1} style={styles.compactDescription}>{description}</Text></View>
        <View style={styles.compactEnd}><PremiumBadge /><Ionicons name="chevron-forward" size={20} color={colors.sapphire} /></View>
      </Pressable>
    );
  }
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.icon}><Ionicons name="lock-closed" size={19} color={colors.gold} /></View>
        <PremiumBadge />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onUnlock}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>Premium ile Aç</Text>
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
