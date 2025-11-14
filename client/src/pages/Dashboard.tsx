import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertCircle, Users, Trophy, ArrowUpCircle, ArrowDownCircle, Download } from "lucide-react";
import jsPDF from 'jspdf';
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();
  const { data: paymentStats } = trpc.dashboard.paymentStats.useQuery();
  const { data: parcelasStats } = trpc.parcelas.estatisticas.useQuery();
  const { data: transacoes } = trpc.parcelas.transacoesRecentes.useQuery();

  const handlePieClick = (statusName: string) => {
    const statusMap: Record<string, string> = {
      'Pagos': 'pago',
      'Pendentes': 'pendente',
      'Atrasados': 'atrasado'
    };
    const status = statusMap[statusName];
    if (status) {
      setLocation(`/emprestimos?status=${status}`);
    }
  };

  const handleBarClick = (data: any) => {
    if (data && data.clienteId) {
      setLocation(`/emprestimos?clienteId=${data.clienteId}&status=pago`);
    }
  };

  const COLORS = {
    pagos: "#22c55e",
    pendentes: "#eab308",
    atrasados: "#ef4444",
  };

  const statusChartData = paymentStats
    ? [
        { name: "Pagos", value: paymentStats.statusStats.pagos, color: COLORS.pagos },
        { name: "Pendentes", value: paymentStats.statusStats.pendentes, color: COLORS.pendentes },
        { name: "Atrasados", value: paymentStats.statusStats.atrasados, color: COLORS.atrasados },
      ]
    : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value / 100);
  };

  const gerarComprovantePDF = (transacao: any) => {
    const doc = new jsPDF();
    
    // Cabeçalho
    doc.setFontSize(20);
    doc.text("Bruno's Loan", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Sistema de Gest\u00e3o de Empr\u00e9stimos", 105, 28, { align: 'center' });
    
    // Linha separadora
    doc.line(20, 35, 190, 35);
    
    // T\u00edtulo do comprovante
    doc.setFontSize(16);
    doc.text("COMPROVANTE DE TRANSA\u00c7\u00c3O", 105, 45, { align: 'center' });
    
    // Dados da transa\u00e7\u00e3o
    doc.setFontSize(12);
    let y = 60;
    
    doc.text(`Tipo: ${transacao.tipo === 'emprestimo' ? 'Empr\u00e9stimo Concedido' : 'Pagamento Recebido'}`, 20, y);
    y += 10;
    doc.text(`Cliente: ${transacao.cliente}`, 20, y);
    y += 10;
    doc.text(`Data: ${new Date(transacao.data).toLocaleDateString('pt-BR')}`, 20, y);
    y += 10;
    doc.text(`Descri\u00e7\u00e3o: ${transacao.descricao}`, 20, y);
    y += 10;
    doc.setFontSize(14);
    doc.text(`Valor: ${formatCurrency(transacao.valor)}`, 20, y);
    
    // Rodap\u00e9
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 280, { align: 'center' });
    doc.text("Este \u00e9 um documento eletr\u00f4nico gerado automaticamente.", 105, 285, { align: 'center' });
    
    // Salvar PDF
    const nomeArquivo = `comprovante_${transacao.tipo}_${transacao.id}.pdf`;
    doc.save(nomeArquivo);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalAReceber || 0)}</div>
            <p className="text-xs text-muted-foreground">Empréstimos ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Potencial</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.lucroPotencial || 0)}</div>
            <p className="text-xs text-muted-foreground">Juros a receber</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empréstimos Atrasados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emprestimosAtrasados || 0}</div>
            <p className="text-xs text-muted-foreground">Requerem atenção</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.clientesAtivos || 0}</div>
            <p className="text-xs text-muted-foreground">Com empréstimos pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Pizza de Parcelas */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Parcelas</CardTitle>
            <CardDescription>Proporção de parcelas por status</CardDescription>
          </CardHeader>
          <CardContent>
            {parcelasStats ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Pagas", value: parcelasStats.pagas, color: COLORS.pagos },
                      { name: "Pendentes", value: parcelasStats.pendentes, color: COLORS.pendentes },
                      { name: "Atrasadas", value: parcelasStats.atrasadas, color: COLORS.atrasados },
                    ]}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { color: COLORS.pagos },
                      { color: COLORS.pendentes },
                      { color: COLORS.atrasados },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} parcelas`} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => {
                      const percent = ((entry.payload.value / parcelasStats.total) * 100).toFixed(0);
                      return `${value}: ${entry.payload.value} (${percent}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Status dos Empréstimos */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Empréstimos</CardTitle>
            <CardDescription>Distribuição por status de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStats && statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                    onClick={(data) => handlePieClick(data.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} empréstimos`} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value, entry: any) => {
                      const total = statusChartData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((entry.payload.value / total) * 100).toFixed(0);
                      return `${value}: ${entry.payload.value} (${percent}%)`;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Melhores Pagadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top 10 Melhores Pagadores
            </CardTitle>
            <CardDescription>Clientes com melhor histórico de pagamento</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStats && paymentStats.rankingClientes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={paymentStats.rankingClientes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="nome" type="category" width={150} style={{ fontSize: '12px' }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Bar 
                    dataKey="taxaPontualidade" 
                    fill="#3b82f6" 
                    name="Taxa de Pontualidade"
                    onClick={handleBarClick}
                    cursor="pointer"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhum dado disponível</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extrato de Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Extrato de Transações Recentes</CardTitle>
          <CardDescription>Últimas 20 movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          {transacoes && transacoes.length > 0 ? (
            <div className="space-y-2">
              {transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {transacao.tipo === 'emprestimo' ? (
                      <ArrowUpCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium">{transacao.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {transacao.cliente} • {new Date(transacao.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transacao.tipo === 'emprestimo' ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {transacao.tipo === 'emprestimo' ? '-' : '+'} {formatCurrency(transacao.valor)}
                      </p>
                    </div>
                    <button
                      onClick={() => gerarComprovantePDF(transacao)}
                      className="p-2 hover:bg-accent rounded-lg transition-colors"
                      title="Baixar comprovante"
                    >
                      <Download className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhuma transação registrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
