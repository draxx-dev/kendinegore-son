import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Building, 
  Calendar as CalendarIcon, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  CheckCircle,
  ArrowLeft,
  User,
  Users,
  Image as ImageIcon
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { netGSMService } from "@/integrations/supabase/sms";
import PhoneVerificationModal from "@/components/customers/PhoneVerificationModal";

interface Business {
  id: string;
  name: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  slug: string;
  owner_id: string;
  show_email_in_booking: boolean;
  show_phone_in_booking: boolean;
  country_code: string;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
}

interface WorkingHours {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

interface Staff {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_image_url: string | null;
  specialties: string[] | null;
}

interface PortfolioImage {
  id: string;
  url: string;
  title: string;
}

// Ülke kodları listesi
const countryCodes = [
  { code: '+90', name: 'Türkiye', flag: '🇹🇷' },
  { code: '+421', name: 'Slovakya', flag: '🇸🇰' },
  { code: '+420', name: 'Çekya', flag: '🇨🇿' },
  { code: '+43', name: 'Avusturya', flag: '🇦🇹' },
  { code: '+49', name: 'Almanya', flag: '🇩🇪' },
  { code: '+33', name: 'Fransa', flag: '🇫🇷' },
  { code: '+44', name: 'İngiltere', flag: '🇬🇧' },
  { code: '+39', name: 'İtalya', flag: '🇮🇹' },
  { code: '+34', name: 'İspanya', flag: '🇪🇸' },
  { code: '+31', name: 'Hollanda', flag: '🇳🇱' },
  { code: '+32', name: 'Belçika', flag: '🇧🇪' },
  { code: '+41', name: 'İsviçre', flag: '🇨🇭' },
  { code: '+45', name: 'Danimarka', flag: '🇩🇰' },
  { code: '+46', name: 'İsveç', flag: '🇸🇪' },
  { code: '+47', name: 'Norveç', flag: '🇳🇴' },
  { code: '+358', name: 'Finlandiya', flag: '🇫🇮' },
  { code: '+48', name: 'Polonya', flag: '🇵🇱' },
  { code: '+36', name: 'Macaristan', flag: '🇭🇺' },
  { code: '+40', name: 'Romanya', flag: '🇷🇴' },
  { code: '+359', name: 'Bulgaristan', flag: '🇧🇬' },
  { code: '+385', name: 'Hırvatistan', flag: '🇭🇷' },
  { code: '+386', name: 'Slovenya', flag: '🇸🇮' },
  { code: '+372', name: 'Estonya', flag: '🇪🇪' },
  { code: '+371', name: 'Letonya', flag: '🇱🇻' },
  { code: '+370', name: 'Litvanya', flag: '🇱🇹' },
  { code: '+1', name: 'ABD/Kanada', flag: '🇺🇸' },
  { code: '+7', name: 'Rusya', flag: '🇷🇺' },
  { code: '+86', name: 'Çin', flag: '🇨🇳' },
  { code: '+81', name: 'Japonya', flag: '🇯🇵' },
  { code: '+82', name: 'Güney Kore', flag: '🇰🇷' },
  { code: '+91', name: 'Hindistan', flag: '🇮🇳' },
  { code: '+971', name: 'BAE', flag: '🇦🇪' },
  { code: '+966', name: 'Suudi Arabistan', flag: '🇸🇦' },
  { code: '+20', name: 'Mısır', flag: '🇪🇬' },
  { code: '+27', name: 'Güney Afrika', flag: '🇿🇦' },
  { code: '+55', name: 'Brezilya', flag: '🇧🇷' },
  { code: '+54', name: 'Arjantin', flag: '🇦🇷' },
  { code: '+52', name: 'Meksika', flag: '🇲🇽' },
  { code: '+61', name: 'Avustralya', flag: '🇦🇺' },
  { code: '+64', name: 'Yeni Zelanda', flag: '🇳🇿' }
];

const PublicBooking = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessId, setBusinessId] = useState<string | undefined>();
  const { hasAccess, loading: subscriptionLoading } = useSubscriptionStatus(businessId);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0 = Landing page, 1-5 = Booking steps
  
  // Portfolio pagination
  const [portfolioPage, setPortfolioPage] = useState(0);
  const imagesPerPage = 4;
  const totalPages = Math.ceil(portfolioImages.length / imagesPerPage);
  
  // Form data
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  
  // SMS verification states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingCustomerInfo, setPendingCustomerInfo] = useState<PendingCustomerInfo | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [successAppointmentData, setSuccessAppointmentData] = useState<{
    date: string;
    time: string;
    services: string[];
    customerName: string;
    appointmentId: string;
  } | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
    countryCode: "+90"
  });
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [openLegalModal, setOpenLegalModal] = useState<string | null>(null);

  const openModal = (type: string) => {
    setOpenLegalModal(type);
  };

  const formatPhoneNumber = (phone: string, customerCountryCode?: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Use customer country code if provided, otherwise use business country code
    const countryCode = customerCountryCode || business?.country_code || '+90';
    
    if (countryCode === '+90') {
      // Turkey: remove leading 0 (NetGSM requirement for Turkey)
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
  };

  // Get notification phone number based on SMS settings
  const getNotificationPhoneNumber = async (): Promise<string> => {
    try {
      const { data: smsSettings } = await supabase
        .from('sms_settings')
        .select('notification_phone_source')
        .eq('business_id', business.id)
        .single();

      if (smsSettings?.notification_phone_source === 'profile') {
        // Get profile phone
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone, country_code')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.phone) {
            return formatPhoneNumber(profile.phone, profile.country_code);
          }
        }
      }
      
      // Default to business phone
      return business.phone ? formatPhoneNumber(business.phone) : '';
    } catch (error) {
      console.error('Error getting notification phone:', error);
      // Fallback to business phone
      return business.phone ? formatPhoneNumber(business.phone) : '';
    }
  };

  // Interface for pending customer info
  interface PendingCustomerInfo {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    notes: string;
    countryCode: string;
  }

  // Interface for SMS settings data
  interface SMSSettings {
    business_notification_enabled?: boolean;
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

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [occupiedTimeSlots, setOccupiedTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    if (slug) {
      fetchBusinessData(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (business?.id) {
      setBusinessId(business.id);
    }
  }, [business]);

  useEffect(() => {
    if (selectedDate) {
      generateAvailableTimeSlots();
    }
  }, [selectedDate, selectedStaff, workingHours, business]);

  const fetchBusinessData = async (businessSlug: string) => {
    try {
      // Fetch business
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('slug', businessSlug)
        .single();

      if (businessError) throw businessError;
      setBusiness(businessData);

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('name');

      setServices(servicesData || []);

      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', businessData.id)
        .eq('is_active', true)
        .order('name');

      setStaff(staffData || []);

      // Fetch working hours
      const { data: workingHoursData } = await supabase
        .from('working_hours')
        .select('*')
        .eq('business_id', businessData.id)
        .order('day_of_week');

      setWorkingHours(workingHoursData || []);

      // Fetch portfolio images
      await fetchPortfolioImages(businessData.owner_id);

    } catch (error) {
      toast({
        title: "Hata",
        description: "İşletme bulunamadı.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioImages = async (ownerId: string) => {
    try {
      const { data: files, error } = await supabase.storage
        .from('business-portfolio')
        .list(ownerId, {
          limit: 20,
          offset: 0
        });

      if (error) throw error;

      const imagePromises = files?.map(async (file) => {
        const { data: { publicUrl } } = supabase.storage
          .from('business-portfolio')
          .getPublicUrl(`${ownerId}/${file.name}`);
        
        return {
          id: file.name,
          url: publicUrl,
          title: file.name.split('.')[0].replace(/[-_]/g, ' ')
        };
      }) || [];

      const imageResults = await Promise.all(imagePromises);
      setPortfolioImages(imageResults);
    } catch (error) {
      // Portfolio resimleri yüklenemedi
    }
  };

  const generateAvailableTimeSlots = async () => {
    if (!selectedDate || !workingHours.length || !business) return;

    const dayOfWeek = selectedDate.getDay();
    const todayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);

    if (!todayWorkingHours || todayWorkingHours.is_closed) {
      setAvailableTimeSlots([]);
      setOccupiedTimeSlots([]);
      return;
    }

    const slots: string[] = [];
    const [startHour, startMinute] = todayWorkingHours.start_time.split(':').map(Number);
    const [endHour, endMinute] = todayWorkingHours.end_time.split(':').map(Number);

    let currentHour = startHour;
    let currentMinute = startMinute;

    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(timeSlot);

      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }

    // Check for occupied time slots if staff is selected
    const occupied: string[] = [];
    if (selectedStaff && selectedStaff !== "") {
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const { data: appointments, error } = await supabase
          .from('appointments')
          .select('start_time, end_time')
          .eq('business_id', business.id)
          .eq('staff_id', selectedStaff)
          .eq('appointment_date', dateStr)
          .in('status', ['scheduled', 'in_progress']);

        if (error) throw error;

        // Mark all overlapping time slots as occupied
        appointments?.forEach(appointment => {
          const appointmentStart = appointment.start_time;
          const appointmentEnd = appointment.end_time;
          
          slots.forEach(slot => {
            // Check if this slot overlaps with the appointment
            const slotEnd = addMinutesToTime(slot, 30);
            if (timeOverlaps(slot, slotEnd, appointmentStart, appointmentEnd)) {
              occupied.push(slot);
            }
          });
        });
      } catch (error) {
        // Randevu kontrol hatası
      }
    }

    setAvailableTimeSlots(slots);
    setOccupiedTimeSlots(occupied);
  };

  // Helper function to add minutes to a time string
  const addMinutesToTime = (timeStr: string, minutes: number): string => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  // Helper function to check if two time ranges overlap
  const timeOverlaps = (start1: string, end1: string, start2: string, end2: string): boolean => {
    return start1 < end2 && start2 < end1;
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleBookingSubmit = async () => {
    if (!business || !selectedDate || !selectedTime || selectedServices.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    if (!agreedToTerms) {
      toast({
        title: "Hata",
        description: "Lütfen kullanım şartlarını kabul edin.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format phone number for SMS
      const formattedPhone = formatPhoneNumber(customerInfo.phone, customerInfo.countryCode);
      
      // Check if customer exists in ANY business (not just this one)
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customers')
        .select('id, first_name, last_name, business_id')
        .eq('phone', customerInfo.phone)
        .maybeSingle();

      let customerId: string;

      if (existingCustomer) {
        // Customer exists in another business - SMS verification required
        if (existingCustomer.business_id !== business.id) {
                  setPendingCustomerInfo({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          email: customerInfo.email,
          notes: customerInfo.notes,
          countryCode: customerInfo.countryCode
        });
          setShowVerificationModal(true);
          return; // Stop appointment creation
        }
        
        // Customer exists in this business
        customerId = existingCustomer.id;
        
        // Update customer info if changed
        if (existingCustomer.first_name !== customerInfo.firstName || existingCustomer.last_name !== customerInfo.lastName) {
          await supabase
            .from('customers')
            .update({
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
              email: customerInfo.email || null,
              notes: customerInfo.notes || null
            })
            .eq('id', existingCustomer.id);
        }
      } else {
        // New customer - SMS verification required
        setPendingCustomerInfo({
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          phone: customerInfo.phone,
          email: customerInfo.email,
          notes: customerInfo.notes,
          countryCode: customerInfo.countryCode
        });
        setShowVerificationModal(true);
        return; // Stop appointment creation
      }

      // Get first service details for time calculation
      const firstService = services.find(s => s.id === selectedServices[0]);
      if (!firstService) {
        throw new Error('Servis bulunamadı');
      }

      // Birden fazla servis seçilmişse, toplam süreyi hesapla
      let totalDuration = firstService.duration_minutes || 30;
      if (selectedServices.length > 1) {
        totalDuration = services
          .filter(s => selectedServices.includes(s.id))
          .reduce((total, service) => total + (service.duration_minutes || 30), 0);
      }

      // Toplam süreye göre end_time hesapla - daha doğru yöntem
      const [startHours, startMinutes] = selectedTime.split(':').map(Number);
      const totalMinutes = startHours * 60 + startMinutes + totalDuration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      const endTimeString = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      // endTimeString'in geçerli olduğunu kontrol et
      if (!endTimeString || endTimeString === 'Invalid Date') {
        throw new Error('Geçersiz bitiş saati hesaplandı');
      }

      // Toplam fiyatı hesapla
      const totalPrice = services
        .filter(s => selectedServices.includes(s.id))
        .reduce((total, service) => total + service.price, 0);

      // Tek randevu kaydı oluştur - tüm servisleri array olarak ekle
      const staffId = await assignAvailableStaff();
      if (!staffId) {
        throw new Error('Seçilen saatte müsait personel bulunamadı. Lütfen farklı bir saat seçin.');
      }
      
      // Toplam süreye göre tek end_time hesapla
      const totalDurationForEndTime = services
        .filter(s => selectedServices.includes(s.id))
        .reduce((total, service) => total + (service.duration_minutes || 30), 0);
      
      const [startHoursForEnd, startMinutesForEnd] = selectedTime.split(':').map(Number);
      const totalMinutesForEnd = startHoursForEnd * 60 + startMinutesForEnd + totalDurationForEndTime;
      const endHoursForEnd = Math.floor(totalMinutesForEnd / 60);
      const endMinutesForEnd = totalMinutesForEnd % 60;
      const endTimeStringForAll = `${endHoursForEnd.toString().padStart(2, '0')}:${endMinutesForEnd.toString().padStart(2, '0')}`;
      


      // Tek randevu kaydı oluştur - tüm servisleri array olarak ekle
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          business_id: business.id,
          customer_id: customerId,
          service_ids: selectedServices, // Array olarak tüm servisler
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedTime,
          end_time: endTimeStringForAll,
          status: 'scheduled',
          total_price: totalPrice, // Toplam fiyat
          staff_id: staffId,
          notes: customerInfo.notes || null
        })
        .select('id')
        .single();

      if (appointmentError) {
        throw new Error(`Randevu oluşturulamadı: ${appointmentError.message}`);
      }

      // Send business notification SMS
      try {
        // Check if business notifications are enabled
        const isBusinessNotificationEnabled = await checkBusinessNotificationEnabled();
        
        if (isBusinessNotificationEnabled) {
          const formattedBusinessPhone = await getNotificationPhoneNumber();
          const appointmentDate = new Date(selectedDate);
          const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
          
          const businessMessage = `${formattedDate} tarihine yeni bir online randevunuz var. Lutfen panelinizi kontrol ediniz. KendineGore`;
          
          if (formattedBusinessPhone) {
            const smsResult = await netGSMService.sendSMSWithLimitCheck(
              [formattedBusinessPhone],
              businessMessage,
              business.id,
              'business_notification',
              customerInfo.phone
            );
            
            if (smsResult.success) {
              // İşletme bildirimi başarıyla gönderildi
              console.log('Business notification SMS sent successfully');
            }
          }
        }
      } catch (smsError) {
        // SMS gönderim hatası
      }


      // Send customer confirmation SMS
      try {
        const customerPhone = customerInfo.phone;
        const formattedCustomerPhone = formatPhoneNumber(customerPhone);
        const appointmentDate = new Date(selectedDate);
        const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const customerMessage = `${formattedDate} tarihli ${cleanTurkishChars(business.name)} isletmesinden almis oldugunuz randevunuz sisteme kaydedilmistir. Iptal ettirmek icin isletmeyi arayabilirsiniz ${business.phone || 'bilinmiyor'}. KendineGore`;
        
        if (formattedCustomerPhone) {
          await netGSMService.sendCustomerConfirmation(
            formattedCustomerPhone,
            customerMessage,
            business.id
          );
        }
      } catch (smsError) {
        // SMS gönderim hatası
      }

      // Set success data for the success screen
      setSuccessAppointmentData({
        date: format(selectedDate, 'dd MMMM yyyy, EEEE', { locale: tr }),
        time: selectedTime,
        services: services.filter(s => selectedServices.includes(s.id)).map(s => s.name),
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        appointmentId: appointment.id
      });
      
      setShowSuccessScreen(true);

          } catch (error) {
      toast({
          title: "Hata",
          description: error instanceof Error ? error.message : "Randevu oluşturulamadı.",
          variant: "destructive",
        });
      }
  };

  // Handle SMS verification success
  const handleVerificationSuccess = async () => {
    setIsVerifying(true);
    try {
      // Create customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          first_name: pendingCustomerInfo.firstName,
          last_name: pendingCustomerInfo.lastName,
          phone: pendingCustomerInfo.phone,
          email: pendingCustomerInfo.email || null,
          notes: pendingCustomerInfo.notes || null
        })
        .select('id')
        .single();

      if (createError) throw createError;

      // Create appointment
      const appointment = await createAppointment(newCustomer.id, pendingCustomerInfo.notes);
      
      // Send business notification SMS after successful appointment creation
      try {
        const formattedBusinessPhone = await getNotificationPhoneNumber();
        const appointmentDate = new Date(selectedDate!);
        const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const businessMessage = `${formattedDate} tarihine yeni bir online randevunuz var. Lutfen panelinizi kontrol ediniz. KendineGore`;
        
        if (formattedBusinessPhone) {
          const smsResult = await netGSMService.sendSMSWithLimitCheck(
            [formattedBusinessPhone],
            businessMessage,
            business.id,
            'business_notification',
            pendingCustomerInfo.phone
          );
          
          if (smsResult.success) {
            // İşletme bildirimi başarıyla gönderildi
            console.log('Business notification SMS sent successfully');
          }
        }
      } catch (smsError) {
        // SMS gönderim hatası
      }


      // Send customer confirmation SMS
      try {
        const customerPhone = pendingCustomerInfo.phone;
        const formattedCustomerPhone = formatPhoneNumber(customerPhone, pendingCustomerInfo.countryCode);
        const appointmentDate = new Date(selectedDate!);
        const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        const customerMessage = `${formattedDate} tarihli ${cleanTurkishChars(business.name)} isletmesinden almis oldugunuz randevunuz sisteme kaydedilmistir. Iptal ettirmek icin isletmeyi arayabilirsiniz ${business.phone || 'bilinmiyor'}. KendineGore`;
        
        if (formattedCustomerPhone) {
          await netGSMService.sendCustomerConfirmation(
            formattedCustomerPhone,
            customerMessage,
            business.id
          );
        }
      } catch (smsError) {
        // SMS gönderim hatası
      }
      
      // Set success data for the success screen
      setSuccessAppointmentData({
        date: format(selectedDate!, 'dd MMMM yyyy, EEEE', { locale: tr }),
        time: selectedTime,
        services: services.filter(s => selectedServices.includes(s.id)).map(s => s.name),
        customerName: `${pendingCustomerInfo.firstName} ${pendingCustomerInfo.lastName}`,
        appointmentId: appointment.id
      });
      
      setShowVerificationModal(false);
      setPendingCustomerInfo(null);
      setShowSuccessScreen(true);
    } catch (error) {
      toast({
        title: "Hata",
          description: "Randevu oluşturulamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
      } finally {
      setIsVerifying(false);
    }
  };

  // Assign available staff function
  const assignAvailableStaff = async (): Promise<string | null> => {
    try {
      // Get all active staff for this business
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('id, name')
        .eq('business_id', business.id)
        .eq('is_active', true);

      if (staffError || !staffMembers || staffMembers.length === 0) {
        return null;
      }

      // O gün o saatte müsait personel bul
      const { data: existingAppointments, error: appointmentError } = await supabase
        .from('appointments')
        .select('staff_id, start_time, end_time')
        .eq('business_id', business.id)
        .eq('appointment_date', format(selectedDate!, 'yyyy-MM-dd'))
        .eq('status', 'scheduled');

      if (appointmentError) {
        return staffMembers[0].id; // Fallback
      }

      // Her personel için müsaitlik kontrolü
      for (const staffMember of staffMembers) {
        let isAvailable = true;
        
        // Bu personelin o saatte randevusu var mı kontrol et
        for (const appointment of existingAppointments || []) {
          if (appointment.staff_id === staffMember.id) {
            // Zaman çakışması kontrolü
            const existingStart = appointment.start_time;
            const existingEnd = appointment.end_time;
            
            // Toplam süreyi hesapla
            const totalDurationForCheck = services
              .filter(s => selectedServices.includes(s.id))
              .reduce((total, service) => total + (service.duration_minutes || 30), 0);
            
            // End time hesaplama - daha doğru yöntem
            const [startHoursForCheck, startMinutesForCheck] = selectedTime.split(':').map(Number);
            const totalMinutesForCheck = startHoursForCheck * 60 + startMinutesForCheck + totalDurationForCheck;
            const endHoursForCheck = Math.floor(totalMinutesForCheck / 60);
            const endMinutesForCheck = totalMinutesForCheck % 60;
            const endTimeStringForCheck = `${endHoursForCheck.toString().padStart(2, '0')}:${endMinutesForCheck.toString().padStart(2, '0')}`;
            
            // Yeni randevu mevcut randevu ile çakışıyor mu?
            if (
              (selectedTime >= existingStart && selectedTime < existingEnd) ||
              (endTimeStringForCheck > existingStart && endTimeStringForCheck <= existingEnd) ||
              (selectedTime <= existingStart && endTimeStringForCheck >= existingEnd)
            ) {
              isAvailable = false;
              break;
            }
          }
        }
        
        if (isAvailable) {
          return staffMember.id;
        }
      }
      
      // Hiç müsait personel bulunamadı
      return null;
          } catch (error) {
        return null;
      }
  };

    // Create appointment function (extracted from handleBookingSubmit)
  const createAppointment = async (customerId: string, customerNotes?: string) => {
    // Get first service details for time calculation
    const firstService = services.find(s => s.id === selectedServices[0]);
    if (!firstService) {
      throw new Error('Servis bulunamadı');
    }

    // Birden fazla servis seçilmişse, toplam süreyi hesapla
    let totalDuration = firstService.duration_minutes || 30;
    if (selectedServices.length > 1) {
      totalDuration = services
        .filter(s => selectedServices.includes(s.id))
        .reduce((total, service) => total + (service.duration_minutes || 30), 0);
    }

    // Toplam süreye göre end_time hesapla - daha doğru yöntem
    const [startHours, startMinutes] = selectedTime.split(':').map(Number);
    const totalMinutes = startHours * 60 + startMinutes + totalDuration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    const endTimeString = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    // endTimeString'in geçerli olduğunu kontrol et
    if (!endTimeString || endTimeString === 'Invalid Date') {
      throw new Error('Geçersiz bitiş saati hesaplandı');
    }

    // Toplam fiyatı hesapla
    const totalPrice = services
      .filter(s => selectedServices.includes(s.id))
      .reduce((total, service) => total + service.price, 0);

    // Tek randevu kaydı oluştur - tüm servisleri array olarak ekle
    const staffId = await assignAvailableStaff();
    if (!staffId) {
      throw new Error('Seçilen saatte müsait personel bulunamadı. Lütfen farklı bir saat seçin.');
    }
    
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        business_id: business.id,
        customer_id: customerId,
        service_ids: selectedServices, // Array olarak tüm servisler
        appointment_date: format(selectedDate!, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTimeString,
        status: 'scheduled',
        total_price: totalPrice, // Toplam fiyat
        staff_id: staffId,
        notes: customerNotes || null
      })
      .select('id')
      .single();

    if (appointmentError) {
      throw new Error('Randevu oluşturulamadı');
    }
    
    return appointment;

    // Send business notification SMS
    try {
      const formattedBusinessPhone = await getNotificationPhoneNumber();
      const appointmentDate = new Date(selectedDate!);
      const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      const businessMessage = `${formattedDate} tarihine yeni bir online randevunuz var. Lutfen panelinizi kontrol ediniz. KendineGore`;
      
      if (formattedBusinessPhone) {
        const smsResult = await netGSMService.sendSMSWithLimitCheck(
          [formattedBusinessPhone],
          businessMessage,
          business.id,
          'business_notification',
          null
        );
        
        if (smsResult.success) {
          // İşletme bildirimi başarıyla gönderildi
        }
      }
    } catch (smsError) {
      // SMS gönderim hatası
    }

    return appointment;
  };

  // Helper function to check if business notifications are enabled
  const checkBusinessNotificationEnabled = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('sms_settings')
        .select('business_notification_enabled')
        .eq('business_id', business?.id)
        .single();
      
      if (error) {
        return true; // Default to enabled if no settings found
      }
      
      return (data as SMSSettings)?.business_notification_enabled || false;
    } catch (error) {
      return true; // Default to enabled on error
    }
  };

  const getTotalPrice = () => {
    return services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.price, 0);
  };

  const getTotalDuration = () => {
    return services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.duration_minutes, 0);
  };

  // Business ID yüklenene kadar loading göster
  if (!businessId || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // Subscription loading göster
  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // Abonelik süresi bitmişse randevu formunu gösterme
  if (!hasAccess && business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                <Building className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-red-800 mb-4">Online Randevu Geçici Olarak Kapalı</h2>
            <p className="text-red-600 mb-4">
              {business.name} şu anda online randevu almıyor. Lütfen işletmeyi telefon ile arayın.
            </p>
            <div className="space-y-2 text-sm text-gray-600">
              <p>Telefon: {business.phone}</p>
              {business.email && <p>E-posta: {business.email}</p>}
            </div>
            <Button onClick={() => navigate('/')} className="mt-4">
              Ana Sayfaya Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <h2 className="text-2xl font-bold mb-4">İşletme Bulunamadı</h2>
            <p className="text-muted-foreground mb-4">Aradığınız işletme bulunamadı.</p>
            <Button onClick={() => navigate('/')}>Ana Sayfaya Dön</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="w-full max-w-md mx-auto p-4">
        {step === 0 ? (
          // Modern Business Card
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50">
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-br from-brand-primary via-brand-primary-dark to-brand-secondary text-white">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative p-8 text-center">
                <h1 className="text-2xl font-bold mb-2">{business.name}</h1>
                <div className="space-y-2 text-sm opacity-90">
                  {business.phone && business.show_phone_in_booking && (
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.address && (
                    <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-center text-xs leading-relaxed">
                        {business.address}
                        {business.city && `, ${business.city}`}
                        {business.district && `, ${business.district}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              {business.description && (
                <div className="text-center">
                  <p className="text-slate-600 leading-relaxed text-sm">
                    {business.description}
                  </p>
                </div>
              )}

              {/* Portfolio Section */}
              <div>
                <h2 className="text-lg font-semibold text-center mb-4 text-slate-800">Çalışmalarımız</h2>
                {portfolioImages.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {portfolioImages
                        .slice(portfolioPage * imagesPerPage, (portfolioPage + 1) * imagesPerPage)
                        .map((image) => (
                          <div
                            key={image.id}
                            className="aspect-square bg-slate-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group"
                          >
                            <img
                              src={image.url}
                              alt={image.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          </div>
                        ))}
                    </div>
                    
                    {/* Modern Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mb-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 rounded-full"
                          onClick={() => setPortfolioPage(Math.max(0, portfolioPage - 1))}
                          disabled={portfolioPage === 0}
                        >
                          ←
                        </Button>
                        <div className="flex gap-2">
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setPortfolioPage(i)}
                              className={cn(
                                "w-8 h-2 rounded-full transition-all duration-200",
                                i === portfolioPage 
                                  ? "bg-brand-primary shadow-md" 
                                  : "bg-slate-200 hover:bg-slate-300"
                              )}
                            />
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 w-10 rounded-full"
                          onClick={() => setPortfolioPage(Math.min(totalPages - 1, portfolioPage + 1))}
                          disabled={portfolioPage === totalPages - 1}
                        >
                          →
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                    <p className="text-sm">Portföy resimleri yakında eklenecek</p>
                  </div>
                )}
              </div>

              {/* Enhanced Book Button */}
              <Button
                className="w-full h-14 bg-gradient-to-r from-brand-primary via-brand-primary-dark to-brand-secondary hover:from-brand-secondary hover:via-brand-primary-dark hover:to-brand-primary text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 relative overflow-hidden group"
                onClick={() => setStep(1)}
              >
                <div className="absolute inset-0 bg-white/10 transform skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <CalendarIcon className="mr-3 h-6 w-6" />
                Hemen Randevu Al
              </Button>

              {/* Contact Info Cards */}
              <div className="grid grid-cols-1 gap-3">
                {business.phone && business.show_phone_in_booking && (
                  <a 
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">Telefon</p>
                      <p className="text-sm text-slate-500">{business.phone}</p>
                    </div>
                  </a>
                )}
                {business.email && business.show_email_in_booking && (
                  <a 
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">E-posta</p>
                      <p className="text-sm text-slate-500">{business.email}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        ) : step === 6 ? (
          // Success Page
          <Card className="bg-white shadow-xl">
            <CardContent className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Randevunuz Alındı!</h2>
              <p className="text-muted-foreground mb-6">
                Randevunuz başarıyla oluşturuldu. En kısa sürede size dönüş yapılacak.
              </p>
              <Button onClick={() => setStep(0)} variant="outline">
                Ana Sayfaya Dön
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Booking Form - Expanded Layout
          <div className="w-full max-w-4xl mx-auto">
            <Card className="bg-white shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => step === 1 ? setStep(0) : setStep(step - 1)}
                    className="p-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <CardDescription>Randevu Al - Adım {step}/5</CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {step === 1 && (
                  // Step 1: Service Selection
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Hizmet Seçimi</h3>
                    <p className="text-muted-foreground mb-6">Almak istediğiniz hizmetleri seçin</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {services.map((service) => (
                        <Card 
                          key={service.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedServices.includes(service.id) 
                              ? "ring-2 ring-brand-primary bg-brand-primary/5" 
                              : ""
                          )}
                          onClick={() => handleServiceToggle(service.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">{service.name}</h4>
                              <Badge variant="secondary">₺{service.price}</Badge>
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {service.duration_minutes} dakika
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(2)} 
                        disabled={selectedServices.length === 0}
                        className="bg-brand-primary hover:bg-brand-primary/90"
                      >
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  // Step 2: Staff Selection
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Personel Seçimi</h3>
                    <p className="text-muted-foreground mb-6">Hizmet almak istediğiniz personeli seçin (opsiyonel)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <Card 
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-md",
                          selectedStaff === "" ? "ring-2 ring-brand-primary bg-brand-primary/5" : ""
                        )}
                        onClick={() => setSelectedStaff("")}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Users className="h-6 w-6 text-brand-primary mt-1" />
                            <div>
                              <h4 className="font-semibold">Fark Etmez</h4>
                              <p className="text-sm text-muted-foreground">
                                Müsait olan personel otomatik atanacak
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {staff.map((member) => (
                        <Card 
                          key={member.id}
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedStaff === member.id ? "ring-2 ring-brand-primary bg-brand-primary/5" : ""
                          )}
                          onClick={() => setSelectedStaff(member.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <User className="h-6 w-6 text-brand-primary mt-1" />
                              <div>
                                <h4 className="font-semibold">{member.name}</h4>
                                {member.specialties && member.specialties.length > 0 && (
                                  <p className="text-sm text-muted-foreground">
                                    Uzmanlık: {member.specialties.join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(3)} 
                        className="bg-brand-primary hover:bg-brand-primary/90"
                      >
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  // Step 3: Date Selection
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tarih Seçimi</h3>
                    <p className="text-muted-foreground mb-6">Randevu almak istediğiniz tarihi seçin</p>
                    <div className="flex justify-center mb-6">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => 
                          isBefore(date, startOfDay(new Date())) ||
                          isAfter(date, addDays(new Date(), 30))
                        }
                        locale={tr}
                        className="rounded-md border"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(4)} 
                        disabled={!selectedDate}
                        className="bg-brand-primary hover:bg-brand-primary/90"
                      >
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}

                {step === 4 && (
                  // Step 4: Time Selection
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Saat Seçimi</h3>
                    <p className="text-muted-foreground mb-6">
                      {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: tr })} için uygun saatleri seçin
                    </p>
                    {availableTimeSlots.length > 0 ? (
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                        {availableTimeSlots.map((time) => {
                          const isOccupied = occupiedTimeSlots.includes(time);
                          return (
                            <Button
                              key={time}
                              variant={selectedTime === time ? "default" : isOccupied ? "destructive" : "outline"}
                              onClick={() => !isOccupied && setSelectedTime(time)}
                              disabled={isOccupied}
                              className={cn(
                                "w-full relative",
                                selectedTime === time && "bg-brand-primary hover:bg-brand-primary/90",
                                isOccupied && "cursor-not-allowed opacity-60"
                              )}
                            >
                              {time}
                              {isOccupied && <span className="ml-1 text-xs">DOLU</span>}
                            </Button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 mb-6">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-2">Bu tarih için uygun saat bulunmuyor.</p>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button 
                        onClick={() => setStep(5)} 
                        disabled={!selectedTime}
                        className="bg-brand-primary hover:bg-brand-primary/90"
                      >
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  // Step 5: Customer Information
                  <div>
                    <h3 className="text-lg font-semibold mb-4">İletişim Bilgileri</h3>
                    <p className="text-muted-foreground mb-6">Randevu onayı için iletişim bilgilerinizi girin</p>
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Ad *</Label>
                          <Input
                            id="firstName"
                            value={customerInfo.firstName}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
                            placeholder="Adınız"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Soyad *</Label>
                          <Input
                            id="lastName"
                            value={customerInfo.lastName}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
                            placeholder="Soyadınız"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefon *</Label>
                        <div className="flex gap-2">
                          <Select
                            value={customerInfo.countryCode}
                            onValueChange={(value) => setCustomerInfo(prev => ({ ...prev, countryCode: value }))}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {countryCodes.map((country) => (
                                <SelectItem key={country.code} value={country.code}>
                                  <div className="flex items-center gap-2">
                                    <span>{country.flag}</span>
                                    <span>{country.code}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id="phone"
                            value={customerInfo.phone}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="555 123 45 67"
                            required
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="ornek@email.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notlar</Label>
                        <Textarea
                          id="notes"
                          value={customerInfo.notes}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, notes: e.target.value }))}
                          placeholder="Özel istekleriniz varsa belirtiniz"
                          rows={3}
                        />
                      </div>
                    </div>

                    {/* Terms and Conditions */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={agreedToTerms}
                          onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
                            <span className="text-gray-900">
                              <button 
                                type="button"
                                className="text-brand-primary hover:underline"
                                onClick={() => openModal('terms')}
                              >
                                Kullanım Şartları
                              </button>
                              {" ve "}
                              <button 
                                type="button"
                                className="text-brand-primary hover:underline"
                                onClick={() => openModal('privacy')}
                              >
                                Gizlilik Politikası
                              </button>
                              'nı okudum ve kabul ediyorum.
                            </span>
                          </Label>
                          <p className="text-xs text-gray-500">
                            Randevu alarak, işletmenin randevu politikalarını ve veri işleme koşullarını kabul etmiş olursunuz.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={handleBookingSubmit}
                        disabled={!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone || !agreedToTerms}
                        className="bg-brand-primary hover:bg-brand-primary/90"
                      >
                        Randevu Al
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* SMS Verification Modal */}
      {pendingCustomerInfo && (
        <PhoneVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          phoneNumber={pendingCustomerInfo.phone}
          businessId={business?.id || ''}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}

      {/* Success Screen */}
      {showSuccessScreen && successAppointmentData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            {/* Success Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Randevunuz Alındı! 🎉
            </h2>
            
            {/* Appointment Details */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tarih & Saat</p>
                    <p className="font-semibold text-gray-900">{successAppointmentData.date}</p>
                    <p className="font-semibold text-gray-900">{successAppointmentData.time}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Müşteri</p>
                    <p className="font-semibold text-gray-900">{successAppointmentData.customerName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hizmetler</p>
                    <div className="space-y-1">
                      {successAppointmentData.services.map((service, index) => (
                        <p key={index} className="font-semibold text-gray-900">• {service}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Önemli Bilgiler:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Randevunuz işletme tarafından onaylanacaktır</li>
                    <li>• İşletme size SMS ile bilgilendirme yapacaktır</li>
                    <li>• Randevu saatinden 30 dakika önce gelmeyi unutmayın</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  setShowSuccessScreen(false);
                  setSuccessAppointmentData(null);
                  // Reset form
                  setStep(1);
                  setSelectedDate(null);
                  setSelectedTime("");
                  setSelectedServices([]);
                  setCustomerInfo({
                    firstName: "",
                    lastName: "",
                    phone: "",
                    email: "",
                    notes: "",
                    countryCode: "+90"
                  });
                  setAgreedToTerms(false);
                }}
                className="w-full bg-brand-primary hover:bg-brand-primary/90"
              >
                Yeni Randevu Al
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/'}
                className="w-full"
              >
                Ana Sayfaya Dön
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Legal Modals */}
      <Dialog open={openLegalModal === 'privacy'} onOpenChange={() => setOpenLegalModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Gizlilik Politikası</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <h3 className="font-semibold text-lg">1. Toplanan Bilgiler</h3>
            <p>
              KendineGöre olarak, hizmetlerimizi sunabilmek için aşağıdaki kişisel bilgileri topluyoruz:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Ad, soyad ve iletişim bilgileri</li>
              <li>E-posta adresi ve telefon numarası</li>
              <li>İşletme bilgileri ve randevu kayıtları</li>
              <li>Kullanım verileri ve analitik bilgiler</li>
            </ul>

            <h3 className="font-semibold text-lg">2. Bilgilerin Kullanımı</h3>
            <p>
              Topladığımız bilgileri aşağıdaki amaçlarla kullanırız:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Hizmetlerimizi sunmak ve geliştirmek</li>
              <li>Müşteri desteği sağlamak</li>
              <li>Yasal yükümlülüklerimizi yerine getirmek</li>
              <li>Güvenlik ve kalite kontrolü</li>
            </ul>

            <h3 className="font-semibold text-lg">3. Bilgi Paylaşımı</h3>
            <p>
              Kişisel bilgilerinizi üçüncü taraflarla paylaşmayız, ancak yasal zorunluluklar veya mahkeme kararları durumunda bu bilgileri paylaşabiliriz.
            </p>

            <h3 className="font-semibold text-lg">4. Veri Güvenliği</h3>
            <p>
              Bilgilerinizi korumak için endüstri standardı güvenlik önlemleri alırız. Verileriniz SSL şifreleme ile korunur ve güvenli sunucularda saklanır.
            </p>

            <h3 className="font-semibold text-lg">5. İletişim</h3>
            <p>
              Gizlilik politikamız hakkında sorularınız için info@kendinegore.com adresinden bizimle iletişime geçebilirsiniz.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openLegalModal === 'terms'} onOpenChange={() => setOpenLegalModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kullanım Şartları</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-gray-700">
            <h3 className="font-semibold text-lg">1. Hizmet Tanımı</h3>
            <p>
              KendineGöre, güzellik salonları, berberler ve kuaförler için CRM ve randevu yönetim hizmetleri sunar.
            </p>

            <h3 className="font-semibold text-lg">2. Kullanıcı Yükümlülükleri</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Doğru ve güncel bilgiler sağlamak</li>
              <li>Hizmeti yasal amaçlarla kullanmak</li>
              <li>Diğer kullanıcıların haklarına saygı göstermek</li>
              <li>Güvenlik önlemlerini almak</li>
            </ul>

            <h3 className="font-semibold text-lg">3. Yasaklı Kullanımlar</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Yasadışı faaliyetlerde bulunmak</li>
              <li>Sistemi hacklemeye çalışmak</li>
              <li>Başkalarının hesaplarını kullanmak</li>
              <li>Zararlı yazılım yaymak</li>
            </ul>

            <h3 className="font-semibold text-lg">4. Hizmet Değişiklikleri</h3>
            <p>
              KendineGöre, hizmetlerini önceden bildirimde bulunarak değiştirme hakkını saklı tutar.
            </p>

            <h3 className="font-semibold text-lg">5. Sorumluluk Sınırları</h3>
            <p>
              KendineGöre, hizmetlerin kesintisiz olmasını garanti etmez. Kullanıcılar, hizmet kullanımından doğabilecek zararlardan sorumludur.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicBooking;