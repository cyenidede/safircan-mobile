import { API_BASE_URL, ApiRequestError, requestJson, type ApiResponseDiagnostic } from '@/lib/api';
import { deserializePreferences, serializePreferences, type PreferencesApiRow, type UserPreferences } from './domain';

type PreferencesResponse = { success: boolean; preferences: PreferencesApiRow };
type SaveResponse = { success: boolean; code?: string; message?: string };

function responseDiagnostic({ url, status, data }: ApiResponseDiagnostic) {
  if (!__DEV__) return;
  const value = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  console.info('[settings-debug] response', { url, status, success: value.success === true, code: typeof value.code === 'string' ? value.code : undefined, message: typeof value.message === 'string' ? value.message : undefined });
}

export async function getPreferences(token: string) {
  const response = await requestJson<PreferencesResponse>('/api/settings/preferences', {
    headers: { Authorization: `Bearer ${token}` },
  }, undefined, responseDiagnostic);
  const preferences = deserializePreferences(response.preferences);
  if (!response.success || !preferences) throw new ApiRequestError('response');
  return preferences;
}

export async function savePreferences(token: string, preferences: UserPreferences) {
  const body = serializePreferences(preferences);
  if (__DEV__) console.info('[settings-debug] request', { url: `${API_BASE_URL}/api/settings/preferences`, method: 'PATCH', body });
  const response = await requestJson<SaveResponse>('/api/settings/preferences', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }, undefined, responseDiagnostic);
  if (!response.success) throw new ApiRequestError('response');
}
