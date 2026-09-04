import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

import ts from 'typescript';

const source = readFileSync(new URL('./communityAccess.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module });
const { isProvisioningPendingCode, resolveCommunityAccess } = module.exports;

test('server birth profile found never renders birth-missing for provisioning errors', () => {
  assert.equal(resolveCommunityAccess({ birthFound: true, socialErrorCode: 'profile_incomplete' }), 'social_provisioning');
  assert.equal(resolveCommunityAccess({ birthFound: true, socialErrorCode: 'chart_required' }), 'social_provisioning');
});

test('only a genuinely missing birth profile renders birth-missing', () => {
  assert.equal(resolveCommunityAccess({ birthFound: false }), 'birth_missing');
});

test('eligible users render preferences or ready based on the social response', () => {
  assert.equal(resolveCommunityAccess({ birthFound: true, socialProfileFound: true, preferencesRequired: true }), 'preferences');
  assert.equal(resolveCommunityAccess({ birthFound: true, socialProfileFound: true, preferencesRequired: false }), 'ready');
});

test('underage and unexpected failures remain distinct', () => {
  assert.equal(resolveCommunityAccess({ birthFound: true, socialErrorCode: 'age_restricted' }), 'underage');
  assert.equal(resolveCommunityAccess({ birthFound: true, socialErrorCode: 'network_error' }), 'error');
});

test('only normal provisioning codes are retried automatically', () => {
  assert.equal(isProvisioningPendingCode('profile_incomplete'), true);
  assert.equal(isProvisioningPendingCode('chart_required'), true);
  assert.equal(isProvisioningPendingCode('network_error'), false);
  assert.equal(isProvisioningPendingCode('age_restricted'), false);
});
