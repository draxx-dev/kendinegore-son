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
  ChevronRight
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useState } from "react";

const navigationItems = [
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
    title: "Personel", 
    url: "/dashboard/staff", 
    icon: UserCheck,
    description: "Personel yönetimi"
  },
  { 
    title: "Ödemeler", 
    url: "/dashboard/payments", 
    icon: CreditCard,
    description: "Finansal takip ve raporlar"
  },
];

const businessItems = [
  { 
    title: "İşletme Detayları", 
    url: "/dashboard/business-details", 
    icon: Building,
    description: "İşletme bilgileri ve portföy"
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
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  const [businessExpanded, setBusinessExpanded] = useState(
    businessItems.some(item => currentPath.startsWith(item.url.split('/*')[0]))
  );

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "bg-brand-primary/10 text-brand-primary font-medium border-r-2 border-brand-primary" 
      : "hover:bg-brand-accent hover:text-brand-primary-dark transition-colors";

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-brand-primary/10">
        {/* Header */}
        <div className="p-4 border-b border-brand-primary/10">
          <div className="flex items-center justify-between">
            {!collapsed && (
              <h2 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                KendineGöre
              </h2>
            )}
            <SidebarTrigger className="ml-auto" />
          </div>
          {!collapsed && (
            <p className="text-sm text-muted-foreground mt-1">Yönetim Paneli</p>
          )}
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!collapsed && "Menü"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/dashboard"}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClassName(isActiveRoute)}`}
                        title={collapsed ? item.title : undefined}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && (
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
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

        {/* Business Management */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {!collapsed && "İşletme Yönetimi"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {/* Business Details with Expandable Submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div 
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                      businessItems.some(item => isActive(item.url)) 
                        ? "bg-brand-primary/10 text-brand-primary font-medium border-r-2 border-brand-primary" 
                        : "hover:bg-brand-accent hover:text-brand-primary-dark"
                    }`}
                    onClick={() => !collapsed && setBusinessExpanded(!businessExpanded)}
                    title={collapsed ? "İşletme Yönetimi" : undefined}
                  >
                    <Building className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            İşletme Yönetimi
                          </span>
                        </div>
                        {businessExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Submenu Items */}
              {(!collapsed && businessExpanded) && businessItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title} className="ml-4">
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClassName(isActiveRoute)}`}
                        title={item.title}
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {item.title}
                          </span>
                          <span className="text-xs text-muted-foreground truncate block">
                            {item.description}
                          </span>
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              {/* Collapsed State - Show as Individual Items */}
              {collapsed && businessItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClassName(isActiveRoute)}`}
                        title={item.title}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <div className="p-4 border-t border-brand-primary/10">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/dashboard/settings" 
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-brand-accent hover:text-brand-primary-dark transition-colors"
                  title={collapsed ? "Ayarlar" : undefined}
                >
                  <Settings className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">Ayarlar</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}