import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Circle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type Usuario = {
  id: number;
  username: string;
  nome: string;
  email: string | null;
  role: "admin" | "operador";
  ativo: number;
  twoFactorEnabled: number;
  lastActivity: Date | null;
  createdAt: Date;
};

export default function UsuariosOnline() {
  const { data: usuarios, isLoading } = trpc.auth.listUsers.useQuery(undefined, {
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  }) as { data: Usuario[] | undefined; isLoading: boolean };

  // Considera online se última atividade foi há menos de 5 minutos
  const isOnline = (lastActivity: Date | null) => {
    if (!lastActivity) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActivity) > fiveMinutesAgo;
  };

  const usuariosOnline = usuarios?.filter(u => isOnline(u.lastActivity)) || [];
  const usuariosOffline = usuarios?.filter(u => !isOnline(u.lastActivity)) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários Online</h1>
        <p className="text-muted-foreground mt-2">
          Monitore quais usuários estão ativos no sistema em tempo real
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Card: Usuários Online */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-green-600 fill-green-600" />
              Online
              <span className="text-sm font-normal text-muted-foreground">
                ({usuariosOnline.length})
              </span>
            </CardTitle>
            <CardDescription>
              Usuários ativos nos últimos 5 minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : usuariosOnline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum usuário online no momento</p>
            ) : (
              <div className="space-y-3">
                {usuariosOnline.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-green-600 fill-green-600 animate-pulse" />
                        <span className="font-medium">{usuario.nome}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {usuario.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{usuario.username}
                      </p>
                    </div>
                    {usuario.lastActivity && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(usuario.lastActivity), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Usuários Offline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Circle className="h-5 w-5 text-gray-400 fill-gray-400" />
              Offline
              <span className="text-sm font-normal text-muted-foreground">
                ({usuariosOffline.length})
              </span>
            </CardTitle>
            <CardDescription>
              Usuários inativos há mais de 5 minutos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : usuariosOffline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todos os usuários estão online</p>
            ) : (
              <div className="space-y-3">
                {usuariosOffline.map((usuario) => (
                  <div key={usuario.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-gray-400 fill-gray-400" />
                        <span className="font-medium">{usuario.nome}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                          {usuario.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        @{usuario.username}
                      </p>
                    </div>
                    {usuario.lastActivity && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(usuario.lastActivity), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Card: Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Estatísticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl font-bold">{usuarios?.length || 0}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Online Agora</p>
              <p className="text-2xl font-bold text-green-600">{usuariosOnline.length}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Taxa de Atividade</p>
              <p className="text-2xl font-bold">
                {usuarios && usuarios.length > 0
                  ? Math.round((usuariosOnline.length / usuarios.length) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
