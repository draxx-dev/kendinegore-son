import { supabase } from './client';

export interface SMSSettings {
  id: string;
  business_id: string;
  is_enabled: boolean;
  reminder_enabled: boolean;
  reminder_minutes: number;
  business_notification_enabled: boolean;
  notification_phone_source: 'business' | 'profile';
  created_at: string;
  updated_at: string;
}

export interface SMSLog {
  id: string;
  business_id: string;
  phone_number: string;
  message: string;
  sms_type: 'verification' | 'reminder' | 'business_notification' | 'customer_confirmation';
  status: 'pending' | 'sent' | 'failed';
  netgsm_response?: string;
  sent_at: string;
  created_at: string;
}

export interface DailySMSUsage {
  id: string;
  business_id: string;
  date: string;
  sms_count: number;
  created_at: string;
  updated_at: string;
}

export interface PhoneVerification {
  id: string;
  phone_number: string;
  verification_code: string;
  business_id: string;
  is_verified: boolean;
  expires_at: string;
  created_at: string;
}

class NetGSMService {
  private username: string;
  private password: string;
  private header: string;
  private apiUrl: string;

  constructor() {
    this.username = import.meta.env.VITE_NETGSM_USERNAME || '';
    this.password = import.meta.env.VITE_NETGSM_PASSWORD || '';
    this.header = import.meta.env.VITE_NETGSM_HEADER || '';
    this.apiUrl = import.meta.env.VITE_NETGSM_API_URL || 'https://api.netgsm.com.tr';
  }

