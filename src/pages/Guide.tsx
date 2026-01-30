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
  MinusCircle,
  Link2,
  Settings,
  Zap,
  ExternalLink
} from "lucide-react";

// Import guide images
import googleOAuthCredentials from "@/assets/guide/google-oauth-credentials.jpg";
import googleOAuthPlayground from "@/assets/guide/google-oauth-playground.jpg";
import metaBusinessManager from "@/assets/guide/meta-business-manager.jpg";
import syncComplete from "@/assets/guide/sync-complete.jpg";
import webhooksIntegration from "@/assets/guide/webhooks-integration.jpg";
import userRoles from "@/assets/guide/user-roles.jpg";

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
            
            {/* Como conectar Google Ads */}
            <AccordionItem value="google-ads" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Como conectar contas Google Ads</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Obtenha Client ID, Client Secret e Refresh Token
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-6 text-sm">
                  <p>
                    Para conectar suas contas do Google Ads, você precisará de três credenciais: 
                    <strong> Client ID</strong>, <strong>Client Secret</strong> e <strong>Refresh Token</strong>.
                  </p>

                  {/* Passo 1: Criar projeto no Google Cloud */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Criar projeto no Google Cloud Console
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        Acesse o{" "}
                        <a 
                          href="https://console.cloud.google.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Google Cloud Console
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Crie um novo projeto ou selecione um existente</li>
                      <li>
                        Ative a <strong>Google Ads API</strong> em "APIs e Serviços" → "Biblioteca"
                      </li>
                    </ol>
                    <div className="mt-3 rounded-lg overflow-hidden border">
                      <img 
                        src={googleOAuthCredentials} 
                        alt="Google Cloud Console - Criação de credenciais OAuth" 
                        className="w-full h-auto"
                      />
                      <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                        Tela de criação de Client ID no Google Cloud Console
                      </p>
                    </div>
                  </div>

                  {/* Passo 2: Configurar tela de consentimento */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Configurar tela de consentimento OAuth
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Vá em "APIs e Serviços" → "Tela de consentimento OAuth"</li>
                      <li>Selecione <strong>Externo</strong> como tipo de usuário</li>
                      <li>Preencha o nome do app e email de suporte</li>
                      <li>
                        Adicione os escopos:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li><code className="text-xs bg-muted px-1 rounded">https://www.googleapis.com/auth/adwords</code></li>
                          <li><code className="text-xs bg-muted px-1 rounded">https://www.googleapis.com/auth/userinfo.email</code></li>
                        </ul>
                      </li>
                      <li>Adicione seu email como usuário de teste</li>
                    </ol>
                  </div>

                  {/* Passo 3: Criar credenciais */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Criar Client ID e Client Secret
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Vá em "APIs e Serviços" → "Credenciais"</li>
                      <li>Clique em "Criar credenciais" → "ID do cliente OAuth"</li>
                      <li>Selecione <strong>Aplicativo da Web</strong></li>
                      <li>
                        Em "URIs de redirecionamento autorizados", adicione:
                        <div className="bg-muted rounded p-2 mt-1 font-mono text-xs">
                          https://developers.google.com/oauthplayground
                        </div>
                      </li>
                      <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong> gerados</li>
                    </ol>
                  </div>

                  {/* Passo 4: Gerar Refresh Token */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Gerar o Refresh Token
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        Acesse o{" "}
                        <a 
                          href="https://developers.google.com/oauthplayground" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          OAuth 2.0 Playground
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>
                        Clique na engrenagem ⚙️ (canto superior direito) e marque:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li>"Use your own OAuth credentials"</li>
                          <li>Cole seu Client ID e Client Secret</li>
                        </ul>
                      </li>
                      <li>
                        No painel esquerdo, em "Input your own scopes", digite:
                        <div className="bg-muted rounded p-2 mt-1 font-mono text-xs">
                          https://www.googleapis.com/auth/adwords
                        </div>
                      </li>
                      <li>Clique em "Authorize APIs" e faça login com a conta do Google Ads</li>
                      <li>Clique em "Exchange authorization code for tokens"</li>
                      <li>Copie o <strong>Refresh Token</strong> gerado</li>
                    </ol>
                    <div className="mt-3 rounded-lg overflow-hidden border">
                      <img 
                        src={googleOAuthPlayground} 
                        alt="OAuth 2.0 Playground - Configuração de credenciais" 
                        className="w-full h-auto"
                      />
                      <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                        OAuth 2.0 Playground com opção "Use your own OAuth credentials"
                      </p>
                    </div>
                  </div>

                  {/* Passo 5: Conectar no sistema */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">5</Badge>
                      Conectar no sistema
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Na página de <strong>Contas</strong>, clique em "Google Ads (Token)"</li>
                      <li>Cole o Client ID, Client Secret e Refresh Token</li>
                      <li>Clique em "Conectar"</li>
                      <li>Todas as contas do Google Ads serão importadas automaticamente (incluindo sub-contas de MCCs)</li>
                    </ol>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mt-4">
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      <strong>✓ Vantagem:</strong> O Refresh Token não expira enquanto você não revogar o acesso. 
                      Você só precisa fazer esse processo uma vez!
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Como conectar Meta Ads */}
            <AccordionItem value="meta-ads" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Como conectar contas Meta Ads</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Obtenha o Token de Acesso do Business Manager
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    Para conectar suas contas do Meta Ads (Facebook/Instagram), você precisará de um 
                    <strong> Token de Acesso</strong> do Business Manager.
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Acessar o Business Manager
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>
                        Acesse{" "}
                        <a 
                          href="https://business.facebook.com/settings/system-users" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          business.facebook.com/settings/system-users
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                      <li>Selecione o Business Manager correto</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Criar ou selecionar usuário do sistema
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Clique em "Adicionar" para criar um novo usuário do sistema</li>
                      <li>Dê um nome descritivo (ex: "API Alertas")</li>
                      <li>Selecione a função "Admin" ou "Funcionário"</li>
                      <li>Atribua as contas de anúncios que deseja monitorar</li>
                    </ol>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Gerar o Token de Acesso
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Selecione o usuário do sistema criado</li>
                      <li>Clique em "Gerar novo token"</li>
                      <li>
                        Selecione as permissões:
                        <ul className="list-disc list-inside ml-4 mt-1 text-muted-foreground">
                          <li><code className="text-xs bg-muted px-1 rounded">ads_read</code></li>
                          <li><code className="text-xs bg-muted px-1 rounded">ads_management</code></li>
                          <li><code className="text-xs bg-muted px-1 rounded">business_management</code></li>
                        </ul>
                      </li>
                      <li>Copie o token gerado (ele só aparece uma vez!)</li>
                    </ol>
                    <div className="mt-3 rounded-lg overflow-hidden border">
                      <img 
                        src={metaBusinessManager} 
                        alt="Meta Business Manager - Geração de Token" 
                        className="w-full h-auto"
                      />
                      <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                        Tela de usuários do sistema no Meta Business Manager
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">4</Badge>
                      Conectar no sistema
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Na página de <strong>Contas</strong>, clique em "Meta Ads (Token)"</li>
                      <li>Cole o Token de Acesso</li>
                      <li>Clique em "Conectar"</li>
                      <li>Todas as contas de anúncios associadas serão importadas</li>
                    </ol>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      <strong>⚠️ Importante:</strong> Tokens do Meta expiram após 60 dias. 
                      Configure alertas de expiração para ser notificado antes!
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sincronização Completa */}
            <AccordionItem value="sync" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Sincronização Completa</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Atualize todas as informações das suas contas
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    O botão <strong>"Sincronização Completa"</strong> na página de Contas realiza 
                    uma atualização abrangente de todas as suas contas conectadas.
                  </p>

                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={syncComplete} 
                      alt="Fluxo de sincronização completa" 
                      className="w-full h-auto"
                    />
                    <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                      O processo de sincronização completa: descobre contas, atualiza nomes e sincroniza saldos
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-3">O que a sincronização completa faz:</h4>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Descobre novas contas</p>
                          <p className="text-muted-foreground text-xs">
                            Verifica se há novas contas vinculadas ao seu acesso (especialmente útil para MCCs do Google Ads)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Atualiza os nomes das contas</p>
                          <p className="text-muted-foreground text-xs">
                            Busca os nomes descritivos das contas na API (substitui IDs por nomes legíveis)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Atualiza saldos e gastos</p>
                          <p className="text-muted-foreground text-xs">
                            Busca o saldo atual e o gasto diário de cada conta
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <p className="font-medium">Renova os tokens de acesso</p>
                          <p className="text-muted-foreground text-xs">
                            Atualiza automaticamente os tokens que estão próximos de expirar
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                    <p className="text-blue-600 dark:text-blue-400 text-sm">
                      <strong>💡 Dica:</strong> Use a sincronização completa sempre que adicionar novas 
                      contas ao seu Google Ads MCC ou quando notar que os nomes das contas estão 
                      mostrando apenas IDs numéricos.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

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
                  
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold mb-2">Diferença entre plataformas:</h4>
                    <div className="grid gap-2">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        <span><strong>Meta Ads:</strong> Tokens expiram em ~60 dias</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span><strong>Google Ads:</strong> Refresh Token não expira (recomendado)</span>
                      </div>
                    </div>
                  </div>

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
                      Crie relatórios de performance por objetivo de campanha
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    O sistema gera relatórios individuais para cada conta de anúncios conectada. 
                    Para contas Meta Ads, você pode configurar <strong>múltiplos objetivos de campanha</strong> e 
                    o sistema gerará um relatório específico para cada objetivo selecionado.
                  </p>

                  {/* Filtro por plataforma */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Filtrar contas por plataforma
                    </h4>
                    <p className="ml-4 text-muted-foreground">
                      Use os botões de filtro na página de Relatórios para visualizar apenas as contas 
                      de uma plataforma específica:
                    </p>
                    <div className="flex items-center gap-2 ml-4 flex-wrap">
                      <span className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium">Todas</span>
                      <span className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#1877F2">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        Meta
                      </span>
                      <span className="px-3 py-1.5 bg-muted rounded-md text-sm font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </span>
                    </div>
                  </div>

                  {/* Configurar objetivos */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Configurar objetivos de campanha (Meta Ads)
                    </h4>
                    <p className="ml-4 text-muted-foreground">
                      Para contas Meta Ads, clique no ícone de engrenagem (⚙️) para definir quais 
                      objetivos de campanha devem ser incluídos nos relatórios:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-4">
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <span>💬</span>
                        <span className="text-sm">Mensagens</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <span>📋</span>
                        <span className="text-sm">Leads</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <span>🎯</span>
                        <span className="text-sm">Conversões</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <span>🔗</span>
                        <span className="text-sm">Tráfego</span>
                      </div>
                      <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <span>❤️</span>
                        <span className="text-sm">Engajamento</span>
                      </div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 ml-4">
                      <p className="text-blue-600 dark:text-blue-400 text-xs">
                        <strong>💡 Dica:</strong> Se você selecionar múltiplos objetivos, o sistema gerará 
                        um relatório separado para cada objetivo, com métricas específicas (ex: "custo por lead" 
                        vs "custo por mensagem").
                      </p>
                    </div>
                  </div>

                  {/* Gerar relatório */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">3</Badge>
                      Gerar relatório
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Configure o período desejado (data de início e fim)</li>
                      <li>Clique em <strong>"Gerar Relatório Agora"</strong></li>
                      <li>Acesse a aba <strong>"Notificações"</strong> para ver os relatórios gerados</li>
                    </ol>
                  </div>

                  {/* Exemplos de formato */}
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="font-medium mb-3">Exemplos de relatórios por objetivo:</p>
                    <div className="grid gap-3">
                      <div className="bg-background rounded p-3 font-mono text-xs">
                        <p className="text-muted-foreground mb-1">💬 Objetivo: Mensagens</p>
                        📊 [Nome da Conta]<br />
                        📅 Período: DD/MM - DD/MM<br />
                        💰 Investimento total: R$ X.XXX,XX<br />
                        💬 Mensagens iniciadas: XXX<br />
                        📈 Custo por mensagem: R$ XX,XX
                      </div>
                      <div className="bg-background rounded p-3 font-mono text-xs">
                        <p className="text-muted-foreground mb-1">📋 Objetivo: Leads</p>
                        📊 [Nome da Conta]<br />
                        📅 Período: DD/MM - DD/MM<br />
                        💰 Investimento total: R$ X.XXX,XX<br />
                        📋 Leads gerados: XXX<br />
                        📈 Custo por lead: R$ XX,XX
                      </div>
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
                      <strong>Ative os alertas por conta</strong> - Na página de Contas, clique no ícone de configuração (⚙️) de cada conta
                    </li>
                    <li>
                      <strong>Configure integrações (opcional)</strong> - Adicione webhooks para receber alertas via n8n, Zapier ou Make
                    </li>
                  </ol>
                  
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold mb-2">Verificação automática:</h4>
                    <p className="text-muted-foreground">
                      O sistema verifica automaticamente o saldo das contas <strong>a cada hora</strong>. 
                      Alertas são enviados no máximo uma vez a cada 24 horas por conta para evitar spam.
                    </p>
                  </div>

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
                        Disparados quando o token está próximo da data de expiração (Meta Ads)
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Integrações via Webhook */}
            <AccordionItem value="webhooks" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Integrações via Webhook</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Conecte com n8n, Zapier, Make e outras ferramentas
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    Envie alertas e notificações para ferramentas de automação via webhooks.
                  </p>

                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={webhooksIntegration} 
                      alt="Fluxo de integração via webhooks" 
                      className="w-full h-auto"
                    />
                    <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                      Conecte seus alertas com n8n, Zapier, Make e outras ferramentas
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">1</Badge>
                      Criar webhook na ferramenta de destino
                    </h4>
                    <p className="ml-4 text-muted-foreground">
                      No n8n, Zapier ou Make, crie um trigger de webhook e copie a URL gerada.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-base flex items-center gap-2">
                      <Badge variant="outline">2</Badge>
                      Configurar no sistema
                    </h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Acesse a página de <strong>Alertas</strong></li>
                      <li>Vá para a aba <strong>Integrações</strong></li>
                      <li>Cole a URL do webhook</li>
                      <li>Escolha quais eventos devem disparar o webhook</li>
                    </ol>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold mb-2">Eventos disponíveis:</h4>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li><strong>Saldo baixo:</strong> Quando o saldo fica abaixo do limite</li>
                      <li><strong>Token expirando:</strong> Quando um token Meta está próximo de expirar</li>
                    </ul>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Formato do payload:</h4>
                    <div className="bg-background rounded p-3 font-mono text-xs overflow-x-auto">
                      {`{
  "type": "low_balance",
  "account_name": "Nome da Conta",
  "balance": 150.00,
  "min_balance": 500.00,
  "timestamp": "2024-01-15T10:30:00Z"
}`}
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

                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={userRoles} 
                      alt="Níveis de permissão: Admin, Gestor e Leitor" 
                      className="w-full h-auto"
                    />
                    <p className="text-xs text-muted-foreground p-2 bg-muted/50 text-center">
                      Os três níveis de acesso: Administrador, Gestor e Leitor
                    </p>
                  </div>
                  
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

            {/* Configurações da Conta */}
            <AccordionItem value="account-config" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold">Configurações individuais por conta</h3>
                    <p className="text-sm text-muted-foreground font-normal">
                      Personalize alertas e nome de produto para cada conta
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 pb-6">
                <div className="space-y-4 text-sm">
                  <p>
                    Cada conta de anúncios pode ter configurações individuais que sobrescrevem as configurações globais.
                  </p>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Como acessar:</h4>
                    <ol className="list-decimal list-inside space-y-2 ml-4">
                      <li>Vá para a página de <strong>Contas</strong></li>
                      <li>Clique no ícone de configuração (⚙️) da conta desejada</li>
                    </ol>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold mb-3">Configurações disponíveis:</h4>
                    <div className="grid gap-3">
                      <div>
                        <p className="font-medium">Nome do Produto</p>
                        <p className="text-muted-foreground text-xs">
                          Define o nome que aparece nos relatórios gerados para esta conta
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Saldo Mínimo para Alerta</p>
                        <p className="text-muted-foreground text-xs">
                          Valor específico que dispara alertas (sobrescreve o padrão global)
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Alertas Ativados</p>
                        <p className="text-muted-foreground text-xs">
                          Ativa ou desativa alertas de saldo baixo para esta conta específica
                        </p>
                      </div>
                    </div>
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
