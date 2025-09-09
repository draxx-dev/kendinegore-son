import { supabase } from '@/integrations/supabase/client';
import { netGSMService } from '@/integrations/supabase/sms';

// Appointment data structure from database
interface AppointmentData {
  id: string;
  business_id: string;
  customer_id: string;
  appointment_date: string;
  start_time: string;
  service_ids: string[];
  reminder_sent: boolean;
  customers: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  businesses: {
    name: string;
  };
}

// Türkçe karakterleri temizle
const cleanTurkishChars = (text: string): string => {
  return text
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ş/g, 's')
    .replace(/ü/g, 'u')
    .replace(/Ç/g, 'C')
    .replace(/Ğ/g, 'G')
    .replace(/İ/g, 'I')
    .replace(/Ö/g, 'O')
    .replace(/Ş/g, 'S')
    .replace(/Ü/g, 'U');
};

export interface AppointmentReminder {
  id: string;
  business_id: string;
  customer_id: string;
  customer_phone: string;
  customer_name: string;
  service_name: string;
  appointment_date: string;
  start_time: string;
  business_name: string;
}

// SMS Settings interface for type safety
interface SMSSettings {
  id: string;
  business_id: string;
  is_enabled: boolean;
  reminder_enabled: boolean;
  reminder_minutes: number;
  business_notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const sendAppointmentReminders = async () => {
  try {
    // Get all appointments for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        business_id,
        customer_id,
        appointment_date,
        start_time,
        service_ids,
        reminder_sent,
        customers!inner(first_name, last_name, phone),
        businesses!inner(name)
      `)
      .in('appointment_date', [todayStr, tomorrowStr])
      .in('status', ['scheduled', 'confirmed'])
      .eq('reminder_sent', false); // Sadece henüz hatırlatma gönderilmemiş randevuları al

    if (error) throw error;
    if (!appointments) return;

    // Group appointments by business to avoid duplicate SMS
    const businessAppointmentsMap = new Map<string, AppointmentData[]>();
    appointments.forEach(appointment => {
      if (!businessAppointmentsMap.has(appointment.business_id)) {
        businessAppointmentsMap.set(appointment.business_id, []);
      }
      businessAppointmentsMap.get(appointment.business_id)!.push(appointment);
    });

    // Process each business
    for (const [businessId, businessAppointments] of businessAppointmentsMap) {
      try {
        // Get SMS settings for this business
        const { data: smsSettings } = await supabase
          .from('sms_settings')
          .select('*')
          .eq('business_id', businessId)
          .single();

        if (!smsSettings || !(smsSettings as SMSSettings).is_enabled || !(smsSettings as SMSSettings).reminder_enabled) {
          continue;
        }

        const reminderMinutes = (smsSettings as SMSSettings).reminder_minutes || 30;

        // Process each appointment (send only one SMS per appointment)
        for (const appointment of businessAppointments) {
          const appointmentTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
          const reminderTime = new Date(appointmentTime.getTime() - reminderMinutes * 60 * 1000);
          const now = new Date();

          // Check if it's time to send reminder
          if (now >= reminderTime && now < appointmentTime) {
            // reminder_sent kontrolü artık gerekli değil çünkü query'de zaten false olanları alıyoruz

            const customerName = `${appointment.customers.first_name} ${appointment.customers.last_name}`;
            const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            
            const message = `Randevu hatirlatmasi: ${cleanTurkishChars(formattedDate)} tarihli randevunuza ${reminderMinutes} dakika kalmistir. KendineGore`;


            try {
              // Önce reminder_sent'i true yap - duplicate SMS'i önlemek için
              // Bu işlemi atomik yapmak için sadece false olanları güncelle
              const { error: updateError } = await supabase
                .from('appointments')
                .update({ reminder_sent: true })
                .eq('id', appointment.id)
                .eq('reminder_sent', false); // Sadece henüz gönderilmemiş olanları güncelle

              // Eğer güncelleme başarısızsa (zaten true ise), SMS gönderme
              if (updateError) {
                console.log(`Reminder already sent for appointment ${appointment.id}`);
                continue;
              }

              // Sonra SMS gönder
              await netGSMService.sendReminderSMS(
                appointment.customers.phone,
                message,
                businessId
              );

            } catch (smsError) {
              console.error('SMS reminder error:', smsError);
              // Hata durumunda da reminder_sent'i true yap ki tekrar denemesin
              await supabase
                .from('appointments')
                .update({ reminder_sent: true })
                .eq('id', appointment.id);
            }
          }
        }
      } catch (businessError) {
        console.error(`Error processing business ${businessId}:`, businessError);
      }
    }
  } catch (error) {
    console.error('Error sending appointment reminders:', error);
  }
};

export const checkAndSendReminders = () => {
  // Check every 1 minute for more responsive reminders
  setInterval(sendAppointmentReminders, 1 * 60 * 1000);
  
  // Don't run immediately to avoid duplicate SMS on startup
  // sendAppointmentReminders();
};

export const sendManualReminder = async (appointmentId: string): Promise<boolean> => {
  try {
    // Get appointment details
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        business_id,
        customer_id,
        appointment_date,
        start_time,
        service_ids,
        reminder_sent,
        customers!inner(first_name, last_name, phone),
        businesses!inner(name)
      `)
      .eq('id', appointmentId)
      .single();

    if (error || !appointment) {
      throw new Error('Appointment not found');
    }

    // Get SMS settings
    const { data: smsSettings } = await supabase
      .from('sms_settings')
      .select('*')
      .eq('business_id', appointment.business_id)
      .single();

    if (!smsSettings || !(smsSettings as SMSSettings).is_enabled) {
      throw new Error('SMS integration not enabled');
    }

    const reminderMinutes = (smsSettings as SMSSettings).reminder_minutes || 30;
    const customerName = `${appointment.customers.first_name} ${appointment.customers.last_name}`;
    const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const message = `Randevu hatirlatmasi: ${cleanTurkishChars(formattedDate)} tarihli randevunuza ${reminderMinutes} dakika kalmistir. KendineGore`;


    // Önce reminder_sent'i true yap - duplicate SMS'i önlemek için
    // Bu işlemi atomik yapmak için sadece false olanları güncelle
    const { error: updateError } = await supabase
      .from('appointments')
      .update({ reminder_sent: true })
      .eq('id', appointment.id)
      .eq('reminder_sent', false); // Sadece henüz gönderilmemiş olanları güncelle

    // Eğer güncelleme başarısızsa (zaten true ise), hata döndür
    if (updateError) {
      throw new Error('Reminder already sent for this appointment');
    }

    // Sonra SMS gönder
    await netGSMService.sendReminderSMS(
      appointment.customers.phone,
      message,
      appointment.business_id
    );

    return true;
  } catch (error) {
    console.error('Manual reminder error:', error);
    


    return false;
  }
};
