import { PermissionGuard } from "@/components/PermissionGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck } from "lucide-react";

const StaffStaff = () => {
  return (
    <PermissionGuard permission="manage_staff">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Personel Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Personel bilgilerini görüntüleyin ve yönetin.
          </p>
        </div>

        <Card>
          <CardContent className="py-8 text-center">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Personel yönetimi yakında eklenecek.</p>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
};

export default StaffStaff;