import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, Eye, Mail, Edit } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Emprestimos() {
  const [location, setLocation] = useLocation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroClienteId, setFiltroClienteId] = useState<number | null>(null);

  // Ler filtros da URL
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const status = params.get('status');
    const clienteId = params.get('clienteId');
    if (status) {
      setFiltroStatus(status);
    }
    if (clienteId) {
      setFiltroClienteId(parseInt(clienteId));
    }
  }, [location]);
  const [formData, setFormData] = useState({
    tipoEmprestimo: "parcelado" as "parcelado" | "juros_recorrente",
    clienteId: "",
    valorEmprestado: "",
    taxaJuros: "",
    dataEmprestimo: new Date().toISOString().split("T")[0],
  });

  const utils = trpc.useUtils();
  const { data: emprestimosData, isLoading } = trpc.emprestimos.list.useQuery();

  // Filtrar empréstimos por status e cliente
  const emprestimos = emprestimosData?.filter((emp) => {
    let match = true;
    if (filtroStatus) {
      match = match && emp.status.toLowerCase() === filtroStatus.toLowerCase();
    }
    if (filtroClienteId) {
      match = match && emp.clienteId === filtroClienteId;
    }
    return match;
  }) || [];
  const { data: clientes } = trpc.clientes.list.useQuery();

  const createMutation = trpc.emprestimos.create.useMutation({
    onSuccess: () => {
      utils.emprestimos.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDialogOpen(false);
      resetForm();
      toast.success("Empréstimo cadastrado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao cadastrar empréstimo");
    },
  });

  const createJurosRecorrenteMutation = trpc.emprestimos.createJurosRecorrente.useMutation({
    onSuccess: () => {
      utils.emprestimos.list.invalidate();
      utils.dashboard.stats.invalidate();
      setDialogOpen(false);
      resetForm();
      toast.success("Empréstimo com juros recorrente cadastrado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao cadastrar empréstimo");
    },
  });

  const pagarMutation = trpc.emprestimos.marcarComoPago.useMutation({
    onSuccess: () => {
      utils.emprestimos.list.invalidate();
      utils.dashboard.stats.invalidate();
      toast.success("Empréstimo marcado como pago!");
    },
    onError: () => {
      toast.error("Erro ao marcar empréstimo como pago");
    },
  });

  const enviarLembreteMutation = trpc.emprestimos.enviarLembreteAtraso.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEnviarLembrete = (emprestimoId: number, clienteNome: string) => {
    if (confirm(`Enviar lembrete de atraso para ${clienteNome}?`)) {
      enviarLembreteMutation.mutate({ emprestimoId });
    }
  };

  const resetForm = () => {
    setFormData({
      tipoEmprestimo: "parcelado",
      clienteId: "",
      valorEmprestado: "",
      taxaJuros: "",
      dataEmprestimo: new Date().toISOString().split("T")[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tipoEmprestimo === "juros_recorrente") {
      // Criar empréstimo com juros recorrente
      createJurosRecorrenteMutation.mutate({
        clienteId: parseInt(formData.clienteId),
        valorEmprestado: parseFloat(formData.valorEmprestado),
        taxaJuros: parseFloat(formData.taxaJuros),
        dataEmprestimo: formData.dataEmprestimo,
      });
    } else {
      // Criar empréstimo parcelado sem parcelas (adicionar manualmente depois)
      createMutation.mutate({
        clienteId: parseInt(formData.clienteId),
        valorEmprestado: parseFloat(formData.valorEmprestado),
        taxaJuros: parseFloat(formData.taxaJuros),
        quantidadeParcelas: 0, // Sem parcelas iniciais
        valorParcela: 0,
        dataEmprestimo: formData.dataEmprestimo,
        dataVencimento: formData.dataEmprestimo, // Usar data do empréstimo como padrão
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pendente: "secondary",
      pago: "default",
      atrasado: "destructive",
    };

    const labels: Record<string, string> = {
      pendente: "Pendente",
      pago: "Pago",
      atrasado: "Atrasado",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Empréstimos</h1>
          {filtroClienteId && clientes && (
            <p className="text-sm text-muted-foreground mt-1">
              Mostrando empréstimos de: <span className="font-semibold">
                {clientes.find(c => c.id === filtroClienteId)?.nome || 'Cliente'}
              </span>
              {filtroStatus && (
                <span> - Status: <span className="font-semibold capitalize">{filtroStatus}</span></span>
              )}
            </p>
          )}
        </div>
      </div>
      
      {/* Botões de Filtro */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={filtroStatus === "" ? "default" : "outline"}
          onClick={() => {
            setFiltroStatus("");
            setFiltroClienteId(null);
            setLocation("/emprestimos");
          }}
        >
          Todos
        </Button>
        <Button
          variant={filtroStatus === "pago" ? "default" : "outline"}
          onClick={() => {
            setFiltroStatus("pago");
            setLocation("/emprestimos?status=pago");
          }}
          className={filtroStatus === "pago" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          Pagos
        </Button>
        <Button
          variant={filtroStatus === "pendente" ? "default" : "outline"}
          onClick={() => {
            setFiltroStatus("pendente");
            setLocation("/emprestimos?status=pendente");
          }}
          className={filtroStatus === "pendente" ? "bg-yellow-600 hover:bg-yellow-700" : ""}
        >
          Pendentes
        </Button>
        <Button
          variant={filtroStatus === "atrasado" ? "default" : "outline"}
          onClick={() => {
            setFiltroStatus("atrasado");
            setLocation("/emprestimos?status=atrasado");
          }}
          className={filtroStatus === "atrasado" ? "bg-red-600 hover:bg-red-700" : ""}
        >
          Atrasados
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="ml-auto">
              <Plus className="mr-2 h-4 w-4" />
              Novo Empréstimo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Novo Empréstimo</DialogTitle>
                <DialogDescription>
                  Cadastre um novo empréstimo no sistema
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="tipoEmprestimo">Tipo de Empréstimo *</Label>
                  <Select
                    value={formData.tipoEmprestimo}
                    onValueChange={(value: "parcelado" | "juros_recorrente") => setFormData({ ...formData, tipoEmprestimo: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parcelado">Parcelado (com prazo definido)</SelectItem>
                      <SelectItem value="juros_recorrente">Juros Recorrente (pagamento mensal)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="clienteId">Cliente *</Label>
                  <Select
                    value={formData.clienteId}
                    onValueChange={(value) => setFormData({ ...formData, clienteId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes?.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id.toString()}>
                          {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valorEmprestado">Valor Emprestado (R$) *</Label>
                  <Input
                    id="valorEmprestado"
                    type="number"
                    step="0.01"
                    value={formData.valorEmprestado}
                    onChange={(e) => setFormData({ ...formData, valorEmprestado: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="taxaJuros">Taxa de Juros Mensal (%) *</Label>
                  <Input
                    id="taxaJuros"
                    type="number"
                    step="0.01"
                    value={formData.taxaJuros}
                    onChange={(e) => setFormData({ ...formData, taxaJuros: e.target.value })}
                    required
                    placeholder="Ex: 8 para 8% ao mês"
                  />
                </div>
                {/* Informação adicional para emprestimo parcelado */}
                {formData.tipoEmprestimo === "parcelado" && (
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <p className="font-semibold mb-1">ℹ️ Empréstimo Parcelado</p>
                    <p>Após cadastrar, você poderá adicionar as parcelas manualmente na página de detalhes do empréstimo.</p>
                  </div>
                )}
                
                <div className="grid gap-2">
                  <Label htmlFor="dataEmprestimo">Data do Empréstimo *</Label>
                  <Input
                    id="dataEmprestimo"
                    type="date"
                    value={formData.dataEmprestimo}
                    onChange={(e) => setFormData({ ...formData, dataEmprestimo: e.target.value })}
                    required
                  />
                </div>
                
                {/* Informação adicional para juros recorrente */}
                {formData.tipoEmprestimo === "juros_recorrente" && (
                  <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <p className="font-semibold mb-1">ℹ️ Empréstimo com Juros Recorrente</p>
                    <p>O cliente pagará apenas os juros mensalmente. Você poderá registrar os pagamentos de juros e amortizações manualmente na página de detalhes do empréstimo.</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending || createJurosRecorrenteMutation.isPending}>
                  Cadastrar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Empréstimos</CardTitle>
          <CardDescription>Gerencie seus empréstimos cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Carregando...</div>
          ) : emprestimos && emprestimos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor Emprestado</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emprestimos.map((emprestimo) => (
                  <TableRow key={emprestimo.id}>
                    <TableCell className="font-medium">
                      {emprestimo.cliente?.nome || "Cliente não encontrado"}
                    </TableCell>
                    <TableCell>
                      {emprestimo.tipoEmprestimo === "juros_recorrente" ? (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Juros Recorrente</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Parcelado</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(emprestimo.valorEmprestado)}</TableCell>
                    <TableCell>{emprestimo.dataVencimento ? formatDate(emprestimo.dataVencimento) : 'N/A'}</TableCell>
                    <TableCell>{getStatusBadge(emprestimo.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/emprestimos/${emprestimo.id}`)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/emprestimos/${emprestimo.id}`)}
                          title="Editar empréstimo"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {emprestimo.status !== "pago" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => pagarMutation.mutate({ id: emprestimo.id })}
                            title="Marcar como pago"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        {emprestimo.status === "atrasado" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEnviarLembrete(emprestimo.id, emprestimo.cliente?.nome || "Cliente")}
                            title="Enviar lembrete de atraso"
                            disabled={enviarLembreteMutation.isPending}
                          >
                            <Mail className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum empréstimo cadastrado. Clique em "Novo Empréstimo" para começar.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
