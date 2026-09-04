export type CommunityAccessState =
  | 'loading'
  | 'birth_missing'
  | 'underage'
  | 'social_provisioning'
  | 'preferences'
  | 'ready'
  | 'error';

export type CommunityAccessInput = {
  birthFound: boolean;
  socialProfileFound?: boolean;
  preferencesRequired?: boolean;
  socialErrorCode?: string;
};

export function resolveCommunityAccess(input: CommunityAccessInput): CommunityAccessState {
  if (!input.birthFound) return 'birth_missing';
  if (input.socialErrorCode === 'age_restricted' || input.socialErrorCode === 'underage') return 'underage';
  if (input.socialErrorCode === 'profile_incomplete' || input.socialErrorCode === 'chart_required') return 'social_provisioning';
  if (input.socialErrorCode) return 'error';
  if (!input.socialProfileFound) return 'social_provisioning';
  return input.preferencesRequired ? 'preferences' : 'ready';
}

export function isProvisioningPendingCode(code: string | undefined) {
  return code === 'profile_incomplete' || code === 'chart_required';
}
