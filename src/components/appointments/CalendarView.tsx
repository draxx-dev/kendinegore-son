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
  appointment_group_id: string;
  customers: {
    first_name: string;
    last_name: string;
  };
  services: {
    name: string;
  };
  staff: {
    id: string;
    name: string;
  } | null;
}

interface CalendarViewProps {
  selectedDate: string;
  appointments: Appointment[];
  onStatusUpdate: (appointmentGroupId: string, newStatus: string) => void;
}

const CalendarView = ({ selectedDate, appointments, onStatusUpdate }: CalendarViewProps) => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStaff();
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
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const getAppointmentForStaffAtTime = (staffId: string | null, time: string) => {
    if (staffId === null) {
      // Personelsiz randevular için
      return appointments.find(apt => 
        apt.staff === null && 
        apt.start_time.substring(0, 5) === time
      );
    }
    return appointments.find(apt => 
      apt.staff?.id === staffId && 
      apt.start_time.substring(0, 5) === time
    );
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

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardContent className="p-0">
          {/* Staff Header */}
          <div className="flex border-b border-brand-primary/20">
            <div className="w-20 p-4 bg-brand-primary/5 border-r border-brand-primary/20">
              <div className="text-sm font-medium text-center">Saat</div>
            </div>
            {/* Personelsiz randevular için sütun */}
            <div className="flex-1 p-4 text-center border-r border-brand-primary/10">
              <div className="flex flex-col items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gray-200 text-gray-600">
                    G
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm font-medium text-foreground">
                  Genel
                </div>
              </div>
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
                {/* Personelsiz randevular için sütun */}
                <div className="flex-1 p-2 border-r border-brand-primary/10">
                  {(() => {
                    const appointment = getAppointmentForStaffAtTime(null, time);
                    return appointment && (
                      <div className={`rounded-lg border p-2 text-xs ${getStatusColor(appointment.status)}`}>
                        <div className="font-medium mb-1">
                          {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                        </div>
                        <div className="font-semibold mb-1">
                          {appointment.customers.first_name} {appointment.customers.last_name}
                        </div>
                        <div className="mb-1">
                          {appointment.services.name}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {appointment.status === 'scheduled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs"
                              onClick={() => onStatusUpdate(appointment.appointment_group_id, 'confirmed')}
                            >
                              Onayla
                            </Button>
                          )}
                          {['scheduled', 'confirmed'].includes(appointment.status) && (
                            <Button
                              size="sm"
                              variant="brand"
                              className="h-6 px-2 text-xs"
                              onClick={() => onStatusUpdate(appointment.appointment_group_id, 'completed')}
                            >
                              Tamamla
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {staff.map((member) => {
                  const appointment = getAppointmentForStaffAtTime(member.id, time);
                  return (
                    <div key={`${member.id}-${time}`} className="flex-1 p-2 border-r border-brand-primary/10 last:border-r-0">
                      {appointment && (
                        <div className={`rounded-lg border p-2 text-xs ${getStatusColor(appointment.status)}`}>
                          <div className="font-medium mb-1">
                            {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                          </div>
                          <div className="font-semibold mb-1">
                            {appointment.customers.first_name} {appointment.customers.last_name}
                          </div>
                          <div className="mb-1">
                            {appointment.services.name}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {appointment.status === 'scheduled' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 px-2 text-xs"
                                onClick={() => onStatusUpdate(appointment.appointment_group_id, 'confirmed')}
                              >
                                Onayla
                              </Button>
                            )}
                            {['scheduled', 'confirmed'].includes(appointment.status) && (
                              <Button
                                size="sm"
                                variant="brand"
                                className="h-6 px-2 text-xs"
                                onClick={() => onStatusUpdate(appointment.appointment_group_id, 'completed')}
                              >
                                Tamamla
                              </Button>
                            )}
                          </div>
                        </div>
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