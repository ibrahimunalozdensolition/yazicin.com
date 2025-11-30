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
| `phoneNumber` | string | Telefon numarası |
| `createdAt` | timestamp | Kayıt tarihi |
| `updatedAt` | timestamp | Son güncelleme tarihi |
| `isEmailVerified` | boolean | E-posta doğrulama durumu |
| `providerId` | string | (Opsiyonel) Eğer role='provider' ise providers koleksiyonundaki ID |

### `providerApplications` (Provider Başvuruları)
Provider olmak isteyen kullanıcıların başvuru bilgileri.

| Alan | Tip | Açıklama |
|---|---|---|
| `userId` | string | Başvuran kullanıcı ID |
| `email` | string | E-posta adresi |
| `displayName` | string | Ad Soyad |
| `phoneNumber` | string | Telefon numarası |
| `businessName` | string | İşletme/Atölye adı |
| `businessType` | string | 'individual' \| 'company' |
| `city` | string | İl |
| `district` | string | İlçe |
| `address` | string | Açık adres |
| `printerBrand` | string | Yazıcı markası |
| `printerModel` | string | Yazıcı modeli |
| `experience` | string | 3D baskı deneyimi açıklaması |
| `status` | string | 'pending' \| 'approved' \| 'rejected' |
| `adminNote` | string | Admin notu (red durumunda) |
| `createdAt` | timestamp | Başvuru tarihi |
| `reviewedAt` | timestamp | İnceleme tarihi |
| `reviewedBy` | string | İnceleyen admin ID |

### `providers` (Yazıcı Sahipleri)
Onaylanmış provider'ların detaylı bilgileri.

| Alan | Tip | Açıklama |
|---|---|---|
| `userId` | string | users koleksiyonundaki uid referansı |
| `businessName` | string | İşletme/Atölye adı |
| `businessType` | string | 'individual' \| 'company' |
| `bio` | string | Kısa açıklama/deneyim |
| `address` | map | Adres detayları (city, district, fullAddress) |
| `status` | string | 'pending' \| 'approved' \| 'rejected' \| 'suspended' |
| `rating` | number | Ortalama puan (0-5) |
| `completedOrders` | number | Tamamlanan sipariş sayısı |
| `initialPrinter` | map | İlk kayıtlı yazıcı (brand, model) |
| `printers` | array | Sahip olunan yazıcı ID'leri listesi |
| `bankAccount` | map | Banka hesap bilgileri (IBAN, Ad Soyad) |
| `createdAt` | timestamp | Oluşturulma tarihi |
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
| `zipCode` | string | Posta kodu (opsiyonel) |
| `isDefault` | boolean | Varsayılan adres mi? |
| `createdAt` | timestamp | Oluşturulma tarihi |

### `contactForms` (İletişim Formları)
İletişim sayfasından gönderilen mesajlar.

| Alan | Tip | Açıklama |
|---|---|---|
| `name` | string | Gönderen adı |
| `email` | string | E-posta adresi |
| `subject` | string | Konu |
| `message` | string | Mesaj içeriği |
| `status` | string | 'new' \| 'read' \| 'replied' |
| `createdAt` | timestamp | Gönderim tarihi |

## Veri Akışı

### Müşteri Kayıt Akışı
```
1. Register → users (role: customer)
2. Email doğrulama
3. customer-setup → users.phoneNumber + addresses koleksiyonu
4. Customer paneli erişim
```

### Provider Kayıt Akışı
```
1. Register → users (role: customer - geçici)
2. Email doğrulama
3. provider-application → providerApplications (status: pending)
4. Admin onayı:
   - users.role → "provider"
   - users.phoneNumber güncellenir
   - providers koleksiyonu oluşturulur
5. Provider paneli erişim
```

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
      allow read: if isSignedIn();
      allow write: if isOwner(userId) || isAdmin();
    }
    
    // Provider başvuruları
    match /providerApplications/{docId} {
      allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isSignedIn();
      allow update: if isAdmin();
    }
    
    // Providers koleksiyonu
    match /providers/{providerId} {
      allow read: if true; // Provider listesi herkese açık
      allow create: if isAdmin();
      allow update: if (resource.data.userId == request.auth.uid) || isAdmin();
    }
    
    // Adresler
    match /addresses/{docId} {
      allow read, write: if isSignedIn() && resource.data.userId == request.auth.uid;
      allow create: if isSignedIn();
    }
    
    // İletişim formları
    match /contactForms/{docId} {
      allow create: if true; // Herkes mesaj gönderebilir
      allow read: if isAdmin();
    }
  }
}
```
