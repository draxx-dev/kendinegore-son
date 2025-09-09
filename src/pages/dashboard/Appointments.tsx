import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Plus, Clock, User, Scissors, Filter, LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateAppointmentModal } from "@/components/appointments/CreateAppointmentModal";
import { EditAppointmentModal } from "@/components/appointments/EditAppointmentModal";
import { PaymentModal } from "@/components/appointments/PaymentModal";
import CalendarView from "@/components/appointments/CalendarView";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";


interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  service_ids: string[];
  customers: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  staff: {
    id: string;
    name: string;
  } | null;
  payments: Array<{
    payment_method: string;
    payment_status: string;
    amount: number;
  }> | null;
}

interface GroupedAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  service_ids: string[];
  customers: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  services: Array<{
    name: string;
    duration_minutes: number;
  }>;
  staff: {
    id: string;
    name: string;
  } | null;
  payments: Array<{
    payment_method: string;
    payment_status: string;
    amount: number;
  }>;
}

interface WorkingHour {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_closed: boolean;
}

const Appointments = () => {
  const [businessId, setBusinessId] = useState<string | undefined>();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupedAppointments, setGroupedAppointments] = useState<GroupedAppointment[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<GroupedAppointment | null>(null);
  const [isCalendarView, setIsCalendarView] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    // Business ID'yi localStorage'dan al
    const storedBusinessId = localStorage.getItem('businessId');
    if (storedBusinessId) {
      setBusinessId(storedBusinessId);
    }
  }, []);

  useEffect(() => {
    if (businessId) {
      fetchAppointments();
      fetchWorkingHours();
    }
  }, [businessId, selectedDate, statusFilter]);

  const fetchWorkingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('working_hours')
        .select('*')
        .is('staff_id', null) // Genel işletme çalışma saatleri
        .order('day_of_week');

      if (error) throw error;
      setWorkingHours(data || []);
    } catch (error) {
      console.error('Working hours fetch error:', error);
    }
  };

  const groupAppointments = async (appointments: Appointment[]): Promise<GroupedAppointment[]> => {
    // Her randevu için service_ids'den servis bilgilerini çek
    const groupedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        // service_ids array'inden servis bilgilerini çek
        const { data: services, error } = await supabase
          .from('services')
          .select('name, duration_minutes')
          .in('id', appointment.service_ids);

        if (error) {
          console.error('Service fetch error:', error);
          return null;
        }

        return {
          id: appointment.id,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          status: appointment.status,
          total_price: appointment.total_price,
          notes: appointment.notes,
          service_ids: appointment.service_ids,
          customers: appointment.customers,
          services: services || [], // Servis bilgileri array olarak
          staff: appointment.staff,
          payments: appointment.payments || []
        };
      })
    );

    return groupedAppointments.filter(Boolean) as GroupedAppointment[];
  };

  const fetchAppointments = async () => {
    try {
      // Get business ID first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;

      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers(first_name, last_name, phone),
          staff(id, name),
          payments(payment_method, payment_status, amount)
        `)
        .eq('business_id', business.id) // Business ID filtresi ekle
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
      
      // Group appointments by appointment_group_id
      const grouped = await groupAppointments(data || []);
      setGroupedAppointments(grouped);
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

  const updateAppointmentStatus = async (groupedAppointment: GroupedAppointment, newStatus: string) => {
    try {
      // Update single appointment
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', groupedAppointment.id);

      if (error) throw error;

      // If completing appointment, show payment modal
      if (newStatus === 'completed') {
        setSelectedAppointment(groupedAppointment);
        setShowPaymentModal(true);
      }

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

  const getStatusActions = (groupedAppointment: GroupedAppointment) => {
    const actions = [];
    
    // Düzenle butonu her durumda göster
    actions.push(
      <Button 
        key="edit"
        size="sm" 
        variant="outline"
        onClick={() => {
          setSelectedAppointment(groupedAppointment);
          setShowEditModal(true);
        }}
        className="text-blue-600 hover:text-blue-700"
      >
        Düzenle
      </Button>
    );
    
    if (groupedAppointment.status === 'scheduled') {
      actions.push(
        <Button 
          key="confirm"
          size="sm" 
          variant="outline"
          onClick={() => updateAppointmentStatus(groupedAppointment, 'confirmed')}
        >
          Onayla
        </Button>
      );
    }
    
    if (['scheduled', 'confirmed'].includes(groupedAppointment.status)) {
      actions.push(
        <Button 
          key="complete"
          size="sm" 
          variant="brand"
          onClick={() => updateAppointmentStatus(groupedAppointment, 'completed')}
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
          onClick={() => updateAppointmentStatus(groupedAppointment, 'cancelled')}
        >
          İptal
        </Button>
      );
    }

    // Tamamlanan randevular için düzenleme seçenekleri
    if (groupedAppointment.status === 'completed') {
      actions.push(
        <Button 
          key="revert"
          size="sm" 
          variant="outline"
          onClick={() => updateAppointmentStatus(groupedAppointment, 'confirmed')}
          className="text-blue-600 hover:text-blue-700"
        >
          Tamamlandı İptal Et
        </Button>
      );
      actions.push(
        <Button 
          key="payment"
          size="sm" 
          variant="outline"
          onClick={() => {
            setSelectedAppointment(groupedAppointment);
            setShowPaymentModal(true);
          }}
        >
          Ödemeyi Düzenle
        </Button>
      );
    }

    // İptal edilen randevular için iptali geri alma seçeneği
    if (groupedAppointment.status === 'cancelled') {
      actions.push(
        <Button 
          key="uncancel"
          size="sm" 
          variant="outline"
          onClick={() => updateAppointmentStatus(groupedAppointment, 'scheduled')}
          className="text-green-600 hover:text-green-700"
        >
          İptali Geri Al
        </Button>
      );
    }

    return actions;
  };



  const todayStats = {
    total: groupedAppointments.length,
    confirmed: groupedAppointments.filter(a => a.status === 'confirmed').length,
    completed: groupedAppointments.filter(a => a.status === 'completed').length,
    revenue: groupedAppointments
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
    <SubscriptionGuard businessId={businessId}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <CalendarIcon className="h-8 w-8 text-brand-primary" />
            Randevu Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Randevularınızı {isCalendarView ? 'takvim' : 'liste'} görünümünde yönetin.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Liste Modu</span>
            <Switch 
              checked={isCalendarView}
              onCheckedChange={setIsCalendarView}
            />
            <span className="text-sm text-muted-foreground">Takvim Modu</span>
            <LayoutGrid className="h-4 w-4 text-brand-primary" />
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            variant="brand" 
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Yeni Randevu
          </Button>
        </div>
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

      {/* Calendar View or Appointments List */}
      {isCalendarView ? (
        <CalendarView 
          selectedDate={selectedDate}
          appointments={appointments}
          workingHours={workingHours}
          onStatusUpdate={(appointmentId, status) => {
            const groupedAppointment = groupedAppointments.find(g => g.id === appointmentId);
            if (groupedAppointment) {
              updateAppointmentStatus(groupedAppointment, status);
            }
          }}
        />
      ) : (
        <div className="space-y-4">
          {groupedAppointments.map((groupedAppointment) => (
            <Card key={groupedAppointment.id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {groupedAppointment.start_time.slice(0, 5)} - {groupedAppointment.end_time.slice(0, 5)}
                        </span>
                      </div>
                      {getStatusBadge(groupedAppointment.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {groupedAppointment.customers.first_name} {groupedAppointment.customers.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {groupedAppointment.customers.phone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Scissors className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {groupedAppointment.services.map(service => service.name).join(", ")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {groupedAppointment.services.reduce((total, service) => total + service.duration_minutes, 0)} dakika
                          </div>
                          {groupedAppointment.services.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              {groupedAppointment.services.length} hizmet
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="font-medium">₺{groupedAppointment.total_price}</div>
                        {groupedAppointment.staff ? (
                          <div className="text-sm text-brand-primary font-medium">
                            👤 {groupedAppointment.staff.name}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            👤 Personel atanacak
                          </div>
                        )}
                        {/* Ödeme bilgisi göster */}
                        {groupedAppointment.payments && groupedAppointment.payments.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {groupedAppointment.payments.map(payment => {
                              const paymentLabels = {
                                cash: 'Nakit',
                                card: 'Kart',
                                credit: 'Veresiye'
                              };
                              return paymentLabels[payment.payment_method as keyof typeof paymentLabels] || payment.payment_method;
                            }).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>

                    {groupedAppointment.notes && (
                      <div className="mt-3 text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                        {groupedAppointment.notes}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {getStatusActions(groupedAppointment)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {groupedAppointments.length === 0 && (
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
            <Button 
              onClick={() => setShowCreateModal(true)}
              variant="brand"
            >
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

      {/* Create Appointment Modal */}
      <CreateAppointmentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchAppointments}
      />

      {/* Payment Modal */}
      {selectedAppointment && (
        <PaymentModal
          open={showPaymentModal}
          onOpenChange={setShowPaymentModal}
          appointmentId={selectedAppointment.id} // Use appointment ID for payment
          totalAmount={selectedAppointment.total_price}
          customerName={`${selectedAppointment.customers.first_name} ${selectedAppointment.customers.last_name}`}
          onSuccess={() => {
            fetchAppointments();
            setSelectedAppointment(null);
          }}
        />
      )}

      {/* Edit Appointment Modal */}
      {selectedAppointment && (
        <EditAppointmentModal
          open={showEditModal}
          onOpenChange={setShowEditModal}
          appointmentGroup={selectedAppointment}
          onSuccess={() => {
            fetchAppointments();
            setSelectedAppointment(null);
          }}
        />
      )}
    </div>
    </SubscriptionGuard>
  );
};

export default Appointments;