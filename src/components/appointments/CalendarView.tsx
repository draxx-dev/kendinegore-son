import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Staff {
  id: string;
  name: string;
  profile_image_url: string | null;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  service_ids: string[];
  customers: {
    first_name: string;
    last_name: string;
  };
  staff: {
    id: string;
    name: string;
  } | null;
}

interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

interface CalendarViewProps {
  selectedDate: string;
  appointments: Appointment[];
  onStatusUpdate: (appointmentId: string, newStatus: string) => void;
  workingHours?: WorkingHour[];
}

const CalendarView = ({ selectedDate, appointments, onStatusUpdate, workingHours = [] }: CalendarViewProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<{[key: string]: {name: string}}>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
    fetchServices();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, profile_image_url')
        .eq('is_active', true);

      if (error) throw error;
      setStaff(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Personel bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name');

      if (error) throw error;
      
      // Services'i ID'ye göre map'le
      const servicesMap: {[key: string]: {name: string}} = {};
      (data || []).forEach(service => {
        servicesMap[service.id] = { name: service.name };
      });
      setServices(servicesMap);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Servis bilgileri yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    // Seçilen tarihin hangi gün olduğunu bul
    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay(); // 0 = Pazar, 1 = Pazartesi, ...
    
    // O günün çalışma saatlerini bul
    const todayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);
    
    // Eğer o gün kapalıysa veya çalışma saati bulunamazsa boş array döndür
    if (!todayWorkingHours || todayWorkingHours.is_closed) {
      return [];
    }
    
    const slots = [];
    const [startHour, startMinute] = todayWorkingHours.start_time.split(':').map(Number);
    const [endHour, endMinute] = todayWorkingHours.end_time.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    // Çalışma saatleri arasında 30 dakikalık slotlar oluştur
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const time = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      slots.push(time);
      
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour++;
      }
    }
    
    return slots;
  };

  const getAppointmentForStaffAtTime = (staffId: string, time: string) => {
    return appointments.find(apt => {
      if (apt.staff?.id !== staffId) return false;
      
      // Randevunun başlangıç ve bitiş saatlerini al
      const startTime = apt.start_time.substring(0, 5); // HH:MM formatında
      const endTime = apt.end_time.substring(0, 5); // HH:MM formatında
      
      // Eğer bu slot randevunun başlangıç saati ise randevuyu döndür
      if (startTime === time) return true;
      
      // Eğer bu slot randevunun süresi içinde kalıyorsa da randevuyu döndür
      // Zaman karşılaştırması için string'leri sayıya çevir
      const timeInMinutes = parseInt(time.split(':')[0]) * 60 + parseInt(time.split(':')[1]);
      const startInMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
      const endInMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
      
      // Slot randevunun süresi içinde mi kontrol et
      return timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes;
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-200 text-blue-800 border-blue-300',
      confirmed: 'bg-green-200 text-green-800 border-green-300', 
      completed: 'bg-emerald-200 text-emerald-800 border-emerald-300',
      cancelled: 'bg-red-200 text-red-800 border-red-300',
      no_show: 'bg-gray-200 text-gray-800 border-gray-300'
    };
    return colors[status as keyof typeof colors] || colors.scheduled;
  };

  const timeSlots = generateTimeSlots();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // Eğer o gün çalışma saati yoksa veya kapalıysa mesaj göster
  if (timeSlots.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">
              <div className="text-lg font-medium mb-2">Bu gün çalışma saati bulunmuyor</div>
              <div className="text-sm">
                Seçilen tarihte işletme kapalı veya çalışma saati tanımlanmamış.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardContent className="p-0">
          {/* Staff Header */}
          <div className="flex border-b border-brand-primary/20">
            <div className="w-20 p-4 bg-brand-primary/5 border-r border-brand-primary/20">
              <div className="text-sm font-medium text-center">Saat</div>
            </div>
            {staff.map((member) => (
              <div key={member.id} className="flex-1 p-4 text-center border-r border-brand-primary/10 last:border-r-0">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile_image_url || ''} />
                    <AvatarFallback className="bg-brand-primary/10 text-brand-primary">
                      {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm font-medium text-foreground">
                    {member.name}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div className="max-h-96 overflow-y-auto">
            {timeSlots.map((time) => (
              <div key={time} className="flex border-b border-brand-primary/10 last:border-b-0 min-h-[60px]">
                <div className="w-20 p-3 bg-brand-primary/5 border-r border-brand-primary/20 flex items-center justify-center">
                  <div className="text-sm font-medium">{time}</div>
                </div>
                {staff.map((member) => {
                  const appointment = getAppointmentForStaffAtTime(member.id, time);
                  const isAppointmentStart = appointment && appointment.start_time.substring(0, 5) === time;
                  
                  return (
                    <div key={`${member.id}-${time}`} className="flex-1 p-2 border-r border-brand-primary/10 last:border-r-0">
                      {appointment && (
                        <>
                          {isAppointmentStart ? (
                            // Randevunun başlangıç saatinde detaylı bilgi göster
                            <div className={`rounded-lg border p-2 text-xs ${getStatusColor(appointment.status)}`}>
                              <div className="font-medium mb-1">
                                {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                              </div>
                              <div className="font-semibold mb-1">
                                {appointment.customers.first_name} {appointment.customers.last_name}
                              </div>
                              <div className="mb-1">
                                {appointment.service_ids.map(serviceId => services[serviceId]?.name).filter(Boolean).join(", ")}
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {appointment.status === 'scheduled' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => onStatusUpdate(appointment.id, 'confirmed')}
                                  >
                                    Onayla
                                  </Button>
                                )}
                                {['scheduled', 'confirmed'].includes(appointment.status) && (
                                  <Button
                                    size="sm"
                                    variant="brand"
                                    className="h-6 px-2 text-xs"
                                    onClick={() => onStatusUpdate(appointment.id, 'completed')}
                                  >
                                    Tamamla
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            // Randevunun devam ettiği saatlerde sadece dolu göster
                            <div className={`rounded-lg border p-2 text-xs ${getStatusColor(appointment.status)} opacity-75`}>
                              <div className="text-center font-medium">
                                {appointment.customers.first_name} {appointment.customers.last_name}
                              </div>
                              <div className="text-center text-xs opacity-80">
                                Devam ediyor...
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;