# 💰 Bruno's Loan - Sistema de Gestão de Empréstimos

Sistema completo de gestão de empréstimos com funcionalidades avançadas de edição, auditoria e recalculo automático.

[![Deploy Status](https://img.shields.io/badge/deploy-online-success)](https://brunos-loan-app.onrender.com)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-22.13.0-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.x-blue.svg)](https://www.typescriptlang.org)

## 🌐 Demo Online

**URL**: [https://brunos-loan-app.onrender.com](https://brunos-loan-app.onrender.com)

> ⚠️ **Nota**: O aplicativo está deployado no plano gratuito do Render. O servidor hiberna após 15 minutos de inatividade e pode levar ~50 segundos para iniciar no primeiro acesso.

## ✨ Funcionalidades

### 📊 Gestão de Empréstimos

- **Empréstimos Parcelados**: Sistema completo de parcelas com controle de vencimento e pagamento
- **Empréstimos com Juros Recorrente**: Gestão de juros mensais e amortizações
- **Recalculo Automático**: Ao editar ou excluir amortizações, o sistema recalcula automaticamente saldo devedor e juros

### ✏️ Edição Completa

- ✅ Editar empréstimos (valor, taxa, datas)
- ✅ Editar parcelas (valor, vencimento, status)
- ✅ Editar pagamentos de juros
- ✅ Editar amortizações (com recalculo automático)
- ✅ Excluir registros (apenas administradores)

### 🔍 Auditoria e Segurança

- Rastreamento completo de todas as modificações
- Registro de quem alterou e quando
- Controle de acesso por níveis (admin/operador)
- Senhas criptografadas com bcrypt
- Autenticação segura com cookies

### 🎨 Interface Moderna

- Design responsivo (mobile e desktop)
- Tema claro/escuro
- Componentes UI modernos (shadcn/ui)
- Ícones intuitivos
- Tabelas interativas

## 🚀 Tecnologias

### Frontend
- **React** + **TypeScript** + **Vite**
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **React Router** para navegação

### Backend
- **Node.js** + **Express**
- **tRPC** para type-safe API
- **Drizzle ORM** para banco de dados
- **bcryptjs** para criptografia

### Banco de Dados
- **MySQL** (ou PostgreSQL compatível)
- Migrações com Drizzle Kit

### Deploy
- **Render** (hospedagem gratuita)
- **GitHub** (versionamento)
- Deploy automático via Git push

## 📦 Instalação Local

### Pré-requisitos

- Node.js 22.13.0 ou superior
- pnpm (gerenciador de pacotes)
- MySQL 8.0 ou superior

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/danilolimaCabral/brunos-loan-app.git
cd brunos-loan-app
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure o banco de dados**

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=mysql://usuario:senha@localhost:3306/brunos_loan
COOKIE_SECRET=seu-secret-key-aqui
NODE_ENV=development
PORT=3000
```

4. **Execute as migrações**
```bash
pnpm db:push
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

6. **Acesse o aplicativo**

Abra o navegador em: http://localhost:3000

## 🗄️ Configuração do Banco de Dados

### Criar Banco MySQL

```sql
CREATE DATABASE brunos_loan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Executar Migrações

```bash
pnpm db:push
```

### Criar Primeiro Usuário

```sql
-- Senha: admin123
-- Hash bcrypt: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO usuarios_sistema (
  username, 
  password_hash, 
  nome, 
  role, 
  ativo,
  created_at,
  updated_at
) VALUES (
  'admin',
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Administrador',
  'admin',
  1,
  NOW(),
  NOW()
);
```

Login: `admin` / Senha: `admin123`

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor de desenvolvimento

# Build
pnpm build            # Compila para produção
pnpm start            # Inicia servidor de produção

# Banco de Dados
pnpm db:push          # Executa migrações
pnpm db:studio        # Abre Drizzle Studio (GUI)

# Verificação
pnpm check            # Verifica erros de TypeScript
```

## 📁 Estrutura do Projeto

```
brunos-loan-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── contexts/      # Contextos React
│   │   └── hooks/         # Custom hooks
│   └── index.html
├── server/                # Backend Node.js
│   ├── routers.ts        # Rotas tRPC
│   ├── db.ts             # Funções de banco de dados
│   └── index.ts          # Servidor Express
├── drizzle/              # Schema do banco
│   └── schema.ts
├── public/               # Arquivos estáticos
└── package.json
```

## 🌐 Deploy

### Render (Gratuito)

O aplicativo está configurado para deploy automático no Render:

1. Faça push para o repositório GitHub
2. O Render detecta automaticamente
3. Faz build e deploy em 2-5 minutos
4. Aplicativo atualizado sem downtime

### Variáveis de Ambiente Necessárias

No dashboard do Render, configure:

```env
DATABASE_URL=mysql://usuario:senha@host:porta/database
COOKIE_SECRET=<gerado automaticamente>
NODE_ENV=production
PORT=10000
```

### Serviços de Banco Recomendados

- **PlanetScale** (MySQL serverless - gratuito)
- **Railway** (MySQL/PostgreSQL)
- **Render PostgreSQL** (gratuito)

## 📚 Documentação

- [MELHORIAS_IMPLEMENTADAS.md](MELHORIAS_IMPLEMENTADAS.md) - Detalhes técnicos das melhorias
- [GUIA_RAPIDO_EDICAO.md](GUIA_RAPIDO_EDICAO.md) - Manual de uso
- [DEPLOY_FINAL.md](DEPLOY_FINAL.md) - Guia completo de deploy

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👤 Autor

**Bruno's Loan Team**

- GitHub: [@danilolimaCabral](https://github.com/danilolimaCabral)

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com) pelos componentes UI
- [Render](https://render.com) pela hospedagem gratuita
- [Drizzle ORM](https://orm.drizzle.team) pelo excelente ORM

## 📊 Status do Projeto

- ✅ **v2.0.0** - Reformado com funcionalidades completas de edição
- ✅ Deploy permanente no Render
- ✅ Repositório público no GitHub
- ✅ Documentação completa

## 🔮 Roadmap

- [ ] Relatórios em PDF
- [ ] Gráficos e dashboards
- [ ] Exportação para Excel
- [ ] Notificações por email
- [ ] API REST pública
- [ ] Aplicativo mobile

## 🐛 Reportar Bugs

Encontrou um bug? [Abra uma issue](https://github.com/danilolimaCabral/brunos-loan-app/issues/new)

## 💬 Suporte

Precisa de ajuda? [Abra uma discussão](https://github.com/danilolimaCabral/brunos-loan-app/discussions/new)

---

**Desenvolvido com ❤️ para gestão eficiente de empréstimos**
