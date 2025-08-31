import { 
  Calendar, 
  Users, 
  CreditCard, 
  Settings,
  Menu,
  User,
  Clock,
  UserCheck,
  BarChart3,
  Home,
  Scissors,
  Building
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
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStaffPermissions } from "@/hooks/useStaffPermissions";

const mainMenuItems = [
  { 
    title: "Genel Bakış", 
    url: "/staff-dashboard", 
    icon: Home,
    description: "Ana özet ve istatistikler",
    permission: "view_appointments"
  },
  { 
    title: "Randevular", 
    url: "/staff-dashboard/appointments", 
    icon: Calendar,
    description: "Randevu yönetimi ve takvim",
    permission: "view_appointments"
  },
  { 
    title: "Müşteriler", 
    url: "/staff-dashboard/customers", 
    icon: Users,
    description: "Müşteri bilgileri ve CRM",
    permission: "view_customers"
  },
  { 
    title: "Ödemeler", 
    url: "/staff-dashboard/payments", 
    icon: CreditCard,
    description: "Finansal takip ve raporlar",
    permission: "view_payments"
  },
];

const businessOperationsItems = [
  { 
    title: "İşletme Detayları", 
    url: "/staff-dashboard/business-details", 
    icon: Building,
    description: "İşletme bilgileri",
    permission: "view_business_settings"
  },
  { 
    title: "Personel", 
    url: "/staff-dashboard/staff", 
    icon: UserCheck,
    description: "Personel yönetimi",
    permission: "manage_staff"
  },
  { 
    title: "Hizmetler", 
    url: "/staff-dashboard/services", 
    icon: Scissors,
    description: "Hizmet tanımları ve fiyatlar",
    permission: "view_services"
  },
  { 
    title: "Çalışma Saatleri", 
    url: "/staff-dashboard/working-hours", 
    icon: Clock,
    description: "Salon açılış kapanış saatleri",
    permission: "view_business_settings"
  },
  { 
    title: "Online Randevu", 
    url: "/staff-dashboard/online-booking", 
    icon: BarChart3,
    description: "Online randevu sayfası ve portföy",
    permission: "view_business_settings"
  },
  { 
    title: "Raporlar", 
    url: "/staff-dashboard/reports", 
    icon: BarChart3,
    description: "İstatistikler ve raporlar",
    permission: "view_reports"
  },
];

interface StaffSidebarProps {
  staffName: string;
  businessName: string;
}

export function StaffSidebar({ staffName, businessName }: StaffSidebarProps) {
  const { toggleSidebar, state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const isMobileDevice = useIsMobile();
  const { hasPermission } = useStaffPermissions();

  const isActive = (path: string) => {
    if (path === "/staff-dashboard") {
      return currentPath === "/staff-dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (isActiveRoute: boolean, hasAccess: boolean = true) => {
    if (!hasAccess) {
      return "opacity-50 cursor-not-allowed";
    }
    return isActiveRoute 
      ? "text-primary" 
      : "hover:bg-secondary/30";
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
                <p className="text-sm text-muted-foreground mt-1">Personel Paneli</p>
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

        {/* Personel Bilgi */}
        {(!collapsed || isMobileDevice) && (
          <div className="px-3 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-brand-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {staffName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {businessName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ana Menü Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {(!collapsed || isMobileDevice) && "Ana Menü"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-1">
              {mainMenuItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                const hasAccess = hasPermission(item.permission);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={hasAccess ? item.url : "#"} 
                         end={item.url === "/staff-dashboard"}
                         className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute, hasAccess)}`}
                         title={(collapsed && !isMobileDevice) ? item.title : undefined}
                         onClick={!hasAccess ? (e) => e.preventDefault() : undefined}
                       >
                        <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute && hasAccess ? 'text-primary' : hasAccess ? 'bg-secondary group-hover:bg-primary/10' : 'bg-secondary/50'}`}>
                          <item.icon className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute && hasAccess ? 'text-primary' : ''}`} />
                        </div>
                        {(!collapsed || isMobileDevice) && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {hasAccess ? item.description : "Yetki gerekli"}
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
              {businessOperationsItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                const hasAccess = hasPermission(item.permission);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={hasAccess ? item.url : "#"} 
                         className={`flex items-center ${collapsed && !isMobileDevice ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute, hasAccess)}`}
                         title={(collapsed && !isMobileDevice) ? item.title : undefined}
                         onClick={!hasAccess ? (e) => e.preventDefault() : undefined}
                       >
                        <div className={`${collapsed && !isMobileDevice ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute && hasAccess ? 'text-primary' : hasAccess ? 'bg-secondary group-hover:bg-primary/10' : 'bg-secondary/50'}`}>
                          <item.icon className={`${collapsed && !isMobileDevice ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute && hasAccess ? 'text-primary' : ''}`} />
                        </div>
                        {(!collapsed || isMobileDevice) && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-semibold truncate block">
                              {item.title}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {hasAccess ? item.description : "Yetki gerekli"}
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

        {/* Settings */}
        <div className="px-3 border-t border-border pt-1 mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                 <NavLink 
                   to="/staff-dashboard/settings" 
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