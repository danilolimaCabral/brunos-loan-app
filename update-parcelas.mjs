import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const db = drizzle(connection);

// Limpar parcelas antigas
console.log('Limpando parcelas antigas...');
await connection.query('DELETE FROM parcelas');

// Dados das planilhas com quantidade correta de parcelas
const emprestimosComParcelas = [
  { clienteNome: 'JUNIOR (MATHEUS)', qtdParcelas: 8, valorInicial: 2000, valorParcela: 250, juros: 0.08 },
  { clienteNome: 'TATIANA', qtdParcelas: 4, valorInicial: 2500, valorParcela: 625, juros: 0.08 },
  { clienteNome: 'KATIA MAE', qtdParcelas: 4, valorInicial: 1000, valorParcela: 250, juros: 0.08 },
  { clienteNome: 'GABRIEL', qtdParcelas: 1, valorInicial: 5000, valorParcela: 5000, juros: 0.1 },
  { clienteNome: 'MALLU', qtdParcelas: 5, valorInicial: 5000, valorParcela: 1000, juros: 0.08 },
  { clienteNome: 'JUNIOR', qtdParcelas: 10, valorInicial: 9000, valorParcela: 900, juros: 0.07 },
  { clienteNome: 'CF', qtdParcelas: 7, valorInicial: 28600, valorParcela: 1906.67, juros: 0.05 },
  { clienteNome: 'THIAGO', qtdParcelas: 8, valorInicial: 18300, valorParcela: 4575, juros: 0.05 },
  { clienteNome: 'RAFAEL', qtdParcelas: 9, valorInicial: 16000, valorParcela: 6000, juros: 0.05 },
  { clienteNome: 'RONALDO', qtdParcelas: 7, valorInicial: 24000, valorParcela: 1250, juros: 0.05 },
  { clienteNome: 'GABRIEL', qtdParcelas: 7, valorInicial: 10000, valorParcela: 1000, juros: 0.1 },
  { clienteNome: 'KATIA', qtdParcelas: 6, valorInicial: 17000, valorParcela: 850, juros: 0.05 },
  { clienteNome: 'RAIANE', qtdParcelas: 1, valorInicial: 2000, valorParcela: 2000, juros: 0.1 },
  { clienteNome: 'VITORIA', qtdParcelas: 2, valorInicial: 6000, valorParcela: 3000, juros: 0.08 },
  { clienteNome: 'GUILHERME', qtdParcelas: 1, valorInicial: 5000, valorParcela: 5000, juros: 0.05 },
  { clienteNome: 'TATIANA', qtdParcelas: 4, valorInicial: 4000, valorParcela: 1000, juros: 0.08 },
  { clienteNome: 'RAIANE', qtdParcelas: 1, valorInicial: 2200, valorParcela: 2200, juros: 0.1 },
  { clienteNome: 'ANDREIA', qtdParcelas: 5, valorInicial: 6700, valorParcela: 335, juros: 0.05 },
  { clienteNome: 'KARLA', qtdParcelas: 2, valorInicial: 1000, valorParcela: 500, juros: 0.08 },
  { clienteNome: 'JEFFIM', qtdParcelas: 3, valorInicial: 5000, valorParcela: 500, juros: 0.1 },
];

console.log('Gerando parcelas para cada empréstimo...');

for (const emp of emprestimosComParcelas) {
  // Buscar cliente pelo nome
  const [clientes] = await connection.query(
    'SELECT id FROM clientes WHERE nome LIKE ?',
    [`%${emp.clienteNome}%`]
  );
  
  if (clientes.length === 0) {
    console.log(`Cliente não encontrado: ${emp.clienteNome}`);
    continue;
  }
  
  const clienteId = clientes[0].id;
  
  // Buscar empréstimo do cliente
  const [emprestimos] = await connection.query(
    'SELECT id, dataEmprestimo FROM emprestimos WHERE clienteId = ? ORDER BY id DESC LIMIT 1',
    [clienteId]
  );
  
  if (emprestimos.length === 0) {
    console.log(`Empréstimo não encontrado para: ${emp.clienteNome}`);
    continue;
  }
  
  const emprestimoId = emprestimos[0].id;
  const dataInicio = new Date(emprestimos[0].dataEmprestimo);
  
  console.log(`Gerando ${emp.qtdParcelas} parcelas para ${emp.clienteNome}...`);
  
  // Gerar parcelas com juros compostos
  for (let i = 1; i <= emp.qtdParcelas; i++) {
    const dataVencimento = new Date(dataInicio);
    dataVencimento.setMonth(dataVencimento.getMonth() + i);
    
    // Cálculo de juros compostos: valor_parcela * (1 + juros)^(i-1)
    const valorParcela = emp.valorParcela * Math.pow(1 + emp.juros, i - 1);
    
    // Converter valor para centavos
    const valorEmCentavos = Math.round(valorParcela * 100);
    
    await connection.query(
      `INSERT INTO parcelas (emprestimoId, numeroParcela, dataVencimento, valorParcela, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, 'pendente', NOW(), NOW())`,
      [emprestimoId, i, dataVencimento, valorEmCentavos]
    );
  }
}

console.log('Parcelas geradas com sucesso!');
await connection.end();
