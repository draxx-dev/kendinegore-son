import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar, 
  Clock, 
  User, 
  Scissors, 
  DollarSign,
  X,
  History
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes?: string;
  services: {
    name: string;
    duration_minutes: number;
  };
  staff?: {
    name: string;
  };
}

interface CustomerAppointmentHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

const CustomerAppointmentHistoryModal = ({ 
  isOpen, 
  onClose, 
  customerId, 
  customerName 
}: CustomerAppointmentHistoryModalProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && customerId) {
      fetchAppointmentHistory();
    }
  }, [isOpen, customerId]);

  const fetchAppointmentHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          total_price,
          notes,
          appointment_group_id,
          services (
            name,
            duration_minutes
          ),
          staff (
            name
          )
        `)
        .eq('customer_id', customerId)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (error) throw error;
      
      // Group appointments by appointment_group_id
      const groupedAppointments = groupAppointments(data || []);
      setAppointments(groupedAppointments);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevu geçmişi yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Group appointments by appointment_group_id to avoid duplicates
  const groupAppointments = (appointments: any[]) => {
    const groupMap = new Map<string, any>();
    
    appointments.forEach(appointment => {
      const groupId = appointment.appointment_group_id || appointment.id;
      
      if (groupMap.has(groupId)) {
        const existing = groupMap.get(groupId)!;
        // Add service if not already present
        if (!existing.services.some((s: any) => s.name === appointment.services.name)) {
          existing.services.push(appointment.services);
        }
        // Update total price
        existing.total_price += appointment.total_price;
      } else {
        groupMap.set(groupId, {
          ...appointment,
          services: [appointment.services],
          total_price: appointment.total_price
        });
      }
    });
    
    return Array.from(groupMap.values());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Planlandı';
      case 'confirmed':
        return 'Onaylandı';
      case 'completed':
        return 'Tamamlandı';
      case 'cancelled':
        return 'İptal Edildi';
      case 'no_show':
        return 'Gelmedi';
      default:
        return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}s ${mins > 0 ? mins + 'dk' : ''}`;
    }
    return `${mins}dk`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-primary" />
            {customerName} - Randevu Geçmişi
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <Card className="bg-gray-50">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Henüz randevu bulunmuyor
                  </h3>
                  <p className="text-muted-foreground text-center">
                    Bu müşteri için henüz randevu oluşturulmamış.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-brand-primary mb-1">
                        {appointments.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Toplam Randevu</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {appointments.filter(a => a.status === 'completed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Tamamlanan</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {formatPrice(appointments.reduce((sum, a) => sum + a.total_price, 0))}
                      </div>
                      <div className="text-sm text-muted-foreground">Toplam Değer</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        {formatPrice(appointments.length > 0 ? appointments.reduce((sum, a) => sum + a.total_price, 0) / appointments.length : 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Ortalama</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Appointment List */}
                <div className="space-y-4">
                  {appointments.map((appointment) => (
                    <Card key={appointment.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                                                    <CardTitle className="text-lg flex items-center gap-2">
                          <Scissors className="h-5 w-5 text-brand-primary" />
                          {appointment.services.length > 1 
                            ? `${appointment.services.length} Hizmet` 
                            : appointment.services[0]?.name || 'Hizmet'
                          }
                        </CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>
                                  {format(new Date(appointment.appointment_date), 'dd MMMM yyyy', { locale: tr })}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>
                                  {appointment.start_time} - {appointment.end_time}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatPrice(appointment.total_price)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(appointment.status)}>
                              {getStatusText(appointment.status)}
                            </Badge>
                            {appointment.staff && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User className="h-4 w-4" />
                                <span>{appointment.staff.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <strong>Hizmetler:</strong>
                              <div className="mt-1 space-y-1">
                                {appointment.services.map((service: any, index: number) => (
                                  <div key={index} className="text-xs text-muted-foreground">
                                    • {service.name} ({formatDuration(service.duration_minutes)})
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="text-sm">
                              <strong>Toplam Fiyat:</strong> {formatPrice(appointment.total_price)}
                            </div>
                          </div>
                          {appointment.notes && (
                            <div className="text-sm">
                              <strong>Notlar:</strong>
                              <div className="mt-1 p-2 bg-gray-50 rounded text-muted-foreground">
                                {appointment.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerAppointmentHistoryModal;
