import { hasEntitlement, hasPremiumAccess } from './entitlements';

function assert(value: boolean, message: string) {
  if (!value) throw new Error(message);
}

assert(!hasPremiumAccess('full_chart', 'advanced-synastry'), 'full_chart must not unlock Professional Synastry');
assert(!hasPremiumAccess('annual_forecast', 'advanced-synastry'), 'annual_forecast must not unlock Professional Synastry');
assert(!hasPremiumAccess('birth_time_rectification', 'advanced-synastry'), 'rectification must not unlock Professional Synastry');
assert(hasPremiumAccess('synastry', 'advanced-synastry'), 'synastry must unlock Professional Synastry');
assert(!hasEntitlement('synastry', 'full_chart'), 'synastry must not unlock full_chart');
assert(!hasEntitlement('synastry', 'annual_forecast'), 'synastry must not unlock annual_forecast');
assert(!hasEntitlement('synastry', 'birth_time_rectification'), 'synastry must not unlock rectification');
