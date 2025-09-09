import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
  actionUrl: string;
  actionText: string;
}

export const useSetupProgress = (businessId?: string) => {
  const [steps, setSteps] = useState<SetupStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  const checkStepCompletion = async () => {
    if (!businessId) return;

    try {
      // 1. İşletme Bilgileri Kontrolü
      const { data: business } = await supabase
        .from('businesses')
        .select('name, phone, address, description')
        .eq('id', businessId)
        .single();

      const businessCompleted = !!(business?.name && business?.phone && business?.address);

      // 2. Personel Kontrolü
      const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('business_id', businessId)
        .eq('is_active', true);

      const staffCompleted = (staff?.length || 0) > 0;

      // 3. Hizmetler Kontrolü
      const { data: services } = await supabase
        .from('services')
        .select('id')
        .eq('business_id', businessId)
        .eq('is_active', true);

      const servicesCompleted = (services?.length || 0) > 0;

      // 4. Çalışma Saatleri Kontrolü
      const { data: workingHours } = await supabase
        .from('working_hours')
        .select('id')
        .eq('business_id', businessId);

      const workingHoursCompleted = (workingHours?.length || 0) > 0;

      // 5. SMS Entegrasyonu Kontrolü
      const { data: smsSettings } = await supabase
        .from('sms_settings')
        .select('id')
        .eq('business_id', businessId);

      const smsCompleted = !!smsSettings;

      // 6. Portföy Kontrolü
      const { data: { user } } = await supabase.auth.getUser();
      let portfolioCompleted = false;
      
      if (user) {
        const { data: files } = await supabase.storage
          .from('business-portfolio')
          .list(user.id, { limit: 1 });
        
        portfolioCompleted = (files?.length || 0) > 0;
      }

      const newSteps: SetupStep[] = [
        {
          id: 'business',
          title: 'İşletme Bilgileri',
          description: 'İşletme adı, telefon ve adres bilgilerini ekleyin',
          completed: businessCompleted,
          skipped: false,
          actionUrl: '/dashboard/business-details',
          actionText: 'Düzenle'
        },
        {
          id: 'staff',
          title: 'Personel Ekleme',
          description: 'En az 1 personel ekleyin ve uzmanlık alanlarını belirleyin',
          completed: staffCompleted,
          skipped: false,
          actionUrl: '/dashboard/staff',
          actionText: 'Personel Ekle'
        },
        {
          id: 'services',
          title: 'Hizmetler Tanımlama',
          description: 'Sunacağınız hizmetleri, fiyatlarını ve sürelerini ekleyin',
          completed: servicesCompleted,
          skipped: false,
          actionUrl: '/dashboard/services',
          actionText: 'Hizmet Ekle'
        },
        {
          id: 'working-hours',
          title: 'Çalışma Saatleri',
          description: 'Haftalık çalışma saatlerinizi ve tatil günlerinizi belirleyin',
          completed: workingHoursCompleted,
          skipped: false,
          actionUrl: '/dashboard/working-hours',
          actionText: 'Ayarla'
        },
        {
          id: 'sms',
          title: 'SMS Entegrasyonu',
          description: 'NetGSM ayarlarını yapın ve test SMS gönderin',
          completed: smsCompleted,
          skipped: false,
          actionUrl: '/dashboard/sms-integration',
          actionText: 'Ayarla'
        },
        {
          id: 'portfolio',
          title: 'Portföy Ekleme',
          description: 'Çalışmalarınızın fotoğraflarını ekleyin',
          completed: portfolioCompleted,
          skipped: false,
          actionUrl: '/dashboard/online-booking',
          actionText: 'Portföy Ekle'
        }
      ];

      setSteps(newSteps);

      // Progress hesaplama
      const completedSteps = newSteps.filter(step => step.completed).length;
      const totalSteps = newSteps.length;
      setProgress(Math.round((completedSteps / totalSteps) * 100));

    } catch (error) {
      console.error('Setup progress check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const skipStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, skipped: true, completed: false }
        : step
    ));
  };

  const unskipStep = (stepId: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, skipped: false }
        : step
    ));
  };

  useEffect(() => {
    checkStepCompletion();
  }, [businessId]);

  return {
    steps,
    loading,
    progress,
    checkStepCompletion,
    skipStep,
    unskipStep
  };
};
