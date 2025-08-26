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
  const [formData, setFormData] = useState({
    customer_id: "",
    staff_id: "",
    appointment_date: "",
    start_time: "",
    notes: ""
  });

  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    try {
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
    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
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
    
    if (!formData.customer_id || selectedServices.length === 0 || !formData.appointment_date || !formData.start_time) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const businessId = await getBusinessId();
      const totalDuration = calculateTotalDuration();
      const totalPrice = calculateTotalPrice();
      const endTime = calculateEndTime(formData.start_time, totalDuration);

      // Generate a single group ID for all services in this appointment
      const appointmentGroupId = crypto.randomUUID();

      // Determine staff assignment
      let finalStaffId = formData.staff_id;
      
      if (!finalStaffId && staff.length > 0) {
        // If no staff selected, assign randomly from available staff
        const randomIndex = Math.floor(Math.random() * staff.length);
        finalStaffId = staff[randomIndex].id;
      }

      // Create appointments for each selected service with the same group_id
      const appointmentPromises = selectedServices.map(async (serviceId) => {
        const { error } = await supabase
          .from('appointments')
          .insert([{
            business_id: businessId,
            customer_id: formData.customer_id,
            service_id: serviceId,
            staff_id: finalStaffId || null,
            appointment_date: formData.appointment_date,
            start_time: formData.start_time,
            end_time: endTime,
            total_price: totalPrice,
            appointment_group_id: appointmentGroupId,
            notes: formData.notes || null,
            status: 'scheduled'
          }]);

        if (error) throw error;
      });

      await Promise.all(appointmentPromises);

      toast({
        title: "Başarılı!",
        description: `${selectedServices.length} randevu oluşturuldu.`,
      });

      // Form'u temizle
      setFormData({
        customer_id: "",
        staff_id: "",
        appointment_date: "",
        start_time: "",
        notes: ""
      });
      setSelectedServices([]);

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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