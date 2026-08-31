const ENDPOINT = 'https://safircan.com/api/birth-profile';

export type AuthenticatedBirthProfile = {
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_time: string | null;
  birth_time_unknown: boolean;
  birth_place: string;
  birth_time_source: 'user' | 'rectification' | null;
};

export async function getAuthenticatedBirthProfile(token: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(ENDPOINT, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = await response.json().catch(() => null) as { success?: boolean; profile?: AuthenticatedBirthProfile | null } | null;
    return data?.success ? data.profile ?? null : null;
  } finally {
    clearTimeout(timeout);
  }
}
