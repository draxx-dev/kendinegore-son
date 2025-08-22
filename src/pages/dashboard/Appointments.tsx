import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Plus, Clock, User, Scissors, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  customers: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  services: {
    name: string;
    duration_minutes: number;
  };
  staff: {
    name: string;
  } | null;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [selectedDate, statusFilter]);

  const fetchAppointments = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers(first_name, last_name, phone),
          services(name, duration_minutes),
          staff(name)
        `)
        .order('start_time', { ascending: true });

      if (selectedDate) {
        query = query.eq('appointment_date', selectedDate);
      }

      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevular yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) throw error;

      toast({
        title: "Başarılı!",
        description: "Randevu durumu güncellendi.",
      });

      fetchAppointments();
    } catch (error) {
      toast({
        title: "Hata",
        description: "Randevu durumu güncellenirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Planlandı", variant: "secondary" as const },
      confirmed: { label: "Onaylandı", variant: "default" as const },
      completed: { label: "Tamamlandı", variant: "default" as const },
      cancelled: { label: "İptal", variant: "destructive" as const },
      no_show: { label: "Gelmedi", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusActions = (appointment: Appointment) => {
    const actions = [];
    
    if (appointment.status === 'scheduled') {
      actions.push(
        <Button 
          key="confirm"
          size="sm" 
          variant="outline"
          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
        >
          Onayla
        </Button>
      );
    }
    
    if (['scheduled', 'confirmed'].includes(appointment.status)) {
      actions.push(
        <Button 
          key="complete"
          size="sm" 
          variant="brand"
          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
        >
          Tamamla
        </Button>
      );
      actions.push(
        <Button 
          key="cancel"
          size="sm" 
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={() => updateAppointmentStatus(appointment.id, 'cancelled')}
        >
          İptal
        </Button>
      );
    }

    return actions;
  };

  const todayStats = {
    total: appointments.length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    revenue: appointments
      .filter(a => a.status === 'completed')
      .reduce((sum, a) => sum + Number(a.total_price), 0)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-brand-primary" />
            Randevu Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Randevularınızı takvim görünümünde yönetin.
          </p>
        </div>
        <Button variant="brand" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Randevu
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 backdrop-blur-sm border-brand-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="scheduled">Planlandı</option>
                <option value="confirmed">Onaylandı</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
                <option value="no_show">Gelmedi</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-brand-primary mb-1">{todayStats.total}</div>
            <div className="text-sm text-muted-foreground">Toplam Randevu</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">{todayStats.confirmed}</div>
            <div className="text-sm text-muted-foreground">Onaylandı</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">{todayStats.completed}</div>
            <div className="text-sm text-muted-foreground">Tamamlandı</div>
          </CardContent>
        </Card>
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">₺{todayStats.revenue}</div>
            <div className="text-sm text-muted-foreground">Günlük Gelir</div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {appointments.map((appointment) => (
          <Card key={appointment.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                      </span>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {appointment.customers.first_name} {appointment.customers.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.customers.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Scissors className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{appointment.services.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appointment.services.duration_minutes} dakika
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium">₺{appointment.total_price}</div>
                      {appointment.staff && (
                        <div className="text-sm text-muted-foreground">
                          {appointment.staff.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mt-3 text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      {appointment.notes}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {getStatusActions(appointment)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {appointments.length === 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? "Bugün randevu yok"
                : "Seçilen tarihte randevu yok"
              }
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Yeni randevu oluşturmak için yukarıdaki butonu kullanabilirsiniz.
            </p>
            <Button variant="brand">
              <Plus className="h-4 w-4 mr-2" />
              İlk Randevuyu Oluştur
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-blue-50/50 backdrop-blur-sm border-blue-200/50">
        <CardHeader>
          <CardTitle className="text-blue-900">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Haftalık Görünüm</div>
                <div className="text-sm text-muted-foreground">7 günlük randevu takvimi</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">Aylık Rapor</div>
                <div className="text-sm text-muted-foreground">Aylık randevu istatistikleri</div>
              </div>
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-medium">SMS Hatırlatma</div>
                <div className="text-sm text-muted-foreground">Otomatik hatırlatma ayarları</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Appointments;