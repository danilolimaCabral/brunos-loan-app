import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clientes, emprestimos, parcelas, Cliente, InsertCliente, Emprestimo, InsertEmprestimo, Parcela, InsertParcela, usuariosSistema, UsuarioSistema, pagamentosJuros, InsertPagamentoJuros, PagamentoJuros, amortizacoes, InsertAmortizacao, Amortizacao } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Clientes =====

export async function getAllClientes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clientes).orderBy(desc(clientes.createdAt));
}

export async function getClienteById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCliente(data: InsertCliente) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clientes).values(data);
  return Number(result[0].insertId);
}

export async function updateCliente(id: number, data: Partial<InsertCliente>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clientes).set(data).where(eq(clientes.id, id));
}

export async function deleteCliente(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clientes).where(eq(clientes.id, id));
}

// ===== Empréstimos =====

export async function getAllEmprestimos() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emprestimos).orderBy(desc(emprestimos.createdAt));
}

export async function getAllEmprestimosComClientes() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select({
      emprestimo: emprestimos,
      cliente: clientes,
    })
    .from(emprestimos)
    .leftJoin(clientes, eq(emprestimos.clienteId, clientes.id))
    .orderBy(desc(emprestimos.createdAt));
  
  return result.map(r => ({
    ...r.emprestimo,
    cliente: r.cliente,
  }));
}

export async function getEmprestimoById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emprestimos).where(eq(emprestimos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getEmprestimosByClienteId(clienteId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emprestimos).where(eq(emprestimos.clienteId, clienteId)).orderBy(desc(emprestimos.dataVencimento));
}

export async function createEmprestimo(data: InsertEmprestimo) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(emprestimos).values(data);
  return Number(result[0].insertId);
}

export async function updateEmprestimo(id: number, data: Partial<InsertEmprestimo>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(emprestimos).set(data).where(eq(emprestimos.id, id));
}

export async function deleteEmprestimo(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(emprestimos).where(eq(emprestimos.id, id));
}

// ===== Estatísticas do Dashboard =====

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalAReceber: 0,
    lucroPotencial: 0,
    emprestimosAtrasados: 0,
    clientesAtivos: 0,
  };

  const now = new Date();
  const allEmprestimos = await db.select().from(emprestimos);

  let totalAReceber = 0;
  let lucroPotencial = 0;
  let emprestimosAtrasados = 0;
  const clientesAtivosSet = new Set<number>();

  for (const emp of allEmprestimos) {
    if (emp.status !== "pago") {
      const valorTotal = emp.valorEmprestado + (emp.valorEmprestado * emp.taxaJuros / 10000);
      const juros = emp.valorEmprestado * emp.taxaJuros / 10000;
      totalAReceber += valorTotal;
      lucroPotencial += juros;
      clientesAtivosSet.add(emp.clienteId);

      if (emp.dataVencimento && emp.dataVencimento < now) {
        emprestimosAtrasados++;
      }
    }
  }

  return {
    totalAReceber: Math.round(totalAReceber),
    lucroPotencial: Math.round(lucroPotencial),
    emprestimosAtrasados,
    clientesAtivos: clientesAtivosSet.size,
  };
}

// ===== Parcelas =====

export async function getAllParcelas() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parcelas);
}

export async function getParcelasByEmprestimoId(emprestimoId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(parcelas).where(eq(parcelas.emprestimoId, emprestimoId)).orderBy(parcelas.numeroParcela);
}

export async function createParcela(data: InsertParcela) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(parcelas).values(data);
  return Number(result[0].insertId);
}

export async function updateParcela(id: number, data: Partial<InsertParcela>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parcelas).set(data).where(eq(parcelas.id, id));
}

export async function marcarParcelaComoPaga(id: number, valorPago: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(parcelas).set({
    status: "pago",
    dataPagamento: new Date(),
    valorPago,
  }).where(eq(parcelas.id, id));
}

export async function deleteParcela(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(parcelas).where(eq(parcelas.id, id));
}

// ===== Usuários do Sistema (2FA) =====

