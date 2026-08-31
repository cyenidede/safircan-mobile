import { Redirect } from 'expo-router';

export default function PremiumPreviewScreen() {
  if (!__DEV__) return <Redirect href="/(tabs)/profile" />;
  const { DevPremiumPreviewContent } = require('@/features/premium/DevPremiumPreviewContent') as typeof import('@/features/premium/DevPremiumPreviewContent');
  return <DevPremiumPreviewContent />;
}
