import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Plus } from "lucide-react";

const Staff = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <UserCheck className="h-8 w-8 text-brand-primary" />
            Personel Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">
            Personel bilgilerini ve çalışma saatlerini yönetin.
          </p>
        </div>
        <Button variant="brand" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Personel
        </Button>
      </div>

      <Card className="bg-white/50 backdrop-blur-sm border-brand-primary/10">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Personel Yönetimi
          </h3>
          <p className="text-muted-foreground text-center">
            Bu sayfa geliştirilme aşamasında.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Staff;