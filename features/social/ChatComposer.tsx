import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { colors } from '@/constants/theme';
import { PREMIUM_PRODUCTS } from '@/constants/products';
import type { SocialUsage } from './api';

export function ChatComposer({ usage, sending, immediate = false, onSend }: { usage: SocialUsage | null; sending: boolean; immediate?: boolean; onSend: (body: string) => boolean | Promise<boolean> }) {
  const [body, setBody] = useState('');
  const bodyRef = useRef('');
  const pressLocked = useRef(false);
  if (usage && !usage.allowed) return <View style={styles.paywall}><Text style={styles.paywallTitle}>10 ücretsiz mesaj hakkını kullandın.</Text><Text style={styles.copy}>Sınırsız mesajlaşmaya geç.</Text><Text style={styles.price}>{PREMIUM_PRODUCTS.messaging_subscription.prototypePrice}</Text><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/premium', params: { product: 'messaging_subscription' } } as Href)} style={styles.upgrade}><Text style={styles.upgradeText}>SINIRSIZ MESAJLAŞMAYA GEÇ</Text></Pressable></View>;
  const handlePress = () => {
    const trimmed = bodyRef.current.trim();
    if (!trimmed || sending || pressLocked.current) return;
    pressLocked.current = true;
    const result = onSend(trimmed);
    if (immediate) { bodyRef.current = ''; setBody(''); }
    else void Promise.resolve(result).then((sent) => { if (sent) { bodyRef.current = ''; setBody(''); } });
    requestAnimationFrame(() => { pressLocked.current = false; });
  };
  const updateBody = (value: string) => { bodyRef.current = value; setBody(value); };
  return <View style={styles.container}><TextInput accessibilityLabel="Mesaj" multiline maxLength={1000} onChangeText={updateBody} placeholder="Mesajını yaz…" placeholderTextColor={colors.muted} style={styles.input} value={body} /><Pressable accessibilityRole="button" disabled={!body.trim() || sending} onPress={handlePress} style={({ pressed }) => [styles.send, (pressed || sending || !body.trim()) && styles.disabled]}><Text style={styles.sendText}>GÖNDER</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-end', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 9, padding: 12 }, input: { backgroundColor: colors.white, borderColor: colors.border, borderRadius: 16, borderWidth: 1, color: colors.navy, flex: 1, fontSize: 16, maxHeight: 120, minHeight: 50, paddingHorizontal: 14, paddingVertical: 12 }, send: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 14, justifyContent: 'center', minHeight: 50, paddingHorizontal: 14 }, sendText: { color: colors.white, fontSize: 13, fontWeight: '900' }, disabled: { opacity: 0.55 }, paywall: { alignItems: 'center', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, gap: 7, padding: 15 }, paywallTitle: { color: colors.navy, fontSize: 16, fontWeight: '900', textAlign: 'center' }, copy: { color: colors.muted, fontSize: 14 }, price: { color: colors.gold, fontSize: 18, fontWeight: '900' }, upgrade: { alignItems: 'center', backgroundColor: colors.sapphire, borderRadius: 13, justifyContent: 'center', minHeight: 46, paddingHorizontal: 16 }, upgradeText: { color: colors.white, fontSize: 12, fontWeight: '900', textAlign: 'center' },
});
