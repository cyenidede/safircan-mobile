import { productFromAppStoreId, type PremiumProductId } from '@/constants/products';
import type { StorePurchase } from './types';

const VERIFY_URL = 'https://safircan.com/api/iap/apple/verify';

export async function verifyPurchaseOnBackend(accessToken: string, purchase: StorePurchase): Promise<{ verified: true; productId: PremiumProductId }> {
  const product = productFromAppStoreId(purchase.productId);
  if (!product || !purchase.purchaseToken) throw new Error('invalid_purchase');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, appStoreProductId: product.appStoreProductId, transactionId: purchase.id, signedTransaction: purchase.purchaseToken }),
      signal: controller.signal,
    });
    const data = await response.json() as { verified?: boolean; productId?: PremiumProductId };
    if (!response.ok || data.verified !== true || data.productId !== product.id) throw new Error('verification_failed');
    return { verified: true, productId: product.id };
  } finally { clearTimeout(timeout); }
}
