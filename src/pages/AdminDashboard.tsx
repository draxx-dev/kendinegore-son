import { useEffect } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { adminAuthService } from "@/services/adminAuth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminStats from "./admin/AdminStats";
import AdminBusinesses from "./admin/AdminBusinesses";
import AdminContact from "./admin/AdminContact";
import AdminPayments from "./admin/AdminPayments";
import { Shield, BarChart3, Building, Mail } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Admin session kontrolü
    if (!adminAuthService.isAdmin()) {
      navigate("/admin-e4553757bda6d71e8b0b0306040ece0d/login");
      return;
    }
  }, [navigate]);

  const WelcomePage = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Shield className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hoş Geldiniz!
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          KendineGore Admin Paneline hoş geldiniz
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/admin-e4553757bda6d71e8b0b0306040ece0d/dashboard")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              İstatistikler
            </CardTitle>
            <CardDescription>
              Sistem genel bakış ve performans metrikleri
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Toplam işletme, müşteri, randevu ve gelir istatistiklerini görüntüleyin.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/admin-e4553757bda6d71e8b0b0306040ece0d/businesses")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Building className="h-6 w-6 text-green-600" />
              </div>
              İşletmeler
            </CardTitle>
            <CardDescription>
              Kayıtlı işletmeleri görüntüleyin ve yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Tüm işletmeleri listeleyin, arayın ve detaylarını görüntüleyin.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/admin-e4553757bda6d71e8b0b0306040ece0d/contact")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>
              İletişim Mesajları
            </CardTitle>
            <CardDescription>
              İşletmelerden gelen mesajları yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              İşletmelerden gelen destek taleplerini görüntüleyin ve yanıtlayın.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/admin-e4553757bda6d71e8b0b0306040ece0d/payments")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              Ödeme Talepleri
            </CardTitle>
            <CardDescription>
              Abonelik ve SMS paketi taleplerini yönetin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              İşletmelerden gelen ödeme taleplerini onaylayın veya reddedin.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Main Content */}
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<WelcomePage />} />
                    <Route path="/dashboard" element={<AdminStats />} />
        <Route path="/businesses" element={<AdminBusinesses />} />
        <Route path="/contact" element={<AdminContact />} />
        <Route path="/payments" element={<AdminPayments />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
