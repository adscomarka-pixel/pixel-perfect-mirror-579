import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, Calendar, FileText, Loader2, Mail, Save, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [weeklyReportEnabled, setWeeklyReportEnabled] = useState(true);
  const [balanceAlertEnabled, setBalanceAlertEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [reportDay, setReportDay] = useState("monday");
  const [reportTime, setReportTime] = useState("09:00");
  const [defaultMinBalance, setDefaultMinBalance] = useState("500");

  // Fetch profile data
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch notification settings
  const { data: notificationSettings, isLoading: loadingSettings } = useQuery({
    queryKey: ['notification-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Populate form with fetched data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setCompanyName(profile.company_name || "");
      setPhone(profile.phone || "");
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  useEffect(() => {
    if (notificationSettings) {
      setWeeklyReportEnabled(notificationSettings.weekly_report_enabled ?? true);
      setBalanceAlertEnabled(notificationSettings.balance_alerts_enabled ?? true);
      setEmailNotifications(notificationSettings.email_notifications ?? true);
      setReportDay(notificationSettings.report_day || "monday");
      setReportTime(notificationSettings.report_time || "09:00");
      setDefaultMinBalance(String(notificationSettings.default_min_balance || 500));
    }
  }, [notificationSettings]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      // Update or insert profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          full_name: fullName,
          company_name: companyName,
          phone: phone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      // Update or insert notification settings
      const { error: settingsError } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          weekly_report_enabled: weeklyReportEnabled,
          balance_alerts_enabled: balanceAlertEnabled,
          email_notifications: emailNotifications,
          report_day: reportDay,
          report_time: reportTime,
          default_min_balance: parseFloat(defaultMinBalance) || 500,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (settingsError) throw settingsError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const isLoading = loadingProfile || loadingSettings;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground">Personalize sua experiência no CMK Performance</p>
        </div>

        <div className="max-w-3xl space-y-6">
          {/* Profile Settings */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Perfil</h3>
                <p className="text-sm text-muted-foreground">Informações da sua conta</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input 
                  id="company" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nome da empresa"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+55 11 99999-9999"
                />
              </div>
            </div>
          </div>

          {/* Report Settings */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Relatórios Automáticos</h3>
                <p className="text-sm text-muted-foreground">Configure o envio automático de relatórios</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Relatório Semanal</p>
                    <p className="text-sm text-muted-foreground">Enviado toda segunda-feira às 9h</p>
                  </div>
                </div>
                <Switch
                  checked={weeklyReportEnabled}
                  onCheckedChange={setWeeklyReportEnabled}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reportDay">Dia do Envio</Label>
                  <select
                    id="reportDay"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={reportDay}
                    onChange={(e) => setReportDay(e.target.value)}
                  >
                    <option value="monday">Segunda-feira</option>
                    <option value="tuesday">Terça-feira</option>
                    <option value="wednesday">Quarta-feira</option>
                    <option value="thursday">Quinta-feira</option>
                    <option value="friday">Sexta-feira</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportTime">Horário</Label>
                  <Input 
                    id="reportTime" 
                    type="time" 
                    value={reportTime}
                    onChange={(e) => setReportTime(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-card rounded-xl border border-border shadow-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Notificações</h3>
                <p className="text-sm text-muted-foreground">Escolha como deseja ser notificado</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Alertas de Saldo Baixo</p>
                    <p className="text-sm text-muted-foreground">Receba alertas quando o saldo estiver abaixo do limite</p>
                  </div>
                </div>
                <Switch
                  checked={balanceAlertEnabled}
                  onCheckedChange={setBalanceAlertEnabled}
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Notificações por Email</p>
                    <p className="text-sm text-muted-foreground">Receba uma cópia dos alertas por email</p>
                  </div>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultMinBalance">Limite Mínimo Padrão (R$)</Label>
                <Input 
                  id="defaultMinBalance" 
                  type="number" 
                  value={defaultMinBalance}
                  onChange={(e) => setDefaultMinBalance(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Este valor será usado como padrão para novas contas conectadas
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              variant="hero" 
              size="lg"
              onClick={handleSave}
              disabled={saveMutation.isPending || isLoading}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
