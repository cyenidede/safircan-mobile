import AsyncStorage from '@react-native-async-storage/async-storage';

import { getAuthenticatedBirthProfile } from './api/birth-profile';
import type { NatalChartRequest } from './api/types';

const STORAGE_KEY = '@safircan/current-birth-input/v1';
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export type CurrentBirthInput = {
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  birth_place: string;
  birth_time_source: 'user' | 'rectification' | null;
  first_name?: string;
  last_name?: string;
};

type StoredBirthInput = { version: 1; birth_date: string; birth_time: string | null; birth_time_unknown: boolean; birth_place: string };

export async function saveCurrentBirthInput(input: NatalChartRequest) {
  const value: StoredBirthInput = { version: 1, birth_date: input.birth_date, birth_time: input.birth_time_unknown ? null : input.birth_time, birth_time_unknown: input.birth_time_unknown, birth_place: input.birth_place.trim() };
  if (!isValid(value)) return;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export async function resolveCurrentBirthProfile(accessToken?: string | null): Promise<CurrentBirthInput | null> {
  if (accessToken) {
    const profile = await getAuthenticatedBirthProfile(accessToken).catch(() => null);
    if (profile && isValid(profile)) return profile;
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredBirthInput;
    if (stored.version !== 1 || !isValid(stored)) return null;
    return { birth_date: stored.birth_date, birth_time: stored.birth_time, birth_time_unknown: stored.birth_time_unknown, birth_place: stored.birth_place, birth_time_source: null };
  } catch {
    return null;
  }
}

function isValid(input: { birth_date?: unknown; birth_time?: unknown; birth_time_unknown?: unknown; birth_place?: unknown }) {
  if (typeof input.birth_date !== 'string' || !DATE_PATTERN.test(input.birth_date) || Number.isNaN(Date.parse(`${input.birth_date}T00:00:00Z`))) return false;
  if (typeof input.birth_place !== 'string' || !input.birth_place.trim()) return false;
  if (input.birth_time_unknown === true) return input.birth_time == null;
  return input.birth_time_unknown === false && typeof input.birth_time === 'string' && TIME_PATTERN.test(input.birth_time.slice(0, 5));
}
