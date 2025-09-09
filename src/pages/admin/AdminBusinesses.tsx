import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Building, 
  Search,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Users,
  DollarSign,
  Eye,
  MoreHorizontal
} from "lucide-react";

interface Business {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  is_active: boolean;
  created_at: string;
  slug: string;
  country_code: string;
}

const AdminBusinesses = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Businesses fetch error:', error);
      toast({
        title: "Hata",
        description: "İşletmeler yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredBusinesses = businesses.filter(business =>
    business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    business.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">İşletmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">İşletmeler</h1>
          <p className="text-gray-600 mt-2">Kayıtlı işletmeleri görüntüleyin ve yönetin</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {businesses.length} İşletme
        </Badge>
      </div>

      {/* Search */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="İşletme adı, email veya telefon ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBusinesses.map((business) => (
          <Card key={business.id} className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{business.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {business.slug}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={business.is_active ? "default" : "secondary"}>
                    {business.is_active ? "Aktif" : "Pasif"}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{business.country_code} {business.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{business.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{business.address}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Randevular</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">-</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Gelir</span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900">-</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Detaylar
                </Button>
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredBusinesses.length === 0 && (
        <Card className="bg-white shadow-sm">
          <CardContent className="p-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? "İşletme bulunamadı" : "Henüz işletme yok"}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? "Arama kriterlerinize uygun işletme bulunamadı."
                : "Sistemde henüz kayıtlı işletme bulunmuyor."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminBusinesses;
