import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { ApiRequestError } from '@/lib/api';
import { getPersonalizedCurrent } from './api';
import {
  createPersonalizedPollingGate,
  PERSONALIZED_POLL_DELAY_MS,
  shouldPollPersonalized,
  type PersonalizedCurrent,
  type PersonalizedKind,
  type PersonalizedLocale,
} from './domain';

const personalizedKinds: readonly PersonalizedKind[] = ['weekly', 'monthly', 'sky_answer'];
export type PersonalizedFailure = 'auth_required' | 'account_unavailable' | 'temporary_unavailable' | 'network';
type KindState = { data: PersonalizedCurrent | null; loading: boolean; error: 'temporary_unavailable' | 'network' | null };
export type PersonalizedState = Record<PersonalizedKind, KindState>;

export function emptyPersonalizedState(): PersonalizedState {
  return {
    weekly: { data: null, loading: false, error: null },
    monthly: { data: null, loading: false, error: null },
    sky_answer: { data: null, loading: false, error: null },
  };
}

export function classifyPersonalizedFailure(error: unknown): PersonalizedFailure {
  if (error instanceof ApiRequestError && (error.status === 401 || error.kind === 'unauthorized')) return 'auth_required';
  if (error instanceof ApiRequestError && (error.status === 403 || error.kind === 'forbidden')) return 'account_unavailable';
  if (error instanceof ApiRequestError && error.status === 503) return 'temporary_unavailable';
  return 'network';
}

export function transitionPersonalizedFailure(current: PersonalizedState, kind: PersonalizedKind, failure: PersonalizedFailure) {
  if (failure === 'auth_required' || failure === 'account_unavailable') {
    return { state: emptyPersonalizedState(), blockingIssue: failure, cancelAll: true, retry: false } as const;
  }
  return {
    state: { ...current, [kind]: { data: null, loading: false, error: failure } },
    blockingIssue: null,
    cancelAll: false,
    retry: false,
  } as const;
}

export function createPersonalizedGenerationGate() {
  const values: Record<PersonalizedKind, number> = { weekly: 0, monthly: 0, sky_answer: 0 };
  return {
    current: (kind: PersonalizedKind) => values[kind],
    isCurrent: (kind: PersonalizedKind, ticket: number) => values[kind] === ticket,
    invalidate: (kind: PersonalizedKind) => { values[kind] += 1; },
    invalidateAll: () => { personalizedKinds.forEach((kind) => { values[kind] += 1; }); },
  };
}

