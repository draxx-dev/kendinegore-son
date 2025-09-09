import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Building, 
  LogOut,
  Shield,
  Mail,
  CreditCard
} from "lucide-react";
import { adminAuthService } from "@/services/adminAuth";

const AdminSidebar = () => {
  const location = useLocation();

  const handleLogout = () => {
    adminAuthService.logout();
    window.location.href = "/admin-e4553757bda6d71e8b0b0306040ece0d/login";
  };

  const menuItems = [
    {
      icon: BarChart3,
      label: "İstatistikler",
      path: "/admin-e4553757bda6d71e8b0b0306040ece0d/dashboard",
      active: location.pathname === "/admin-e4553757bda6d71e8b0b0306040ece0d/dashboard"
    },
    {
      icon: Building,
      label: "İşletmeler",
      path: "/admin-e4553757bda6d71e8b0b0306040ece0d/businesses",
      active: location.pathname.includes("/businesses")
    },
    {
      icon: Mail,
      label: "İletişim Mesajları",
      path: "/admin-e4553757bda6d71e8b0b0306040ece0d/contact",
      active: location.pathname.includes("/contact")
    },
    {
      icon: CreditCard,
      label: "Ödeme Talepleri",
      path: "/admin-e4553757bda6d71e8b0b0306040ece0d/payments",
      active: location.pathname.includes("/payments")
    }
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500">KendineGore</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="mb-4">
          <p className="text-sm text-gray-500">Hoş geldiniz</p>
          <p className="text-sm font-semibold text-gray-900">
            {adminAuthService.getCurrentAdmin()?.username}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="w-full flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Çıkış Yap
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar;
