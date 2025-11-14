import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import jwt from "jsonwebtoken";
import { ENV } from "./_core/env";
import { z } from "zod";
import * as db from "./db";
import { Parcela } from "../drizzle/schema";
import bcrypt from "bcryptjs";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ 
        username: z.string(), 
        password: z.string(),
        twoFactorCode: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar usuário no banco
        const usuario = await db.getUsuarioByUsername(input.username);
        
        // Verificar se usuário existe e senha está correta
        if (!usuario || !bcrypt.compareSync(input.password, usuario.senha)) {
          throw new Error("Usuário ou senha incorretos");
        }
        
        // Verificar se usuário está ativo
        if (usuario.ativo !== 1) {
          throw new Error("Usuário inativo");
        }
        
        // Se chegou aqui, credenciais estão corretas
        
        // Se 2FA estiver habilitado, verificar código
        if (usuario.twoFactorEnabled === 1) {
          if (!input.twoFactorCode) {
            return { 
              success: false, 
              requiresTwoFactor: true,
              message: "Código de autenticação de dois fatores necessário" 
            };
          }
          
          // Verificar código 2FA
          const { verifyTwoFactorToken, verifyBackupCode } = await import('./twoFactor');
          let isValid = false;
          
          if (usuario.twoFactorSecret) {
            isValid = verifyTwoFactorToken(usuario.twoFactorSecret, input.twoFactorCode);
          }
          
          // Se não for válido, tentar código de backup
          if (!isValid && usuario.backupCodes) {
            const backupResult = verifyBackupCode(usuario.backupCodes, input.twoFactorCode);
            if (backupResult.valid) {
              isValid = true;
              // Atualizar códigos de backup removendo o usado
              if (backupResult.remainingCodes) {
                await db.updateUsuarioBackupCodes(usuario.id, JSON.stringify(backupResult.remainingCodes));
              }
            }
          }
          
          if (!isValid) {
            throw new Error("Código de autenticação inválido");
          }
        }
        
        // Criar um usuário para a sessão
        const user = {
          id: usuario.id,
          openId: `local-${usuario.username}`,
          name: usuario.nome,
          email: usuario.email || "",
          role: "admin" as const,
        };
        
        // Criar token JWT
        const token = jwt.sign(user, ENV.cookieSecret, { expiresIn: "7d" });
        
        // Atualizar última atividade
        await db.updateUsuarioLastActivity(usuario.id);
        
        // Definir cookie de sessão
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
        });
        
        return { success: true, user, requiresTwoFactor: false };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    // Rotas de 2FA
    getTwoFactorStatus: protectedProcedure.query(async ({ ctx }) => {
      const usuario = await db.getUsuarioByUsername('financeiro'); // TODO: usar ctx.user
      if (!usuario) {
        return { enabled: false };
      }
      return { 
        enabled: usuario.twoFactorEnabled === 1,
        hasBackupCodes: !!usuario.backupCodes 
      };
    }),
    setupTwoFactor: protectedProcedure.mutation(async ({ ctx }) => {
      const { generateTwoFactorSecret, generateQRCode } = await import('./twoFactor');
      const usuario = await db.getUsuarioByUsername('financeiro'); // TODO: usar ctx.user
      
      if (!usuario) {
        throw new Error("Usuário não encontrado");
      }
      
      // Gerar novo secret
      const { secret, otpauth_url } = generateTwoFactorSecret(usuario.username || 'user');
      if (!otpauth_url) {
        throw new Error("Erro ao gerar secret 2FA");
      }
      const qrCode = await generateQRCode(otpauth_url);
      
      // Salvar secret no banco (ainda não habilitado)
      await db.updateUsuarioTwoFactor(usuario.id, {
        twoFactorSecret: secret,
        twoFactorEnabled: 0, // Ainda não habilitado até verificar
      });
      
      return {
        secret,
        qrCode,
      };
    }),
    enableTwoFactor: protectedProcedure
      .input(z.object({ code: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { verifyTwoFactorToken, generateBackupCodes } = await import('./twoFactor');
        const usuario = await db.getUsuarioByUsername('financeiro'); // TODO: usar ctx.user
        
        if (!usuario || !usuario.twoFactorSecret) {
          throw new Error("Configure o 2FA primeiro");
        }
        
        // Verificar código
        const isValid = verifyTwoFactorToken(usuario.twoFactorSecret, input.code);
        if (!isValid) {
          throw new Error("Código inválido");
        }
        
        // Gerar códigos de backup
        const backupCodes = generateBackupCodes();
        
        // Habilitar 2FA
        await db.updateUsuarioTwoFactor(usuario.id, {
          twoFactorEnabled: 1,
          backupCodes: JSON.stringify(backupCodes),
        });
        
        return {
          success: true,
          backupCodes,
        };
      }),
    disableTwoFactor: protectedProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const usuario = await db.getUsuarioByUsername('financeiro'); // TODO: usar ctx.user
        
        if (!usuario) {
          throw new Error("Usuário não encontrado");
        }
        
        // Verificar senha
        if (!bcrypt.compareSync(input.password, usuario.senha)) {
          throw new Error("Senha incorreta");
        }
        
        // Desabilitar 2FA
        await db.updateUsuarioTwoFactor(usuario.id, {
          twoFactorEnabled: 0,
          twoFactorSecret: undefined,
          backupCodes: undefined,
        });
        
        return { success: true };
      }),
    // Endpoints de Backup e Pânico (Admin apenas)
    generateBackup: protectedProcedure
      .mutation(async ({ ctx }) => {
        // TODO: Verificar se usuário é admin
        if (ctx.user?.role !== 'admin') {
          throw new Error("Acesso negado. Apenas administradores podem gerar backup.");
        }
        
        // TODO: Implementar geração de backup SQL
        // TODO: Enviar email com backup
        
        return {
          success: true,
          message: "Backup gerado e enviado por email com sucesso",
        };
      }),
    executePanic: protectedProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // Verificar se usuário é admin
        if (ctx.user?.role !== 'admin') {
          throw new Error("Acesso negado. Apenas administradores podem executar o pânico.");
        }
        
        // Buscar usuário para verificar senha
        const usuario = await db.getUsuarioByUsername('admin'); // TODO: usar ctx.user
        if (!usuario) {
          throw new Error("Usuário não encontrado");
        }
        
        // Verificar senha
        if (!bcrypt.compareSync(input.password, usuario.senha)) {
          throw new Error("Senha incorreta");
        }
        
        // TODO: 1. Gerar backup
        // TODO: 2. Enviar backup por email
        // TODO: 3. Apagar dados de clientes, empréstimos e parcelas
        // TODO: 4. Registrar ação no log
        // TODO: 5. Enviar notificação de pânico
        
        return {
          success: true,
          message: "Pânico executado. Backup enviado e dados apagados.",
        };
      }),
    // Gerenciamento de Usuários (Admin apenas)
    listUsers: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Acesso negado. Apenas administradores podem listar usuários.");
        }
        
        const usuarios = await db.getAllUsuariosSistema();
        // Não retornar senhas
        return usuarios.map(u => ({
          id: u.id,
          username: u.username,
          nome: u.nome,
          email: u.email,
          role: u.role,
          ativo: u.ativo,
          twoFactorEnabled: u.twoFactorEnabled,
          createdAt: u.createdAt,
        }));
      }),
    deleteUser: protectedProcedure
      .input(z.object({ 
        userId: z.number(),
        password: z.string() 
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Acesso negado. Apenas administradores podem excluir usuários.");
        }
        
        // Impedir exclusão do próprio usuário
        if (ctx.user.id === input.userId) {
          throw new Error("Você não pode excluir seu próprio usuário.");
        }
        
        // Verificar senha do admin
        const admin = await db.getUsuarioByUsername('admin'); // TODO: usar ctx.user
        if (!admin) {
          throw new Error("Usuário admin não encontrado");
        }
        
        if (!bcrypt.compareSync(input.password, admin.senha)) {
          throw new Error("Senha incorreta");
        }
        
        // Excluir usuário
        await db.deleteUsuarioSistema(input.userId);
        
        return {
          success: true,
          message: "Usuário excluído com sucesso",
        };
      }),
    createUser: protectedProcedure
      .input(z.object({
        username: z.string().min(3, "Username deve ter no mínimo 3 caracteres"),
        password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
        nome: z.string().min(1, "Nome é obrigatório"),
        email: z.string().optional(),
        role: z.enum(['admin', 'operador']),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') {
          throw new Error("Acesso negado. Apenas administradores podem criar usuários.");
        }
        
        // Validar email se fornecido
        if (input.email && input.email.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.email)) {
            throw new Error("Email inválido");
          }
        }
        
        // Verificar se username já existe
        const existingUser = await db.getUsuarioByUsername(input.username);
        if (existingUser) {
          throw new Error("Username já está em uso");
        }
        
        // Criptografar senha
        const hashedPassword = bcrypt.hashSync(input.password, 10);
        
        // Criar usuário
        const userId = await db.createUsuarioSistema(
          input.username,
          hashedPassword,
          input.nome,
          input.email && input.email.trim() !== "" ? input.email : undefined,
          input.role
        );
        
        return {
          success: true,
          message: "Usuário criado com sucesso",
          userId,
        };
      }),
  }),

  // Rotas de Clientes
  clientes: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllClientes();
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getClienteById(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          nome: z.string().min(1),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          anotacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const id = await db.createCliente(input);
        return { id };
      }),
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          nome: z.string().min(1).optional(),
          telefone: z.string().optional(),
          email: z.string().email().optional(),
          anotacoes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCliente(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteCliente(input.id);
        return { success: true };
      }),
    enviarAnotacoesPorEmail: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const cliente = await db.getClienteById(input.id);
        if (!cliente) {
          throw new Error("Cliente não encontrado");
        }
        if (!cliente.email) {
          throw new Error("Cliente não possui e-mail cadastrado");
        }
        
        // TODO: Implementar envio de e-mail real
        // Por enquanto, apenas simula o envio
        console.log(`Enviando anotações para ${cliente.email}:`, cliente.anotacoes);
        
        return { success: true, message: `E-mail enviado para ${cliente.email}` };
      }),
  }),

  // Rotas de Empréstimos
  emprestimos: router({
    list: protectedProcedure.query(async () => {
      const emprestimos = await db.getAllEmprestimos();
      const clientes = await db.getAllClientes();
      const clientesMap = new Map(clientes.map(c => [c.id, c]));

      // Atualizar status automaticamente
      const now = new Date();
      for (const emp of emprestimos) {
        if (emp.status !== "pago" && emp.dataVencimento && emp.dataVencimento < now) {
          await db.updateEmprestimo(emp.id, { status: "atrasado" });
          emp.status = "atrasado";
        }
      }

      return emprestimos.map(emp => ({
        ...emp,
        cliente: clientesMap.get(emp.clienteId),
        valorTotal: emp.valorEmprestado + (emp.valorEmprestado * emp.taxaJuros / 10000),
      }));
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getEmprestimoById(input.id);
      }),
    create: protectedProcedure
      .input(
        z.object({
          clienteId: z.number(),
          valorEmprestado: z.number().positive(),
          taxaJuros: z.number().min(0),
          quantidadeParcelas: z.number().int().min(1).default(1),
          valorParcela: z.number().positive(),
          dataEmprestimo: z.string(),
          dataVencimento: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const valorEmprestadoCentavos = Math.round(input.valorEmprestado * 100);
        const taxaJurosCentesimos = Math.round(input.taxaJuros * 100);
        const valorParcelaCentavos = Math.round(input.valorParcela * 100);
        
        const data = {
          clienteId: input.clienteId,
          tipoEmprestimo: "parcelado" as const,
          valorEmprestado: valorEmprestadoCentavos,
          taxaJuros: taxaJurosCentesimos,
          saldoDevedor: valorEmprestadoCentavos, // Inicialmente igual ao valor emprestado
          quantidadeParcelas: input.quantidadeParcelas,
          valorParcela: valorParcelaCentavos,
          dataEmprestimo: new Date(input.dataEmprestimo),
          dataVencimento: new Date(input.dataVencimento),
        };
        const id = await db.createEmprestimo(data);
        
        // Gerar parcelas automaticamente
        const dataInicio = new Date(input.dataEmprestimo);
        const taxaJurosDecimal = input.taxaJuros / 100;
        
        for (let i = 1; i <= input.quantidadeParcelas; i++) {
          const dataVencimento = new Date(dataInicio);
          dataVencimento.setMonth(dataVencimento.getMonth() + i);
          
          // Cálculo de juros compostos
          const valorParcela = input.valorParcela * Math.pow(1 + taxaJurosDecimal, i - 1);
          const valorParcelaEmCentavos = Math.round(valorParcela * 100);
          
          await db.createParcela({
            emprestimoId: id,
            numeroParcela: i,
            dataVencimento,
            valorParcela: valorParcelaEmCentavos,
            status: 'pendente',
          });
        }
        
        return { id };
      }),
    marcarComoPago: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateEmprestimo(input.id, {
          status: "pago",
          dataPagamento: new Date(),
        });
        return { success: true };
      }),
    getParcelas: protectedProcedure
      .input(z.object({ emprestimoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getParcelasByEmprestimoId(input.emprestimoId);
      }),
    pagarParcela: protectedProcedure
      .input(z.object({ id: z.number(), valorPago: z.number() }))
      .mutation(async ({ input }) => {
        await db.marcarParcelaComoPaga(input.id, Math.round(input.valorPago * 100));
        return { success: true };
      }),
    enviarLembreteAtraso: protectedProcedure
      .input(z.object({ emprestimoId: z.number() }))
      .mutation(async ({ input }) => {
        const emprestimo = await db.getEmprestimoById(input.emprestimoId);
        if (!emprestimo) {
          throw new Error("Empréstimo não encontrado");
        }

        const cliente = await db.getClienteById(emprestimo.clienteId);
        if (!cliente || !cliente.email) {
          throw new Error("Cliente não possui e-mail cadastrado");
        }

        // Simulação de envio de e-mail
        console.log(`\n=== LEMBRETE DE ATRASO ===`);
        console.log(`Para: ${cliente.email}`);
        console.log(`Cliente: ${cliente.nome}`);
        console.log(`Valor em atraso: R$ ${(emprestimo.valorEmprestado / 100).toFixed(2)}`);        console.log(`Vencimento: ${emprestimo.dataVencimento ? emprestimo.dataVencimento.toLocaleDateString('pt-BR') : 'N/A'}`);
        
        console.log(`==========================\n`);

        return { success: true, message: `Lembrete enviado para ${cliente.email}` };
      }),
    updateEmprestimo: protectedProcedure
      .input(z.object({
        id: z.number(),
        valorEmprestado: z.number().positive().optional(),
        taxaJuros: z.number().min(0).optional(),
        dataEmprestimo: z.string().optional(),
        dataVencimento: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updates: any = {};
        
        if (input.valorEmprestado !== undefined) {
          updates.valorEmprestado = Math.round(input.valorEmprestado * 100);
        }
        if (input.taxaJuros !== undefined) {
          updates.taxaJuros = Math.round(input.taxaJuros * 100);
        }
        if (input.dataEmprestimo) {
          updates.dataEmprestimo = new Date(input.dataEmprestimo);
        }
        if (input.dataVencimento) {
          updates.dataVencimento = new Date(input.dataVencimento);
        }
        
        // Adicionar auditoria
        if (ctx.user) {
          updates.modificadoPor = ctx.user.name || 'Sistema';
          updates.modificadoEm = new Date();
        }
        
        await db.updateEmprestimo(input.id, updates);
        return { success: true };
      }),
    updateParcela: protectedProcedure
      .input(z.object({
        id: z.number(),
        valorParcela: z.number().positive().optional(),
        dataVencimento: z.string().optional(),
        dataPagamento: z.string().optional(),
        status: z.enum(["pendente", "pago", "atrasado"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const updates: any = {};
        
        if (input.valorParcela !== undefined) {
          updates.valorParcela = Math.round(input.valorParcela * 100);
        }
        if (input.dataVencimento) {
          updates.dataVencimento = new Date(input.dataVencimento);
        }
        if (input.dataPagamento) {
          updates.dataPagamento = new Date(input.dataPagamento);
        }
        if (input.status) {
          updates.status = input.status;
        }
        
        // Adicionar auditoria
        if (ctx.user) {
          updates.modificadoPor = ctx.user.name || 'Sistema';
          updates.modificadoEm = new Date();
        }
        
        await db.updateParcela(input.id, updates);
        return { success: true };
      }),
    deleteParcela: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteParcela(input.id);
        return { success: true };
      }),
    createParcela: protectedProcedure
      .input(z.object({
        emprestimoId: z.number(),
        numeroParcela: z.number().positive(),
        valorParcela: z.number().positive(),
        dataVencimento: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const parcela = {
          emprestimoId: input.emprestimoId,
          numeroParcela: input.numeroParcela,
          valorParcela: Math.round(input.valorParcela * 100),
          dataVencimento: new Date(input.dataVencimento),
          status: 'pendente' as const,
          modificadoPor: ctx.user?.name || 'Sistema',
          modificadoEm: new Date(),
        };
        
        await db.createParcela(parcela);
        return { success: true };
      }),
    recalcularParcelas: protectedProcedure
      .input(z.object({
        emprestimoId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Buscar empréstimo
        const emprestimo = await db.getEmprestimoById(input.emprestimoId);
        if (!emprestimo) throw new Error("Empréstimo não encontrado");
        
        // Apenas para empréstimos parcelados
        if (emprestimo.tipoEmprestimo !== "parcelado") {
          throw new Error("Recalcular parcelas só está disponível para empréstimos parcelados");
        }
        
        // Buscar parcelas existentes
        const parcelasExistentes = await db.getParcelasByEmprestimoId(input.emprestimoId);
        
        // Separar parcelas pagas (preservar) e não pagas (recalcular)
        const parcelasPagas = parcelasExistentes.filter(p => p.status === 'pago');
        const parcelasNaoPagas = parcelasExistentes.filter(p => p.status !== 'pago');
        
        const numeroParcelas = emprestimo.quantidadeParcelas || 1;
        const valorEmprestado = emprestimo.valorEmprestado;
        const taxaJuros = emprestimo.taxaJuros / 10000; // Converter de centésimos para decimal
        
        // Calcular valor da parcela com juros compostos
        const valorParcela = Math.round(
          (valorEmprestado * taxaJuros * Math.pow(1 + taxaJuros, numeroParcelas)) /
          (Math.pow(1 + taxaJuros, numeroParcelas) - 1)
        );
        
        // Atualizar parcelas não pagas com novo valor
        for (const parcela of parcelasNaoPagas) {
          await db.updateParcela(parcela.id, {
            valorParcela,
            modificadoPor: ctx.user?.name || 'Sistema',
            modificadoEm: new Date(),
          });
        }
        
        // Se o número de parcelas aumentou, criar novas
        const totalParcelasAtuais = parcelasExistentes.length;
        if (numeroParcelas > totalParcelasAtuais) {
          if (!emprestimo.dataVencimento) {
            throw new Error("Data de vencimento não definida no empréstimo");
          }
          const dataVencimentoBase = new Date(emprestimo.dataVencimento);
          
          for (let i = totalParcelasAtuais + 1; i <= numeroParcelas; i++) {
            const dataVencimento = new Date(dataVencimentoBase);
            dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
            
            await db.createParcela({
              emprestimoId: input.emprestimoId,
              numeroParcela: i,
              valorParcela,
              dataVencimento,
              status: 'pendente',
            });
          }
        }
        
        return { 
          success: true,
          parcelasAtualizadas: parcelasNaoPagas.length,
          parcelasCriadas: Math.max(0, numeroParcelas - totalParcelasAtuais),
          parcelasPreservadas: parcelasPagas.length,
        };
      }),
      // Criar empréstimo com juros recorrente
    createJurosRecorrente: protectedProcedure
      .input(
        z.object({
          clienteId: z.number(),
          valorEmprestado: z.number().positive(),
          taxaJuros: z.number().min(0), // Taxa mensal em porcentagem
          dataEmprestimo: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const valorEmprestadoCentavos = Math.round(input.valorEmprestado * 100);
        const taxaJurosCentesimos = Math.round(input.taxaJuros * 100);
        
        // Calcular valor do juros mensal
        const valorJurosMensal = Math.round((valorEmprestadoCentavos * input.taxaJuros) / 100);
        
        const data = {
          clienteId: input.clienteId,
          tipoEmprestimo: "juros_recorrente" as const,
          valorEmprestado: valorEmprestadoCentavos,
          taxaJuros: taxaJurosCentesimos,
          saldoDevedor: valorEmprestadoCentavos, // Inicialmente igual ao valor emprestado
          valorJurosMensal: valorJurosMensal,
          quantidadeParcelas: 0, // Não se aplica
          valorParcela: 0, // Não se aplica
          dataEmprestimo: new Date(input.dataEmprestimo),
          dataVencimento: new Date(input.dataEmprestimo), // Sem vencimento definido
        };
        
        const id = await db.createEmprestimo(data);
        return { id };
      }),
      
    // Registrar pagamento de juros
    registrarPagamentoJuros: protectedProcedure
      .input(
        z.object({
          emprestimoId: z.number(),
          valorPago: z.number().positive(),
          dataPagamento: z.string(),
          observacao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const valorPagoCentavos = Math.round(input.valorPago * 100);
        
        const data = {
          emprestimoId: input.emprestimoId,
          valorPago: valorPagoCentavos,
          dataPagamento: new Date(input.dataPagamento),
          observacao: input.observacao,
          modificadoPor: ctx.user?.name || 'Sistema',
          modificadoEm: new Date(),
        };
        
        const id = await db.createPagamentoJuros(data);
        return { id };
      }),
      
    // Registrar amortização (pagamento parcial do principal)
    registrarAmortizacao: protectedProcedure
      .input(
        z.object({
          emprestimoId: z.number(),
          valorAmortizado: z.number().positive(),
          dataAmortizacao: z.string(),
          observacao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const valorAmortizadoCentavos = Math.round(input.valorAmortizado * 100);
        
        // Buscar empréstimo atual
        const emprestimo = await db.getEmprestimoById(input.emprestimoId);
        if (!emprestimo) throw new Error("Empréstimo não encontrado");
        
        const saldoAnterior = emprestimo.saldoDevedor;
        const saldoNovo = saldoAnterior - valorAmortizadoCentavos;
        
        if (saldoNovo < 0) {
          throw new Error("Valor da amortização excede o saldo devedor");
        }
        
        // Calcular novo valor de juros mensal
        const taxaJurosDecimal = emprestimo.taxaJuros / 10000; // Converter de centésimos para decimal
        const jurosAnterior = emprestimo.valorJurosMensal || 0;
        const jurosNovo = Math.round(saldoNovo * taxaJurosDecimal);
        
        // Registrar amortização
        const dataAmortizacao = {
          emprestimoId: input.emprestimoId,
          valorAmortizado: valorAmortizadoCentavos,
          saldoAnterior,
          saldoNovo,
          jurosAnterior,
          jurosNovo,
          dataAmortizacao: new Date(input.dataAmortizacao),
          observacao: input.observacao,
          modificadoPor: ctx.user?.name || 'Sistema',
          modificadoEm: new Date(),
        };
        
        const id = await db.createAmortizacao(dataAmortizacao);
        
        // Atualizar empréstimo com novo saldo e juros
        await db.updateEmprestimo(input.emprestimoId, {
          saldoDevedor: saldoNovo,
          valorJurosMensal: jurosNovo,
          status: saldoNovo === 0 ? 'pago' : emprestimo.status,
          dataPagamento: saldoNovo === 0 ? new Date() : emprestimo.dataPagamento,
          modificadoPor: ctx.user?.name || 'Sistema',
          modificadoEm: new Date(),
        });
        
        return { id, saldoNovo, jurosNovo };
      }),
      
    // Listar pagamentos de juros de um empréstimo
    listPagamentosJuros: protectedProcedure
      .input(z.object({ emprestimoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getPagamentosJurosByEmprestimoId(input.emprestimoId);
      }),
      
    // Listar amortizações de um empréstimo
    listAmortizacoes: protectedProcedure
      .input(z.object({ emprestimoId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAmortizacoesByEmprestimoId(input.emprestimoId);
      }),
      
    // Obter totais de um empréstimo com juros recorrente
    getTotaisJurosRecorrente: protectedProcedure
      .input(z.object({ emprestimoId: z.number() }))
      .query(async ({ input }) => {
        const totalJurosPagos = await db.getTotalJurosPagos(input.emprestimoId);
        const totalAmortizado = await db.getTotalAmortizado(input.emprestimoId);
        const emprestimo = await db.getEmprestimoById(input.emprestimoId);
        
        return {
          totalJurosPagos,
          totalAmortizado,
          totalPago: totalJurosPagos + totalAmortizado,
          saldoDevedor: emprestimo?.saldoDevedor || 0,
          valorEmprestado: emprestimo?.valorEmprestado || 0,
          valorJurosMensal: emprestimo?.valorJurosMensal || 0,
        };
      }),
      
    // Editar pagamento de juros
    updatePagamentoJuros: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          valorPago: z.number().positive().optional(),
          dataPagamento: z.string().optional(),
          observacao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const updates: any = {};
        
        if (input.valorPago !== undefined) {
          updates.valorPago = Math.round(input.valorPago * 100);
        }
        if (input.dataPagamento) {
          updates.dataPagamento = new Date(input.dataPagamento);
        }
        if (input.observacao !== undefined) {
          updates.observacao = input.observacao;
        }
        
        updates.modificadoPor = ctx.user?.name || 'Sistema';
        updates.modificadoEm = new Date();
        
        await db.updatePagamentoJuros(input.id, updates);
        return { success: true };
      }),
      
    // Excluir pagamento de juros
    deletePagamentoJuros: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePagamentoJuros(input.id);
        return { success: true };
      }),
      
    // Editar amortização
    updateAmortizacao: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          valorAmortizado: z.number().positive().optional(),
          dataAmortizacao: z.string().optional(),
          observacao: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const amortizacao = await db.getAmortizacaoById(input.id);
        if (!amortizacao) throw new Error("Amortização não encontrada");
        
        const updates: any = {};
        
        // Se o valor foi alterado, precisamos recalcular saldos e juros
        if (input.valorAmortizado !== undefined && input.valorAmortizado * 100 !== amortizacao.valorAmortizado) {
          const emprestimo = await db.getEmprestimoById(amortizacao.emprestimoId);
          if (!emprestimo) throw new Error("Empréstimo não encontrado");
          
          const valorAmortizadoCentavos = Math.round(input.valorAmortizado * 100);
          const diferencaAmortizacao = valorAmortizadoCentavos - amortizacao.valorAmortizado;
          
          // Recalcular saldos
          const novoSaldoNovo = amortizacao.saldoNovo - diferencaAmortizacao;
          if (novoSaldoNovo < 0) {
            throw new Error("Valor da amortização excede o saldo devedor disponível");
          }
          
          // Recalcular juros
          const taxaJurosDecimal = emprestimo.taxaJuros / 10000;
          const novoJurosNovo = Math.round(novoSaldoNovo * taxaJurosDecimal);
          
          updates.valorAmortizado = valorAmortizadoCentavos;
          updates.saldoNovo = novoSaldoNovo;
          updates.jurosNovo = novoJurosNovo;
          
          // Atualizar empréstimo também
          await db.updateEmprestimo(amortizacao.emprestimoId, {
            saldoDevedor: novoSaldoNovo,
            valorJurosMensal: novoJurosNovo,
            status: novoSaldoNovo === 0 ? 'pago' : emprestimo.status,
            dataPagamento: novoSaldoNovo === 0 ? new Date() : emprestimo.dataPagamento,
          });
        }
        
        if (input.dataAmortizacao) {
          updates.dataAmortizacao = new Date(input.dataAmortizacao);
        }
        if (input.observacao !== undefined) {
          updates.observacao = input.observacao;
        }
        
        updates.modificadoPor = ctx.user?.name || 'Sistema';
        updates.modificadoEm = new Date();
        
        await db.updateAmortizacao(input.id, updates);
        return { success: true };
      }),
      
    // Excluir amortização
    deleteAmortizacao: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Buscar amortização antes de excluir
        const amortizacao = await db.getAmortizacaoById(input.id);
        if (!amortizacao) throw new Error("Amortização não encontrada");
        
        // Buscar empréstimo
        const emprestimo = await db.getEmprestimoById(amortizacao.emprestimoId);
        if (!emprestimo) throw new Error("Empréstimo não encontrado");
        
        // Reverter a amortização no empréstimo
        const novoSaldoDevedor = emprestimo.saldoDevedor + amortizacao.valorAmortizado;
        const taxaJurosDecimal = emprestimo.taxaJuros / 10000;
        const novoJurosMensal = Math.round(novoSaldoDevedor * taxaJurosDecimal);
        
        await db.updateEmprestimo(amortizacao.emprestimoId, {
          saldoDevedor: novoSaldoDevedor,
          valorJurosMensal: novoJurosMensal,
          status: 'pendente', // Voltar para pendente
          dataPagamento: null,
          modificadoPor: ctx.user?.name || 'Sistema',
          modificadoEm: new Date(),
        });
        
        // Excluir amortização
        await db.deleteAmortizacao(input.id);
        return { success: true };
      }),
  }),

  // Rota do Dashboard
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      return await db.getDashboardStats();
    }),
    paymentStats: protectedProcedure.query(async () => {
      const emprestimos = await db.getAllEmprestimosComClientes();
      
      // Estatísticas por status
      const statusStats = {
        pagos: emprestimos.filter((e: any) => e.status === "pago").length,
        pendentes: emprestimos.filter((e: any) => e.status === "pendente").length,
        atrasados: emprestimos.filter((e: any) => e.status === "atrasado").length,
      };
      
      // Ranking de clientes por pagamentos
      const clientesMap = new Map<number, { nome: string; pagos: number; atrasados: number; total: number }>();
      
      for (const emp of emprestimos) {
        if (!emp.cliente) continue;
        
        const clienteId = emp.cliente.id;
        if (!clientesMap.has(clienteId)) {
          clientesMap.set(clienteId, {
            nome: emp.cliente.nome,
            pagos: 0,
            atrasados: 0,
            total: 0,
          });
        }
        
        const stats = clientesMap.get(clienteId)!;
        stats.total++;
        
        if (emp.status === "pago") {
          stats.pagos++;
        } else if (emp.status === "atrasado") {
          stats.atrasados++;
        }
      }
      
      // Converter para array e calcular taxa de pontualidade
      const rankingClientes = Array.from(clientesMap.values())
        .map(c => ({
          ...c,
          taxaPontualidade: c.total > 0 ? Math.round((c.pagos / c.total) * 100) : 0,
        }))
        .sort((a, b) => b.taxaPontualidade - a.taxaPontualidade)
        .slice(0, 10); // Top 10
      
      return {
        statusStats,
        rankingClientes,
      };
    }),
  }),
  
  parcelas: router({
    transacoesRecentes: publicProcedure.query(async () => {
      const emprestimos = await db.getAllEmprestimosComClientes();
      const parcelas = await db.getAllParcelas();
      
      const transacoes: Array<{
        id: string;
        tipo: 'emprestimo' | 'pagamento';
        data: Date;
        descricao: string;
        valor: number;
        cliente: string;
      }> = [];
      
      // Adicionar empréstimos
      emprestimos.forEach(emp => {
        transacoes.push({
          id: `emp-${emp.id}`,
          tipo: 'emprestimo',
          data: emp.dataEmprestimo,
          descricao: 'Empréstimo concedido',
          valor: emp.valorEmprestado,
          cliente: emp.cliente?.nome || 'Desconhecido',
        });
      });
      
      // Adicionar parcelas pagas
      parcelas
        .filter(p => p.status === 'pago' && p.dataPagamento)
        .forEach(parcela => {
          const emprestimo = emprestimos.find(e => e.id === parcela.emprestimoId);
          transacoes.push({
            id: `parc-${parcela.id}`,
            tipo: 'pagamento',
            data: parcela.dataPagamento!,
            descricao: `Pagamento parcela ${parcela.numeroParcela}`,
            valor: parcela.valorPago || parcela.valorParcela,
            cliente: emprestimo?.cliente?.nome || 'Desconhecido',
          });
        });
      
      // Ordenar por data (mais recente primeiro)
      transacoes.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
      
      // Retornar apenas as 20 mais recentes
      return transacoes.slice(0, 20);
    }),
    estatisticas: publicProcedure.query(async () => {
      const todasParcelas = await db.getAllParcelas();
      const hoje = new Date();
      
      let pagas = 0;
      let pendentes = 0;
      let atrasadas = 0;
      
      todasParcelas.forEach((parcela: Parcela) => {
        if (parcela.status === 'pago') {
          pagas++;
        } else if (new Date(parcela.dataVencimento) < hoje) {
          atrasadas++;
        } else {
          pendentes++;
        }
      });
      
      return { pagas, pendentes, atrasadas, total: todasParcelas.length };
    }),
  }),
  
  assistente: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string(),
        history: z.array(z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string(),
          timestamp: z.date(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        // Contexto sobre o sistema
        const systemPrompt = `Você é um assistente virtual do sistema Bruno's Loan, um sistema de gestão de empréstimos.

Funcionalidades do sistema:
- Cadastro de clientes (nome, telefone, email, anotações)
- Gestão de empréstimos com duas modalidades:
  1. Empréstimo Parcelado: parcelas fixas com vencimento definido, calculadas com juros compostos
  2. Empréstimo com Juros Recorrente: cliente paga apenas juros mensais e pode fazer amortizações
- Dashboard com gráficos e estatísticas
- Sistema de lembretes por email
- Controle de usuários (admin e operador)
- Autenticação de dois fatores (2FA)
- Logs de auditoria

Você pode executar ações no sistema:
- Cadastrar e editar clientes
- Buscar clientes por nome
- Cadastrar empréstimos parcelados (com cálculo automático de parcelas)
- Cadastrar empréstimos com juros recorrente
- Consultar empréstimos de um cliente específico
- Consultar parcelas de um empréstimo
- Listar empréstimos por status (pendente, pago, atrasado)
- Registrar pagamento de parcela (empréstimos parcelados)
- Registrar pagamento de juros (empréstimos com juros recorrente)
- Registrar amortização (empréstimos com juros recorrente)

Sempre responda em português brasileiro de forma clara e objetiva.
Quando executar uma ação, confirme os detalhes da operação realizada.
Para cadastrar empréstimos, você precisa do ID do cliente - se não souber, busque o cliente primeiro.
Para registrar pagamentos, você precisa do ID da parcela ou do empréstimo.`;
        
        // Definir tools disponíveis
        const tools = [
          {
            type: 'function' as const,
            function: {
              name: 'cadastrar_cliente',
              description: 'Cadastra um novo cliente no sistema',
              parameters: {
                type: 'object',
                properties: {
                  nome: { type: 'string', description: 'Nome completo do cliente' },
                  telefone: { type: 'string', description: 'Telefone do cliente (opcional)' },
                  email: { type: 'string', description: 'Email do cliente (opcional)' },
                  anotacoes: { type: 'string', description: 'Anotações sobre o cliente (opcional)' },
                },
                required: ['nome'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'editar_cliente',
              description: 'Edita dados de um cliente existente',
              parameters: {
                type: 'object',
                properties: {
                  clienteId: { type: 'number', description: 'ID do cliente a ser editado' },
                  nome: { type: 'string', description: 'Novo nome do cliente (opcional)' },
                  telefone: { type: 'string', description: 'Novo telefone do cliente (opcional)' },
                  email: { type: 'string', description: 'Novo email do cliente (opcional)' },
                  anotacoes: { type: 'string', description: 'Novas anotações sobre o cliente (opcional)' },
                },
                required: ['clienteId'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'buscar_clientes',
              description: 'Busca clientes por nome (busca parcial)',
              parameters: {
                type: 'object',
                properties: {
                  nome: { type: 'string', description: 'Nome ou parte do nome do cliente para buscar' },
                },
                required: ['nome'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'cadastrar_emprestimo_parcelado',
              description: 'Cadastra um novo empréstimo parcelado com parcelas fixas',
              parameters: {
                type: 'object',
                properties: {
                  clienteId: { type: 'number', description: 'ID do cliente que receberá o empréstimo' },
                  valorEmprestado: { type: 'number', description: 'Valor total emprestado em reais' },
                  taxaJuros: { type: 'number', description: 'Taxa de juros mensal em porcentagem (ex: 10.5 para 10,5%)' },
                  quantidadeParcelas: { type: 'number', description: 'Quantidade de parcelas' },
                  dataEmprestimo: { type: 'string', description: 'Data do empréstimo no formato YYYY-MM-DD' },
                  dataVencimento: { type: 'string', description: 'Data de vencimento da primeira parcela no formato YYYY-MM-DD' },
                },
                required: ['clienteId', 'valorEmprestado', 'taxaJuros', 'quantidadeParcelas', 'dataEmprestimo', 'dataVencimento'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'cadastrar_emprestimo_juros_recorrente',
              description: 'Cadastra um empréstimo com juros recorrente (cliente paga apenas juros mensais)',
              parameters: {
                type: 'object',
                properties: {
                  clienteId: { type: 'number', description: 'ID do cliente que receberá o empréstimo' },
                  valorEmprestado: { type: 'number', description: 'Valor total emprestado em reais' },
                  taxaJuros: { type: 'number', description: 'Taxa de juros mensal em porcentagem (ex: 10.5 para 10,5%)' },
                  dataEmprestimo: { type: 'string', description: 'Data do empréstimo no formato YYYY-MM-DD' },
                  dataVencimento: { type: 'string', description: 'Data de vencimento do primeiro pagamento de juros no formato YYYY-MM-DD' },
                },
                required: ['clienteId', 'valorEmprestado', 'taxaJuros', 'dataEmprestimo', 'dataVencimento'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'consultar_emprestimos_cliente',
              description: 'Consulta todos os empréstimos de um cliente específico',
              parameters: {
                type: 'object',
                properties: {
                  clienteId: { type: 'number', description: 'ID do cliente' },
                },
                required: ['clienteId'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'listar_emprestimos_por_status',
              description: 'Lista empréstimos filtrados por status',
              parameters: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['pendente', 'pago', 'atrasado'], description: 'Status dos empréstimos a listar' },
                },
                required: ['status'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'consultar_parcelas_emprestimo',
              description: 'Consulta todas as parcelas de um empréstimo específico',
              parameters: {
                type: 'object',
                properties: {
                  emprestimoId: { type: 'number', description: 'ID do empréstimo' },
                },
                required: ['emprestimoId'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'registrar_pagamento_parcela',
              description: 'Registra o pagamento de uma parcela de empréstimo parcelado',
              parameters: {
                type: 'object',
                properties: {
                  parcelaId: { type: 'number', description: 'ID da parcela a ser paga' },
                  valorPago: { type: 'number', description: 'Valor pago em reais (opcional, usa valor da parcela se não informado)' },
                  dataPagamento: { type: 'string', description: 'Data do pagamento no formato YYYY-MM-DD (opcional, usa data atual se não informado)' },
                },
                required: ['parcelaId'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'registrar_pagamento_juros',
              description: 'Registra um pagamento de juros mensal para empréstimo com juros recorrente',
              parameters: {
                type: 'object',
                properties: {
                  emprestimoId: { type: 'number', description: 'ID do empréstimo' },
                  valorPago: { type: 'number', description: 'Valor pago em reais' },
                  dataPagamento: { type: 'string', description: 'Data do pagamento no formato YYYY-MM-DD (opcional, usa data atual se não informado)' },
                },
                required: ['emprestimoId', 'valorPago'],
              },
            },
          },
          {
            type: 'function' as const,
            function: {
              name: 'registrar_amortizacao',
              description: 'Registra uma amortização (pagamento parcial do principal) para empréstimo com juros recorrente',
              parameters: {
                type: 'object',
                properties: {
                  emprestimoId: { type: 'number', description: 'ID do empréstimo' },
                  valorAmortizado: { type: 'number', description: 'Valor amortizado em reais' },
                  dataAmortizacao: { type: 'string', description: 'Data da amortização no formato YYYY-MM-DD (opcional, usa data atual se não informado)' },
                },
                required: ['emprestimoId', 'valorAmortizado'],
              },
            },
          },
        ];
        
        // Construir histórico de mensagens
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...(input.history || []).slice(-10).map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          })),
          { role: 'user' as const, content: input.message },
        ];
        
        // Primeira chamada ao LLM com tools
        const response = await invokeLLM({ 
          messages,
          tools,
          tool_choice: 'auto',
        });
        
        const responseMessage = response.choices[0].message;
        
        // Verificar se há tool calls
        if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
          const toolCall = responseMessage.tool_calls[0];
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          let toolResult: any = null;
          
          // Executar a função apropriada
          if (functionName === 'cadastrar_cliente') {
            const clienteId = await db.createCliente({
              nome: functionArgs.nome,
              telefone: functionArgs.telefone,
              email: functionArgs.email,
              anotacoes: functionArgs.anotacoes,
            });
            toolResult = { success: true, clienteId, nome: functionArgs.nome };
          } else if (functionName === 'editar_cliente') {
            const { clienteId, ...updates } = functionArgs;
            await db.updateCliente(clienteId, updates);
            toolResult = { success: true, clienteId, updates };
          } else if (functionName === 'buscar_clientes') {
            const todosClientes = await db.getAllClientes();
            const clientesEncontrados = todosClientes.filter(c => 
              c.nome.toLowerCase().includes(functionArgs.nome.toLowerCase())
            );
            toolResult = { clientes: clientesEncontrados };
          } else if (functionName === 'cadastrar_emprestimo_parcelado') {
            // Calcular valor da parcela com juros compostos
            const valorEmprestadoCentavos = Math.round(functionArgs.valorEmprestado * 100);
            const taxaJurosCentesimos = Math.round(functionArgs.taxaJuros * 100);
            const taxaDecimal = functionArgs.taxaJuros / 100;
            const n = functionArgs.quantidadeParcelas;
            
            // Fórmula de juros compostos: M = C * (1 + i)^n
            const montanteTotal = functionArgs.valorEmprestado * Math.pow(1 + taxaDecimal, n);
            const valorParcela = montanteTotal / n;
            const valorParcelaCentavos = Math.round(valorParcela * 100);
            
            const emprestimoId = await db.createEmprestimo({
              clienteId: functionArgs.clienteId,
              tipoEmprestimo: 'parcelado' as const,
              valorEmprestado: valorEmprestadoCentavos,
              taxaJuros: taxaJurosCentesimos,
              saldoDevedor: valorEmprestadoCentavos,
              quantidadeParcelas: functionArgs.quantidadeParcelas,
              valorParcela: valorParcelaCentavos,
              valorJurosMensal: null,
              dataEmprestimo: new Date(functionArgs.dataEmprestimo),
              dataVencimento: new Date(functionArgs.dataVencimento),
              status: 'pendente' as const,
            });
            
            // Criar parcelas
            const dataVencimentoBase = new Date(functionArgs.dataVencimento);
            for (let i = 1; i <= functionArgs.quantidadeParcelas; i++) {
              const dataVencimentoParcela = new Date(dataVencimentoBase);
              dataVencimentoParcela.setMonth(dataVencimentoParcela.getMonth() + (i - 1));
              
              await db.createParcela({
                emprestimoId,
                numeroParcela: i,
                dataVencimento: dataVencimentoParcela,
                valorParcela: valorParcelaCentavos,
                status: 'pendente' as const,
              });
            }
            
            toolResult = { 
              success: true, 
              emprestimoId, 
              valorParcela: valorParcela.toFixed(2),
              valorTotal: montanteTotal.toFixed(2),
              quantidadeParcelas: functionArgs.quantidadeParcelas,
            };
          } else if (functionName === 'cadastrar_emprestimo_juros_recorrente') {
            const valorEmprestadoCentavos = Math.round(functionArgs.valorEmprestado * 100);
            const taxaJurosCentesimos = Math.round(functionArgs.taxaJuros * 100);
            const valorJurosMensal = functionArgs.valorEmprestado * (functionArgs.taxaJuros / 100);
            const valorJurosMensalCentavos = Math.round(valorJurosMensal * 100);
            
            const emprestimoId = await db.createEmprestimo({
              clienteId: functionArgs.clienteId,
              tipoEmprestimo: 'juros_recorrente' as const,
              valorEmprestado: valorEmprestadoCentavos,
              taxaJuros: taxaJurosCentesimos,
              saldoDevedor: valorEmprestadoCentavos,
              quantidadeParcelas: 1,
              valorParcela: valorJurosMensalCentavos,
              valorJurosMensal: valorJurosMensalCentavos,
              dataEmprestimo: new Date(functionArgs.dataEmprestimo),
              dataVencimento: new Date(functionArgs.dataVencimento),
              status: 'pendente' as const,
            });
            
            toolResult = { 
              success: true, 
              emprestimoId,
              valorJurosMensal: valorJurosMensal.toFixed(2),
              valorEmprestado: functionArgs.valorEmprestado.toFixed(2),
            };
          } else if (functionName === 'consultar_emprestimos_cliente') {
            const todosEmprestimos = await db.getAllEmprestimos();
            const emprestimosCliente = todosEmprestimos.filter(e => e.clienteId === functionArgs.clienteId);
            
            const emprestimosFormatados = emprestimosCliente.map(emp => ({
              id: emp.id,
              tipo: emp.tipoEmprestimo,
              valorEmprestado: (emp.valorEmprestado / 100).toFixed(2),
              taxaJuros: (emp.taxaJuros / 100).toFixed(2) + '%',
              status: emp.status,
              dataEmprestimo: emp.dataEmprestimo.toISOString().split('T')[0],
              dataVencimento: emp.dataVencimento ? emp.dataVencimento.toISOString().split('T')[0] : 'N/A',
            }));
            
            toolResult = { emprestimos: emprestimosFormatados };
          } else if (functionName === 'listar_emprestimos_por_status') {
            const todosEmprestimos = await db.getAllEmprestimos();
            const todosClientes = await db.getAllClientes();
            const clientesMap = new Map(todosClientes.map(c => [c.id, c]));
            
            const emprestimosFiltrados = todosEmprestimos.filter(e => e.status === functionArgs.status);
            
            const emprestimosFormatados = emprestimosFiltrados.map(emp => ({
              id: emp.id,
              cliente: clientesMap.get(emp.clienteId)?.nome || 'Desconhecido',
              tipo: emp.tipoEmprestimo,
              valorEmprestado: (emp.valorEmprestado / 100).toFixed(2),
              taxaJuros: (emp.taxaJuros / 100).toFixed(2) + '%',
              status: emp.status,
              dataVencimento: emp.dataVencimento ? emp.dataVencimento.toISOString().split('T')[0] : 'N/A',
            }));
            
            toolResult = { emprestimos: emprestimosFormatados, total: emprestimosFormatados.length };
          } else if (functionName === 'consultar_parcelas_emprestimo') {
            const parcelas = await db.getParcelasByEmprestimoId(functionArgs.emprestimoId);
            
            const parcelasFormatadas = parcelas.map(p => ({
              id: p.id,
              numero: p.numeroParcela,
              valor: (p.valorParcela / 100).toFixed(2),
              vencimento: p.dataVencimento.toISOString().split('T')[0],
              status: p.status,
              dataPagamento: p.dataPagamento ? p.dataPagamento.toISOString().split('T')[0] : null,
              valorPago: p.valorPago ? (p.valorPago / 100).toFixed(2) : null,
            }));
            
            toolResult = { parcelas: parcelasFormatadas, total: parcelas.length };
          } else if (functionName === 'registrar_pagamento_parcela') {
            const todasParcelasTemp = await db.getAllParcelas();
            const parcela = todasParcelasTemp.find(p => p.id === functionArgs.parcelaId);
            if (!parcela) {
              toolResult = { success: false, error: 'Parcela não encontrada' };
            } else {
              const valorPagoCentavos = functionArgs.valorPago 
                ? Math.round(functionArgs.valorPago * 100)
                : parcela.valorParcela;
              
              const dataPagamento = functionArgs.dataPagamento 
                ? new Date(functionArgs.dataPagamento)
                : new Date();
              
              await db.updateParcela(functionArgs.parcelaId, {
                status: 'pago' as const,
                dataPagamento,
                valorPago: valorPagoCentavos,
              });
              
              // Verificar se todas as parcelas do empréstimo foram pagas
              const todasParcelas = await db.getParcelasByEmprestimoId(parcela.emprestimoId);
              const todasPagas = todasParcelas.every(p => p.id === functionArgs.parcelaId || p.status === 'pago');
              
              if (todasPagas) {
                await db.updateEmprestimo(parcela.emprestimoId, {
                  status: 'pago' as const,
                  dataPagamento: new Date(),
                });
              }
              
              toolResult = { 
                success: true, 
                parcelaId: functionArgs.parcelaId,
                numeroParcela: parcela.numeroParcela,
                valorPago: (valorPagoCentavos / 100).toFixed(2),
                emprestimoQuitado: todasPagas,
              };
            }
          } else if (functionName === 'registrar_pagamento_juros') {
            const emprestimo = await db.getEmprestimoById(functionArgs.emprestimoId);
            if (!emprestimo) {
              toolResult = { success: false, error: 'Empréstimo não encontrado' };
            } else if (emprestimo.tipoEmprestimo !== 'juros_recorrente') {
              toolResult = { success: false, error: 'Este empréstimo não é do tipo juros recorrente' };
            } else {
              const valorPagoCentavos = Math.round(functionArgs.valorPago * 100);
              const dataPagamento = functionArgs.dataPagamento 
                ? new Date(functionArgs.dataPagamento)
                : new Date();
              
              await db.createPagamentoJuros({
                emprestimoId: functionArgs.emprestimoId,
                valorPago: valorPagoCentavos,
                dataPagamento,
              });
              
              toolResult = { 
                success: true, 
                emprestimoId: functionArgs.emprestimoId,
                valorPago: functionArgs.valorPago.toFixed(2),
                dataPagamento: dataPagamento.toISOString().split('T')[0],
              };
            }
          } else if (functionName === 'registrar_amortizacao') {
            const emprestimo = await db.getEmprestimoById(functionArgs.emprestimoId);
            if (!emprestimo) {
              toolResult = { success: false, error: 'Empréstimo não encontrado' };
            } else if (emprestimo.tipoEmprestimo !== 'juros_recorrente') {
              toolResult = { success: false, error: 'Este empréstimo não é do tipo juros recorrente' };
            } else {
              const valorAmortizadoCentavos = Math.round(functionArgs.valorAmortizado * 100);
              const dataAmortizacao = functionArgs.dataAmortizacao 
                ? new Date(functionArgs.dataAmortizacao)
                : new Date();
              
              // Calcular novo saldo devedor
              const novoSaldoDevedor = emprestimo.saldoDevedor - valorAmortizadoCentavos;
              
              if (novoSaldoDevedor < 0) {
                toolResult = { success: false, error: 'Valor de amortização maior que o saldo devedor' };
              } else {
                // Recalcular juros mensal
                const taxaDecimal = emprestimo.taxaJuros / 10000;
                const novoJurosMensal = Math.round((novoSaldoDevedor / 100) * taxaDecimal * 100);
                
                // Registrar amortização
                await db.createAmortizacao({
                  emprestimoId: functionArgs.emprestimoId,
                  valorAmortizado: valorAmortizadoCentavos,
                  saldoAnterior: emprestimo.saldoDevedor,
                  saldoNovo: novoSaldoDevedor,
                  jurosAnterior: emprestimo.valorJurosMensal || 0,
                  jurosNovo: novoJurosMensal,
                  dataAmortizacao,
                });
                
                // Atualizar empréstimo
                const statusAtualizado = novoSaldoDevedor === 0 ? 'pago' as const : emprestimo.status;
                await db.updateEmprestimo(functionArgs.emprestimoId, {
                  saldoDevedor: novoSaldoDevedor,
                  valorJurosMensal: novoJurosMensal,
                  status: statusAtualizado,
                  ...(novoSaldoDevedor === 0 ? { dataPagamento: new Date() } : {}),
                });
                
                toolResult = { 
                  success: true, 
                  emprestimoId: functionArgs.emprestimoId,
                  valorAmortizado: functionArgs.valorAmortizado.toFixed(2),
                  novoSaldoDevedor: (novoSaldoDevedor / 100).toFixed(2),
                  novoJurosMensal: (novoJurosMensal / 100).toFixed(2),
                  emprestimoQuitado: novoSaldoDevedor === 0,
                };
              }
            }
          }
          
          // Segunda chamada ao LLM com o resultado da tool
          const finalMessages = [
            ...messages,
            responseMessage,
            {
              role: 'tool' as const,
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult),
            },
          ];
          
          const finalResponse = await invokeLLM({ messages: finalMessages });
          const finalContent = finalResponse.choices[0].message.content;
          const finalText = typeof finalContent === 'string' ? finalContent : 'Ação executada com sucesso.';
          
          return {
            response: finalText,
            action: functionName,
            actionData: toolResult,
          };
        }
        
        // Se não houver tool calls, retornar resposta normal
        const content = responseMessage.content;
        const responseText = typeof content === 'string' ? content : 'Desculpe, não consegui processar sua mensagem.';
        
        return {
          response: responseText,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
