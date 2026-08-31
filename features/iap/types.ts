import type { PremiumProductId } from '@/constants/products';

export type StoreProduct = { productId: PremiumProductId; appStoreProductId: string; displayPrice: string };
export type StorePurchase = { id: string; productId: string; purchaseToken?: string | null };
export type PurchaseResult = { ok: true } | { ok: false; message: string };
export type IAPContextValue = {
  available: boolean;
  loading: boolean;
  purchasing: PremiumProductId | null;
  restoring: boolean;
  products: Partial<Record<PremiumProductId, StoreProduct>>;
  displayPrice: (productId: PremiumProductId) => string | null;
  purchase: (productId: PremiumProductId) => Promise<PurchaseResult>;
  restorePurchases: () => Promise<PurchaseResult>;
};
