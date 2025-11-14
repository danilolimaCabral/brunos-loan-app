# Bruno's Loan - Lista de Tarefas

## Funcionalidades Principais

- [x] Sistema de autenticação e login seguro
- [x] Dashboard com resumos financeiros (total a receber, lucros, empréstimos atrasados)
- [x] Módulo de Clientes (CRM)
  - [x] Cadastrar novo cliente
  - [x] Listar todos os clientes
  - [x] Editar dados do cliente
  - [x] Excluir cliente
- [x] Módulo de Empréstimos
  - [x] Lançar novo empréstimo
  - [x] Listar todos os empréstimos
  - [x] Cálculo automático de juros e valor total
  - [x] Status visual com cores (Pendente, Atrasado, Pago)
  - [x] Marcar empréstimo como pago
- [ ] Exportação de dados para planilha Excel
- [ ] Automação de e-mails (lembretes de vencimento e avisos de atraso)
- [x] Campo de anotações no cadastro de clientes
- [ ] Funcionalidade de envio de e-mail (aguardando exemplos do usuário)
- [x] Botão "Enviar Anotações por Email" na tela de clientes

## Melhorias baseadas nas planilhas de exemplo

- [x] Sistema de parcelas detalhado
  - [x] Criar tabela de parcelas no banco de dados
  - [x] Calcular parcelas com juros compostos
  - [x] Permitir pagamento parcela por parcela
  - [x] Mostrar histórico de pagamentos
- [ ] Exportação para Excel no formato das planilhas
- [x] Visualização detalhada de cada empréstimo com todas as parcelas
- [ ] Filtro de status na listagem de empréstimos (Todos, Pendentes, Atrasados, Pagos)
- [x] Sistema de login tradicional com usuário e senha
- [x] Tela de login personalizada
- [x] Criar usuário padrão (financeiro / financeiro2025)
- [x] Gráficos no dashboard
  - [x] Gráfico de clientes que pagam em dia vs atrasados
  - [x] Gráfico de status dos empréstimos (Pagos, Pendentes, Atrasados)
  - [x] Ranking de melhores pagadores
- [x] Sistema de lembretes automáticos por e-mail
  - [x] Lembrete de empréstimos atrasados
  - [ ] Lembrete de vencimento próximo (3 dias antes)
  - [x] Botão manual para enviar lembrete individual
- [x] Bug: Login não está funcionando com credenciais financeiro/financeiro2025
- [ ] Sistema de gerenciamento de múltiplos usuários
  - [ ] Tabela de usuários no banco de dados
  - [ ] Página de cadastro de usuários
  - [ ] Listagem de usuários cadastrados
  - [ ] Editar e excluir usuários
  - [ ] Diferentes níveis de acesso (admin, operador)
- [x] Desabilitar OAuth e usar apenas login tradicional
- [x] Analisar planilhas e implementar geração automática de parcelas
  - [x] Identificar quantidade de parcelas de cada empréstimo
  - [x] Implementar cálculo automático baseado nos dados reais
  - [x] Funcionalidade de baixa automática de parcelas
- [ ] Melhorias no sistema de parcelas
  - [x] Campo de quantidade de parcelas no cadastro de empréstimo
  - [ ] Gráfico visual de parcelas (pagas vs pendentes)
  - [ ] Interface para marcar parcelas individuais como pagas
  - [ ] Botão para marcar múltiplas parcelas de uma vez
