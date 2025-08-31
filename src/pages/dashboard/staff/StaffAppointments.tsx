import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar as CalendarIcon, Plus, Clock, User, Scissors, Filter, LayoutGrid, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateAppointmentModal } from "@/components/appointments/CreateAppointmentModal";
import { EditAppointmentModal } from "@/components/appointments/EditAppointmentModal";
import { PaymentModal } from "@/components/appointments/PaymentModal";
import CalendarView from "@/components/appointments/CalendarView";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { PermissionGuard } from "@/components/PermissionGuard";

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  total_price: number;
  notes: string | null;
  appointment_group_id: string;
  customers: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
  };
  services: {
    name: string;
    duration_minutes: number;
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
  appointment_group_id: string;
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
    email?: string;
  };
  services: Array<{
    name: string;
    duration_minutes: number;
  }>;
  staff: {
    id: string;
    name: string;
  } | null;
  appointment_ids: string[];
  payments: Array<{
    payment_method: string;
    payment_status: string;
    amount: number;
  }>;
}

const StaffAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [groupedAppointments, setGroupedAppointments] = useState<GroupedAppointment[]>([]);
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
    fetchAppointments();
  }, [selectedDate, statusFilter]);

  const groupAppointments = (appointments: Appointment[]): GroupedAppointment[] => {
    const groupMap = new Map<string, GroupedAppointment>();
    
    appointments.forEach(appointment => {
      const groupId = appointment.appointment_group_id;
      
      if (groupMap.has(groupId)) {
        const existing = groupMap.get(groupId)!;
        existing.services.push(appointment.services);
        existing.appointment_ids.push(appointment.id);
        if (appointment.payments) {
          existing.payments.push(...appointment.payments);
        }
      } else {
        groupMap.set(groupId, {
          appointment_group_id: groupId,
          appointment_date: appointment.appointment_date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          status: appointment.status,
          total_price: appointment.total_price,
          notes: appointment.notes,
          customers: appointment.customers,
          services: [appointment.services],
          staff: appointment.staff,
          appointment_ids: [appointment.id],
          payments: appointment.payments || []
        });
      }
    });
    
    return Array.from(groupMap.values());
  };

  const fetchAppointments = async () => {
    try {
      const staffSession = localStorage.getItem('staff_session');
      if (!staffSession) return;

      const session = JSON.parse(staffSession);
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          customers(first_name, last_name, phone, email),
          services(name, duration_minutes),
          staff(id, name),
          payments(payment_method, payment_status, amount)
        `)
        .eq('business_id', session.staff.business_id)
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
      
      const grouped = groupAppointments(data || []);
      setGroupedAppointments(grouped);
    } catch (error) {
      console.error('Error fetching appointments:', error);
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
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .in('id', groupedAppointment.appointment_ids);

      if (error) throw error;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  return (
    <PermissionGuard permission="view_appointments">
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
            onStatusUpdate={(groupId, status) => {
              const groupedAppointment = groupedAppointments.find(g => g.appointment_group_id === groupId);
              if (groupedAppointment) {
                updateAppointmentStatus(groupedAppointment, status);
              }
            }}
          />
        ) : (
          <div className="space-y-4">
            {groupedAppointments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {selectedDate === new Date().toISOString().split('T')[0] 
                      ? "Bugün için randevu kaydı bulunmuyor." 
                      : "Seçilen tarih için randevu kaydı bulunmuyor."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              groupedAppointments.map((groupedAppointment) => (
                <Card key={groupedAppointment.appointment_group_id} className="bg-white/50 backdrop-blur-sm border-brand-primary/10 hover:shadow-soft transition-all duration-300">
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
                          </div>
                        </div>

                        {groupedAppointment.notes && (
                          <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                            <p className="text-sm text-muted-foreground">
                              <strong>Notlar:</strong> {groupedAppointment.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                        {getStatusActions(groupedAppointment)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Modals */}
        <CreateAppointmentModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={fetchAppointments}
        />

        {selectedAppointment && (
          <>
            <EditAppointmentModal
              open={showEditModal}
              onOpenChange={setShowEditModal}
              appointmentGroup={selectedAppointment}
              onSuccess={fetchAppointments}
            />

            <PaymentModal
              open={showPaymentModal}
              onOpenChange={setShowPaymentModal}
              appointmentId={selectedAppointment.appointment_ids[0]}
              totalAmount={selectedAppointment.total_price}
              customerName={`${selectedAppointment.customers.first_name} ${selectedAppointment.customers.last_name}`}
              onSuccess={fetchAppointments}
            />
          </>
        )}
      </div>
    </PermissionGuard>
  );
};

export default StaffAppointments;