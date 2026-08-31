# Apple In-App Purchase kurulumu

Mobil istemci `expo-iap` ile StoreKit ürünlerini okur. Satın alma veya geri yükleme sonucunda gelen imzalı transaction, kullanıcı Supabase access token'ı ile `POST https://safircan.com/api/iap/apple/verify` adresine gönderilir. İstemci yalnız `{ verified: true, productId }` yanıtından sonra non-consumable transaction'ı tamamlar ve `/api/entitlements` üzerinden haklarını yeniler.

Backend doğrulama endpoint'i şu alanları kabul etmelidir:

```json
{
  "productId": "birth_time_rectification",
  "appStoreProductId": "com.safircan.app.birth_time_rectification",
  "transactionId": "StoreKit transaction id",
  "signedTransaction": "StoreKit 2 JWS"
}
```

Backend; bearer token kullanıcı kimliğini doğrulamalı, StoreKit 2 JWS imzasını ve bundle/product/transaction/environment alanlarını Apple kök sertifikalarıyla server-side doğrulamalı, transaction'ı idempotent işlemeli ve ancak bundan sonra `product_entitlements` kaydını aktif etmelidir. Apple issuer ID, key ID ve `.p8` private key yalnız server ortamında tutulmalıdır.

## Development build

Expo Go native StoreKit modülünü içermez. Gerçek cihazdaki development build için Apple hesabı ve EAS projesi bağlandıktan sonra:

```sh
npx eas-cli build --profile development --platform ios
npx expo start --dev-client
```

`eas.json` içindeki development profili gerçek iOS cihazı ve internal distribution için hazırlanmıştır. StoreKit testi gerçek ürün veya Apple StoreKit Configuration/Sandbox hesabıyla yapılmalı; uygulama kodunda başarılı ödeme veya entitlement taklit edilmemelidir.