    async sendSMSRequest(phoneNumbers: string[], message: string, businessId: string, customerPhone?: string): Promise<any> {
    if (!this.username || !this.password || !this.header) {
      throw new Error('NetGSM credentials not configured');
    }

    // Get business country code from database
    const businessCountryCode = await getBusinessCountryCode(businessId);
    
    // Format phone numbers for NetGSM based on country code
    const formattedPhoneNumbers = phoneNumbers.map(phone => {
      let cleaned = phone.replace(/\D/g, '');
      
      if (businessCountryCode === '+90') {
        // Turkey: remove leading 0
        if (cleaned.startsWith('0')) {
          cleaned = cleaned.substring(1);
        }
      } else {
        // International: add 00 prefix for NetGSM
        if (!cleaned.startsWith('00')) {
          cleaned = '00' + cleaned;
        }
      }
      
      return cleaned;
    });

    try {
      const response = await fetch('https://vexsdrvhjlwupwzgfuqx.supabase.co/functions/v1/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
        },
        body: JSON.stringify({
          phoneNumber: formattedPhoneNumbers[0],
          message: message,
          businessId: businessId,
          customerPhone: customerPhone
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        return {
          statusCode: 0,
          messageId: result.response?.jobid || null,
          success: true,
          response: JSON.stringify(result.response)
        };
      } else {
        return {
          statusCode: -1,
          messageId: null,
          success: false,
          response: JSON.stringify(result.response)
        };
      }
    } catch (error) {
      console.error('Edge Function SMS error:', error);
      throw new Error('SMS gönderilemedi');
    }
  }

  private parseNetGSMResponse(response: string): any {
    try {
      const jsonResponse = JSON.parse(response);
      
      if (jsonResponse.code === '00') {
        return {
          statusCode: 0,
          messageId: jsonResponse.jobid || null,
          success: true,
          response: response
        };
      } else {
        return {
          statusCode: parseInt(jsonResponse.code) || -1,
          messageId: jsonResponse.jobid || null,
          success: false,
          response: response
        };
      }
    } catch (e) {
      const parts = response.trim().split(' ');
      const statusCode = parts[0];
      const messageId = parts[1] || null;

      return {
        statusCode: parseInt(statusCode),
        messageId,
        success: statusCode === '00',
        response: response
      };
    }
  }

  async sendVerificationCode(phoneNumber: string, code: string, businessId: string): Promise<boolean> {
    try {
      const message = `Randevu doğrulama kodunuz: ${code}`;
      const result = await this.sendSMSRequest([phoneNumber], message, businessId);
      
      // Log SMS
      await this.logSMS(businessId, phoneNumber, message, 'verification', result.success ? 'sent' : 'failed', result.response);
      
      return result.success;
    } catch (error) {
      console.error('Verification SMS error:', error);
      await this.logSMS(businessId, phoneNumber, 'Doğrulama kodu gönderilemedi', 'verification', 'failed', error.message);
      return false;
    }
  }

  async sendReminderSMS(phoneNumber: string, appointmentDetails: string, businessId: string): Promise<boolean> {
    try {
      // Önce abonelik erişimini kontrol et
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('check_sms_access', { business_uuid: businessId });

      if (accessError) {
        console.error('SMS access check error:', accessError);
        await this.logSMS(businessId, phoneNumber, 'SMS erişim kontrolü hatası', 'reminder', 'failed', accessError.message);
        return false;
      }

      if (!hasAccess) {
        console.log('SMS gönderimi için geçerli abonelik gereklidir');
        await this.logSMS(businessId, phoneNumber, 'SMS gönderimi için geçerli abonelik gereklidir', 'reminder', 'failed', 'No SMS access');
        return false;
      }

      // appointmentDetails zaten tam mesaj olarak geliyor, ek başlık ekleme
      const message = appointmentDetails;
      const result = await this.sendSMSRequest([phoneNumber], message, businessId);
      
      // SMS başarılıysa hakkı azalt
      if (result.success) {
        const { error: decrementError } = await supabase
          .rpc('decrement_sms_remaining', { 
            business_uuid: businessId, 
            sms_count: 1 
          });
        
        if (decrementError) {
          console.error('SMS hakkı azaltma hatası:', decrementError);
        }
      }
      
      await this.logSMS(businessId, phoneNumber, message, 'reminder', result.success ? 'sent' : 'failed', result.response);
      
      return result.success;
    } catch (error) {
      console.error('Reminder SMS error:', error);
      await this.logSMS(businessId, phoneNumber, 'Hatırlatma SMS gönderilemedi', 'reminder', 'failed', error.message);
      return false;
    }
  }

  async sendBusinessNotification(phoneNumber: string, message: string, businessId: string, customerPhone?: string): Promise<any> {
    try {
      const result = await this.sendSMSRequest([phoneNumber], message, businessId, customerPhone);
      
      // SMS log kaydını ekle
      await this.logSMS(businessId, phoneNumber, message, 'business_notification', result.success ? 'sent' : 'failed', result.response, customerPhone);
      
      return result; // Tam response'ı döndür
    } catch (error) {
      console.error('Business notification SMS error:', error);
      // SMS log kaydını ekle
      await this.logSMS(businessId, phoneNumber, 'İşletme bildirimi gönderilemedi', 'business_notification', 'failed', error.message, customerPhone);
      return { success: false, error: error.message };
    }
  }

  async sendCustomerConfirmation(phoneNumber: string, message: string, businessId: string): Promise<any> {
    try {
      const result = await this.sendSMSRequest([phoneNumber], message, businessId);
      
      // SMS log kaydını kaldır - randevu alındığında gerekli değil
      // await this.logSMS(businessId, phoneNumber, message, 'customer_confirmation', result.success ? 'sent' : 'failed', result.response);
      
      return result; // Tam response'ı döndür
    } catch (error) {
      console.error('Customer confirmation SMS error:', error);
      // SMS log kaydını kaldır - randevu alındığında gerekli değil
      // await this.logSMS(businessId, phoneNumber, 'Müşteri onay SMS gönderilemedi', 'customer_confirmation', 'failed', error.message);
      return { success: false, error: error.message };
    }
  }


  private async logSMS(businessId: string, phoneNumber: string, message: string, type: string, status: string, response?: string, customerPhone?: string): Promise<void> {
    try {
      await supabase
        .from('sms_logs')
        .insert({
          business_id: businessId,
          phone_number: phoneNumber,
          message,
          sms_type: type,
          status,
          netgsm_response: response || null,
          sent_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('SMS logging error:', error);
    }
  }

  // SMS gönderim mantığı (günlük limit kontrolü ile)
  async sendSMSWithLimitCheck(phoneNumbers: string[], message: string, businessId: string, smsType: 'verification' | 'reminder' | 'business_notification' | 'customer_confirmation', customerPhone?: string): Promise<{ success: boolean; source: 'system' | 'business'; dailyCount: number }> {
    try {
      // Önce abonelik erişimini kontrol et
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('check_sms_access', { business_uuid: businessId });

      if (accessError) {
        console.error('SMS access check error:', accessError);
        throw new Error('SMS erişim kontrolü başarısız');
      }

      if (!hasAccess) {
        throw new Error('SMS gönderimi için geçerli abonelik gereklidir');
      }

      const dailyCount = await phoneVerificationAPI.getDailySMSCount(businessId);
      const isBusinessNotification = smsType === 'business_notification';
      
      // İşletme bildirimi için limit kontrolü
      if (isBusinessNotification && dailyCount >= 3) {
        // 3'ten sonra işletmeye yansısın
        const result = await this.sendSMSRequest(phoneNumbers, message, businessId, customerPhone);
        
        // SMS başarılıysa hakkı azalt
        if (result.success) {
          const { error: decrementError } = await supabase
            .rpc('decrement_sms_remaining', { 
              business_uuid: businessId, 
              sms_count: 1 
            });
          
          if (decrementError) {
            console.error('SMS hakkı azaltma hatası:', decrementError);
          }
        }
        
        await phoneVerificationAPI.incrementDailySMSCount(businessId);
        await this.logSMS(businessId, phoneNumbers[0], message, smsType, 'sent', result, customerPhone);
        
        return { 
          success: true, 
          source: 'business', 
          dailyCount: dailyCount + 1 
        };
      } else {
        // İlk 3 SMS bizden (sadece işletme bildirimi için)
        if (isBusinessNotification) {
          const result = await this.sendSMSRequest(phoneNumbers, message, businessId, customerPhone);
          // İlk 3 SMS'te sayaç artırılır ama hakkı azaltılmaz (ücretsiz)
          await phoneVerificationAPI.incrementDailySMSCount(businessId);
          await this.logSMS(businessId, phoneNumbers[0], message, smsType, 'sent', result, customerPhone);
          
          return { 
            success: true, 
            source: 'system', 
            dailyCount: dailyCount + 1 
          };
        } else {
          // Diğer SMS türleri (müşteri onayı, hatırlatma, doğrulama) her zaman bizden
          const result = await this.sendSMSRequest(phoneNumbers, message, businessId, customerPhone);
          await this.logSMS(businessId, phoneNumbers[0], message, smsType, 'sent', result, customerPhone);
          
          return { 
            success: true, 
            source: 'system', 
            dailyCount: dailyCount 
          };
        }
      }
    } catch (error) {
      console.error('SMS send with limit check error:', error);
      await this.logSMS(businessId, phoneNumbers[0], message, smsType, 'failed', null, customerPhone);
      return { 
        success: false, 
        source: 'system', 
        dailyCount: await phoneVerificationAPI.getDailySMSCount(businessId) 
      };
    }
  }
}

// Helper function to get business country code
async function getBusinessCountryCode(businessId: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('country_code')
      .eq('id', businessId)
      .single();

    if (error) {
      console.error('Error fetching business country code:', error);
      return '+90'; // Default to Turkey
    }

    return data?.country_code || '+90';
  } catch (error) {
    console.error('Error fetching business country code:', error);
    return '+90'; // Default to Turkey
  }
}

export const netGSMService = new NetGSMService();

// SMS Settings CRUD operations
export const smsSettingsAPI = {
  async getSettings(businessId: string): Promise<SMSSettings | null> {
    const { data, error } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('business_id', businessId)
      .single();

    if (error) {
      console.error('SMS settings fetch error:', error);
      return null;
    }

    return data;
  },

  async createSettings(businessId: string, settings: Partial<SMSSettings>): Promise<SMSSettings | null> {
    const { data, error } = await supabase
      .from('sms_settings')
      .insert({
        business_id: businessId,
        is_enabled: settings.is_enabled ?? true,
        reminder_enabled: settings.reminder_enabled ?? true,
        reminder_minutes: settings.reminder_minutes ?? 30,
        business_notification_enabled: settings.business_notification_enabled ?? true,
        notification_phone_source: settings.notification_phone_source ?? 'business',
        ...settings
      })
      .select()
      .single();

    if (error) {
      console.error('SMS settings create error:', error);
      return null;
    }

    return data;
  },

  async updateSettings(id: string, settings: Partial<SMSSettings>): Promise<SMSSettings | null> {
    const { data, error } = await supabase
      .from('sms_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('SMS settings update error:', error);
      return null;
    }

    return data;
  },

  async getSMSLogs(businessId: string, limit: number = 50): Promise<SMSLog[]> {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('SMS logs fetch error:', error);
      return [];
    }

    return data || [];
  },

  async getSMSStats(businessId: string): Promise<{ total: number; sent: number; failed: number }> {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('status')
      .eq('business_id', businessId);

    if (error) {
      console.error('SMS stats fetch error:', error);
      return { total: 0, sent: 0, failed: 0 };
    }

    const total = data.length;
    const sent = data.filter(log => log.status === 'sent').length;
    const failed = data.filter(log => log.status === 'failed').length;

    return { total, sent, failed };
  }
};

// Phone verification operations
export const phoneVerificationAPI = {
  async createVerification(phoneNumber: string, businessId: string): Promise<{ code: string; expiresAt: Date } | null> {
    const code = Math.random().toString().slice(2, 8); // 6 digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    try {
      // Delete existing verification for this phone
      await supabase
        .from('phone_verifications')
        .delete()
        .eq('phone_number', phoneNumber)
        .eq('business_id', businessId);

      // Create new verification
      const { error } = await supabase
        .from('phone_verifications')
        .insert({
          phone_number: phoneNumber,
          verification_code: code,
          business_id: businessId,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Send SMS with verification code
      const message = `Randevu dogrulama kodunuz: ${code}. 10 dakika gecerlidir. KendineGore`;
      const smsResult = await netGSMService.sendVerificationCode(phoneNumber, code, businessId);
      
      if (!smsResult) {
        console.error('SMS verification code could not be sent');
        // Delete the verification record if SMS failed
        await supabase
          .from('phone_verifications')
          .delete()
          .eq('phone_number', phoneNumber)
          .eq('business_id', businessId);
        return null;
      }

      return { code, expiresAt };
    } catch (error) {
      console.error('Phone verification create error:', error);
      return null;
    }
  },

  async verifyCode(phoneNumber: string, code: string, businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('verification_code', code)
        .eq('business_id', businessId)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        return false;
      }

      // Mark as verified
      await supabase
        .from('phone_verifications')
        .update({ is_verified: true })
        .eq('id', data.id);

      return true;
    } catch (error) {
      console.error('Phone verification error:', error);
      return false;
    }
  },

