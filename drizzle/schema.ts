import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela de clientes para o CRM
 */
export const clientes = mysqlTable("clientes", {
  id: int("id").autoincrement().primaryKey(),
  nome: varchar("nome", { length: 255 }).notNull(),
  telefone: varchar("telefone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  anotacoes: text("anotacoes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Cliente = typeof clientes.$inferSelect;
export type InsertCliente = typeof clientes.$inferInsert;

/**
 * Tabela de empréstimos
 */
export const emprestimos = mysqlTable("emprestimos", {
  id: int("id").autoincrement().primaryKey(),
  clienteId: int("clienteId").notNull(),
  tipoEmprestimo: mysqlEnum("tipoEmprestimo", ["parcelado", "juros_recorrente"]).default("parcelado").notNull(),
  valorEmprestado: int("valorEmprestado").notNull(), // valor em centavos
  taxaJuros: int("taxaJuros").notNull(), // taxa em centésimos de porcentagem (ex: 1050 = 10.50%)
  saldoDevedor: int("saldoDevedor").notNull(), // saldo atual devedor (para juros recorrente)
  quantidadeParcelas: int("quantidadeParcelas").default(1).notNull(), // quantidade de parcelas (apenas para parcelado)
  valorParcela: int("valorParcela").notNull(), // valor base da parcela em centavos (apenas para parcelado)
  valorJurosMensal: int("valorJurosMensal"), // valor do juros mensal atual (para juros recorrente)
  dataEmprestimo: timestamp("dataEmprestimo").notNull(),
  dataVencimento: timestamp("dataVencimento"), // Opcional - pode ser null para juros recorrente
  status: mysqlEnum("status", ["pendente", "pago", "atrasado"]).default("pendente").notNull(),
  dataPagamento: timestamp("dataPagamento"),
  modificadoPor: varchar("modificadoPor", { length: 255 }), // Username do usuário que fez a última modificação
  modificadoEm: timestamp("modificadoEm"), // Data/hora da última modificação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Emprestimo = typeof emprestimos.$inferSelect;
export type InsertEmprestimo = typeof emprestimos.$inferInsert;

/**
 * Tabela de parcelas dos empréstimos
 */
export const parcelas = mysqlTable("parcelas", {
  id: int("id").autoincrement().primaryKey(),
  emprestimoId: int("emprestimoId").notNull(),
  numeroParcela: int("numeroParcela").notNull(),
  dataVencimento: timestamp("dataVencimento").notNull(),
  valorParcela: int("valorParcela").notNull(), // valor em centavos
  dataPagamento: timestamp("dataPagamento"),
  valorPago: int("valorPago"), // valor em centavos
  status: mysqlEnum("status", ["pendente", "pago", "atrasado"]).default("pendente").notNull(),
  modificadoPor: varchar("modificadoPor", { length: 255 }), // Username do usuário que fez a última modificação
  modificadoEm: timestamp("modificadoEm"), // Data/hora da última modificação
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parcela = typeof parcelas.$inferSelect;
export type InsertParcela = typeof parcelas.$inferInsert;

// Tabela de usuários do sistema (para login tradicional)
export const usuariosSistema = mysqlTable("usuarios_sistema", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  senha: varchar("senha", { length: 255 }).notNull(), // Hash da senha
  nome: varchar("nome", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["admin", "operador"]).default("operador").notNull(),
  ativo: int("ativo").default(1).notNull(), // 1 = ativo, 0 = inativo
  twoFactorEnabled: int("twoFactorEnabled").default(0).notNull(), // 1 = habilitado, 0 = desabilitado
  twoFactorSecret: varchar("twoFactorSecret", { length: 255 }), // Secret do TOTP
  backupCodes: text("backupCodes"), // Códigos de backup (JSON)
  lastActivity: timestamp("lastActivity"), // Última atividade do usuário
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UsuarioSistema = typeof usuariosSistema.$inferSelect;
export type InsertUsuarioSistema = typeof usuariosSistema.$inferInsert;

/**
 * Tabela de pagamentos de juros (para empréstimos com juros recorrente)
 */
export const pagamentosJuros = mysqlTable("pagamentos_juros", {
  id: int("id").autoincrement().primaryKey(),
  emprestimoId: int("emprestimoId").notNull(),
  valorPago: int("valorPago").notNull(), // valor em centavos
  dataPagamento: timestamp("dataPagamento").notNull(),
  observacao: text("observacao"),
  modificadoPor: varchar("modificadoPor", { length: 255 }),
  modificadoEm: timestamp("modificadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PagamentoJuros = typeof pagamentosJuros.$inferSelect;
export type InsertPagamentoJuros = typeof pagamentosJuros.$inferInsert;

/**
 * Tabela de amortizações (pagamentos parciais do principal)
 */
export const amortizacoes = mysqlTable("amortizacoes", {
  id: int("id").autoincrement().primaryKey(),
  emprestimoId: int("emprestimoId").notNull(),
  valorAmortizado: int("valorAmortizado").notNull(), // valor em centavos
  saldoAnterior: int("saldoAnterior").notNull(), // saldo antes da amortização
  saldoNovo: int("saldoNovo").notNull(), // saldo após amortização
  jurosAnterior: int("jurosAnterior").notNull(), // valor do juros mensal antes
  jurosNovo: int("jurosNovo").notNull(), // valor do juros mensal após
  dataAmortizacao: timestamp("dataAmortizacao").notNull(),
  observacao: text("observacao"),
  modificadoPor: varchar("modificadoPor", { length: 255 }),
  modificadoEm: timestamp("modificadoEm"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Amortizacao = typeof amortizacoes.$inferSelect;
export type InsertAmortizacao = typeof amortizacoes.$inferInsert;