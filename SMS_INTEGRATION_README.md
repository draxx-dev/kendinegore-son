# 📱 NetGSM SMS Entegrasyonu

Bu proje, NetGSM SMS servisi kullanarak otomatik SMS gönderimi yapabilen bir salon yönetim sistemi içerir.

## 🚀 Özellikler

### 1. **Telefon Doğrulama SMS'i**
- Yeni müşteriler online randevu alırken telefon numaraları doğrulanır
- 6 haneli doğrulama kodu SMS ile gönderilir
- Kod 10 dakika geçerlidir
- Mevcut müşteriler için doğrulama gerekmez

### 2. **Randevu Hatırlatma SMS'i**
- Müşterilere randevularından belirli süre önce hatırlatma gönderilir
- Hatırlatma süresi işletme tarafından ayarlanabilir (15 dakika - 24 saat)
- Sadece aktif randevular için hatırlatma gönderilir

### 3. **İşletme Bildirim SMS'i**
- Yeni online randevu alındığında işletmeye bilgilendirme gönderilir
- **Günlük 3 SMS'e kadar sistem tarafından karşılanır**
- **3'ten sonraki SMS'ler işletme hesabından kesilir**
- Elle oluşturulan randevular için işletme bildirimi gönderilmez

### 4. **SMS Yönetim Paneli**
- SMS ayarlarını etkinleştir/devre dışı bırak
- Hatırlatma süresini ayarla
- SMS geçmişini görüntüle
- Başarılı/başarısız SMS istatistikleri

## ⚙️ Kurulum

### 1. **Environment Variables**
`.env` dosyasına NetGSM bilgilerini ekleyin:

```env
# NetGSM SMS Entegrasyonu
VITE_NETGSM_USERNAME="your_username"
VITE_NETGSM_PASSWORD="your_password"
VITE_NETGSM_HEADER="your_header"
VITE_NETGSM_API_URL="https://api.netgsm.com.tr"
```

### 2. **NetGSM Hesap Bilgileri**
- NetGSM hesabınızdan kullanıcı adı ve şifre alın
- SMS başlığınızı (header) belirleyin
- API URL varsayılan olarak ayarlanmıştır

## 🗄️ Veritabanı Yapısı

### **sms_settings** Tablosu
```sql
CREATE TABLE sms_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  is_enabled BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes INTEGER DEFAULT 30,
  business_notification_enabled BOOLEAN DEFAULT true,
  verification_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### **sms_logs** Tablosu
```sql
CREATE TABLE sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  sms_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  netgsm_response TEXT,
  sent_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **phone_verifications** Tablosu
```sql
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES businesses(id),
  is_verified BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **daily_sms_usage** Tablosu
```sql
CREATE TABLE daily_sms_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sms_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, date)
);
```

## 🔧 Kullanım

### **1. SMS Ayarları Yönetimi**
```typescript
import { smsSettingsAPI } from '@/integrations/supabase/sms';

// SMS ayarlarını getir
const settings = await smsSettingsAPI.getSettings(businessId);

// SMS ayarlarını güncelle
await smsSettingsAPI.updateSettings(settings.id, {
  reminder_minutes: 45,
  business_notification_enabled: false
});
```

### **2. Telefon Doğrulama**
```typescript
import { phoneVerificationAPI } from '@/integrations/supabase/sms';

// Doğrulama kodu oluştur ve gönder
const result = await phoneVerificationAPI.createVerification(phone, businessId);

// Kodu doğrula
const isValid = await phoneVerificationAPI.verifyCode(phone, code, businessId);
```

### **3. SMS Gönderimi**
```typescript
import { netGSMService } from '@/integrations/supabase/sms';

// Hatırlatma SMS'i gönder
await netGSMService.sendReminderSMS(phone, message, businessId);

// İşletme bildirimi gönder (günlük limit kontrolü ile)
const result = await netGSMService.sendSMSWithLimitCheck(
  [phone], 
  message, 
  businessId, 
  'business_notification'
);

// Günlük SMS sayısını kontrol et
const dailyCount = await netGSMService.getDailySMSCount(businessId);
```

## 📱 SMS Türleri

### **1. Doğrulama SMS'i**
```
Randevu doğrulama kodunuz: 123456
```

### **2. Hatırlatma SMS'i**
```
Sayın [Müşteri Adı], [Salon Adı] salonunda [Tarih] günü saat [Saat]'de [Hizmet] randevunuz bulunmaktadır. Randevunuzu unutmayın!
```

### **3. İşletme Bildirimi**
```
[DD.MM.YYYY] tarihine yeni bir online randevunuz var. Lutfen panelinizi kontrol ediniz. KendineGore
```

### **4. Müşteri Onay SMS'i**
```
[DD.MM.YYYY] tarihli [İşletme Adı] isletmesinden almis oldugunuz randevunuz sisteme kaydedilmistir. Iptal ettirmek icin isletmeyi arayabilirsiniz [Telefon]. KendineGore
```

## 🔄 Otomatik İşlemler

### **Randevu Hatırlatma Sistemi**
- Sistem her dakika kontrol edilir
- Hatırlatma zamanı gelen randevular için SMS gönderilir
- Hatırlatma süresi işletme ayarlarından belirlenir

### **SMS Loglama**
- Tüm gönderilen SMS'ler loglanır
- NetGSM yanıtları kaydedilir
- Başarılı/başarısız durumlar takip edilir

### **Günlük SMS Limit Sistemi**
- İşletme bildirimi SMS'leri için günlük limit kontrolü
- İlk 3 SMS sistem tarafından karşılanır
- 3'ten sonraki SMS'ler işletme hesabından kesilir
- Diğer SMS türleri (hatırlatma, doğrulama, müşteri onayı) her zaman sistem tarafından karşılanır

## 🛡️ Güvenlik

### **RLS (Row Level Security)**
- Her işletme sadece kendi SMS ayarlarını görebilir
- SMS logları işletme bazında ayrılır
- Telefon doğrulama işletme bazında yapılır

### **Veri Doğrulama**
- Telefon numarası formatı kontrol edilir
- Doğrulama kodu süresi sınırlıdır (10 dakika)
- SMS gönderim limitleri kontrol edilir

## 📊 İstatistikler

### **SMS İstatistikleri**
- Toplam gönderilen SMS sayısı
- Başarılı gönderim sayısı
- Başarısız gönderim sayısı
- SMS türü bazında dağılım

### **Performans Metrikleri**
- SMS gönderim başarı oranı
- Ortalama yanıt süresi
- Hata türleri ve sıklıkları

## 🚨 Hata Yönetimi

### **SMS Gönderim Hataları**
- NetGSM API hataları yakalanır
- Başarısız SMS'ler loglanır
- Kullanıcıya uygun hata mesajları gösterilir

### **Doğrulama Hataları**
- Geçersiz kod girişleri
- Süresi dolmuş kodlar
- Telefon numarası format hataları

## 🔮 Gelecek Özellikler

### **Planlanan Geliştirmeler**
- Toplu SMS gönderimi
- SMS şablonları
- Otomatik SMS raporları
- SMS kredi yönetimi
- Farklı SMS sağlayıcıları desteği

## 📞 Destek

### **NetGSM Destek**
- API dokümantasyonu: https://www.netgsm.com.tr/dokumanlar
- Teknik destek: 0850 550 0 550
- E-posta: info@netgsm.com.tr

### **Proje Desteği**
- GitHub Issues: Proje repository'sinde issue açın
- E-posta: [Proje e-posta adresi]

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Not:** SMS gönderimi için NetGSM hesabınızda yeterli kredi bulunduğundan emin olun. Test amaçlı önce küçük miktarlarla deneme yapmanız önerilir.
