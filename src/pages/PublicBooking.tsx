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
  owner_id: string;
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
  
  // Portfolio pagination
  const [portfolioPage, setPortfolioPage] = useState(0);
  const imagesPerPage = 4;
  const totalPages = Math.ceil(portfolioImages.length / imagesPerPage);
  
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
    <div className="min-h-screen bg-gradient-to-br from-brand-primary/5 to-brand-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step === 0 ? (
          // Main Business Card
          <Card className="bg-white shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-primary to-brand-secondary text-white p-6">
              <h1 className="text-xl font-bold text-center mb-4">{business.name}</h1>
              <div className="space-y-2 text-sm">
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{business.phone}</span>
                  </div>
                )}
                {business.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">
                      {business.address}
                      {business.city && `, ${business.city}`}
                      {business.district && `, ${business.district}`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Portfolio Section */}
            <div className="p-6">
              <h2 className="text-lg font-semibold text-center mb-4">Portföy</h2>
              {portfolioImages.length > 0 ? (
                <div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {portfolioImages
                      .slice(portfolioPage * imagesPerPage, (portfolioPage + 1) * imagesPerPage)
                      .map((image) => (
                        <div
                          key={image.id}
                          className="aspect-square bg-muted rounded-lg overflow-hidden border-2 border-muted"
                        >
                          <img
                            src={image.url}
                            alt={image.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mb-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPortfolioPage(Math.max(0, portfolioPage - 1))}
                        disabled={portfolioPage === 0}
                      >
                        ←
                      </Button>
                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              i === portfolioPage ? "bg-brand-primary" : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPortfolioPage(Math.min(totalPages - 1, portfolioPage + 1))}
                        disabled={portfolioPage === totalPages - 1}
                      >
                        →
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-muted rounded-lg border-2 border-muted flex items-center justify-center"
                    >
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 pt-0">
              <Button 
                onClick={() => setStep(1)} 
                className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white font-semibold py-3"
                size="lg"
              >
                <CalendarIcon className="h-5 w-5 mr-2" />
                Randevu Al
              </Button>
            </div>
          </Card>
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
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleBookingSubmit}
                        disabled={!customerInfo.firstName || !customerInfo.lastName || !customerInfo.phone}
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
    </div>
  );
};

export default PublicBooking;