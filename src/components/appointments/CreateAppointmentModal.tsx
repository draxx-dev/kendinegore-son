import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateCustomerModal } from "@/components/customers/CreateCustomerModal";
import { Calendar, Save, X, UserPlus } from "lucide-react";
import { useSMSIntegration } from "@/hooks/useSMSIntegration";

interface CreateAppointmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface Staff {
  id: string;
  name: string;
  is_active: boolean;
}

export const CreateAppointmentModal = ({ 
  open, 
  onOpenChange, 
  onSuccess 
}: CreateAppointmentModalProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customer_id: "",
    staff_id: "",
    appointment_date: "",
    start_time: "",
    notes: ""
  });

  const { toast } = useToast();
  const { sendBusinessNotification } = useSMSIntegration(businessId);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
      // Get business ID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Kullanıcı bulunamadı");
      
      const { data: businesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, phone')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (businessError) throw businessError;
      if (businesses) {
        setBusinessId(businesses.id);
      }

      const [customersRes, servicesRes, staffRes] = await Promise.all([
        supabase.from('customers').select('*').order('first_name'),
        supabase.from('services').select('*').eq('is_active', true).order('name'),
        supabase.from('staff').select('*').eq('is_active', true).order('name')
      ]);

      if (customersRes.error) throw customersRes.error;
      if (servicesRes.error) throw servicesRes.error;
      if (staffRes.error) throw staffRes.error;

      setCustomers(customersRes.data || []);
      setServices(servicesRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Veriler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getBusinessId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Kullanıcı bulunamadı");
    
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!businesses) {
      throw new Error("İşletme bulunamadı. Lütfen sayfayı yenileyin.");
    }

    return businesses.id;
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    
    // 24 saat formatını aşarsa düzelt (sadece gerekirse)
    const adjustedEndHours = endHours >= 24 ? endHours - 24 : endHours;
    
    return `${adjustedEndHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  };

  // Belirli bir saatte uygun personel bul
  const findAvailableStaff = async (date: string, startTime: string, durationMinutes: number) => {
    const endTime = calculateEndTime(startTime, durationMinutes);
    
    // O gün o saatte mevcut randevuları kontrol et
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('staff_id, start_time, end_time')
      .eq('appointment_date', date)
      .eq('status', 'scheduled');

    if (error) throw error;

    // Her personel için müsaitlik kontrolü
    for (const staffMember of staff.filter(s => s.is_active)) {
      let isAvailable = true;
      
      // Bu personelin o saatte randevusu var mı kontrol et
      for (const appointment of existingAppointments || []) {
        if (appointment.staff_id === staffMember.id) {
          // Zaman çakışması kontrolü
          const existingStart = appointment.start_time;
          const existingEnd = appointment.end_time;
          
          // Yeni randevu mevcut randevu ile çakışıyor mu?
          if (
            (startTime >= existingStart && startTime < existingEnd) ||
            (endTime > existingStart && endTime <= existingEnd) ||
            (startTime <= existingStart && endTime >= existingEnd)
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
    
    return null; // Uygun personel bulunamadı
  };

  // Belirli bir personelin müsait olup olmadığını kontrol et
  const checkStaffAvailability = async (staffId: string, date: string, startTime: string, durationMinutes: number) => {
    const endTime = calculateEndTime(startTime, durationMinutes);
    
    // Bu personelin o gün o saatte randevusu var mı kontrol et
    const { data: existingAppointments, error } = await supabase
      .from('appointments')
      .select('start_time, end_time')
      .eq('appointment_date', date)
      .eq('staff_id', staffId)
      .eq('status', 'scheduled');

    if (error) throw error;

    // Zaman çakışması kontrolü
    for (const appointment of existingAppointments || []) {
      const existingStart = appointment.start_time;
      const existingEnd = appointment.end_time;
      
      // Yeni randevu mevcut randevu ile çakışıyor mu?
      if (
        (startTime >= existingStart && startTime < existingEnd) ||
        (endTime > existingStart && endTime <= existingEnd) ||
        (startTime <= existingStart && endTime >= existingEnd)
      ) {
        return false; // Çakışma var
      }
    }
    
    return true; // Müsait
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleNewCustomerAdded = (customer: Customer) => {
    setCustomers(prev => [customer, ...prev]);
    setFormData(prev => ({ ...prev, customer_id: customer.id }));
  };

  const calculateTotalPrice = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.price || 0);
    }, 0);
  };

  const calculateTotalDuration = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service?.duration_minutes || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.appointment_date || !formData.start_time || selectedServices.length === 0) {
      toast({
        title: "Hata",
        description: "Lütfen tüm gerekli alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const businessId = await getBusinessId();
      
      // Get customer and service details for SMS
      const customer = customers.find(c => c.id === formData.customer_id);
      const selectedServiceNames = services
        .filter(s => selectedServices.includes(s.id))
        .map(s => s.name)
        .join(', ');

      // Tek randevu kaydı oluştur - tüm servisleri array olarak ekle
      // Personel atanmamışsa uygun personel bul
      let staffId = formData.staff_id;
      if (!staffId) {
        // Otomatik personel atama - müsait olanı bul
        staffId = await findAvailableStaff(formData.appointment_date, formData.start_time, calculateTotalDuration());
        if (!staffId) {
          throw new Error('Seçilen saatte müsait personel bulunamadı. Lütfen farklı bir saat seçin.');
        }
      } else {
        // Seçilen personelin müsait olup olmadığını kontrol et
        const isAvailable = await checkStaffAvailability(staffId, formData.appointment_date, formData.start_time, calculateTotalDuration());
        if (!isAvailable) {
          throw new Error('Seçilen personel bu saatte müsait değil. Lütfen farklı bir personel veya saat seçin.');
        }
      }
      
      // Toplam süreye göre tek end_time hesapla
      const totalDuration = calculateTotalDuration();
      const endTime = calculateEndTime(formData.start_time, totalDuration);
      

      // Tek randevu kaydı oluştur - tüm servisleri array olarak ekle
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          business_id: businessId,
          customer_id: formData.customer_id,
          staff_id: staffId,
          service_ids: selectedServices, // Array olarak tüm servisler
          appointment_date: formData.appointment_date,
          start_time: formData.start_time,
          end_time: endTime,
          status: 'scheduled',
          total_price: calculateTotalPrice(), // Toplam fiyat
          notes: formData.notes || null
        })
        .select('id')
        .single();

      if (appointmentError) {
        console.error('❌ DEBUG - Elle randevu oluşturma hatası:', appointmentError);
        throw new Error(`Randevu oluşturulamadı: ${appointmentError.message}`);
      }


      // Elle oluşturulan randevular için müşteriye SMS gönder (online randevu ile aynı içerik)
      try {
        const customer = customers.find(c => c.id === formData.customer_id);
        if (customer && customer.phone) {
          // İşletme bilgilerini al
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('name, phone')
            .eq('id', businessId)
            .single();

          if (businessError) throw businessError;

          const appointmentDate = new Date(formData.appointment_date);
          const formattedDate = appointmentDate.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });

          // Türkçe karakterleri temizle
          const cleanTurkishChars = (str: string) => {
            return str
              .replace(/ğ/g, 'g')
              .replace(/ü/g, 'u')
              .replace(/ş/g, 's')
              .replace(/ı/g, 'i')
              .replace(/ö/g, 'o')
              .replace(/ç/g, 'c')
              .replace(/Ğ/g, 'G')
              .replace(/Ü/g, 'U')
              .replace(/Ş/g, 'S')
              .replace(/İ/g, 'I')
              .replace(/Ö/g, 'O')
              .replace(/Ç/g, 'C');
          };
          
          // Online randevu ile aynı mesaj içeriği
          const customerMessage = `${formattedDate} tarihli ${cleanTurkishChars(business.name)} isletmesinden almis oldugunuz randevunuz sisteme kaydedilmistir. Iptal ettirmek icin isletmeyi arayabilirsiniz ${business.phone || 'bilinmiyor'}. KendineGore`;
          
          // SMS gönder
          const { netGSMService } = await import('@/integrations/supabase/sms');
          await netGSMService.sendCustomerConfirmation(
            customer.phone,
            customerMessage,
            businessId!
          );
        }
      } catch (smsError) {
        console.error('SMS gönderim hatası:', smsError);
        // SMS hatası randevu oluşturmayı engellemez
      }

      toast({
        title: "Başarılı!",
        description: "Randevu başarıyla oluşturuldu.",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Appointment creation error:', error);
      toast({
        title: "Hata",
        description: error.message || "Randevu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };



  const resetForm = () => {
    setFormData({
      customer_id: "",
      staff_id: "",
      appointment_date: "",
      start_time: "",
      notes: ""
    });
    setSelectedServices([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-primary" />
            Yeni Randevu Oluştur
          </DialogTitle>
          <DialogDescription>
            Müşteri için yeni bir randevu oluşturun.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="customer">Müşteri *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewCustomerModal(true)}
                className="h-8"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Yeni Müşteri
              </Button>
            </div>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Müşteri seçin" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Hizmetler * (Birden fazla seçebilirsiniz)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => toggleServiceSelection(service.id)}
                  className={`cursor-pointer p-2 rounded-md border text-sm transition-colors ${
                    selectedServices.includes(service.id)
                      ? 'bg-brand-primary text-white border-brand-primary'
                      : 'bg-background border-border hover:bg-muted'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{service.name}</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span>{service.duration_minutes}dk</span>
                      <span>₺{service.price}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {selectedServices.map((serviceId) => {
                  const service = services.find(s => s.id === serviceId);
                  return service ? (
                    <Badge key={serviceId} variant="secondary" className="text-xs">
                      {service.name}
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="text-sm text-muted-foreground border-t pt-2">
                <div className="flex justify-between">
                  <span>Toplam Süre:</span>
                  <span className="font-medium">{calculateTotalDuration()} dakika</span>
                </div>
                <div className="flex justify-between">
                  <span>Toplam Fiyat:</span>
                  <span className="font-medium">₺{calculateTotalPrice()}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointment_date">Tarih *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time">Saat *</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff">Personel (Opsiyonel)</Label>
            <Select
              value={formData.staff_id}
              onValueChange={(value) => setFormData({ ...formData, staff_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Personel seçin (opsiyonel)" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((staffMember) => (
                  <SelectItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Özel talepler, notlar..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              variant="brand" 
              disabled={loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Oluşturuluyor..." : "Randevu Oluştur"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-2" />
              İptal
            </Button>
          </div>
        </form>

        <CreateCustomerModal
          open={showNewCustomerModal}
          onOpenChange={setShowNewCustomerModal}
          onSuccess={handleNewCustomerAdded}
        />
      </DialogContent>
    </Dialog>
  );
};