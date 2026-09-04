import Constants, { ExecutionEnvironment } from 'expo-constants';

export const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const remotePushAvailable = !isExpoGo;

export async function loadNotificationsModule() {
  if (!remotePushAvailable) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}