- [x] Gráfico de pizza mostrando proporção de parcelas (pagas, pendentes, atrasadas)
- [x] Seção de extrato detalhado de transações recentes no dashboard
- [x] Botão para gerar e baixar comprovante em PDF de cada transação
- [x] Tornar gráfico de pizza clicável para filtrar empréstimos por status
- [x] Corrigir layout que está cortando nomes dos clientes
- [x] Adicionar botões de filtro na página de empréstimos (Todos, Pagos, Pendentes, Atrasados)
- [x] Corrigir layout dos gráficos de pizza (legendas sobrepostas e cortadas)
- [x] Substituir logo atual pelo novo logo profissional em todo o sistema
- [x] Melhorar exposição e posicionamento do logo no sistema
- [x] Ajustar cor do logo para tema escuro/profissional
- [x] Integrar logo de forma mais natural ao design do sistema
- [x] Criar versão alternativa do logo em modo escuro (cores claras)
- [x] Implementar detecção automática de tema para trocar logo
- [x] Testar logo em diferentes fundos e temas
- [x] Remover padrão quadriculado (checkerboard) do fundo transparente dos logos
- [x] Aumentar significativamente o tamanho do logo na tela de login
- [x] Aumentar tamanho do logo no sidebar do dashboard
- [x] Tornar gráfico Top 10 Melhores Pagadores clicável
- [x] Ao clicar em cliente no ranking, redirecionar para empréstimos do cliente
- [x] Filtrar apenas parcelas pagas/quitadas do cliente selecionado
- [x] Implementar sistema de autenticação de dois fatores (2FA)
- [x] Adicionar campo 2FA no banco de dados (secret, enabled)
- [x] Criar tela de configuração de 2FA com QR Code
- [x] Adicionar validação de código 2FA no login
- [x] Gerar códigos de backup para emergências
- [x] Permitir desabilitar 2FA com senha
- [ ] Implementar sistema de permissões (admin vs financeiro)
- [ ] Usuário financeiro não pode excluir registros
- [ ] Criar botão de Backup (gera backup e envia por email)
- [ ] Criar botão de Pânico (apaga tudo, faz backup, envia email)
- [x] Adicionar rota /seguranca no App.tsx
- [ ] Atualizar Login.tsx para suportar campo de código 2FA
- [ ] Criar tabela de logs de ações críticas
- [x] Criar usuário admin com senha admin2025
- [x] Adicionar botões de Backup e Pânico na página de Segurança
- [x] Botões visíveis apenas para usuários admin
- [x] Implementar endpoint de backup do banco de dados (estrutura)
- [x] Implementar endpoint de pânico (estrutura com verificação de senha)
- [ ] Implementar geração real de backup SQL
- [ ] Configurar envio de email com backup
- [ ] Implementar exclusão de dados no pânico
- [x] Criar seção de gerenciamento de usuários na página de Segurança
- [x] Listar todos os usuários do sistema
- [x] Adicionar botão para excluir usuário (apenas admin)
- [x] Confirmação com senha antes de excluir usuário
- [x] Endpoint backend para excluir usuário
- [x] Impedir exclusão do próprio usuário logado
- [x] Ocultar usuário financeiro da lista de gerenciamento de usuários
- [ ] Desativar autenticação OAuth do Google/Manus (manter para futura integração)
- [ ] Usar apenas sistema de login local já implementado
- [x] Adicionar botão "Criar Novo Usuário" na página de Segurança
- [x] Criar formulário para cadastro de novos usuários
- [x] Endpoint backend para criar novo usuário
- [x] Permitir admin definir username, senha, nome, email e role
- [x] Corrigir validação de email no formulário de criar usuário (aceitar vazio)
- [x] Adicionar campo lastActivity na tabela usuarios_sistema
- [x] Atualizar lastActivity a cada login do usuário
- [x] Criar página "Usuários Online" no menu lateral
- [x] Mostrar lista de usuários com status online/offline
- [x] Indicador visual (badge verde/cinza) para status
- [x] Exibir última atividade de cada usuário
- [x] Considerar usuário online se atividade < 5 minutos
- [x] Resetar senha do usuário financeiro1 para F2025
- [x] Adicionar indicador de status online/offline na lista de usuários da página de Segurança
- [x] Mostrar badge verde (online) ou cinza (offline) ao lado de cada usuário
- [x] Adicionar campos de auditoria no banco (modificadoPor, modificadoEm)
- [x] Liberar edição de parcelas em aberto (pendente/atrasado)
- [x] Adicionar botão "Editar" nas parcelas
- [x] Permitir editar campos de empréstimos
- [x] Adicionar botão de editar na página de detalhe do empréstimo
- [x] Registrar quem fez cada alteração (usuário + timestamp)
- [x] Mostrar informação de auditoria apenas para admin

