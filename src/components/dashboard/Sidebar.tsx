import { 
  Calendar, 
  Users, 
  CreditCard, 
  Clock, 
  UserCheck, 
  BarChart3,
  Home,
  Scissors,
  Settings,
  Building,
  ChevronDown,
  ChevronRight,
  Menu,
  MessageSquare,
  MessageCircle,
  Shield,
  CreditCard as PaymentIcon,
  HelpCircle,
  Mail
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const mainMenuItems = [
  { 
    title: "Genel Bakış", 
    url: "/dashboard", 
    icon: Home,
    description: "Ana özet ve istatistikler"
  },
  { 
    title: "Randevular", 
    url: "/dashboard/appointments", 
    icon: Calendar,
    description: "Randevu yönetimi ve takvim"
  },
  { 
    title: "Müşteriler", 
    url: "/dashboard/customers", 
    icon: Users,
    description: "Müşteri bilgileri ve CRM"
  },
  { 
    title: "Ödemeler", 
    url: "/dashboard/payments", 
    icon: CreditCard,
    description: "Finansal takip ve raporlar"
  },
];

const businessOperationsItems = [
  { 
    title: "İşletme Detayları", 
    url: "/dashboard/business-details", 
    icon: Building,
    description: "İşletme bilgileri"
  },
  { 
    title: "Personel", 
    url: "/dashboard/staff", 
    icon: UserCheck,
    description: "Personel yönetimi"
  },
  { 
    title: "Hizmetler", 
    url: "/dashboard/services", 
    icon: Scissors,
    description: "Hizmet tanımları ve fiyatlar"
  },
  { 
    title: "Çalışma Saatleri", 
    url: "/dashboard/working-hours", 
    icon: Clock,
    description: "Salon açılış kapanış saatleri"
  },
  { 
    title: "Online Randevu", 
    url: "/dashboard/online-booking", 
    icon: BarChart3,
    description: "Online randevu sayfası ve portföy"
  },
];

const integrationsItems = [
  { 
    title: "SMS Entegrasyonu", 
    url: "/dashboard/sms-integration", 
    icon: MessageSquare,
    description: "NetGSM SMS ayarları ve istatistikleri"
  },
  { 
    title: "WhatsApp AI Asistan", 
    url: "/dashboard/whatsapp-ai", 
    icon: MessageCircle,
    description: "AI destekli otomatik randevu sistemi"
  },
];

const systemManagementItems = [
  { 
    title: "Sistem Ödemeleri", 
    url: "/dashboard/system-payments", 
    icon: PaymentIcon,
    description: "Abonelik ve sistem ödemeleri"
  },
  { 
    title: "Neler Olacak", 
    url: "/dashboard/roadmap", 
    icon: HelpCircle,
    description: "Gelecek özellikler ve güncellemeler"
  },
  { 
    title: "Bize Ulaş", 
    url: "/dashboard/contact", 
    icon: Mail,
    description: "Destek ve iletişim"
  },
];

export function DashboardSidebar() {
  const { toggleSidebar, state, isMobile } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isMobileDevice = useIsMobile();
  
  // Abonelik durumu kontrolü - business ID'yi localStorage'dan al
  const [businessId, setBusinessId] = useState<string | undefined>();
  const { hasAccess, loading: subscriptionLoading } = useSubscriptionStatus(businessId);

  useEffect(() => {
    // Business ID'yi localStorage'dan al
    const storedBusinessId = localStorage.getItem('businessId');
    if (storedBusinessId) {
      setBusinessId(storedBusinessId);
    }
  }, []);

  // Business ID yüklenene kadar loading göster
  if (!businessId) {
    return (
      <Sidebar 
        className={
          isMobileDevice 
            ? "w-72" 
            : collapsed 
              ? "w-16" 
              : "w-64"
        } 
        collapsible={isMobileDevice ? "offcanvas" : "icon"}
      >
        <SidebarContent className="bg-white border-r border-border shadow-sm">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "text-primary" 
      : "hover:bg-secondary/30";

  // Abonelik süresi bitmişse sadece belirli sayfalar erişilebilir
  const getAccessibleMainItems = () => {
    if (hasAccess || subscriptionLoading) {
      return mainMenuItems;
    }
    // Süre bitmişse sadece ayarlar ve sistem ödemeleri erişilebilir
    return [];
  };

  const getAccessibleIntegrationItems = () => {
    if (hasAccess || subscriptionLoading) {
      return integrationsItems;
    }
    // Süre bitmişse entegrasyonlar erişilemez
    return [];
  };

  const getAccessibleBusinessItems = () => {
    if (hasAccess || subscriptionLoading) {
      return businessOperationsItems;
    }
    // Süre bitmişse sadece ayarlar erişilebilir
    return businessOperationsItems.filter(item => item.url === "/dashboard/business-details");
  };

  const getAccessibleSystemItems = () => {
    // Sistem yönetimi her zaman erişilebilir
    return systemManagementItems;
  };

  return (
    <Sidebar 
      className={
        isMobileDevice 
          ? "w-72" 
          : collapsed 
            ? "w-16" 
            : "w-64"
      } 
      collapsible={isMobileDevice ? "offcanvas" : "icon"}
    >
      <SidebarContent className="bg-white border-r border-border shadow-sm">
        {/* Header */}
        <div className={`${collapsed && !isMobileDevice ? 'py-2 px-1 border-b border-border translate-y-[1px]' : 'py-[32px] px-3 border-b border-border'} h-[4rem] flex items-center mb-px`}>
          <div className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center' : 'justify-between'} w-full`}>
            {(!collapsed || isMobileDevice) && (
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  KendineGöre
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Yönetim Paneli</p>
              </div>
            )}
            {!isMobileDevice && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => toggleSidebar()}
                className={`h-8 w-8 hover:bg-secondary/50 ${collapsed ? '' : 'flex-shrink-0'}`}
              >
                <Menu className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Ana Menü Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {(!collapsed || isMobileDevice) && "Ana Menü"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-1">
              {getAccessibleMainItems().map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         end={item.url === "/dashboard"}
                         className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                         title={(collapsed && !isMobileDevice) ? item.title : undefined}
                       >
                        <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                          <item.icon className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                        </div>
                        {(!collapsed || isMobileDevice) && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* İşletme İşlemleri Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {(!collapsed || isMobileDevice) && "İşletme İşlemleri"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-1">
              {getAccessibleBusinessItems().map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                         title={(collapsed && !isMobileDevice) ? item.title : undefined}
                       >
                        <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                          <item.icon className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                        </div>
                        {(!collapsed || isMobileDevice) && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Entegrasyonlar Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {(!collapsed || isMobileDevice) && "Entegrasyonlar"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-1">
              {getAccessibleIntegrationItems().map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                         title={(collapsed && !isMobileDevice) ? item.title : undefined}
                       >
                        <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                          <item.icon className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                        </div>
                        {(!collapsed || isMobileDevice) && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sistem Yönetimi Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {(!collapsed || isMobileDevice) && "Sistem Yönetimi"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-1">
              {getAccessibleSystemItems().map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                         title={(collapsed && !isMobileDevice) ? item.title : undefined}
                       >
                        <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                          <item.icon className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                        </div>
                        {(!collapsed || isMobileDevice) && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {item.description}
                            </span>
                          </div>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Abonelik Süresi Uyarısı */}
        {!hasAccess && !subscriptionLoading && (
          <div className="px-3 py-2">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-semibold">Abonelik Süresi Dolmuş</span>
              </div>
              <p className="text-xs text-red-600 mt-1">
                Paket almak için Sistem Ödemeleri'ne gidin
              </p>
            </div>
          </div>
        )}

        {/* Settings */}
        <div className="px-3 border-t border-border pt-1 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                 <NavLink 
                   to="/dashboard/settings" 
                   className={({isActive}) => `flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-xl transition-all duration-300 group ${getNavClassName(isActive)}`}
                   title={(collapsed && !isMobileDevice) ? "Ayarlar" : undefined}
                 >
                  {({isActive}) => (
                    <>
                      <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActive ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                        <Settings className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      </div>
                      {(!collapsed || isMobileDevice) && <span className="text-sm font-semibold">Ayarlar</span>}
                    </>
                  )}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}