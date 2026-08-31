import { ApiRequestError, requestJson } from '@/lib/api';
import type { SynastryQuestionAnswer, SynastryRelationshipType } from './types';

export type SynastryPersonRequest = {
  name?: string;
  birth_date: string;
  birth_time?: string;
  birth_time_unknown: boolean;
  birth_place: string;
};

export type MobileSynastryRequest = {
  relationshipType: SynastryRelationshipType;
  personA: SynastryPersonRequest;
  personB: SynastryPersonRequest;
};

export type MobileSynastryResponse = {
  success: true;
  version: string;
  relationshipType: SynastryRelationshipType;
  people: {
    personA: { name?: string; birthTimeKnown: boolean };
    personB: { name?: string; birthTimeKnown: boolean };
  };
  capabilities: { crossAspects: true; houseOverlays: boolean; angles: boolean; vertex: boolean };
  answers: SynastryQuestionAnswer[];
  cached: boolean;
};

export type SynastryClientError = 'auth' | 'entitlement' | 'place' | 'temporary';

export async function createSynastryReport(input: MobileSynastryRequest, accessToken: string) {
  try {
    const response = await requestJson<MobileSynastryResponse>('/api/mobile-synastry', {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }, 45_000);
    if (!response.success || response.answers.length !== 17) throw new ApiRequestError('response');
    return response;
  } catch (error) {
    const kind: SynastryClientError = error instanceof ApiRequestError
      ? error.kind === 'unauthorized' ? 'auth' : error.kind === 'forbidden' ? 'entitlement' : error.kind === 'place' ? 'place' : 'temporary'
      : 'temporary';
    throw new Error(kind);
  }
}
