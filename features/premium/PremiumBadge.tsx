import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

export function PremiumBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>PREMIUM</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F4E8CE',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
});
