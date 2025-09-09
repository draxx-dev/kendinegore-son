import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { smsSettingsAPI, netGSMService, phoneVerificationAPI } from '@/integrations/supabase/sms';

export const useSMSIntegration = (businessId: string | null) => {
  const [smsSettings, setSmsSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      fetchSMSSettings();
    }
  }, [businessId]);

  const fetchSMSSettings = async () => {
    if (!businessId) return;

    try {
      setIsLoading(true);
      let settings = await smsSettingsAPI.getSettings(businessId);
      
      if (!settings) {
        // Create default settings if none exist
        settings = await smsSettingsAPI.createSettings(businessId, {
          is_enabled: true,
          reminder_enabled: true,
          reminder_minutes: 30,
          business_notification_enabled: true,
          verification_enabled: true
        });
      }

      setSmsSettings(settings);
    } catch (error) {
      console.error('SMS settings fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendReminderSMS = async (phoneNumber: string, appointmentDetails: string) => {
    if (!businessId || !smsSettings?.reminder_enabled) return false;
    
    try {
      return await netGSMService.sendReminderSMS(phoneNumber, appointmentDetails, businessId);
    } catch (error) {
      console.error('Reminder SMS error:', error);
      return false;
    }
  };

  const sendBusinessNotification = async (phoneNumber: string, message: string) => {
    if (!businessId || !smsSettings?.business_notification_enabled) return false;
    
    try {
      return await netGSMService.sendBusinessNotification(phoneNumber, message, businessId);
    } catch (error) {
      console.error('Business notification SMS error:', error);
      return false;
    }
  };

  const sendVerificationCode = async (phoneNumber: string) => {
    if (!businessId || !smsSettings?.verification_enabled) return null;
    
    try {
      return await phoneVerificationAPI.createVerification(phoneNumber, businessId);
    } catch (error) {
      console.error('Verification code send error:', error);
      return null;
    }
  };

  const verifyCode = async (phoneNumber: string, code: string) => {
    if (!businessId) return false;
    
    try {
      return await phoneVerificationAPI.verifyCode(phoneNumber, code, businessId);
    } catch (error) {
      console.error('Code verification error:', error);
      return false;
    }
  };

  const isPhoneVerified = async (phoneNumber: string) => {
    if (!businessId) return false;
    
    try {
      return await phoneVerificationAPI.isPhoneVerified(phoneNumber, businessId);
    } catch (error) {
      console.error('Phone verification check error:', error);
      return false;
    }
  };

  return {
    smsSettings,
    isLoading,
    sendReminderSMS,
    sendBusinessNotification,
    sendVerificationCode,
    verifyCode,
    isPhoneVerified,
    refreshSettings: fetchSMSSettings
  };
};
