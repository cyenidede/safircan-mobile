import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

import { disableSocialPushToken } from './api';
import { remotePushAvailable } from './notificationRuntime';

const DEVICE_ID_KEY = 'safircan.social.push-device-id.v1';

export async function getSocialPushDeviceId() {
  const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const created = Crypto.randomUUID();
  await AsyncStorage.setItem(DEVICE_ID_KEY, created);
  return created;
}

export async function disableSocialPushForLogout(accessToken: string) {
  if (!remotePushAvailable) return;
  try {
    await disableSocialPushToken(accessToken, await getSocialPushDeviceId());
  } catch {
    // Push cleanup must never prevent sign out.
  }
}
