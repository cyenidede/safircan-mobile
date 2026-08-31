import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { useAuth } from '@/features/auth/AuthProvider';
import { getRectificationResult, RectificationRequestError, saveRectificationResult, type PublicRectificationResult } from '@/features/rectification/api';
import { RectificationResultCard } from '@/features/rectification/RectificationResultCard';

export default function RectificationResultScreen() {
  const params = useLocalSearchParams<{ requestId?: string }>();
  const { session } = useAuth();
  const [result, setResult] = useState<PublicRectificationResult | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const requestId = typeof params.requestId === 'string' ? params.requestId : '';

  useEffect(() => { if (!requestId || !session?.access_token) { setError('Doğum saati sonucu bulunamadı.'); return; } let active = true; void getRectificationResult(requestId, session.access_token).then((value) => { if (active) setResult(value); }).catch(() => { if (active) setError('Doğum saati sonucu şu anda yüklenemiyor.'); }); return () => { active = false; }; }, [requestId, session?.access_token]);
  const save = async () => { if (!requestId || !session?.access_token || saving) return; setSaving(true); setError(''); try { await saveRectificationResult(requestId, session.access_token); router.replace('/rectification-upsell'); } catch (saveError) { if (saveError instanceof RectificationRequestError && saveError.message === 'profile_incomplete') { const labels: Record<string, string> = { first_name: 'ad', last_name: 'soyad', email: 'e-posta' }; const missing = saveError.missingFields.map((field) => labels[field]).filter(Boolean); setError(`Doğum saatin hesaplandı. Sonucu hesabına kaydetmek için profilindeki eksik bilgileri tamamlaman gerekiyor.${missing.length ? ` Eksik: ${missing.join(', ')}.` : ''}`); } else setError('Doğum saatin şu anda kaydedilemedi. Lütfen tekrar dene.'); } finally { setSaving(false); } };

  if (!result && !error) return <Screen><ActivityIndicator color={colors.sapphire} size="large" /><Text style={styles.loading}>Sonucun hazırlanıyor…</Text></Screen>;
  return <Screen>{result ? <RectificationResultCard result={{ birthTime: result.estimatedBirthTime, ascendantSign: result.ascendantSign }} saving={saving} onSave={() => void save()} /> : null}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}</Screen>;
}

const styles = StyleSheet.create({ loading: { color: colors.muted, fontSize: 16, textAlign: 'center' }, error: { backgroundColor: '#F8E8E8', borderRadius: 14, color: colors.danger, fontSize: 15, lineHeight: 21, padding: 13 } });