export function usePersonalizedCurrent(accessToken: string | undefined, locale: PersonalizedLocale) {
  const [state, setState] = useState<PersonalizedState>(emptyPersonalizedState);
  const [blockingIssue, setBlockingIssue] = useState<'auth_required' | 'account_unavailable' | null>(null);
  const mountedRef = useRef(true);
  const focusedRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState ?? 'active');
  const ownerRef = useRef(`${accessToken ?? ''}:${locale}`);
  const generations = useRef(createPersonalizedGenerationGate());
  const controllers = useRef<Partial<Record<PersonalizedKind, AbortController>>>({});
  const timers = useRef<Partial<Record<PersonalizedKind, ReturnType<typeof setTimeout>>>>({});
  const gates = useRef<Record<PersonalizedKind, ReturnType<typeof createPersonalizedPollingGate>>>({
    weekly: createPersonalizedPollingGate(),
    monthly: createPersonalizedPollingGate(),
    sky_answer: createPersonalizedPollingGate(),
  });

  const cancelKind = useCallback((kind: PersonalizedKind, resetWindow = true) => {
    generations.current.invalidate(kind);
    controllers.current[kind]?.abort();
    delete controllers.current[kind];
    const timer = timers.current[kind];
    if (timer) clearTimeout(timer);
    delete timers.current[kind];
    if (resetWindow) gates.current[kind].cancel();
  }, []);

  const cancelAll = useCallback(() => personalizedKinds.forEach((kind) => cancelKind(kind)), [cancelKind]);
  const loadKindRef = useRef<(kind: PersonalizedKind, resetWindow?: boolean) => Promise<void>>(async () => undefined);

  const schedule = useCallback((kind: PersonalizedKind, result: PersonalizedCurrent) => {
    if (!focusedRef.current || appStateRef.current !== 'active' || !gates.current[kind].begin(result)) return;
    timers.current[kind] = setTimeout(() => {
      delete timers.current[kind];
      if (!gates.current[kind].consume() || !focusedRef.current || appStateRef.current !== 'active') return;
      void loadKindRef.current(kind, false);
    }, PERSONALIZED_POLL_DELAY_MS);
  }, []);

  const loadKind = useCallback(async (kind: PersonalizedKind, resetWindow = false) => {
    if (!accessToken || !mountedRef.current || !focusedRef.current || appStateRef.current !== 'active') return;
    cancelKind(kind, resetWindow);
    const ticket = generations.current.current(kind);
    const controller = new AbortController();
    controllers.current[kind] = controller;
    setState((current) => ({ ...current, [kind]: { ...current[kind], loading: true, error: null } }));
    try {
      const result = await getPersonalizedCurrent(kind, locale, accessToken, controller.signal);
      if (!mountedRef.current || controller.signal.aborted || !generations.current.isCurrent(kind, ticket) || ownerRef.current !== `${accessToken}:${locale}`) return;
      setBlockingIssue(null);
      setState((current) => ({ ...current, [kind]: { data: result, loading: false, error: null } }));
      if (shouldPollPersonalized(result)) schedule(kind, result);
    } catch (error) {
      if (!mountedRef.current || controller.signal.aborted || !generations.current.isCurrent(kind, ticket)) return;
      const failure = classifyPersonalizedFailure(error);
      if (failure === 'auth_required' || failure === 'account_unavailable') {
        cancelAll();
        setBlockingIssue(failure);
        setState(emptyPersonalizedState());
      } else {
        gates.current[kind].cancel();
        setBlockingIssue(null);
        setState((current) => transitionPersonalizedFailure(current, kind, failure).state);
      }
    } finally {
      if (controllers.current[kind] === controller) delete controllers.current[kind];
    }
  }, [accessToken, cancelAll, cancelKind, locale, schedule]);
  loadKindRef.current = loadKind;

  const refreshAll = useCallback(() => {
    if (!accessToken || !focusedRef.current || appStateRef.current !== 'active') return;
    personalizedKinds.forEach((kind) => { void loadKind(kind, true); });
  }, [accessToken, loadKind]);

  const refresh = useCallback((kind: PersonalizedKind) => loadKind(kind, true), [loadKind]);

  useEffect(() => {
    const owner = `${accessToken ?? ''}:${locale}`;
    ownerRef.current = owner;
    cancelAll();
    setBlockingIssue(null);
    setState(emptyPersonalizedState());
    if (accessToken && focusedRef.current && appStateRef.current === 'active') refreshAll();
  }, [accessToken, cancelAll, locale, refreshAll]);

  useFocusEffect(useCallback(() => {
    focusedRef.current = true;
    if (appStateRef.current === 'active') refreshAll();
    return () => {
      focusedRef.current = false;
      cancelAll();
    };
  }, [cancelAll, refreshAll]));

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      const wasActive = appStateRef.current === 'active';
      appStateRef.current = next;
      if (next !== 'active') cancelAll();
      else if (!wasActive && focusedRef.current) refreshAll();
    });
    return () => subscription.remove();
  }, [cancelAll, refreshAll]);

  useEffect(() => () => {
    mountedRef.current = false;
    focusedRef.current = false;
    cancelAll();
  }, [cancelAll]);

  const ownerMatches = ownerRef.current === `${accessToken ?? ''}:${locale}`;
  return useMemo(() => ({ state: ownerMatches ? state : emptyPersonalizedState(), blockingIssue: ownerMatches ? blockingIssue : null, refresh }), [blockingIssue, ownerMatches, refresh, state]);
}
