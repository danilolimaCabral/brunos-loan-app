import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Key, AlertTriangle, Check, Copy, Database, Siren, Download, Users, Trash2, UserPlus, Circle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Seguranca() {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [backupCodesDialogOpen, setBackupCodesDialogOpen] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [panicDialogOpen, setPanicDialogOpen] = useState(false);
  const [panicPassword, setPanicPassword] = useState("");
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [deleteUserPassword, setDeleteUserPassword] = useState("");
  const [userToDelete, setUserToDelete] = useState<{ id: number; nome: string } | null>(null);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    nome: "",
    email: "",
    role: "operador" as "admin" | "operador",
  });

  const { user } = useAuth();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  
  // Função para verificar se usuário está online
  const isOnline = (lastActivity: Date | null | undefined) => {
    if (!lastActivity) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActivity) > fiveMinutesAgo;
  };
  const { data: status, isLoading } = trpc.auth.getTwoFactorStatus.useQuery();
  const { data: usuarios, isLoading: loadingUsers } = trpc.auth.listUsers.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  }) as { data: Array<{
    id: number;
    username: string;
    nome: string;
    email: string | null;
    role: "admin" | "operador";
    ativo: number;
    twoFactorEnabled: number;
    lastActivity: Date | null;
    createdAt: Date;
  }> | undefined; isLoading: boolean };

  const setupMutation = trpc.auth.setupTwoFactor.useMutation({
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setSetupDialogOpen(false);
      setVerifyDialogOpen(true);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const enableMutation = trpc.auth.enableTwoFactor.useMutation({
    onSuccess: (data) => {
      setBackupCodes(data.backupCodes);
      setVerifyDialogOpen(false);
      setBackupCodesDialogOpen(true);
      utils.auth.getTwoFactorStatus.invalidate();
      toast.success("Autenticação de dois fatores habilitada!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const disableMutation = trpc.auth.disableTwoFactor.useMutation({
    onSuccess: () => {
      setDisableDialogOpen(false);
      setDisablePassword("");
      utils.auth.getTwoFactorStatus.invalidate();
      toast.success("Autenticação de dois fatores desabilitada");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const backupMutation = trpc.auth.generateBackup.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setBackupDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const panicMutation = trpc.auth.executePanic.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setPanicDialogOpen(false);
      setPanicPassword("");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteUserMutation = trpc.auth.deleteUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDeleteUserDialogOpen(false);
      setDeleteUserPassword("");
      setUserToDelete(null);
      utils.auth.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createUserMutation = trpc.auth.createUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setCreateUserDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        nome: "",
        email: "",
        role: "operador",
      });
      utils.auth.listUsers.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSetup = () => {
    setSetupDialogOpen(true);
  };

  const handleStartSetup = () => {
    setupMutation.mutate();
  };

  const handleVerify = () => {
    if (!verifyCode || verifyCode.length !== 6) {
      toast.error("Digite um código de 6 dígitos");
      return;
    }
    enableMutation.mutate({ code: verifyCode });
  };

  const handleDisable = () => {
    if (!disablePassword) {
      toast.error("Digite sua senha");
      return;
    }
    disableMutation.mutate({ password: disablePassword });
  };

  const copyBackupCodes = () => {
    const text = backupCodes.join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Códigos copiados para a área de transferência");
  };

  const downloadBackupCodes = () => {
    const text = `Códigos de Backup - Bruno's Loan\n\nGuarde estes códigos em um local seguro. Cada código pode ser usado apenas uma vez.\n\n${backupCodes.join("\n")}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "brunos-loan-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Segurança</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Segurança</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as configurações de segurança da sua conta
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                <span className="font-medium">Aplicativo Autenticador</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {status?.enabled
                  ? "A autenticação de dois fatores está ativa"
                  : "Use um aplicativo como Google Authenticator ou Microsoft Authenticator"}
              </p>
            </div>
            {status?.enabled ? (
              <Button variant="destructive" onClick={() => setDisableDialogOpen(true)}>
                Desabilitar
              </Button>
            ) : (
              <Button onClick={handleSetup}>Habilitar</Button>
            )}
          </div>

          {status?.enabled && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Sua conta está protegida com autenticação de dois fatores.
                {status.hasBackupCodes && " Você possui códigos de backup salvos."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cards de Admin apenas */}
      {isAdmin && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setCreateUserDialogOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Criar Novo Usuário
                </Button>
              </div>
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">Carregando usuários...</p>
              ) : (
                <div className="space-y-2">
                  {usuarios?.filter(u => u.username !== 'financeiro').map((usuario) => (
                    <div key={usuario.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isOnline(usuario.lastActivity) ? (
                            <Circle className="h-3 w-3 text-green-600 fill-green-600 animate-pulse" />
                          ) : (
                            <Circle className="h-3 w-3 text-gray-400 fill-gray-400" />
                          )}
                          <span className="font-medium">{usuario.nome}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                            {usuario.role}
                          </span>
                          {usuario.twoFactorEnabled === 1 && (
                            <Shield className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          @{usuario.username} {usuario.email && `• ${usuario.email}`}
                        </p>
                      </div>
                      {user?.id !== usuario.id && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setUserToDelete({ id: usuario.id, nome: usuario.nome });
                            setDeleteUserDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backup do Sistema
              </CardTitle>
              <CardDescription>
                Gere um backup completo do banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    <span className="font-medium">Backup Manual</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Exporta todos os dados e envia por email
                  </p>
                </div>
                <Button onClick={() => setBackupDialogOpen(true)}>
                  Gerar Backup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Siren className="h-5 w-5" />
                Botão de Pânico
              </CardTitle>
              <CardDescription>
                Em caso de emergência: apaga dados sensíveis e gera backup
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>ATENÇÃO:</strong> Esta ação é irreversível e deve ser usada apenas em situações de emergência.
                  Todos os dados de clientes e empréstimos serão apagados permanentemente.
                </AlertDescription>
              </Alert>
              <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                <div className="space-y-1">
                  <span className="font-medium text-destructive">Ativar Pânico</span>
                  <p className="text-sm text-muted-foreground">
                    Backup automático + exclusão de dados + notificação
                  </p>
                </div>
                <Button variant="destructive" onClick={() => setPanicDialogOpen(true)}>
                  Ativar Pânico
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog: Iniciar Configuração */}
      <Dialog open={setupDialogOpen} onOpenChange={setSetupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Habilitar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Você precisará de um aplicativo autenticador no seu celular, como:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
              <li>1Password</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSetupDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleStartSetup} disabled={setupMutation.isPending}>
              {setupMutation.isPending ? "Gerando..." : "Continuar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Escanear QR Code e Verificar */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Escaneie o QR Code</DialogTitle>
            <DialogDescription>
              Use seu aplicativo autenticador para escanear este código
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Ou digite este código manualmente:</Label>
              <div className="p-3 bg-muted rounded font-mono text-sm break-all">
                {secret}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verify-code">Digite o código de 6 dígitos</Label>
              <Input
                id="verify-code"
                placeholder="000000"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleVerify} disabled={enableMutation.isPending}>
              {enableMutation.isPending ? "Verificando..." : "Verificar e Ativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Códigos de Backup */}
      <Dialog open={backupCodesDialogOpen} onOpenChange={setBackupCodesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Salve seus Códigos de Backup
            </DialogTitle>
            <DialogDescription>
              Guarde estes códigos em um local seguro. Você pode usá-los para acessar sua conta
              se perder acesso ao aplicativo autenticador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Cada código pode ser usado apenas uma vez. Não compartilhe estes códigos com ninguém.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={copyBackupCodes} className="gap-2">
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" onClick={downloadBackupCodes}>
              Baixar
            </Button>
            <Button onClick={() => setBackupCodesDialogOpen(false)}>
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Desabilitar 2FA */}
      <Dialog open={disableDialogOpen} onOpenChange={setDisableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desabilitar Autenticação de Dois Fatores</DialogTitle>
            <DialogDescription>
              Digite sua senha para confirmar que deseja desabilitar a autenticação de dois fatores.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Isso tornará sua conta menos segura.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="disable-password">Senha</Label>
              <Input
                id="disable-password"
                type="password"
                placeholder="Digite sua senha"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisableDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisable}
              disabled={disableMutation.isPending}
            >
              {disableMutation.isPending ? "Desabilitando..." : "Desabilitar 2FA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Backup */}
      <Dialog open={backupDialogOpen} onOpenChange={setBackupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gerar Backup do Sistema
            </DialogTitle>
            <DialogDescription>
              Será gerado um backup completo do banco de dados e enviado para o email cadastrado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                O backup incluirá:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Todos os clientes</li>
                  <li>Todos os empréstimos</li>
                  <li>Todas as parcelas</li>
                  <li>Configurações do sistema</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBackupDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => backupMutation.mutate()}
              disabled={backupMutation.isPending}
            >
              {backupMutation.isPending ? "Gerando..." : "Gerar e Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Pânico */}
      <Dialog open={panicDialogOpen} onOpenChange={setPanicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Siren className="h-5 w-5" />
              Confirmar Botão de Pânico
            </DialogTitle>
            <DialogDescription>
              Esta ação é IRREVERSÍVEL. Digite sua senha para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>O que acontecerá:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Backup automático será gerado</li>
                  <li>Backup será enviado por email</li>
                  <li>TODOS os dados de clientes serão apagados</li>
                  <li>TODOS os empréstimos serão apagados</li>
                  <li>TODAS as parcelas serão apagadas</li>
                  <li>Ação será registrada no log</li>
                </ol>
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="panic-password">Senha de Administrador</Label>
              <Input
                id="panic-password"
                type="password"
                placeholder="Digite sua senha"
                value={panicPassword}
                onChange={(e) => setPanicPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setPanicDialogOpen(false);
              setPanicPassword("");
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!panicPassword) {
                  toast.error("Digite sua senha");
                  return;
                }
                panicMutation.mutate({ password: panicPassword });
              }}
              disabled={panicMutation.isPending}
            >
              {panicMutation.isPending ? "Executando..." : "Confirmar Pânico"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Criar Novo Usuário */}
      <Dialog open={createUserDialogOpen} onOpenChange={setCreateUserDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Criar Novo Usuário
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do novo usuário do sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username *</Label>
              <Input
                id="new-username"
                placeholder="Digite o username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Senha *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-nome">Nome Completo *</Label>
              <Input
                id="new-nome"
                placeholder="Digite o nome completo"
                value={newUser.nome}
                onChange={(e) => setNewUser({ ...newUser, nome: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="email@exemplo.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Permissão *</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: "admin" | "operador") => setNewUser({ ...newUser, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operador">Operador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setCreateUserDialogOpen(false);
              setNewUser({
                username: "",
                password: "",
                nome: "",
                email: "",
                role: "operador",
              });
            }}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!newUser.username || !newUser.password || !newUser.nome) {
                  toast.error("Preencha todos os campos obrigatórios");
                  return;
                }
                createUserMutation.mutate(newUser);
              }}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Excluir Usuário */}
      <Dialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Excluir Usuário
            </DialogTitle>
            <DialogDescription>
              Esta ação é permanente. Digite sua senha para confirmar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Você está prestes a excluir o usuário <strong>{userToDelete?.nome}</strong>.
                Esta ação não pode ser desfeita.
              </AlertDescription>
            </Alert>
            <div className="space-y-2">
              <Label htmlFor="delete-user-password">Senha de Administrador</Label>
              <Input
                id="delete-user-password"
                type="password"
                placeholder="Digite sua senha"
                value={deleteUserPassword}
                onChange={(e) => setDeleteUserPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteUserDialogOpen(false);
              setDeleteUserPassword("");
              setUserToDelete(null);
            }}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!deleteUserPassword) {
                  toast.error("Digite sua senha");
                  return;
                }
                if (!userToDelete) return;
                deleteUserMutation.mutate({ 
                  userId: userToDelete.id, 
                  password: deleteUserPassword 
                });
              }}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
