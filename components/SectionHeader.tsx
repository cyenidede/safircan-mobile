import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/theme';

export function SectionHeader({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <View style={styles.container}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  eyebrow: { color: colors.sapphire, fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: colors.navy, fontSize: 30, fontWeight: '800', letterSpacing: -0.7, lineHeight: 36 },
  description: { color: colors.muted, fontSize: 17, lineHeight: 25 },
});
