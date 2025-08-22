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
import { format, addDays, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

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

const PublicBooking = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [portfolioImages, setPortfolioImages] = useState<PortfolioImage[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHours[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0); // 0 = Landing page, 1-5 = Booking steps
  
  // Form data
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [customerInfo, setCustomerInfo] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: ""
  });

  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [occupiedTimeSlots, setOccupiedTimeSlots] = useState<string[]>([]);

  useEffect(() => {
    if (slug) {
      fetchBusinessData(slug);
    }
  }, [slug]);

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
      console.error('İşletme bilgileri yüklenirken hata:', error);
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
      console.error('Portfolio resimleri yüklenirken hata:', error);
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
        console.error('Randevu kontrol hatası:', error);
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

    try {
      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          business_id: business.id,
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          phone: customerInfo.phone,
          email: customerInfo.email,
          notes: customerInfo.notes
        })
        .select()
        .single();

      if (customerError) throw customerError;

      // Create appointment group
      const appointmentGroupId = crypto.randomUUID();

      // Calculate total price and duration
      const selectedServiceData = services.filter(s => selectedServices.includes(s.id));
      const totalPrice = selectedServiceData.reduce((sum, service) => sum + service.price, 0);
      const totalDuration = selectedServiceData.reduce((sum, service) => sum + service.duration_minutes, 0);

      // Calculate end time
      const [startHour, startMinute] = selectedTime.split(':').map(Number);
      const endTime = new Date();
      endTime.setHours(startHour, startMinute + totalDuration, 0, 0);
      const endTimeStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;

      // Determine staff assignment
      let finalStaffId = selectedStaff;
      
      if (!selectedStaff && staff.length > 0) {
        // If no staff selected, assign randomly from available staff
        const randomIndex = Math.floor(Math.random() * staff.length);
        finalStaffId = staff[randomIndex].id;
      }

      // Create appointments for each service
      const appointments = selectedServiceData.map(service => ({
        business_id: business.id,
        customer_id: customer.id,
        service_id: service.id,
        staff_id: finalStaffId || null,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime,
        end_time: endTimeStr,
        total_price: service.price,
        appointment_group_id: appointmentGroupId,
        notes: customerInfo.notes,
        status: 'scheduled'
      }));

      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointments);

      if (appointmentError) throw appointmentError;

      toast({
        title: "Başarılı!",
        description: "Randevunuz başarıyla oluşturuldu. En kısa sürede size dönüş yapılacak.",
      });

      setStep(6); // Success step

    } catch (error) {
      console.error('Randevu oluşturma hatası:', error);
      toast({
        title: "Hata",
        description: "Randevu oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5">
      {step === 0 ? (
        // Professional Landing Page
        <div>
          {/* Hero Section */}
          <div className="bg-white border-b">
            <div className="container mx-auto px-4 py-12">
              <div className="text-center max-w-4xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-6">
                  <Building className="h-12 w-12 text-brand-primary" />
                  <h1 className="text-4xl md:text-5xl font-bold text-foreground">{business.name}</h1>
                </div>
                {business.description && (
                  <p className="text-muted-foreground text-xl mb-8 leading-relaxed">{business.description}</p>
                )}
                <Button 
                  onClick={() => setStep(1)} 
                  variant="brand" 
                  size="lg"
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Randevu Al
                </Button>
              </div>
            </div>
          </div>

          <div className="container mx-auto px-4 py-12">
            <div className="max-w-6xl mx-auto space-y-12">
              
              {/* Business Information */}
              <Card className="bg-white shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">İletişim Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {business.phone && (
                      <div className="flex items-center gap-3 p-4 bg-brand-primary/5 rounded-lg">
                        <Phone className="h-6 w-6 text-brand-primary" />
                        <div>
                          <h3 className="font-semibold">Telefon</h3>
                          <p className="text-muted-foreground">{business.phone}</p>
                        </div>
                      </div>
                    )}
                    {business.email && (
                      <div className="flex items-center gap-3 p-4 bg-brand-primary/5 rounded-lg">
                        <Mail className="h-6 w-6 text-brand-primary" />
                        <div>
                          <h3 className="font-semibold">E-posta</h3>
                          <p className="text-muted-foreground">{business.email}</p>
                        </div>
                      </div>
                    )}
                    {business.address && (
                      <div className="flex items-center gap-3 p-4 bg-brand-primary/5 rounded-lg">
                        <MapPin className="h-6 w-6 text-brand-primary" />
                        <div>
                          <h3 className="font-semibold">Adres</h3>
                          <p className="text-muted-foreground">
                            {business.address}
                            {business.city && `, ${business.city}`}
                            {business.district && `, ${business.district}`}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Section */}
              {portfolioImages.length > 0 && (
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <ImageIcon className="h-6 w-6 text-brand-primary" />
                      Çalışmalarımız
                    </CardTitle>
                    <CardDescription>
                      Kaliteli hizmetimizin örneklerini keşfedin
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {portfolioImages.slice(0, 8).map((image) => (
                        <div key={image.id} className="group">
                          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-all duration-300">
                            <img 
                              src={image.url} 
                              alt={image.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400";
                              }}
                            />
                          </div>
                          <h3 className="mt-3 font-medium text-center capitalize">{image.title}</h3>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services Section */}
              {services.length > 0 && (
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Star className="h-6 w-6 text-brand-primary" />
                      Hizmetlerimiz
                    </CardTitle>
                    <CardDescription>
                      Size özel profesyonel hizmetler sunuyoruz
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {services.map((service) => (
                        <div key={service.id} className="p-6 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-xl border border-brand-primary/10">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <Badge variant="secondary" className="text-lg font-bold">₺{service.price}</Badge>
                          </div>
                          {service.description && (
                            <p className="text-muted-foreground mb-3 text-sm leading-relaxed">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {service.duration_minutes} dakika
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Staff Section */}
              {staff.length > 0 && (
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Users className="h-6 w-6 text-brand-primary" />
                      Uzman Ekibimiz
                    </CardTitle>
                    <CardDescription>
                      Deneyimli ve profesyonel kadromuz
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {staff.map((member) => (
                        <div key={member.id} className="text-center p-6 bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 rounded-xl border border-brand-primary/10">
                          <User className="h-16 w-16 text-brand-primary mx-auto mb-4" />
                          <h3 className="font-semibold text-lg mb-2">{member.name}</h3>
                          {member.specialties && member.specialties.length > 0 && (
                            <p className="text-muted-foreground text-sm">
                              Uzmanlık: {member.specialties.join(', ')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Call to Action */}
              <div className="text-center py-12">
                <h2 className="text-3xl font-bold mb-4">Hemen Randevu Alın</h2>
                <p className="text-muted-foreground text-lg mb-8">Profesyonel hizmetimizden yararlanmak için randevunuzu oluşturun</p>
                <Button 
                  onClick={() => setStep(1)} 
                  variant="brand" 
                  size="lg"
                  className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CalendarIcon className="h-5 w-5 mr-2" />
                  Randevu Al
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Booking Steps
        <div className="container mx-auto px-4 py-8">
          {/* Back to main page button */}
          <div className="mb-6">
            <Button 
              onClick={() => setStep(0)} 
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Ana Sayfaya Dön
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
                <Building className="h-6 w-6 text-brand-primary" />
                {business.name} - Randevu Al
              </h1>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
          {step === 6 ? (
            // Success Step
            <Card className="text-center">
              <CardContent className="py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">Randevunuz Alındı!</h2>
                <p className="text-muted-foreground mb-6">
                  Randevu talebiniz başarıyla iletildi. İşletme en kısa sürede size dönüş yapacak.
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold mb-2">Randevu Detayları:</h3>
                  <p><strong>Tarih:</strong> {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: tr })}</p>
                  <p><strong>Saat:</strong> {selectedTime}</p>
                  <p><strong>Hizmetler:</strong> {services.filter(s => selectedServices.includes(s.id)).map(s => s.name).join(', ')}</p>
                  <p><strong>Toplam Ücret:</strong> ₺{getTotalPrice().toLocaleString('tr-TR')}</p>
                </div>
                <Button onClick={() => navigate('/')} variant="brand">
                  Ana Sayfaya Dön
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                 {/* Step 1: Service Selection */}
                {step === 1 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Hizmet Seçimi</CardTitle>
                      <CardDescription>
                        Almak istediğiniz hizmetleri seçin (birden fazla seçim yapabilirsiniz)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <h3 className="font-semibold">{service.name}</h3>
                                <Badge variant="secondary">₺{service.price}</Badge>
                              </div>
                              {service.description && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {service.duration_minutes} dakika
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      <div className="flex justify-end mt-6">
                        <Button 
                          onClick={() => setStep(2)} 
                          disabled={selectedServices.length === 0}
                          variant="brand"
                        >
                          Devam Et
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Staff Selection */}
                {step === 2 && staff.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Personel Seçimi</CardTitle>
                      <CardDescription>
                        Hizmet almak istediğiniz personeli seçin (opsiyonel)
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* Fark etmez seçeneği */}
                        <Card 
                          className={cn(
                            "cursor-pointer transition-all hover:shadow-md",
                            selectedStaff === "" 
                              ? "ring-2 ring-brand-primary bg-brand-primary/5" 
                              : ""
                          )}
                          onClick={() => setSelectedStaff("")}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Users className="h-6 w-6 text-brand-primary mt-1" />
                              <div>
                                <h3 className="font-semibold">Fark Etmez</h3>
                                <p className="text-sm text-muted-foreground">
                                  Müsait olan personel otomatik atanacak
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Personel listesi */}
                        {staff.map((member) => (
                          <Card 
                            key={member.id}
                            className={cn(
                              "cursor-pointer transition-all hover:shadow-md",
                              selectedStaff === member.id 
                                ? "ring-2 ring-brand-primary bg-brand-primary/5" 
                                : ""
                            )}
                            onClick={() => setSelectedStaff(member.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <User className="h-6 w-6 text-brand-primary mt-1" />
                                <div>
                                  <h3 className="font-semibold">{member.name}</h3>
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
                      
                      <div className="flex justify-between">
                        <Button onClick={() => setStep(1)} variant="outline">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Geri
                        </Button>
                        <Button 
                          onClick={() => setStep(staff.length > 0 ? 3 : 2)} 
                          variant="brand"
                        >
                          Devam Et
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Date Selection */}
                {step === 3 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Tarih Seçimi</CardTitle>
                      <CardDescription>
                        Randevu almak istediğiniz tarihi seçin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-center">
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
                      <div className="flex justify-between mt-6">
                        <Button onClick={() => setStep(staff.length > 0 ? 2 : 1)} variant="outline">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Geri
                        </Button>
                        <Button 
                          onClick={() => setStep(4)} 
                          disabled={!selectedDate}
                          variant="brand"
                        >
                          Devam Et
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Time Selection */}
                {step === 4 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Saat Seçimi</CardTitle>
                      <CardDescription>
                        {selectedDate && format(selectedDate, 'dd MMMM yyyy', { locale: tr })} için uygun saatleri seçin
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       {availableTimeSlots.length > 0 ? (
                         <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                           {availableTimeSlots.map((time) => {
                             const isOccupied = occupiedTimeSlots.includes(time);
                             return (
                               <Button
                                 key={time}
                                 variant={selectedTime === time ? "brand" : isOccupied ? "destructive" : "outline"}
                                 onClick={() => !isOccupied && setSelectedTime(time)}
                                 disabled={isOccupied}
                                 className={cn(
                                   "w-full relative",
                                   isOccupied && "cursor-not-allowed opacity-60"
                                 )}
                               >
                                 {time}
                                 {isOccupied && (
                                   <span className="ml-1 text-xs">DOLU</span>
                                 )}
                               </Button>
                             );
                           })}
                         </div>
                       ) : (
                         <div className="text-center py-8">
                           <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                           <p className="text-muted-foreground mb-2">Bu tarih için uygun saat bulunmuyor.</p>
                           {selectedStaff && selectedStaff !== "" && (
                             <p className="text-sm text-muted-foreground">
                               Seçilen personelin bu tarihte müsait saati bulunmuyor.
                             </p>
                           )}
                         </div>
                       )}
                      <div className="flex justify-between mt-6">
                        <Button onClick={() => setStep(3)} variant="outline">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Geri
                        </Button>
                        <Button 
                          onClick={() => setStep(5)} 
                          disabled={!selectedTime}
                          variant="brand"
                        >
                          Devam Et
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 5: Customer Information */}
                {step === 5 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>İletişim Bilgileri</CardTitle>
                      <CardDescription>
                        Randevu onayı için iletişim bilgilerinizi girin
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                        <Input
                          id="phone"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="0555 123 45 67"
                          required
                        />
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
                      <div className="flex justify-between">
                        <Button onClick={() => setStep(4)} variant="outline">
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Geri
                        </Button>
                        <Button 
                          onClick={handleBookingSubmit}
                          disabled={!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone}
                          variant="brand"
                        >
                          Randevu Al
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Step Indicator */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Randevu Süreci</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="space-y-3">
                       {[
                         { step: 1, title: "Hizmet Seçimi", icon: Star },
                         { step: 2, title: "Personel Seçimi", icon: User },
                         { step: 3, title: "Tarih Seçimi", icon: CalendarIcon },
                         { step: 4, title: "Saat Seçimi", icon: Clock },
                         { step: 5, title: "İletişim Bilgileri", icon: Phone },
                       ].map(({ step: stepNum, title, icon: Icon }) => (
                         <div 
                           key={stepNum}
                           className={cn(
                             "flex items-center gap-3 p-2 rounded-lg",
                             step === stepNum ? "bg-brand-primary/10 text-brand-primary" : 
                             step > stepNum ? "text-green-600" : "text-muted-foreground"
                           )}
                         >
                           <Icon className="h-4 w-4" />
                           <span className="text-sm font-medium">{title}</span>
                           {step > stepNum && <CheckCircle className="h-4 w-4 ml-auto" />}
                         </div>
                       ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Booking Summary */}
                {(selectedServices.length > 0 || selectedDate || selectedTime) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Randevu Özeti</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedServices.length > 0 && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-2">Seçilen Hizmetler:</h4>
                          {services
                            .filter(service => selectedServices.includes(service.id))
                            .map(service => (
                              <div key={service.id} className="flex justify-between text-sm">
                                <span>{service.name}</span>
                                <span>₺{service.price}</span>
                              </div>
                            ))
                          }
                        </div>
                      )}
                      
                      {selectedDate && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Tarih:</h4>
                          <p className="text-sm">{format(selectedDate, 'dd MMMM yyyy', { locale: tr })}</p>
                        </div>
                      )}
                      
                      {selectedTime && (
                        <div>
                          <h4 className="font-medium text-sm text-muted-foreground mb-1">Saat:</h4>
                          <p className="text-sm">{selectedTime}</p>
                        </div>
                      )}
                      
                      {selectedServices.length > 0 && (
                        <>
                          <div className="border-t pt-3">
                            <div className="flex justify-between text-sm">
                              <span>Toplam Süre:</span>
                              <span>{getTotalDuration()} dakika</span>
                            </div>
                            <div className="flex justify-between font-semibold">
                              <span>Toplam Ücret:</span>
                              <span>₺{getTotalPrice().toLocaleString('tr-TR')}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicBooking;