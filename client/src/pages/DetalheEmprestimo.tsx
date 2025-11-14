import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Check, Download, Edit, Info, DollarSign, TrendingDown, Trash2 } from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function DetalheEmprestimo() {
  const [, params] = useRoute("/emprestimos/:id");
  const [, setLocation] = useLocation();
  const emprestimoId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  // Estados para edição de parcela
  const [editParcelaDialogOpen, setEditParcelaDialogOpen] = useState(false);
  const [parcelaToEdit, setParcelaToEdit] = useState<any>(null);
  const [editParcelaForm, setEditParcelaForm] = useState({
    valorParcela: "",
    dataVencimento: "",
    dataPagamento: "",
    status: "pendente" as "pendente" | "pago" | "atrasado",
  });
  
  // Estados para edição de empréstimo
  const [editEmprestimoDialogOpen, setEditEmprestimoDialogOpen] = useState(false);
  const [editEmprestimoForm, setEditEmprestimoForm] = useState({
    valorEmprestado: "",
    taxaJuros: "",
    dataEmprestimo: "",
    dataVencimento: "",
  });
  
  // Estados para juros recorrente
  const [pagamentoJurosDialogOpen, setPagamentoJurosDialogOpen] = useState(false);
  const [pagamentoJurosForm, setPagamentoJurosForm] = useState({
    valorPago: "",
    dataPagamento: new Date().toISOString().split("T")[0],
    observacao: "",
  });
  
  const [amortizacaoDialogOpen, setAmortizacaoDialogOpen] = useState(false);
  const [amortizacaoForm, setAmortizacaoForm] = useState({
    valorAmortizado: "",
    dataAmortizacao: new Date().toISOString().split("T")[0],
    observacao: "",
  });
  
  // Estados para editar pagamento de juros
  const [editPagamentoJurosDialogOpen, setEditPagamentoJurosDialogOpen] = useState(false);
  const [pagamentoJurosToEdit, setPagamentoJurosToEdit] = useState<any>(null);
  const [editPagamentoJurosForm, setEditPagamentoJurosForm] = useState({
    valorPago: "",
    dataPagamento: "",
    observacao: "",
  });
  
  // Estados para editar amortização
  const [editAmortizacaoDialogOpen, setEditAmortizacaoDialogOpen] = useState(false);
  const [amortizacaoToEdit, setAmortizacaoToEdit] = useState<any>(null);
  const [editAmortizacaoForm, setEditAmortizacaoForm] = useState({
    valorAmortizado: "",
    dataAmortizacao: "",
    observacao: "",
  });
  
  const [recalcularDialogOpen, setRecalcularDialogOpen] = useState(false);
  
  // Estados para adicionar parcela
  const [adicionarParcelaDialogOpen, setAdicionarParcelaDialogOpen] = useState(false);
  const [adicionarParcelaForm, setAdicionarParcelaForm] = useState({
    numeroParcela: "",
    valorParcela: "",
    dataVencimento: "",
  });

  const utils = trpc.useUtils();
  const { data: emprestimo, isLoading: loadingEmprestimo } = trpc.emprestimos.getById.useQuery({ id: emprestimoId });
  const { data: parcelas, isLoading: loadingParcelas } = trpc.emprestimos.getParcelas.useQuery({ emprestimoId });
  const { data: cliente } = trpc.clientes.getById.useQuery({ id: emprestimo?.clienteId || 0 }, { enabled: !!emprestimo });
  
  // Queries para juros recorrente
  const isJurosRecorrente = emprestimo?.tipoEmprestimo === "juros_recorrente";
  const { data: pagamentosJuros } = trpc.emprestimos.listPagamentosJuros.useQuery(
    { emprestimoId },
    { enabled: isJurosRecorrente }
  );
  const { data: amortizacoes } = trpc.emprestimos.listAmortizacoes.useQuery(
    { emprestimoId },
    { enabled: isJurosRecorrente }
  );
  const { data: totaisJurosRecorrente } = trpc.emprestimos.getTotaisJurosRecorrente.useQuery(
    { emprestimoId },
    { enabled: isJurosRecorrente }
  );

  const pagarParcelaMutation = trpc.emprestimos.pagarParcela.useMutation({
    onSuccess: () => {
      utils.emprestimos.getParcelas.invalidate({ emprestimoId });
      utils.emprestimos.list.invalidate();
      toast.success("Parcela marcada como paga!");
    },
    onError: () => {
      toast.error("Erro ao marcar parcela como paga");
    },
  });
  
  const editParcelaMutation = trpc.emprestimos.updateParcela.useMutation({
    onSuccess: () => {
      utils.emprestimos.getParcelas.invalidate({ emprestimoId });
      utils.emprestimos.list.invalidate();
      setEditParcelaDialogOpen(false);
      toast.success("Parcela atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar parcela");
    },
  });
  
  const editEmprestimoMutation = trpc.emprestimos.updateEmprestimo.useMutation({
    onSuccess: () => {
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      utils.emprestimos.list.invalidate();
      setEditEmprestimoDialogOpen(false);
      toast.success("Empréstimo atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar empréstimo");
    },
  });
  
  const deleteParcelaMutation = trpc.emprestimos.deleteParcela.useMutation({
    onSuccess: () => {
      utils.emprestimos.getParcelas.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      utils.emprestimos.list.invalidate();
      toast.success("Parcela excluída com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir parcela");
    },
  });
  
  const registrarPagamentoJurosMutation = trpc.emprestimos.registrarPagamentoJuros.useMutation({
    onSuccess: () => {
      utils.emprestimos.listPagamentosJuros.invalidate({ emprestimoId });
      utils.emprestimos.getTotaisJurosRecorrente.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      setPagamentoJurosDialogOpen(false);
      setPagamentoJurosForm({
        valorPago: "",
        dataPagamento: new Date().toISOString().split("T")[0],
        observacao: "",
      });
      toast.success("Pagamento de juros registrado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar pagamento de juros");
    },
  });
  
  const registrarAmortizacaoMutation = trpc.emprestimos.registrarAmortizacao.useMutation({
    onSuccess: () => {
      utils.emprestimos.listAmortizacoes.invalidate({ emprestimoId });
      utils.emprestimos.getTotaisJurosRecorrente.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      setAmortizacaoDialogOpen(false);
      setAmortizacaoForm({
        valorAmortizado: "",
        dataAmortizacao: new Date().toISOString().split("T")[0],
        observacao: "",
      });
      toast.success("Amortização registrada com sucesso! Juros recalculados.");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar amortização");
    },
  });
  
  const updatePagamentoJurosMutation = trpc.emprestimos.updatePagamentoJuros.useMutation({
    onSuccess: () => {
      utils.emprestimos.listPagamentosJuros.invalidate({ emprestimoId });
      utils.emprestimos.getTotaisJurosRecorrente.invalidate({ emprestimoId });
      setEditPagamentoJurosDialogOpen(false);
      toast.success("Pagamento de juros atualizado com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar pagamento de juros");
    },
  });
  
  const deletePagamentoJurosMutation = trpc.emprestimos.deletePagamentoJuros.useMutation({
    onSuccess: () => {
      utils.emprestimos.listPagamentosJuros.invalidate({ emprestimoId });
      utils.emprestimos.getTotaisJurosRecorrente.invalidate({ emprestimoId });
      toast.success("Pagamento de juros excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir pagamento de juros");
    },
  });
  
  const updateAmortizacaoMutation = trpc.emprestimos.updateAmortizacao.useMutation({
    onSuccess: () => {
      utils.emprestimos.listAmortizacoes.invalidate({ emprestimoId });
      utils.emprestimos.getTotaisJurosRecorrente.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      setEditAmortizacaoDialogOpen(false);
      toast.success("Amortização atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar amortização");
    },
  });
  
  const deleteAmortizacaoMutation = trpc.emprestimos.deleteAmortizacao.useMutation({
    onSuccess: () => {
      utils.emprestimos.listAmortizacoes.invalidate({ emprestimoId });
      utils.emprestimos.getTotaisJurosRecorrente.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      toast.success("Amortização excluída com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir amortização");
    },
  });
  
  const recalcularParcelasMutation = trpc.emprestimos.recalcularParcelas.useMutation({
    onSuccess: (data) => {
      utils.emprestimos.getParcelas.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      setRecalcularDialogOpen(false);
      toast.success(
        `Parcelas recalculadas! ${data.parcelasAtualizadas} atualizadas, ${data.parcelasCriadas} criadas, ${data.parcelasPreservadas} preservadas (pagas).`
      );
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao recalcular parcelas");
    },
  });
  
  const adicionarParcelaMutation = trpc.emprestimos.createParcela.useMutation({
    onSuccess: () => {
      utils.emprestimos.getParcelas.invalidate({ emprestimoId });
      utils.emprestimos.getById.invalidate({ id: emprestimoId });
      setAdicionarParcelaDialogOpen(false);
      setAdicionarParcelaForm({
        numeroParcela: "",
        valorParcela: "",
        dataVencimento: "",
      });
      toast.success("Parcela adicionada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao adicionar parcela");
    },
  });

  if (loadingEmprestimo || loadingParcelas) {
    return (
      <div className="container py-8">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!emprestimo) {
    return (
      <div className="container py-8">
        <p>Empréstimo não encontrado</p>
      </div>
    );
  }

  const valorEmprestado = emprestimo.valorEmprestado / 100;
  const taxaJuros = emprestimo.taxaJuros / 100;
  
  // Calcular valor total dinamicamente com base nas parcelas reais
  const parcelasPagas = parcelas?.filter(p => p.status === "pago").length || 0;
  const totalParcelas = parcelas?.length || 0;
  const valorPago = parcelas?.filter(p => p.status === "pago").reduce((sum, p) => sum + (p.valorPago || 0), 0) || 0;
  const valorTotalCentavos = parcelas?.reduce((sum, p) => sum + p.valorParcela, 0) || 0;
  const valorTotal = valorTotalCentavos / 100;
  const valorRestante = (valorTotalCentavos - valorPago) / 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pago":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "atrasado":
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const handlePagarParcela = (parcelaId: number, valorParcela: number) => {
    if (confirm("Confirma o pagamento desta parcela?")) {
      pagarParcelaMutation.mutate({ id: parcelaId, valorPago: valorParcela / 100 });
    }
  };
  
  const handleEditParcela = (parcela: any) => {
    setParcelaToEdit(parcela);
    setEditParcelaForm({
      valorParcela: (parcela.valorParcela / 100).toString(),
      dataVencimento: new Date(parcela.dataVencimento).toISOString().split('T')[0],
      dataPagamento: parcela.dataPagamento ? new Date(parcela.dataPagamento).toISOString().split('T')[0] : "",
      status: parcela.status,
    });
    setEditParcelaDialogOpen(true);
  };
  
  const handleSaveEditParcela = () => {
    if (!parcelaToEdit) {
      toast.error("Nenhuma parcela selecionada para edição");
      return;
    }
    
    if (!editParcelaForm.valorParcela || parseFloat(editParcelaForm.valorParcela) <= 0) {
      toast.error("Valor da parcela deve ser maior que zero");
      return;
    }
    
    if (!editParcelaForm.dataVencimento) {
      toast.error("Data de vencimento é obrigatória");
      return;
    }
    
    const updates: any = {
      id: parcelaToEdit.id,
      valorParcela: parseFloat(editParcelaForm.valorParcela),
      dataVencimento: editParcelaForm.dataVencimento,
      status: editParcelaForm.status,
    };
    
    if (editParcelaForm.dataPagamento) {
      updates.dataPagamento = editParcelaForm.dataPagamento;
    }
    
    editParcelaMutation.mutate(updates);
  };
  
  const handleEditEmprestimo = () => {
    if (!emprestimo) return;
    
    setEditEmprestimoForm({
      valorEmprestado: (emprestimo.valorEmprestado / 100).toString(),
      taxaJuros: (emprestimo.taxaJuros / 100).toString(),
      dataEmprestimo: new Date(emprestimo.dataEmprestimo).toISOString().split('T')[0],
      dataVencimento: emprestimo.dataVencimento ? new Date(emprestimo.dataVencimento).toISOString().split('T')[0] : '',
    });
    setEditEmprestimoDialogOpen(true);
  };
  
  const handleSaveEditEmprestimo = () => {
    editEmprestimoMutation.mutate({
      id: emprestimoId,
      valorEmprestado: parseFloat(editEmprestimoForm.valorEmprestado),
      taxaJuros: parseFloat(editEmprestimoForm.taxaJuros),
      dataEmprestimo: editEmprestimoForm.dataEmprestimo,
      dataVencimento: editEmprestimoForm.dataVencimento,
    });
  };
  
  const handleDeleteParcela = (parcelaId: number) => {
    if (confirm("Tem certeza que deseja excluir esta parcela? Esta ação não pode ser desfeita.")) {
      deleteParcelaMutation.mutate({ id: parcelaId });
    }
  };

  const handleExportarExcel = () => {
    toast.info("Funcionalidade de exportação em desenvolvimento");
  };
  
  const handleRegistrarPagamentoJuros = () => {
    if (!pagamentoJurosForm.valorPago || parseFloat(pagamentoJurosForm.valorPago) <= 0) {
      toast.error("Valor pago deve ser maior que zero");
      return;
    }
    
    registrarPagamentoJurosMutation.mutate({
      emprestimoId,
      valorPago: parseFloat(pagamentoJurosForm.valorPago),
      dataPagamento: pagamentoJurosForm.dataPagamento,
      observacao: pagamentoJurosForm.observacao || undefined,
    });
  };
  
  const handleRegistrarAmortizacao = () => {
    if (!amortizacaoForm.valorAmortizado || parseFloat(amortizacaoForm.valorAmortizado) <= 0) {
      toast.error("Valor amortizado deve ser maior que zero");
      return;
    }
    
    registrarAmortizacaoMutation.mutate({
      emprestimoId,
      valorAmortizado: parseFloat(amortizacaoForm.valorAmortizado),
      dataAmortizacao: amortizacaoForm.dataAmortizacao,
      observacao: amortizacaoForm.observacao || undefined,
    });
  };
  
  const handleEditPagamentoJuros = (pagamento: any) => {
    setPagamentoJurosToEdit(pagamento);
    setEditPagamentoJurosForm({
      valorPago: (pagamento.valorPago / 100).toString(),
      dataPagamento: new Date(pagamento.dataPagamento).toISOString().split('T')[0],
      observacao: pagamento.observacao || "",
    });
    setEditPagamentoJurosDialogOpen(true);
  };
  
  const handleSaveEditPagamentoJuros = () => {
    if (!pagamentoJurosToEdit) return;
    
    if (!editPagamentoJurosForm.valorPago || parseFloat(editPagamentoJurosForm.valorPago) <= 0) {
      toast.error("Valor pago deve ser maior que zero");
      return;
    }
    
    updatePagamentoJurosMutation.mutate({
      id: pagamentoJurosToEdit.id,
      valorPago: parseFloat(editPagamentoJurosForm.valorPago),
      dataPagamento: editPagamentoJurosForm.dataPagamento,
      observacao: editPagamentoJurosForm.observacao,
    });
  };
  
  const handleDeletePagamentoJuros = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este pagamento de juros?")) {
      deletePagamentoJurosMutation.mutate({ id });
    }
  };
  
  const handleEditAmortizacao = (amortizacao: any) => {
    setAmortizacaoToEdit(amortizacao);
    setEditAmortizacaoForm({
      valorAmortizado: (amortizacao.valorAmortizado / 100).toString(),
      dataAmortizacao: new Date(amortizacao.dataAmortizacao).toISOString().split('T')[0],
      observacao: amortizacao.observacao || "",
    });
    setEditAmortizacaoDialogOpen(true);
  };
  
  const handleSaveEditAmortizacao = () => {
    if (!amortizacaoToEdit) return;
    
    if (!editAmortizacaoForm.valorAmortizado || parseFloat(editAmortizacaoForm.valorAmortizado) <= 0) {
      toast.error("Valor amortizado deve ser maior que zero");
      return;
    }
    
    updateAmortizacaoMutation.mutate({
      id: amortizacaoToEdit.id,
      valorAmortizado: parseFloat(editAmortizacaoForm.valorAmortizado),
      dataAmortizacao: editAmortizacaoForm.dataAmortizacao,
      observacao: editAmortizacaoForm.observacao,
    });
  };
  
  const handleDeleteAmortizacao = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta amortização? O saldo devedor será recalculado.")) {
      deleteAmortizacaoMutation.mutate({ id });
    }
  };
  
  const handleAdicionarParcela = () => {
    if (!adicionarParcelaForm.numeroParcela || !adicionarParcelaForm.valorParcela || !adicionarParcelaForm.dataVencimento) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    adicionarParcelaMutation.mutate({
      emprestimoId,
      numeroParcela: parseInt(adicionarParcelaForm.numeroParcela),
      valorParcela: parseFloat(adicionarParcelaForm.valorParcela),
      dataVencimento: adicionarParcelaForm.dataVencimento,
    });
  };

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/emprestimos")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Detalhes do Empréstimo</h1>
              {isJurosRecorrente ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  Juros Recorrente
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                  Parcelado
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Cliente: {cliente?.nome}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEditEmprestimo}>
            <Edit className="h-4 w-4 mr-2" />
            Editar Empréstimo
          </Button>
          <Button onClick={handleExportarExcel}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Excel
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      {isJurosRecorrente ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Emprestado</CardDescription>
              <CardTitle className="text-2xl">R$ {valorEmprestado.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Saldo Devedor</CardDescription>
              <CardTitle className="text-2xl text-orange-600">
                R$ {((totaisJurosRecorrente?.saldoDevedor || 0) / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Pago (Juros + Amortização)</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                R$ {((totaisJurosRecorrente?.totalPago || 0) / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Juros Mensal Atual</CardDescription>
              <CardTitle className="text-2xl text-blue-600">
                R$ {((totaisJurosRecorrente?.valorJurosMensal || 0) / 100).toFixed(2)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Emprestado</CardDescription>
              <CardTitle className="text-2xl">R$ {valorEmprestado.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Total</CardDescription>
              <CardTitle className="text-2xl">R$ {valorTotal.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Pago</CardDescription>
              <CardTitle className="text-2xl text-green-600">R$ {(valorPago / 100).toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Valor Restante</CardDescription>
              <CardTitle className="text-2xl text-orange-600">R$ {valorRestante.toFixed(2)}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Informações do Empréstimo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa de Juros:</span>
            <span className="font-medium">{taxaJuros.toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Data do Empréstimo:</span>
            <span className="font-medium">{new Date(emprestimo.dataEmprestimo).toLocaleDateString("pt-BR")}</span>
          </div>
          {emprestimo.dataVencimento && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data de Vencimento:</span>
              <span className="font-medium">{new Date(emprestimo.dataVencimento).toLocaleDateString("pt-BR")}</span>
            </div>
          )}
          {!isJurosRecorrente && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Parcelas Pagas:</span>
              <span className="font-medium">{parcelasPagas} de {totalParcelas}</span>
            </div>
          )}
          {isAdmin && emprestimo.modificadoPor && (
            <>
              <div className="h-px bg-border my-2" />
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Última modificação por <strong>{emprestimo.modificadoPor}</strong> em{" "}
                  {new Date(emprestimo.modificadoEm!).toLocaleString("pt-BR")}
                </AlertDescription>
              </Alert>
            </>
          )}
        </CardContent>
      </Card>

      {/* Tabela diferente para cada tipo */}
      {isJurosRecorrente ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Histórico de Pagamentos e Amortizações</CardTitle>
                <CardDescription>
                  Gerencie pagamentos de juros mensais (R$ {((emprestimo.valorJurosMensal || 0) / 100).toFixed(2)}/mês) e amortizações do principal
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setPagamentoJurosDialogOpen(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <DollarSign className="h-5 w-5 mr-2" />
                  Registrar Pagamento de Juros
                </Button>
                <Button onClick={() => setAmortizacaoDialogOpen(true)} variant="outline" size="lg">
                  <TrendingDown className="h-5 w-5 mr-2" />
                  Registrar Amortização
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(() => {
              const pagamentos: Array<{
                id: number;
                tipo: 'juros' | 'amortizacao';
                data: Date;
                valor: number;
                observacao?: string;
                saldoNovo?: number;
                jurosNovo?: number;
                item: any;
              }> = [];
              
              pagamentosJuros?.forEach(p => {
                pagamentos.push({
                  id: p.id,
                  tipo: 'juros',
                  data: new Date(p.dataPagamento),
                  valor: p.valorPago,
                  observacao: p.observacao || undefined,
                  item: p,
                });
              });
              
              amortizacoes?.forEach(a => {
                pagamentos.push({
                  id: a.id,
                  tipo: 'amortizacao',
                  data: new Date(a.dataAmortizacao),
                  valor: a.valorAmortizado,
                  observacao: a.observacao || undefined,
                  saldoNovo: a.saldoNovo,
                  jurosNovo: a.jurosNovo,
                  item: a,
                });
              });
              
              pagamentos.sort((a, b) => b.data.getTime() - a.data.getTime());
              
              return pagamentos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead>Saldo Após</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagamentos.map((pag) => (
                      <TableRow key={`${pag.tipo}-${pag.id}`}>
                        <TableCell>{pag.data.toLocaleDateString("pt-BR")}</TableCell>
                        <TableCell>
                          {pag.tipo === 'juros' ? (
                            <Badge className="bg-blue-500">Pagamento de Juros</Badge>
                          ) : (
                            <Badge className="bg-purple-500">Amortização</Badge>
                          )}
                        </TableCell>
                        <TableCell>R$ {(pag.valor / 100).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{pag.observacao || "-"}</TableCell>
                        <TableCell>
                          {pag.saldoNovo !== undefined ? (
                            <span className="font-medium">R$ {(pag.saldoNovo / 100).toFixed(2)}</span>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => pag.tipo === 'juros' ? handleEditPagamentoJuros(pag.item) : handleEditAmortizacao(pag.item)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => pag.tipo === 'juros' ? handleDeletePagamentoJuros(pag.id) : handleDeleteAmortizacao(pag.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">Nenhum pagamento registrado ainda</p>
                  <p className="text-muted-foreground mb-4">
                    Clique em "Registrar Pagamento de Juros" para adicionar os pagamentos mensais
                  </p>
                  <Button onClick={() => setPagamentoJurosDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Registrar Primeiro Pagamento
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle>Parcelas</CardTitle>
                <CardDescription>
                  Adicione e gerencie as parcelas manualmente
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default"
                  size="lg"
                  onClick={() => setAdicionarParcelaDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Adicionar Parcela
                </Button>
                {isAdmin && emprestimo.tipoEmprestimo === "parcelado" && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setRecalcularDialogOpen(true)}
                  >
                    Recalcular Parcelas
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {parcelas && parcelas.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Pagamento</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcelas.map((parcela) => (
                  <TableRow key={parcela.id}>
                    <TableCell className="font-medium">{parcela.numeroParcela}</TableCell>
                    <TableCell>{new Date(parcela.dataVencimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>R$ {(parcela.valorParcela / 100).toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(parcela.status)}</TableCell>
                    <TableCell>
                      {parcela.dataPagamento
                        ? new Date(parcela.dataPagamento).toLocaleDateString("pt-BR")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditParcela(parcela)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </Button>
                        {parcela.status !== "pago" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePagarParcela(parcela.id, parcela.valorParcela)}
                            disabled={pagarParcelaMutation.isPending}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Pagar
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteParcela(parcela.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma parcela cadastrada para este empréstimo.
            </p>
          )}
        </CardContent>
      </Card>
      )}
      
      {/* Dialog de Editar Parcela */}
      <Dialog open={editParcelaDialogOpen} onOpenChange={setEditParcelaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Parcela</DialogTitle>
            <DialogDescription>
              Modifique as informações da parcela abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorParcela">Valor da Parcela (R$) *</Label>
              <Input
                id="valorParcela"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={editParcelaForm.valorParcela}
                onChange={(e) => setEditParcelaForm({ ...editParcelaForm, valorParcela: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={editParcelaForm.dataVencimento}
                onChange={(e) => setEditParcelaForm({ ...editParcelaForm, dataVencimento: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataPagamento">Data de Pagamento (opcional)</Label>
              <Input
                id="dataPagamento"
                type="date"
                value={editParcelaForm.dataPagamento}
                onChange={(e) => setEditParcelaForm({ ...editParcelaForm, dataPagamento: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select
                value={editParcelaForm.status}
                onValueChange={(value: any) => setEditParcelaForm({ ...editParcelaForm, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditParcelaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditParcela} disabled={editParcelaMutation.isPending}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Editar Empréstimo */}
      <Dialog open={editEmprestimoDialogOpen} onOpenChange={setEditEmprestimoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Empréstimo</DialogTitle>
            <DialogDescription>
              Modifique as informações do empréstimo abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorEmprestado">Valor Emprestado (R$) *</Label>
              <Input
                id="valorEmprestado"
                type="number"
                step="0.01"
                value={editEmprestimoForm.valorEmprestado}
                onChange={(e) => setEditEmprestimoForm({ ...editEmprestimoForm, valorEmprestado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxaJuros">Taxa de Juros (%) *</Label>
              <Input
                id="taxaJuros"
                type="number"
                step="0.01"
                value={editEmprestimoForm.taxaJuros}
                onChange={(e) => setEditEmprestimoForm({ ...editEmprestimoForm, taxaJuros: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEmprestimo">Data do Empréstimo *</Label>
              <Input
                id="dataEmprestimo"
                type="date"
                value={editEmprestimoForm.dataEmprestimo}
                onChange={(e) => setEditEmprestimoForm({ ...editEmprestimoForm, dataEmprestimo: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataVencimento">Data de Vencimento</Label>
              <Input
                id="dataVencimento"
                type="date"
                value={editEmprestimoForm.dataVencimento}
                onChange={(e) => setEditEmprestimoForm({ ...editEmprestimoForm, dataVencimento: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmprestimoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditEmprestimo} disabled={editEmprestimoMutation.isPending}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Registrar Pagamento de Juros */}
      <Dialog open={pagamentoJurosDialogOpen} onOpenChange={setPagamentoJurosDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento de Juros</DialogTitle>
            <DialogDescription>
              Registre um pagamento mensal de juros. Valor sugerido: R$ {((emprestimo.valorJurosMensal || 0) / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorPago">Valor Pago (R$) *</Label>
              <Input
                id="valorPago"
                type="number"
                step="0.01"
                min="0"
                placeholder={(((emprestimo.valorJurosMensal || 0) / 100).toFixed(2))}
                value={pagamentoJurosForm.valorPago}
                onChange={(e) => setPagamentoJurosForm({ ...pagamentoJurosForm, valorPago: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataPagamentoJuros">Data do Pagamento *</Label>
              <Input
                id="dataPagamentoJuros"
                type="date"
                value={pagamentoJurosForm.dataPagamento}
                onChange={(e) => setPagamentoJurosForm({ ...pagamentoJurosForm, dataPagamento: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacaoJuros">Observação (opcional)</Label>
              <Input
                id="observacaoJuros"
                type="text"
                placeholder="Ex: Pagamento referente a janeiro/2024"
                value={pagamentoJurosForm.observacao}
                onChange={(e) => setPagamentoJurosForm({ ...pagamentoJurosForm, observacao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoJurosDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarPagamentoJuros} disabled={registrarPagamentoJurosMutation.isPending}>
              Registrar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Registrar Amortização */}
      <Dialog open={amortizacaoDialogOpen} onOpenChange={setAmortizacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Amortização</DialogTitle>
            <DialogDescription>
              Registre um pagamento parcial do principal. Saldo devedor atual: R$ {((totaisJurosRecorrente?.saldoDevedor || 0) / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="valorAmortizado">Valor Amortizado (R$) *</Label>
              <Input
                id="valorAmortizado"
                type="number"
                step="0.01"
                min="0"
                max={((totaisJurosRecorrente?.saldoDevedor || 0) / 100)}
                placeholder="0.00"
                value={amortizacaoForm.valorAmortizado}
                onChange={(e) => setAmortizacaoForm({ ...amortizacaoForm, valorAmortizado: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataAmortizacao">Data da Amortização *</Label>
              <Input
                id="dataAmortizacao"
                type="date"
                value={amortizacaoForm.dataAmortizacao}
                onChange={(e) => setAmortizacaoForm({ ...amortizacaoForm, dataAmortizacao: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="observacaoAmortizacao">Observação (opcional)</Label>
              <Input
                id="observacaoAmortizacao"
                type="text"
                placeholder="Ex: Pagamento antecipado"
                value={amortizacaoForm.observacao}
                onChange={(e) => setAmortizacaoForm({ ...amortizacaoForm, observacao: e.target.value })}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Após registrar a amortização, o saldo devedor e os juros mensais serão recalculados automaticamente.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmortizacaoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarAmortizacao} disabled={registrarAmortizacaoMutation.isPending}>
              Registrar Amortização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Editar Pagamento de Juros */}
      <Dialog open={editPagamentoJurosDialogOpen} onOpenChange={setEditPagamentoJurosDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pagamento de Juros</DialogTitle>
            <DialogDescription>
              Modifique as informações do pagamento de juros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editValorPago">Valor Pago (R$) *</Label>
              <Input
                id="editValorPago"
                type="number"
                step="0.01"
                min="0"
                value={editPagamentoJurosForm.valorPago}
                onChange={(e) => setEditPagamentoJurosForm({ ...editPagamentoJurosForm, valorPago: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDataPagamentoJuros">Data do Pagamento *</Label>
              <Input
                id="editDataPagamentoJuros"
                type="date"
                value={editPagamentoJurosForm.dataPagamento}
                onChange={(e) => setEditPagamentoJurosForm({ ...editPagamentoJurosForm, dataPagamento: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editObservacaoJuros">Observação (opcional)</Label>
              <Input
                id="editObservacaoJuros"
                type="text"
                value={editPagamentoJurosForm.observacao}
                onChange={(e) => setEditPagamentoJurosForm({ ...editPagamentoJurosForm, observacao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPagamentoJurosDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditPagamentoJuros} disabled={updatePagamentoJurosMutation.isPending}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Editar Amortização */}
      <Dialog open={editAmortizacaoDialogOpen} onOpenChange={setEditAmortizacaoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Amortização</DialogTitle>
            <DialogDescription>
              Modifique as informações da amortização. Os juros serão recalculados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editValorAmortizado">Valor Amortizado (R$) *</Label>
              <Input
                id="editValorAmortizado"
                type="number"
                step="0.01"
                min="0"
                value={editAmortizacaoForm.valorAmortizado}
                onChange={(e) => setEditAmortizacaoForm({ ...editAmortizacaoForm, valorAmortizado: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDataAmortizacao">Data da Amortização *</Label>
              <Input
                id="editDataAmortizacao"
                type="date"
                value={editAmortizacaoForm.dataAmortizacao}
                onChange={(e) => setEditAmortizacaoForm({ ...editAmortizacaoForm, dataAmortizacao: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editObservacaoAmortizacao">Observação (opcional)</Label>
              <Input
                id="editObservacaoAmortizacao"
                type="text"
                value={editAmortizacaoForm.observacao}
                onChange={(e) => setEditAmortizacaoForm({ ...editAmortizacaoForm, observacao: e.target.value })}
              />
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Ao alterar o valor da amortização, o saldo devedor e os juros mensais serão recalculados automaticamente.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditAmortizacaoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEditAmortizacao} disabled={updateAmortizacaoMutation.isPending}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Adicionar Parcela */}
      <Dialog open={adicionarParcelaDialogOpen} onOpenChange={setAdicionarParcelaDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nova Parcela</DialogTitle>
            <DialogDescription>
              Adicione uma nova parcela ao empréstimo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="numeroParcela">Número da Parcela *</Label>
              <Input
                id="numeroParcela"
                type="number"
                min="1"
                placeholder="1"
                value={adicionarParcelaForm.numeroParcela}
                onChange={(e) => setAdicionarParcelaForm({ ...adicionarParcelaForm, numeroParcela: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valorParcelaNova">Valor da Parcela (R$) *</Label>
              <Input
                id="valorParcelaNova"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={adicionarParcelaForm.valorParcela}
                onChange={(e) => setAdicionarParcelaForm({ ...adicionarParcelaForm, valorParcela: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataVencimentoNova">Data de Vencimento *</Label>
              <Input
                id="dataVencimentoNova"
                type="date"
                value={adicionarParcelaForm.dataVencimento}
                onChange={(e) => setAdicionarParcelaForm({ ...adicionarParcelaForm, dataVencimento: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdicionarParcelaDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAdicionarParcela} disabled={adicionarParcelaMutation.isPending}>
              Adicionar Parcela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Recalcular Parcelas */}
      <Dialog open={recalcularDialogOpen} onOpenChange={setRecalcularDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recalcular Parcelas</DialogTitle>
            <DialogDescription>
              Esta ação irá recalcular todas as parcelas não pagas com base nas informações atuais do empréstimo.
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Parcelas já pagas serão preservadas. Apenas parcelas pendentes ou atrasadas serão recalculadas.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecalcularDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => recalcularParcelasMutation.mutate({ emprestimoId })} disabled={recalcularParcelasMutation.isPending}>
              Confirmar Recalcular
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
