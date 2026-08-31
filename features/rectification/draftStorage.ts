import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RectificationDraft } from './types';
const DRAFT_KEY = '@safircan/rectification-draft/v1';
export async function loadRectificationDraft() { const value = await AsyncStorage.getItem(DRAFT_KEY); if (!value) return null; try { const parsed = JSON.parse(value) as RectificationDraft; return parsed.version === 1 ? parsed : null; } catch { return null; } }
export async function saveRectificationDraft(draft: RectificationDraft) { await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, updatedAt: new Date().toISOString() })); }
export async function clearRectificationDraft() { await AsyncStorage.removeItem(DRAFT_KEY); }