export async function getUsuarioByUsername(username: string): Promise<UsuarioSistema | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get usuario: database not available");
    return undefined;
  }
  
  const result = await db.select().from(usuariosSistema).where(eq(usuariosSistema.username, username)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUsuarioBackupCodes(id: number, backupCodes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usuariosSistema).set({ backupCodes }).where(eq(usuariosSistema.id, id));
}

export async function updateUsuarioTwoFactor(id: number, data: { twoFactorEnabled?: number; twoFactorSecret?: string; backupCodes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usuariosSistema).set(data).where(eq(usuariosSistema.id, id));
}

export async function createUsuarioSistema(username: string, senha: string, nome: string, email?: string, role: 'admin' | 'operador' = 'operador') {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(usuariosSistema).values({
    username,
    senha, // Deve ser hash
    nome,
    email: email || null,
    role,
    ativo: 1,
  });
  
  return Number(result[0].insertId);
}

export async function getAllUsuariosSistema() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: usuariosSistema.id,
    username: usuariosSistema.username,
    nome: usuariosSistema.nome,
    email: usuariosSistema.email,
    role: usuariosSistema.role,
    ativo: usuariosSistema.ativo,
    twoFactorEnabled: usuariosSistema.twoFactorEnabled,
    lastActivity: usuariosSistema.lastActivity,
    createdAt: usuariosSistema.createdAt,
  }).from(usuariosSistema).orderBy(desc(usuariosSistema.createdAt));
}

export async function deleteUsuarioSistema(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(usuariosSistema).where(eq(usuariosSistema.id, id));
}

export async function updateUsuarioLastActivity(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(usuariosSistema)
    .set({ lastActivity: new Date() })
    .where(eq(usuariosSistema.id, id));
}


// ===== Funções para Pagamentos de Juros =====

export async function createPagamentoJuros(data: InsertPagamentoJuros) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pagamentosJuros).values(data);
  return Number((result as any).insertId);
}

export async function getPagamentosJurosByEmprestimoId(emprestimoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(pagamentosJuros).where(eq(pagamentosJuros.emprestimoId, emprestimoId)).orderBy(desc(pagamentosJuros.dataPagamento));
}

// ===== Funções para Amortizações =====

export async function createAmortizacao(data: InsertAmortizacao) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(amortizacoes).values(data);
  return Number((result as any).insertId);
}

export async function getAmortizacoesByEmprestimoId(emprestimoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(amortizacoes).where(eq(amortizacoes.emprestimoId, emprestimoId)).orderBy(desc(amortizacoes.dataAmortizacao));
}

export async function getTotalAmortizado(emprestimoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({
    total: sql<number>`COALESCE(SUM(${amortizacoes.valorAmortizado}), 0)`
  }).from(amortizacoes).where(eq(amortizacoes.emprestimoId, emprestimoId));
  return result[0]?.total || 0;
}

export async function getTotalJurosPagos(emprestimoId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select({
    total: sql<number>`COALESCE(SUM(${pagamentosJuros.valorPago}), 0)`
  }).from(pagamentosJuros).where(eq(pagamentosJuros.emprestimoId, emprestimoId));
  return result[0]?.total || 0;
}

// Funções adicionais para edição e exclusão de pagamentos de juros
export async function updatePagamentoJuros(id: number, data: Partial<InsertPagamentoJuros>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pagamentosJuros).set(data).where(eq(pagamentosJuros.id, id));
}

export async function deletePagamentoJuros(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pagamentosJuros).where(eq(pagamentosJuros.id, id));
}

export async function getPagamentoJurosById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(pagamentosJuros).where(eq(pagamentosJuros.id, id)).limit(1);
  return result[0];
}

// Funções adicionais para edição e exclusão de amortizações
export async function updateAmortizacao(id: number, data: Partial<InsertAmortizacao>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(amortizacoes).set(data).where(eq(amortizacoes.id, id));
}

export async function deleteAmortizacao(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(amortizacoes).where(eq(amortizacoes.id, id));
}

export async function getAmortizacaoById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(amortizacoes).where(eq(amortizacoes.id, id)).limit(1);
  return result[0];
}
