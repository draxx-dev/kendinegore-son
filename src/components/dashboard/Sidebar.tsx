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
  Menu
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
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  const { toggleSidebar, state } = useSidebar();
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
      ? "text-primary" 
      : "hover:bg-secondary/30";

  return (
    <Sidebar className={collapsed ? "w-20" : "w-80"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-border shadow-sm">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
            {!collapsed && (
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  KendineGöre
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Yönetim Paneli</p>
              </div>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => toggleSidebar()}
              className={`${collapsed ? '' : 'ml-auto'} h-8 w-8 hover:bg-secondary/50`}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup className="flex-1 py-4">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {!collapsed && "Ana Menü"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              {navigationItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/dashboard"}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                        title={collapsed ? item.title : undefined}
                      >
                        <div className={`${collapsed ? 'p-3' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                          <item.icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                        </div>
                        {!collapsed && (
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

        {/* Business Management */}
        <SidebarGroup className="py-4">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {!collapsed && "İşletme Yönetimi"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-4">
              {/* Business Details with Expandable Submenu */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <div 
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer group ${
                      businessItems.some(item => isActive(item.url)) 
                        ? "text-primary" 
                        : "hover:bg-secondary/30"
                    }`}
                    onClick={() => !collapsed && setBusinessExpanded(!businessExpanded)}
                    title={collapsed ? "İşletme Yönetimi" : undefined}
                  >
                    <div className={`${collapsed ? 'p-3' : 'p-2'} rounded-lg transition-colors ${
                      businessItems.some(item => isActive(item.url)) 
                        ? 'text-primary' 
                        : 'bg-secondary group-hover:bg-primary/10'
                    }`}>
                      <Building className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${
                        businessItems.some(item => isActive(item.url)) ? 'text-primary' : ''
                      }`} />
                    </div>
                    {!collapsed && (
                      <>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold truncate block">
                            İşletme Yönetimi
                          </span>
                        </div>
                        <div className="transition-transform duration-200">
                          {businessExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Submenu Items */}
              {(!collapsed && businessExpanded) && (
                <div className="ml-4 space-y-1 border-l-2 border-secondary pl-4">
                  {businessItems.map((item) => {
                    const isActiveRoute = isActive(item.url);
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink 
                            to={item.url} 
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                            title={item.title}
                          >
                            <div className={`p-1.5 rounded-md transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary/50 group-hover:bg-primary/10'}`}>
                              <item.icon className={`h-3.5 w-3.5 flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                            </div>
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
                </div>
              )}

              {/* Collapsed State - Show as Individual Items */}
              {collapsed && businessItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                        title={item.title}
                      >
                        <div className={`${collapsed ? 'p-3' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                          <item.icon className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActiveRoute ? 'text-primary' : ''}`} />
                        </div>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <div className="p-4 border-t border-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <NavLink 
                  to="/dashboard/settings" 
                  className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActive)}`}
                  title={collapsed ? "Ayarlar" : undefined}
                >
                  {({isActive}) => (
                    <>
                      <div className={`${collapsed ? 'p-3' : 'p-2'} rounded-lg transition-colors ${isActive ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
                        <Settings className={`${collapsed ? 'h-5 w-5' : 'h-4 w-4'} flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      </div>
                      {!collapsed && <span className="text-sm font-semibold">Ayarlar</span>}
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