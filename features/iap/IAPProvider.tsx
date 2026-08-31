import Constants, { ExecutionEnvironment } from 'expo-constants';
import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';

import {
  APP_STORE_PRODUCT_IDS,
  PREMIUM_PRODUCTS,
  productFromAppStoreId,
  type PremiumProductId,
} from '@/constants/products';
import { useAuth } from '@/features/auth/AuthProvider';
import { useEntitlements } from '@/features/premium/EntitlementProvider';
import { verifyPurchaseOnBackend } from './backend';
import type { IAPContextValue, PurchaseResult, StoreProduct, StorePurchase } from './types';

type Subscription = { remove: () => void };
type ExpoIapModule = {
  initConnection: () => Promise<boolean>;
  endConnection: () => Promise<void>;
  fetchProducts: (options: { skus: string[]; type: 'in-app' }) => Promise<{ id: string; displayPrice: string }[] | null>;
  purchaseUpdatedListener: (listener: (purchase: StorePurchase) => void) => Subscription;
  purchaseErrorListener: (listener: () => void) => Subscription;
  requestPurchase: (options: { request: { apple: { sku: string; appAccountToken: string } }; type: 'in-app' }) => Promise<unknown>;
  finishTransaction: (options: { purchase: StorePurchase; isConsumable: false }) => Promise<void>;
  restorePurchases: () => Promise<void>;
  getAvailablePurchases: () => Promise<StorePurchase[]>;
};

const IAPContext = createContext<IAPContextValue | null>(null);
const developmentBuildMessage = 'Satın alma testi development build gerektirir.';
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function IAPProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const { refreshEntitlements } = useEntitlements();
  const moduleRef = useRef<ExpoIapModule | null>(null);
  const modulePromiseRef = useRef<Promise<ExpoIapModule> | null>(null);
  const purchaseSubscriptionRef = useRef<Subscription | null>(null);
  const errorSubscriptionRef = useRef<Subscription | null>(null);
  const processPurchaseRef = useRef<(purchase: StorePurchase) => Promise<void>>(async () => undefined);
  const activeRef = useRef(true);
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState<PremiumProductId | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [products, setProducts] = useState<Partial<Record<PremiumProductId, StoreProduct>>>({});

  processPurchaseRef.current = async (purchase) => {
    if (!session?.access_token || !moduleRef.current) throw new Error('auth_required');
    await verifyPurchaseOnBackend(session.access_token, purchase);
    await moduleRef.current.finishTransaction({ purchase, isConsumable: false });
    await refreshEntitlements();
    const product = productFromAppStoreId(purchase.productId);
    if (product) setPurchasing((current) => current === product.id ? null : current);
  };

  const loadStore = async (): Promise<ExpoIapModule> => {
    if (isExpoGo || Platform.OS !== 'ios') throw new Error('development_build_required');
    if (moduleRef.current) return moduleRef.current;
    if (modulePromiseRef.current) return modulePromiseRef.current;

    setLoading(true);
    modulePromiseRef.current = import('expo-iap').then(async (loadedModule) => {
      const iap = loadedModule as unknown as ExpoIapModule;
      await iap.initConnection();
      if (!activeRef.current) {
        await iap.endConnection();
        throw new Error('provider_unmounted');
      }
      moduleRef.current = iap;
      purchaseSubscriptionRef.current = iap.purchaseUpdatedListener((purchase) => {
        void processPurchaseRef.current(purchase).catch(() => setPurchasing(null));
      });
      errorSubscriptionRef.current = iap.purchaseErrorListener(() => setPurchasing(null));

      const fetched = await iap.fetchProducts({ skus: [...APP_STORE_PRODUCT_IDS], type: 'in-app' });
      const next: Partial<Record<PremiumProductId, StoreProduct>> = {};
      (fetched ?? []).forEach((storeProduct) => {
        const product = productFromAppStoreId(storeProduct.id);
        if (product) {
          next[product.id] = {
            productId: product.id,
            appStoreProductId: storeProduct.id,
            displayPrice: storeProduct.displayPrice,
          };
        }
      });
      setProducts(next);
      setAvailable(true);
      return iap;
    }).catch((error: unknown) => {
      setAvailable(false);
      modulePromiseRef.current = null;
      throw error;
    }).finally(() => setLoading(false));

    return modulePromiseRef.current;
  };

  useEffect(() => () => {
    activeRef.current = false;
    purchaseSubscriptionRef.current?.remove();
    errorSubscriptionRef.current?.remove();
    const iap = moduleRef.current;
    moduleRef.current = null;
    if (iap) void iap.endConnection();
  }, []);

  const purchase = async (productId: PremiumProductId): Promise<PurchaseResult> => {
    const product = PREMIUM_PRODUCTS[productId];
    if (isExpoGo) return { ok: false, message: developmentBuildMessage };
    if (Platform.OS !== 'ios') return { ok: false, message: 'Satın alma şu anda yalnız iOS uygulamasında kullanılabilir.' };
    if (!session) return { ok: false, message: 'Satın almak için önce giriş yapmalısın.' };
    if (!product.appStoreProductId) return { ok: false, message: 'Bu mağaza ürünü henüz kullanıma hazır değil.' };
    setPurchasing(productId);
    try {
      const iap = await loadStore();
      await iap.requestPurchase({
        request: { apple: { sku: product.appStoreProductId, appAccountToken: session.user.id } },
        type: 'in-app',
      });
      return { ok: true };
    } catch {
      setPurchasing(null);
      return { ok: false, message: 'Satın alma başlatılamadı. Lütfen tekrar dene.' };
    }
  };

  const restorePurchases = async (): Promise<PurchaseResult> => {
    if (isExpoGo) return { ok: false, message: developmentBuildMessage };
    if (Platform.OS !== 'ios') return { ok: false, message: 'Satın almaları geri yükleme şu anda yalnız iOS uygulamasında kullanılabilir.' };
    if (!session) return { ok: false, message: 'Satın almaları geri yüklemek için önce giriş yapmalısın.' };
    setRestoring(true);
    try {
      const iap = await loadStore();
      await iap.restorePurchases();
      const restored = await iap.getAvailablePurchases();
      for (const item of restored.filter((candidate) => productFromAppStoreId(candidate.productId))) {
        await processPurchaseRef.current(item);
      }
      return { ok: true };
    } catch {
      return { ok: false, message: 'Satın almalar geri yüklenemedi. Lütfen tekrar dene.' };
    } finally {
      setRestoring(false);
    }
  };

  const value = useMemo<IAPContextValue>(() => ({
    available,
    loading,
    purchasing,
    restoring,
    products,
    displayPrice: (productId) => products[productId]?.displayPrice ?? (__DEV__ ? PREMIUM_PRODUCTS[productId].prototypePrice : null),
    purchase,
    restorePurchases,
  }), [available, loading, products, purchasing, restoring, session]);

  return <IAPContext.Provider value={value}>{children}</IAPContext.Provider>;
}

export function useIAP() {
  const value = useContext(IAPContext);
  if (!value) throw new Error('useIAP must be used inside IAPProvider');
  return value;
}
