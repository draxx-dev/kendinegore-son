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
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-white border-r border-border shadow-sm">
        {/* Header */}
        <div className={`${collapsed ? 'py-2 px-1' : 'py-[18px] px-3'} border-b border-border h-[4rem] flex items-center mb-px`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} w-full`}>
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
              className={`h-8 w-8 hover:bg-secondary/50 ${collapsed ? '' : 'flex-shrink-0'}`}
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
            <SidebarMenu className="space-y-2 px-1">
              {navigationItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         end={item.url === "/dashboard"}
                         className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-3 rounded-xl transition-all duration-300 group ${getNavClassName(isActiveRoute)}`}
                         title={collapsed ? item.title : undefined}
                       >
                        <div className={`${collapsed ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActiveRoute ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
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

        {/* Settings */}
        <div className="px-3 border-t border-border pt-1">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                 <NavLink 
                   to="/dashboard/settings" 
                   className={({isActive}) => `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-xl transition-all duration-300 group ${getNavClassName(isActive)}`}
                   title={collapsed ? "Ayarlar" : undefined}
                 >
                  {({isActive}) => (
                    <>
                      <div className={`${collapsed ? 'p-0' : 'p-2'} rounded-lg transition-colors ${isActive ? 'text-primary' : 'bg-secondary group-hover:bg-primary/10'}`}>
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