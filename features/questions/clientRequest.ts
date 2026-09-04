import * as Crypto from 'expo-crypto';

export function createClientRequestId() {
  return Crypto.randomUUID();
}

type Ref<T> = { current: T };

export function createClientRequestTracker(generate = createClientRequestId) {
  let value: string | null = null;
  return {
    start() { value = generate(); return value; },
    current() { value ??= generate(); return value; },
    clear() { value = null; },
  };
}

export async function runWithSubmitLock(lock: Ref<boolean>, action: () => Promise<void>) {
  if (lock.current) return false;
  lock.current = true;
  try { await action(); return true; }
  finally { lock.current = false; }
}
