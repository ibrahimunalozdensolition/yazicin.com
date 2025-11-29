# Firestore Veritabanı Şeması

## Koleksiyonlar

### `users` (Kullanıcılar)
Uygulamadaki tüm kullanıcıların (Müşteri, Provider, Admin) temel profil bilgileri.

| Alan | Tip | Açıklama |
|---|---|---|
| `uid` | string | Firebase Auth User ID (Document ID) |
| `email` | string | Kullanıcı e-posta adresi |
| `displayName` | string | Ad Soyad |
| `role` | string | 'customer' \| 'provider' \| 'admin' |
| `photoURL` | string | Profil fotoğrafı URL |
| `phoneNumber` | string | Telefon numarası (opsiyonel) |
| `createdAt` | timestamp | Kayıt tarihi |
| `updatedAt` | timestamp | Son güncelleme tarihi |
| `isEmailVerified` | boolean | E-posta doğrulama durumu |
| `providerId` | string | (Opsiyonel) Eğer role='provider' ise providers koleksiyonundaki ID |

### `providers` (Yazıcı Sahipleri)
Hizmet veren kullanıcıların detaylı bilgileri ve başvuru durumları.

| Alan | Tip | Açıklama |
|---|---|---|
| `userId` | string | users koleksiyonundaki uid referansı |
| `businessName` | string | İşletme/Atölye adı (Bireysel ise Ad Soyad) |
| `bio` | string | Kısa açıklama/biyografi |
| `address` | map | Adres detayları (il, ilçe, açık adres) |
| `status` | string | 'pending' \| 'approved' \| 'rejected' \| 'suspended' |
| `rating` | number | Ortalama puan (0-5) |
| `completedOrders` | number | Tamamlanan sipariş sayısı |
| `printers` | array | Sahip olunan yazıcı ID'leri listesi |
| `bankAccount` | map | Banka hesap bilgileri (IBAN, Ad Soyad) |
| `createdAt` | timestamp | Başvuru tarihi |
| `approvedAt` | timestamp | Onaylanma tarihi |

### `printers` (Yazıcılar) - *İleriki Faz*
Provider'lara ait yazıcıların özellikleri.

| Alan | Tip | Açıklama |
|---|---|---|
| `providerId` | string | Sahibi olan provider ID |
| `brand` | string | Marka |
| `model` | string | Model |
| `type` | string | FDM, SLA, vb. |
| `buildVolume` | map | { x, y, z } mm cinsinden baskı hacmi |
| `materials` | array | Desteklenen malzemeler (PLA, ABS, PETG vb.) |
| `colors` | array | Mevcut renkler |
| `status` | string | 'active' \| 'maintenance' \| 'busy' |
| `pricing` | map | Fiyatlandırma parametreleri (saatlik, gram başı vb.) |

### `orders` (Siparişler) - *İleriki Faz*
Verilen siparişlerin detayları.

| Alan | Tip | Açıklama |
|---|---|---|
| `customerId` | string | Siparişi veren müşteri ID |
| `providerId` | string | Siparişi alan provider ID |
| `status` | string | 'new' \| 'printing' \| 'shipping' \| 'completed' \| 'cancelled' |
| `totalAmount` | number | Toplam tutar |
| `files` | array | Yüklenen dosyalar (STL URL'leri ve metadata) |
| `printSettings` | map | Baskı ayarları (malzeme, doluluk, kalite) |
| `shippingAddress` | map | Teslimat adresi |
| `trackingNumber` | string | Kargo takip numarası |
| `createdAt` | timestamp | Sipariş tarihi |
| `estimatedDelivery` | timestamp | Tahmini teslimat |

### `addresses` (Adresler)
Kullanıcıların kayıtlı adresleri.

| Alan | Tip | Açıklama |
|---|---|---|
| `userId` | string | Kullanıcı ID |
| `title` | string | Adres başlığı (Ev, İş) |
| `city` | string | İl |
| `district` | string | İlçe |
| `fullAddress` | string | Açık adres |
| `zipCode` | string | Posta kodu |

## Security Rules (Temel Kurallar)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Yardımcı fonksiyonlar
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Users koleksiyonu
    match /users/{userId} {
      allow read: if isSignedIn(); // Herkes profilleri görebilir (kısıtlanabilir)
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Providers koleksiyonu
    match /providers/{providerId} {
      allow read: if true; // Provider listesi herkese açık
      allow create: if isSignedIn(); // Giriş yapan başvuru yapabilir
      allow update: if (resource.data.userId == request.auth.uid) || isAdmin();
    }
  }
}
```

