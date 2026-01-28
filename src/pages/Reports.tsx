import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings2, Bell, Webhook } from "lucide-react";
import { ReportConfigTab } from "@/components/dashboard/reports/ReportConfigTab";
import { ReportNotificationsTab } from "@/components/dashboard/reports/ReportNotificationsTab";
import { ReportIntegrationsTab } from "@/components/dashboard/reports/ReportIntegrationsTab";

const Reports = () => {
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground">Gere e gerencie relatórios de desempenho</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="config" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="config" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Webhook className="w-4 h-4" />
            Integrações (n8n)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ReportConfigTab />
        </TabsContent>

        <TabsContent value="notifications">
          <ReportNotificationsTab />
        </TabsContent>

        <TabsContent value="integrations">
          <ReportIntegrationsTab />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Reports;
