import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { AnnualForecastExperience } from '@/app/annual-forecast';
import { PremiumNatalExperience } from '@/app/full-chart';
import { Screen } from '@/components/Screen';
import { colors } from '@/constants/theme';
import { DEV_ANNUAL_FORECAST, DEV_PREMIUM_NATAL } from '@/features/premium/devPremiumPreviewFixture';

export function DevPremiumPreviewContent() { const [view, setView] = useState<'natal' | 'forecast'>('natal'); return <Screen>{view === 'natal' ? <PremiumNatalExperience data={DEV_PREMIUM_NATAL} onOpenForecast={() => setView('forecast')} preview /> : <><Pressable accessibilityRole="button" onPress={() => setView('natal')} style={styles.back}><Text style={styles.backText}>← TAM HARİTAYA DÖN</Text></Pressable><AnnualForecastExperience forecast={DEV_ANNUAL_FORECAST} preview /></>}</Screen>; }

const styles = StyleSheet.create({ back: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: 4 }, backText: { color: colors.sapphire, fontSize: 14, fontWeight: '900' } });