## Nova Modalidade: Empréstimo com Juros Recorrente (Preenchimento Manual)
- [x] Adicionar campo "tipoEmprestimo" no schema (parcelado/juros_recorrente)
- [x] Criar tabela de pagamentos de juros recorrentes
- [x] Criar tabela de amortizações (pagamentos parciais do principal)
- [x] Adicionar campos saldoDevedor e valorJurosMensal no schema
- [x] Criar endpoint para criar empréstimo com juros recorrente
- [x] Criar endpoint para registrar pagamento de juros MANUALMENTE
- [x] Criar endpoint para registrar amortização MANUALMENTE (com recálculo automático)
- [x] Criar interface para cadastrar empréstimo com juros recorrente
- [x] Criar botão "Registrar Pagamento de Juros" na página de detalhes
- [x] Criar botão "Registrar Amortização" na página de detalhes
- [x] Exibir valor total emprestado, total já pago (juros + amortizações) e saldo devedor
- [x] Mostrar histórico completo de pagamentos (juros + amortizações) em ordem cronológica
- [x] Calcular e exibir valor do juros mensal baseado no saldo devedor atual
- [ ] Atualizar dashboard para incluir estatísticas dos dois tipos
- [x] Atualizar empréstimos existentes com tipoEmprestimo = 'parcelado'
- [x] Preencher saldoDevedor para empréstimos antigos
- [x] Preencher valorJurosMensal para empréstimos antigos

## Edição Rápida de Clientes
- [ ] Adicionar botão "Editar" nos cards de clientes
- [ ] Criar dialog de edição rápida de cliente
- [ ] Permitir editar nome, CPF, telefone, email e endereço
- [ ] Atualizar lista após edição sem recarregar página

## Correção de Autenticação
- [ ] Remover redirecionamento OAuth do DashboardLayout
- [ ] Usar apenas sistema de login local
- [ ] Redirecionar para /login quando não autenticado
- [ ] Testar acesso às páginas protegidas

## Assistente IA
- [x] Criar página "Assistente IA" no menu lateral
- [x] Implementar interface de chat com histórico de mensagens
- [x] Integrar com LLM (usar invokeLLM do sistema)
- [x] Adicionar contexto sobre o sistema Bruno's Loan
- [x] Permitir assistente ajudar com dúvidas sobre funcionalidades
- [x] Permitir assistente calcular valores de empréstimos
- [x] Permitir assistente sugerir correções de erros
- [x] Adicionar rota no App.tsx
- [x] Adicionar item no menu do DashboardLayout
- [ ] Salvar histórico de conversas no banco de dados (opcional para versão futura)

## Assistente IA - Cadastro e Edição de Clientes
- [x] Implementar tool calling no Assistente IA
- [x] Criar endpoint para IA cadastrar novos clientes
- [x] Criar endpoint para IA editar clientes existentes
- [x] Criar endpoint para IA buscar clientes por nome
- [x] Atualizar interface do chat para mostrar confirmações de ações
- [x] Permitir IA cadastrar cliente através de conversa natural
- [x] Permitir IA editar dados de clientes através de conversa natural
- [x] Permitir IA buscar e visualizar informações de clientes

## Assistente IA - Cadastro e Consulta de Empréstimos
- [x] Criar tool para cadastrar empréstimo parcelado
- [x] Criar tool para cadastrar empréstimo com juros recorrente
- [x] Criar tool para consultar empréstimos de um cliente
- [x] Criar tool para listar empréstimos por status
- [x] Implementar cálculo automático de parcelas no cadastro via IA
- [x] Atualizar interface para mostrar confirmações de empréstimos cadastrados
- [x] Permitir IA calcular e mostrar simulações de empréstimos

## Assistente IA - Registro de Pagamentos
- [x] Criar tool para registrar pagamento de parcela (empréstimos parcelados)
- [x] Criar tool para registrar pagamento de juros (empréstimos com juros recorrente)
- [x] Criar tool para registrar amortização (empréstimos com juros recorrente)
- [x] Criar tool para consultar parcelas pendentes de um empréstimo
- [x] Atualizar automaticamente status de empréstimos ao registrar pagamentos
- [x] Recalcular juros mensais após amortizações
- [x] Atualizar interface para mostrar confirmações de pagamentos registrados

