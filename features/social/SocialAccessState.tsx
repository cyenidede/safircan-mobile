import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { useLocale, usePalette } from '@/localization';

export function SocialAccessState({ kind, onPress }: { kind: 'underage' | 'birth_required'; onPress: () => void }) {
  const underage = kind === 'underage';
  const {messages}=useLocale(); const palette=usePalette(); const m=messages.accessRequired;
  return <View style={[styles.card,{backgroundColor:palette.surface,borderColor:palette.border}]}>
    <Text style={[styles.title,{color:palette.navy}]}>{underage ? m.underageTitle : m.title}</Text>
    <Text style={[styles.copy,{color:palette.muted}]}>{underage ? m.underageDescription : m.description}</Text>
    <Pressable onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{underage ? m.back : m.action}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 12, margin: 18, padding: 20 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '900', lineHeight: 27, textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 14, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  buttonText: { color: colors.white, fontSize: 13, fontWeight: '900', textAlign: 'center' },
});
