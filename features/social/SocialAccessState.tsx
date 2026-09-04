import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function SocialAccessState({ kind, onPress }: { kind: 'underage' | 'birth_required'; onPress: () => void }) {
  const underage = kind === 'underage';
  return <View style={styles.card}>
    <Text style={styles.title}>{underage ? 'Bu alan henüz senin için açık değil' : 'Doğum bilgilerini tamamlaman gerekiyor'}</Text>
    <Text style={styles.copy}>{underage
      ? 'Ruh Eşi, burç grupları ve özel mesajlaşma özellikleri 18 yaşını doldurduğunda kullanılabilir.'
      : 'Bu alanı kullanabilmek için önce doğum bilgilerini tamamlaman gerekiyor.'}</Text>
    <Pressable onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{underage ? 'GERİ DÖN' : 'DOĞUM BİLGİLERİMİ TAMAMLA'}</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, gap: 12, margin: 18, padding: 20 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '900', lineHeight: 27, textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 14, justifyContent: 'center', minHeight: 50, paddingHorizontal: 16 },
  buttonText: { color: colors.white, fontSize: 13, fontWeight: '900', textAlign: 'center' },
});