  async isPhoneVerified(phoneNumber: string, businessId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('phone_verifications')
        .select('is_verified')
        .eq('phone_number', phoneNumber)
        .eq('business_id', businessId)
        .eq('is_verified', true)
        .single();

      if (error || !data) {
        return false;
      }

      return data.is_verified;
    } catch (error) {
      console.error('Phone verification check error:', error);
      return false;
    }
  },

  // Günlük SMS sayısını kontrol et
  async getDailySMSCount(businessId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: usage, error } = await supabase
        .from('daily_sms_usage')
        .select('sms_count')
        .eq('business_id', businessId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Daily SMS count error:', error);
        return 0;
      }
      
      return usage?.sms_count || 0;
    } catch (error) {
      console.error('Daily SMS count error:', error);
      return 0;
    }
  },

  // Günlük SMS sayısını artır
  async incrementDailySMSCount(businessId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Önce mevcut kaydı kontrol et
      const { data: existing, error: selectError } = await supabase
        .from('daily_sms_usage')
        .select('sms_count')
        .eq('business_id', businessId)
        .eq('date', today)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Select daily SMS count error:', selectError);
        throw selectError;
      }

      if (existing) {
        // Mevcut kayıt varsa sayıyı artır
        const { error: updateError } = await supabase
          .from('daily_sms_usage')
          .update({ 
            sms_count: existing.sms_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('business_id', businessId)
          .eq('date', today);

        if (updateError) {
          console.error('Update daily SMS count error:', updateError);
          throw updateError;
        }
      } else {
        // Yeni kayıt oluştur
        const { error: insertError } = await supabase
          .from('daily_sms_usage')
          .insert({
            business_id: businessId,
            date: today,
            sms_count: 1
          });

        if (insertError) {
          console.error('Insert daily SMS count error:', insertError);
          throw insertError;
        }
      }
    } catch (error) {
      console.error('Increment daily SMS count error:', error);
      throw error;
    }
  },


};
