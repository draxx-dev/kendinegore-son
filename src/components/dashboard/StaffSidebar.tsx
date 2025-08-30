import { 
  Calendar, 
  Users, 
  CreditCard, 
  Settings,
  Menu,
  User
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

const staffMenuItems = [
  { 
    title: "Randevularım", 
    url: "/staff-dashboard", 
    icon: Calendar,
    description: "Bugünkü randevularım"
  },
  { 
    title: "Müşteriler", 
    url: "/staff-dashboard/customers", 
    icon: Users,
    description: "Müşteri bilgileri"
  },
  { 
    title: "Ödemeler", 
    url: "/staff-dashboard/payments", 
    icon: CreditCard,
    description: "Ödeme işlemleri"
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

  const isActive = (path: string) => {
    if (path === "/staff-dashboard") {
      return currentPath === "/staff-dashboard";
    }
    return currentPath.startsWith(path);
  };

  const getNavClassName = (isActiveRoute: boolean) =>
    isActiveRoute 
      ? "text-primary" 
      : "hover:bg-secondary/30";

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

        {/* Personel Menü Navigation */}
        <SidebarGroup className="py-2">
          <SidebarGroupLabel className="px-6 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {(!collapsed || isMobileDevice) && "Menü"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2 px-1">
              {staffMenuItems.map((item) => {
                const isActiveRoute = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                       <NavLink 
                         to={item.url} 
                         end={item.url === "/staff-dashboard"}
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