## Bugs e Correções - Página de Detalhes do Empréstimo
- [x] Investigar e corrigir parcelas duplicadas (usuário pode excluir duplicatas manualmente)
- [x] Adicionar botão de exclusão de parcelas (apenas admin)
- [x] Permitir editar parcelas que já foram marcadas como "pago"
- [x] Adicionar campo de data de pagamento no formulário de edição
- [x] Implementar cálculo dinâmico da barra superior (Valor Emprestado, Valor Total, Valor Pago, Valor Restante)
- [x] Garantir que valores da barra atualizem automaticamente quando parcelas são pagas/editadas

## Funcionalidade - Recalcular Parcelas
- [x] Criar endpoint backend para recalcular parcelas sem excluir dados existentes
- [x] Preservar parcelas já pagas (não recalcular)
- [x] Atualizar apenas parcelas pendentes/atrasadas com novos valores
- [x] Adicionar botão "Recalcular Parcelas" na página de detalhes (apenas admin)
- [x] Implementar dialog de confirmação antes de recalcular
- [x] Mostrar resumo do que será alterado antes de confirmar
- [x] Criar novas parcelas se o número de parcelas aumentou

## Bug - Edição de Parcelas Não Funciona
- [x] Investigar por que não é possível editar parcelas
- [x] Verificar se o dialog abre corretamente
- [x] Verificar se os campos estão habilitados para edição
- [x] Adicionar validação nos campos obrigatórios
- [x] Adicionar mensagens de erro claras
- [x] Adicionar logs de debug para rastreamento
- [x] Melhorar UX com placeholders e atributos required

## Geração de APK Android
- [x] Instalar Capacitor no projeto
- [x] Configurar capacitor.config.ts
- [x] Criar ícones do app em diferentes resoluções
- [x] Adicionar plataforma Android
- [x] Instalar Java 21 e Android SDK
- [x] Configurar compatibilidade de versões
- [x] Gerar build de produção
- [x] Compilar APK (9.0 MB)
- [x] APK gerado com sucesso

## Bug - APK não conecta ao servidor
- [x] Configurar URL da API para produção no capacitor.config.ts
- [x] Adicionar URL do servidor de desenvolvimento
- [x] Sincronizar configurações com Capacitor
- [x] Recompilar APK com configurações corretas

## Refatoração - Sistema de Controle Manual (como planilha Excel)
- [x] Remover geração automática de parcelas no cadastro de empréstimo parcelado
- [x] Remover campos de quantidade de parcelas e data de vencimento do formulário parcelado
- [x] Adicionar botão "Adicionar Parcela" na página de detalhes
- [x] Criar formulário para adicionar parcela manualmente (número, valor, data vencimento)
- [x] Remover data de término obrigatória em empréstimos com juros recorrente (dataVencimento nullable)
- [x] Tornar data de vencimento editável em empréstimos com juros recorrente
- [x] Permitir edição livre de todas as datas sem restrições
- [x] Criar endpoint createParcela para adicionar parcelas individualmente
- [x] Corrigir todos os erros de TypeScript relacionados a dataVencimento nullable
- [x] Testar fluxo completo de controle manual

## Melhorias de UX - Página de Detalhes do Empréstimo
- [x] Adicionar badge visual destacando tipo de empréstimo (Juros Recorrente vs Parcelado)
- [x] Reorganizar layout para mostrar ações relevantes de forma mais clara
- [x] Destacar botão "Registrar Pagamento de Juros" com tamanho maior e cor azul
- [x] Melhorar visualização do histórico de pagamentos de juros (tabela mais clara)
- [x] Adicionar instruções/dicas em cada seção explicando o que fazer
- [x] Adicionar mensagem informativa quando não há pagamentos registrados
- [x] Mostrar valor dos juros mensais na descrição da seção
- [x] Adicionar ícones nos botões para melhor identificação visual
- [x] Facilitar identificação de qual tipo de ação tomar para cada tipo de empréstimo
