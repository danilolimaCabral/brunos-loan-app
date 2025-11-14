import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function AssistenteIA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Olá! Sou o assistente virtual do Bruno's Loan. Como posso ajudá-lo hoje?\n\nPosso:\n- Cadastrar e editar clientes\n- Cadastrar empréstimos (parcelados ou com juros recorrente)\n- Consultar empréstimos e parcelas\n- Registrar pagamentos de parcelas e juros\n- Registrar amortizações\n- Buscar e listar informações\n- Responder dúvidas sobre o sistema\n\nExemplos:\n- \"Cadastre um cliente chamado João Silva, telefone (11) 98765-4321\"\n- \"Cadastre um empréstimo parcelado de R$ 5000 para o cliente ID 1, com 10% de juros, em 12 parcelas, data 2025-01-10, vencimento 2025-02-10\"\n- \"Mostre as parcelas do empréstimo ID 3\"\n- \"Registre o pagamento da parcela ID 15\"\n- \"Registre uma amortização de R$ 1000 no empréstimo ID 2\"",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const chatMutation = trpc.assistente.chat.useMutation({
    onSuccess: (data: { response: string; action?: string; actionData?: any }) => {
      // Mostrar toast se houve uma ação
      if (data.action) {
        if (data.action === 'cadastrar_cliente') {
          toast.success(`Cliente "${data.actionData.nome}" cadastrado com sucesso!`);
        } else if (data.action === 'editar_cliente') {
          toast.success(`Cliente atualizado com sucesso!`);
        } else if (data.action === 'buscar_clientes') {
          toast.info(`Encontrados ${data.actionData.clientes.length} cliente(s)`);
        } else if (data.action === 'cadastrar_emprestimo_parcelado') {
          toast.success(`Empréstimo parcelado cadastrado! ${data.actionData.quantidadeParcelas}x de R$ ${data.actionData.valorParcela}`);
        } else if (data.action === 'cadastrar_emprestimo_juros_recorrente') {
          toast.success(`Empréstimo com juros recorrente cadastrado! Juros mensal: R$ ${data.actionData.valorJurosMensal}`);
        } else if (data.action === 'consultar_emprestimos_cliente') {
          toast.info(`Encontrados ${data.actionData.emprestimos.length} empréstimo(s)`);
        } else if (data.action === 'listar_emprestimos_por_status') {
          toast.info(`Encontrados ${data.actionData.total} empréstimo(s) com status "${data.actionData.emprestimos[0]?.status || 'N/A'}"`);
        } else if (data.action === 'consultar_parcelas_emprestimo') {
          toast.info(`Encontradas ${data.actionData.total} parcela(s)`);
        } else if (data.action === 'registrar_pagamento_parcela') {
          if (data.actionData.success) {
            const msg = data.actionData.emprestimoQuitado 
              ? `Parcela ${data.actionData.numeroParcela} paga! Empréstimo QUITADO! 🎉`
              : `Parcela ${data.actionData.numeroParcela} paga: R$ ${data.actionData.valorPago}`;
            toast.success(msg);
          } else {
            toast.error(data.actionData.error);
          }
        } else if (data.action === 'registrar_pagamento_juros') {
          if (data.actionData.success) {
            toast.success(`Pagamento de juros registrado: R$ ${data.actionData.valorPago}`);
          } else {
            toast.error(data.actionData.error);
          }
        } else if (data.action === 'registrar_amortizacao') {
          if (data.actionData.success) {
            const msg = data.actionData.emprestimoQuitado
              ? `Amortização registrada! Empréstimo QUITADO! 🎉`
              : `Amortização: R$ ${data.actionData.valorAmortizado}. Novo saldo: R$ ${data.actionData.novoSaldoDevedor}, Novos juros: R$ ${data.actionData.novoJurosMensal}`;
            toast.success(msg);
          } else {
            toast.error(data.actionData.error);
          }
        }
      }
      
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error: any) => {
      toast.error("Erro ao processar mensagem: " + error.message);
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    chatMutation.mutate({ message: input, history: messages });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Assistente IA
          </CardTitle>
          <CardDescription>
            Tire dúvidas, calcule valores e receba ajuda sobre o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ScrollArea className="h-[500px] pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {msg.timestamp.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-5 w-5 text-secondary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-foreground animate-pulse" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground">Pensando...</p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Input
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={chatMutation.isPending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || chatMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
