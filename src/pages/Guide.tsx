import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  FileText, 
  Bell, 
  UserPlus, 
  Shield, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  MinusCircle
} from "lucide-react";

const Guide = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Guia de Uso</h1>
          <p className="text-muted-foreground">
            Aprenda como utilizar todas as funcionalidades do sistema
          </p>
        </div>

        <div className="grid gap-6">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {/* Como renovar tokens */}
            <AccordionItem value="tokens" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Key className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Como renovar os tokens de conexão</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Mantenha suas contas sempre conectadas
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    Os tokens de acesso do Meta Ads expiram após um período de tempo. 
                    Siga os passos abaixo para renová-los:
                  </p>
                  <ol className="list-decimal list-inside space-y-3 ml-2">
                    <li>
                      <strong>Acesse a página de Tokens</strong> - Navegue até o menu "Tokens" na barra lateral
                    </li>
                    <li>
                      <strong>Identifique tokens expirando</strong> - Tokens com barra vermelha ou amarela precisam de atenção
                    </li>
                    <li>
                      <strong>Acesse o Meta Business Manager</strong> - Vá para{" "}
                      <a 
                        href="https://business.facebook.com/settings/system-users" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        business.facebook.com/settings/system-users
                      </a>
                    </li>
                    <li>
                      <strong>Gere um novo token</strong> - Selecione o usuário do sistema e clique em "Gerar novo token"
                    </li>
                    <li>
                      <strong>Selecione as permissões</strong> - Marque <code>ads_read</code> e <code>ads_management</code>
                    </li>
                    <li>
                      <strong>Atualize na plataforma</strong> - Copie o novo token e atualize na página de Contas
                    </li>
                  </ol>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      <strong>Dica:</strong> Configure alertas de expiração de token para ser notificado antes que expire.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Como gerar relatórios */}
            <AccordionItem value="reports" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Como gerar relatórios</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Crie relatórios de performance personalizados
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    O sistema gera relatórios individuais para cada conta de anúncios conectada. 
                    Cada relatório contém métricas de investimento, mensagens e custo por mensagem.
                  </p>
                  <ol className="list-decimal list-inside space-y-3 ml-2">
                    <li>
                      <strong>Acesse a página de Relatórios</strong> - Navegue até o menu "Relatórios"
                    </li>
                    <li>
                      <strong>Configure o período</strong> - Selecione as datas de início e fim do relatório
                    </li>
                    <li>
                      <strong>Clique em "Gerar Relatório Agora"</strong> - O sistema buscará os dados da API do Meta
                    </li>
                    <li>
                      <strong>Visualize os relatórios</strong> - Acesse a aba "Notificações" para ver os relatórios gerados
                    </li>
                  </ol>
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="font-medium mb-2">Formato do relatório:</p>
                    <div className="bg-background rounded p-3 font-mono text-xs">
                      📊 [Nome da Conta]<br />
                      📅 Período: DD/MM - DD/MM<br />
                      💰 Investimento total: R$ X.XXX,XX<br />
                      💬 Mensagens iniciadas: XXX<br />
                      📈 Custo por mensagens: R$ XX,XX
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Como configurar alertas */}
            <AccordionItem value="alerts" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Como configurar alertas</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Receba notificações de saldo baixo e tokens expirando
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    Configure alertas para ser notificado quando o saldo das contas estiver baixo 
                    ou quando os tokens estiverem próximos de expirar.
                  </p>
                  <ol className="list-decimal list-inside space-y-3 ml-2">
                    <li>
                      <strong>Acesse a página de Alertas</strong> - Navegue até o menu "Alertas"
                    </li>
                    <li>
                      <strong>Configure o saldo mínimo padrão</strong> - Defina o valor que disparará alertas
                    </li>
                    <li>
                      <strong>Ative os alertas por conta</strong> - Na página de Contas, ative alertas individualmente
                    </li>
                    <li>
                      <strong>Configure integrações (opcional)</strong> - Adicione webhooks para receber alertas via n8n
                    </li>
                  </ol>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-2">Alertas de saldo baixo</p>
                      <p className="text-muted-foreground text-xs">
                        Disparados quando o saldo da conta fica abaixo do limite configurado
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="font-medium mb-2">Alertas de token expirando</p>
                      <p className="text-muted-foreground text-xs">
                        Disparados quando o token está próximo da data de expiração
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Como convidar usuários */}
            <AccordionItem value="users" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Como convidar um novo usuário</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Adicione novos membros à sua equipe
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    Apenas administradores podem convidar novos usuários para o sistema.
                  </p>
                  <ol className="list-decimal list-inside space-y-3 ml-2">
                    <li>
                      <strong>Acesse a página de Usuários</strong> - Navegue até o menu "Usuários" (apenas para admins)
                    </li>
                    <li>
                      <strong>Clique em "Novo Usuário"</strong> - Abrirá o formulário de cadastro
                    </li>
                    <li>
                      <strong>Preencha os dados</strong> - Nome, empresa, email e senha
                    </li>
                    <li>
                      <strong>Selecione a função</strong> - Escolha entre Administrador, Gestor ou Leitor
                    </li>
                    <li>
                      <strong>Clique em "Criar Usuário"</strong> - O usuário receberá acesso imediato
                    </li>
                  </ol>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                    <p className="text-blue-600 dark:text-blue-400 text-sm">
                      <strong>Nota:</strong> O novo usuário poderá fazer login imediatamente com o email e senha cadastrados.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Permissões por função */}
            <AccordionItem value="permissions" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Permissões por função</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Entenda o que cada tipo de usuário pode fazer
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-6">
                  <p className="text-sm">
                    O sistema possui três níveis de acesso com permissões diferentes:
                  </p>
                  
                  <div className="grid gap-4">
                    {/* Administrador */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">
                            Administrador
                          </Badge>
                        </div>
                        <CardDescription>
                          Acesso completo a todas as funcionalidades do sistema
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <PermissionItem allowed>Visualizar dashboard</PermissionItem>
                          <PermissionItem allowed>Gerenciar contas</PermissionItem>
                          <PermissionItem allowed>Gerar relatórios</PermissionItem>
                          <PermissionItem allowed>Configurar alertas</PermissionItem>
                          <PermissionItem allowed>Acionar notificações</PermissionItem>
                          <PermissionItem allowed>Gerenciar usuários</PermissionItem>
                          <PermissionItem allowed>Configurar integrações</PermissionItem>
                          <PermissionItem allowed>Alterar configurações</PermissionItem>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Gestor */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20">
                            Gestor
                          </Badge>
                        </div>
                        <CardDescription>
                          Pode gerar relatórios e acionar notificações de saldo
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <PermissionItem allowed>Visualizar dashboard</PermissionItem>
                          <PermissionItem allowed>Visualizar contas</PermissionItem>
                          <PermissionItem allowed>Gerar relatórios</PermissionItem>
                          <PermissionItem allowed>Visualizar alertas</PermissionItem>
                          <PermissionItem allowed>Acionar notificações</PermissionItem>
                          <PermissionItem denied>Gerenciar usuários</PermissionItem>
                          <PermissionItem denied>Configurar integrações</PermissionItem>
                          <PermissionItem denied>Alterar configurações</PermissionItem>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Leitor */}
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-500/20">
                            Leitor
                          </Badge>
                        </div>
                        <CardDescription>
                          Acesso apenas para visualização
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <PermissionItem allowed>Visualizar dashboard</PermissionItem>
                          <PermissionItem allowed>Visualizar contas</PermissionItem>
                          <PermissionItem allowed>Visualizar relatórios</PermissionItem>
                          <PermissionItem allowed>Visualizar alertas</PermissionItem>
                          <PermissionItem denied>Acionar notificações</PermissionItem>
                          <PermissionItem denied>Gerenciar usuários</PermissionItem>
                          <PermissionItem denied>Configurar integrações</PermissionItem>
                          <PermissionItem denied>Alterar configurações</PermissionItem>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </DashboardLayout>
  );
};

interface PermissionItemProps {
  children: React.ReactNode;
  allowed?: boolean;
  denied?: boolean;
}

const PermissionItem = ({ children, allowed, denied }: PermissionItemProps) => {
  return (
    <div className="flex items-center gap-2">
      {allowed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
      {denied && <XCircle className="w-4 h-4 text-red-500" />}
      {!allowed && !denied && <MinusCircle className="w-4 h-4 text-muted-foreground" />}
      <span className={denied ? "text-muted-foreground" : ""}>{children}</span>
    </div>
  );
};

export default Guide;
