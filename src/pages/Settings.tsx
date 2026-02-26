import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Calendar, FileText, Loader2, Mail, Save, User, Users, Plus, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const WEEKDAYS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
] as const;

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Account Managers
  const { data: managers = [], isLoading: loadingManagers } = useQuery({
    queryKey: ['account_managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_managers')
        .select('*')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const [newManagerName, setNewManagerName] = useState("");
  const [newManagerNotion, setNewManagerNotion] = useState("");
  const [isAddingManager, setIsAddingManager] = useState(false);

  const addManagerMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from('account_managers').insert([{
        user_id: user.id,
        name: newManagerName,
        notion_id: newManagerNotion,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_managers'] });
      setNewManagerName("");
      setNewManagerNotion("");
      setIsAddingManager(false);
      toast.success("Gestor adicionado com sucesso!");
    },
    onError: (error) => toast.error("Erro ao adicionar gestor: " + error.message),
  });

  const deleteManagerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('account_managers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_managers'] });
      toast.success("Gestor removido!");
    },
    onError: (error) => toast.error("Erro ao remover: " + error.message),
  });

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
  const [balanceAlertDays, setBalanceAlertDays] = useState<string[]>(WEEKDAYS.map(d => d.value));
  const [balanceAlertTime, setBalanceAlertTime] = useState("09:00");

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
      // Handle balance_alert_days - ensure it's an array
      const days = (notificationSettings as any).balance_alert_days;
      if (Array.isArray(days) && days.length > 0) {
        setBalanceAlertDays(days);
      } else {
        setBalanceAlertDays(WEEKDAYS.map(d => d.value));
      }
      // Handle balance_alert_time
      const alertTime = (notificationSettings as any).balance_alert_time;
      if (alertTime) {
        setBalanceAlertTime(alertTime);
      }
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
          balance_alert_days: balanceAlertDays,
          balance_alert_time: balanceAlertTime,
          updated_at: new Date().toISOString(),
        } as any, { onConflict: 'user_id' });

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
    <DashboardLayout>
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

        {/* Account Managers Settings */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Gestores de Conta</h3>
                <p className="text-sm text-muted-foreground">Gerencie a lista de gestores para seus clientes</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingManager(!isAddingManager)}
            >
              {isAddingManager ? "Cancelar" : (
                <>
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Gestor
                </>
              )}
            </Button>
          </div>

          {isAddingManager && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 rounded-lg bg-muted/30 border border-dashed">
              <div className="space-y-2">
                <Label htmlFor="manager-name">Nome do Gestor</Label>
                <Input
                  id="manager-name"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager-notion">ID do Notion (Opcional)</Label>
                <Input
                  id="manager-notion"
                  value={newManagerNotion}
                  onChange={(e) => setNewManagerNotion(e.target.value)}
                  placeholder="ID do banco/página"
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => addManagerMutation.mutate()}
                  disabled={!newManagerName || addManagerMutation.isPending}
                >
                  {addManagerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Gestor
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {managers.length === 0 ? (
              <p className="text-center py-4 text-sm text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                Nenhum gestor cadastrado.
              </p>
            ) : (
              managers.map((manager: any) => (
                <div key={manager.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div>
                    <p className="font-medium text-sm">{manager.name}</p>
                    {manager.notion_id && (
                      <p className="text-[10px] text-muted-foreground">Notion: {manager.notion_id}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => deleteManagerMutation.mutate(manager.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
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

            {/* Balance Alert Days Selection */}
            {balanceAlertEnabled && (
              <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center justify-between">
                  <Label>Dias de Verificação de Saldo</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (balanceAlertDays.length === WEEKDAYS.length) {
                        // If all selected, select only weekdays
                        setBalanceAlertDays(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
                      } else {
                        // Select all days
                        setBalanceAlertDays(WEEKDAYS.map(d => d.value));
                      }
                    }}
                    className="text-xs h-7"
                  >
                    {balanceAlertDays.length === WEEKDAYS.length ? 'Apenas dias úteis' : 'Selecionar todos'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((day) => {
                    const isSelected = balanceAlertDays.includes(day.value);
                    return (
                      <label
                        key={day.value}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${isSelected
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-muted-foreground/50 text-muted-foreground"
                          }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setBalanceAlertDays([...balanceAlertDays, day.value]);
                            } else {
                              // Don't allow removing the last day
                              if (balanceAlertDays.length === 1) {
                                toast.error("Selecione pelo menos um dia");
                                return;
                              }
                              setBalanceAlertDays(balanceAlertDays.filter(d => d !== day.value));
                            }
                          }}
                          className="pointer-events-none"
                        />
                        <span className="text-sm font-medium">{day.label}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Balance Alert Time */}
                <div className="space-y-2 pt-3 border-t border-border/50">
                  <Label htmlFor="balanceAlertTime">Horário de Verificação</Label>
                  <Input
                    id="balanceAlertTime"
                    type="time"
                    value={balanceAlertTime}
                    onChange={(e) => setBalanceAlertTime(e.target.value)}
                    className="max-w-[150px]"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Os alertas serão verificados nos dias selecionados, no horário configurado
                </p>
              </div>
            )}

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
    </DashboardLayout>
  );
};

export default Settings;
