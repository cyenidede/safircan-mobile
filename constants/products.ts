export type PremiumProductId = 'annual_forecast' | 'full_chart' | 'birth_time_rectification' | 'synastry';

export type PremiumProduct = {
  id: PremiumProductId;
  appStoreProductId?: string;
  title: string;
  prototypePrice: string;
  description: string;
  ctaLabel: string;
  badge?: string;
  features: readonly string[];
};

// Prototip fiyatlarıdır. Production sürümünde fiyatlar StoreKit üzerinden
// kullanıcının mağaza bölgesine göre yerelleştirilmiş biçimde okunmalıdır.
export const PREMIUM_PRODUCTS: Record<PremiumProductId, PremiumProduct> = {
  annual_forecast: {
    id: 'annual_forecast',
    appStoreProductId: 'com.safircan.app.annual_forecast',
    title: '12 Aylık Yıllık Öngörün',
    prototypePrice: '349 TL',
    description: 'Önündeki 12 ayın önemli temalarını ve gökyüzü döngülerini daha yakından keşfet.',
    ctaLabel: '12 AYLIK ÖNGÖRÜMÜ AÇ',
    features: [
      'Önündeki 12 ayın ana temaları',
      'Aşk ve ilişki dönemleri',
      'Kariyer ve görünürlük fırsatları',
      'Para ve kaynaklarını yönetme dönemleri',
      'Dikkat ve sabır gerektiren zamanlar',
      'Aylık astrolojik yol haritası',
    ],
  },
  full_chart: {
    id: 'full_chart',
    appStoreProductId: 'com.safircan.app.full_chart',
    title: 'Tüm Haritamı Aç',
    prototypePrice: '699 TL',
    description: 'Doğum haritanın tüm temel analizlerini ve 12 aylık yıllık öngörünü tek pakette keşfet.',
    ctaLabel: 'TÜM HARİTAMI AÇ',
    badge: 'EN KAPSAMLI',
    features: [
      '12 Aylık Yıllık Öngörün',
      'Aşk ve İlişki Haritan',
      'Evlilik Potansiyelin',
      'Hayatına Çektiğin Partner Tipi',
      'Kariyer ve Başarı Yolun',
      'Para Kazanma Potansiyelin',
      'Doğuştan Gelen Yeteneklerin',
      'En Güçlü ve En Zorlayıcı Yönlerin',
      'Karmik Göstergelerin',
      'Chiron – En Hassas Noktan',
      'Lilith – Bastırdığın Tarafın',
      '12 Ev Analizi',
      'Gezegen Açıların',
      'MC – Kariyer Zirven',
      'Gelişmiş kişilik analizi',
    ],
  },
  birth_time_rectification: {
    id: 'birth_time_rectification',
    appStoreProductId: 'com.safircan.app.birth_time_rectification',
    title: 'Doğum Saati Hesaplama',
    prototypePrice: '499 TL',
    description: 'Yaşamındaki önemli olayları karşılaştırarak en güçlü eşleşen doğum saatini hesapla.',
    ctaLabel: 'DOĞUM SAATİMİ HESAPLA',
    features: [],
  },
  synastry: {
    id: 'synastry',
    title: 'Profesyonel Sinastri',
    prototypePrice: '599 TL',
    description: 'İki doğum haritasının ilişki dinamiklerini ayrıntılı olarak incele.',
    ctaLabel: 'PROFESYONEL SİNASTRİYİ AÇ',
    features: [],
  },
};

export const APP_STORE_PRODUCT_IDS = Object.values(PREMIUM_PRODUCTS)
  .map((product) => product.appStoreProductId)
  .filter((productId): productId is string => Boolean(productId));

export function productFromAppStoreId(appStoreProductId: string) {
  return Object.values(PREMIUM_PRODUCTS).find(
    (product) => product.appStoreProductId === appStoreProductId,
  );
}

export const PREMIUM_PRODUCT_ORDER: readonly PremiumProductId[] = [
  'annual_forecast',
  'full_chart',
  'synastry',
];
