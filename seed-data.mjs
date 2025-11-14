import { drizzle } from "drizzle-orm/mysql2";
import { clientes, emprestimos, parcelas } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

// Função para calcular parcelas com juros compostos
function calcularParcelas(valorEmprestado, quantidadeParcelas, taxaJuros, dataPrimeiraParcelaStr) {
  const valorParcela = valorEmprestado / quantidadeParcelas;
  const taxaDecimal = taxaJuros / 100;
  const parcelas = [];
  
  const dataPrimeiraParcela = new Date(dataPrimeiraParcelaStr);
  
  for (let i = 0; i < quantidadeParcelas; i++) {
    // Juros compostos: valor cresce a cada parcela
    const valorComJuros = valorParcela * Math.pow(1 + taxaDecimal, i + 1);
    
    // Calcular data de vencimento (adicionar meses)
    const dataVencimento = new Date(dataPrimeiraParcela);
    dataVencimento.setMonth(dataVencimento.getMonth() + i);
    
    parcelas.push({
      numeroParcela: i + 1,
      dataVencimento,
      valorParcela: Math.round(valorComJuros * 100), // converter para centavos
    });
  }
  
  return parcelas;
}

async function seed() {
  console.log("Iniciando população do banco de dados...");
  
  // Clientes baseados nas planilhas
  const clientesData = [
    { nome: "JUNIOR (MATHEUS)", telefone: "", email: "junior.matheus@example.com" },
    { nome: "TATIANA", telefone: "", email: "tatiana@example.com" },
    { nome: "KATIA MAE", telefone: "", email: "katia.mae@example.com" },
    { nome: "GABRIEL", telefone: "", email: "gabriel@example.com" },
    { nome: "MALLU", telefone: "", email: "mallu@example.com" },
    { nome: "JUNIOR", telefone: "", email: "junior@example.com" },
    { nome: "CF", telefone: "", email: "cf@example.com", anotacoes: "PEGOU 35.000,00 - ABATEU 400,00 - PASSOU O VALOR ATUALIZADO 28.600" },
    { nome: "THIAGO", telefone: "", email: "thiago@example.com", anotacoes: "PEGOU R$27.300,00 - PAGOU 9.000,00 - FICOU O JUROS POR MÊS DE 915,00" },
    { nome: "RAFAEL", telefone: "", email: "rafael@example.com", anotacoes: "PEGOU 110.000,00 - FICOU 16.000,00" },
    { nome: "RONALDO", telefone: "", email: "ronaldo@example.com", anotacoes: "PASSOU 20.000,00" },
    { nome: "KATIA SOGRA", telefone: "", email: "katia.sogra@example.com" },
    { nome: "RAIANE", telefone: "", email: "raiane@example.com" },
    { nome: "VITORIA", telefone: "", email: "vitoria@example.com" },
    { nome: "GUILHERME", telefone: "", email: "guilherme@example.com" },
    { nome: "ANDREIA", telefone: "", email: "andreia@example.com", anotacoes: "VAI PAGAR METADE DO VALOR EM SETEMBRO E OUTRA METADE EM DEZEMBRO" },
    { nome: "KARLA", telefone: "", email: "karla@example.com" },
    { nome: "JEFFIM", telefone: "", email: "jeffim@example.com" },
  ];
  
  console.log("Cadastrando clientes...");
  const clientesInseridos = [];
  for (const cliente of clientesData) {
    const result = await db.insert(clientes).values(cliente);
    clientesInseridos.push({ ...cliente, id: Number(result[0].insertId) });
    console.log(`✓ Cliente cadastrado: ${cliente.nome}`);
  }
  
  // Empréstimos baseados nas planilhas
  const emprestimosData = [
    {
      clienteNome: "JUNIOR (MATHEUS)",
      valorEmprestado: 2000,
      quantidadeParcelas: 8,
      taxaJuros: 8,
      dataPrimeiraParce: "2025-02-18",
      status: "pago",
    },
    {
      clienteNome: "TATIANA",
      valorEmprestado: 2500,
      quantidadeParcelas: 4,
      taxaJuros: 8,
      dataPrimeiraParce: "2025-02-20",
      status: "pago",
    },
    {
      clienteNome: "KATIA MAE",
      valorEmprestado: 1000,
      quantidadeParcelas: 4,
      taxaJuros: 8,
      dataPrimeiraParce: "2025-02-28",
      status: "pago",
    },
    {
      clienteNome: "GABRIEL",
      valorEmprestado: 5000,
      quantidadeParcelas: 1,
      taxaJuros: 10,
      dataPrimeiraParce: "2025-02-23",
      status: "pago",
    },
    {
      clienteNome: "MALLU",
      valorEmprestado: 5000,
      quantidadeParcelas: 5,
      taxaJuros: 8,
      dataPrimeiraParce: "2025-04-04",
      status: "pago",
    },
    {
      clienteNome: "JUNIOR",
      valorEmprestado: 9000,
      quantidadeParcelas: 10,
      taxaJuros: 7,
      dataPrimeiraParce: "2025-04-15",
      status: "pendente",
    },
    {
      clienteNome: "CF",
      valorEmprestado: 28600,
      quantidadeParcelas: 15,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-04-17",
      status: "pendente",
    },
    {
      clienteNome: "THIAGO",
      valorEmprestado: 18300,
      quantidadeParcelas: 8,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-03-19",
      status: "pendente",
    },
    {
      clienteNome: "RAFAEL",
      valorEmprestado: 16000,
      quantidadeParcelas: 9,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-01-20",
      status: "pendente",
    },
    {
      clienteNome: "RONALDO",
      valorEmprestado: 24000,
      quantidadeParcelas: 7,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-03-11",
      status: "pendente",
    },
    {
      clienteNome: "KATIA SOGRA",
      valorEmprestado: 17000,
      quantidadeParcelas: 15,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-05-10",
      status: "pendente",
    },
    {
      clienteNome: "RAIANE",
      valorEmprestado: 2000,
      quantidadeParcelas: 1,
      taxaJuros: 10,
      dataPrimeiraParce: "2025-06-05",
      status: "pago",
    },
    {
      clienteNome: "VITORIA",
      valorEmprestado: 6000,
      quantidadeParcelas: 2,
      taxaJuros: 8,
      dataPrimeiraParce: "2025-06-10",
      status: "pago",
    },
    {
      clienteNome: "GUILHERME",
      valorEmprestado: 5000,
      quantidadeParcelas: 1,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-07-02",
      status: "pago",
    },
    {
      clienteNome: "ANDREIA",
      valorEmprestado: 6700,
      quantidadeParcelas: 5,
      taxaJuros: 5,
      dataPrimeiraParce: "2025-07-04",
      status: "pendente",
    },
    {
      clienteNome: "KARLA",
      valorEmprestado: 1000,
      quantidadeParcelas: 2,
      taxaJuros: 8,
      dataPrimeiraParce: "2025-07-20",
      status: "pago",
    },
    {
      clienteNome: "JEFFIM",
      valorEmprestado: 5000,
      quantidadeParcelas: 3,
      taxaJuros: 10,
      dataPrimeiraParce: "2025-09-01",
      status: "pendente",
    },
  ];
  
  console.log("\nCadastrando empréstimos e parcelas...");
  for (const emp of emprestimosData) {
    const cliente = clientesInseridos.find(c => c.nome === emp.clienteNome);
    if (!cliente) {
      console.log(`✗ Cliente não encontrado: ${emp.clienteNome}`);
      continue;
    }
    
    const dataPrimeiraParcela = new Date(emp.dataPrimeiraParce);
    const dataEmprestimo = new Date(dataPrimeiraParcela);
    dataEmprestimo.setDate(dataEmprestimo.getDate() - 5); // 5 dias antes da primeira parcela
    
    const dataVencimento = new Date(dataPrimeiraParcela);
    dataVencimento.setMonth(dataVencimento.getMonth() + emp.quantidadeParcelas - 1);
    
    // Criar empréstimo
    const emprestimoResult = await db.insert(emprestimos).values({
      clienteId: cliente.id,
      valorEmprestado: emp.valorEmprestado * 100, // converter para centavos
      taxaJuros: emp.taxaJuros * 100, // converter para centésimos
      dataEmprestimo,
      dataVencimento,
      status: emp.status,
      dataPagamento: emp.status === "pago" ? dataVencimento : null,
    });
    
    const emprestimoId = Number(emprestimoResult[0].insertId);
    
    // Calcular e criar parcelas
    const parcelasCalculadas = calcularParcelas(
      emp.valorEmprestado,
      emp.quantidadeParcelas,
      emp.taxaJuros,
      emp.dataPrimeiraParce
    );
    
    for (const parcela of parcelasCalculadas) {
      await db.insert(parcelas).values({
        emprestimoId,
        numeroParcela: parcela.numeroParcela,
        dataVencimento: parcela.dataVencimento,
        valorParcela: parcela.valorParcela,
        status: emp.status === "pago" ? "pago" : "pendente",
        dataPagamento: emp.status === "pago" ? parcela.dataVencimento : null,
        valorPago: emp.status === "pago" ? parcela.valorParcela : null,
      });
    }
    
    console.log(`✓ Empréstimo cadastrado: ${emp.clienteNome} - R$ ${emp.valorEmprestado.toFixed(2)} (${emp.quantidadeParcelas}x)`);
  }
  
  console.log("\n✅ População do banco de dados concluída!");
}

seed().catch(console.error);
