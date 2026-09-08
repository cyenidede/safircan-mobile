import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, darkColors, layout } from '@/constants/theme';
import { useLocale } from '@/localization';

type ScreenProps = PropsWithChildren<{ scroll?: boolean; bottomPadding?: number }>;

export function Screen({ children, scroll = true, bottomPadding = 32 }: ScreenProps) {
  const { colorScheme } = useLocale();
  const palette = colorScheme === 'dark' ? darkColors : colors;
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: palette.background }]}>
      {scroll ? <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomPadding }]} showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1 },
  content: { flex: 1, gap: 20, paddingHorizontal: layout.screenPadding, paddingTop: 12 },
});
