# Guia de Deploy do Bruno's Loan no GoDaddy

Este guia detalha o processo completo para hospedar o sistema Bruno's Loan em um servidor GoDaddy com Node.js.

---

## ⚠️ Importante: Requisitos do GoDaddy

Para hospedar o Bruno's Loan no GoDaddy, você precisará de:

1. **Plano de Hospedagem VPS ou Dedicado** (Hospedagem compartilhada NÃO suporta Node.js)
2. **Acesso SSH** ao servidor
3. **Banco de dados MySQL** (incluído na maioria dos planos)
4. **Node.js instalado** no servidor (versão 18 ou superior)

**Custo estimado:** $19.99 - $49.99/mês (dependendo do plano VPS)

---

## 📋 Pré-requisitos

Antes de começar:

- ✅ Conta ativa no GoDaddy com plano VPS ou Dedicado
- ✅ Acesso ao painel de controle (cPanel ou Plesk)
- ✅ Cliente SSH instalado (PuTTY no Windows, Terminal no Mac/Linux)
- ✅ Código-fonte do Bruno's Loan

---

## 🚀 Passo 1: Verificar Suporte a Node.js

### 1.1 Acessar o painel de controle

1. Faça login em [godaddy.com](https://godaddy.com)
2. Vá em **"Meus Produtos"** → **"Hospedagem Web"**
3. Clique em **"Gerenciar"** no seu plano de hospedagem

### 1.2 Verificar se Node.js está disponível

**Se você tem cPanel:**
1. Procure por **"Setup Node.js App"** ou **"Node.js Selector"**
2. Se encontrar, seu plano suporta Node.js ✅
3. Se NÃO encontrar, você precisará de um plano VPS ❌

**Se você tem Hospedagem Compartilhada:**
- Infelizmente, a hospedagem compartilhada do GoDaddy **NÃO suporta Node.js**
- Você precisará fazer upgrade para VPS ou usar Railway/Vercel

---

## 🗄️ Passo 2: Criar Banco de Dados MySQL

### 2.1 Acessar MySQL Databases no cPanel

1. No cPanel, procure por **"MySQL® Databases"**
2. Clique para abrir

### 2.2 Criar novo banco de dados

1. Em **"Create New Database"**, digite: `brunosloan_db`
2. Clique em **"Create Database"**
3. Anote o nome completo (geralmente: `seu_usuario_brunosloan_db`)

### 2.3 Criar usuário do banco de dados

1. Role até **"MySQL Users"**
2. Em **"Username"**, digite: `brunosloan_user`
3. Em **"Password"**, clique em **"Generate Password"** ou crie uma senha forte
4. **IMPORTANTE:** Copie e guarde a senha em local seguro
5. Clique em **"Create User"**

### 2.4 Associar usuário ao banco de dados

1. Role até **"Add User To Database"**
2. Selecione o usuário: `brunosloan_user`
3. Selecione o banco: `brunosloan_db`
4. Clique em **"Add"**
5. Na tela de privilégios, marque **"ALL PRIVILEGES"**
6. Clique em **"Make Changes"**

### 2.5 Anotar informações de conexão

Você precisará dessas informações depois:

```
Host: localhost (ou o endereço fornecido pelo GoDaddy)
Database: seu_usuario_brunosloan_db
Username: seu_usuario_brunosloan_user
Password: [a senha que você criou]
Port: 3306
```

---

## 📦 Passo 3: Preparar os Arquivos do Projeto

### 3.1 Baixar o código-fonte

Se você ainda não tem os arquivos localmente:

1. No painel do Manus, vá em **"Code"** (Código)
2. Clique em **"Download All Files"** (Baixar todos os arquivos)
3. Extraia o arquivo ZIP em uma pasta no seu computador

### 3.2 Criar arquivo de configuração de produção

Crie um arquivo chamado `.env.production` na raiz do projeto com o seguinte conteúdo:

```env
# Banco de Dados
DATABASE_URL=mysql://seu_usuario_brunosloan_user:SUA_SENHA_AQUI@localhost:3306/seu_usuario_brunosloan_db

# Segurança
JWT_SECRET=seu_segredo_super_secreto_123456789

# Ambiente
NODE_ENV=production
PORT=3000

# Aplicação
VITE_APP_TITLE=Bruno's Loan
VITE_APP_LOGO=https://seu-dominio.com/logo.png
```

**Substitua:**
- `seu_usuario_brunosloan_user` pelo usuário real do MySQL
- `SUA_SENHA_AQUI` pela senha do banco de dados
- `seu_usuario_brunosloan_db` pelo nome real do banco
- `seu_segredo_super_secreto_123456789` por uma senha aleatória forte

---

## 🚢 Passo 4: Fazer Upload dos Arquivos

### 4.1 Conectar via FTP/SFTP

**Opção A: Usar FileZilla (Recomendado)**

1. Baixe o FileZilla em [filezilla-project.org](https://filezilla-project.org)
2. Abra o FileZilla
3. Conecte usando as credenciais:
   - **Host:** ftp.seu-dominio.com (ou IP do servidor)
   - **Username:** seu usuário do cPanel
   - **Password:** sua senha do cPanel
   - **Port:** 21 (FTP) ou 22 (SFTP)

**Opção B: Usar File Manager do cPanel**

1. No cPanel, clique em **"File Manager"**
2. Navegue até a pasta `public_html` ou `www`

### 4.2 Fazer upload dos arquivos

1. Navegue até a pasta onde você quer hospedar (geralmente `public_html`)
2. Crie uma nova pasta chamada `brunos-loan`
3. Entre na pasta `brunos-loan`
4. Faça upload de **TODOS** os arquivos do projeto
5. Aguarde o upload completar (pode demorar vários minutos)

---

## ⚙️ Passo 5: Configurar Node.js no Servidor

### 5.1 Acessar Setup Node.js App

1. No cPanel, procure por **"Setup Node.js App"**
2. Clique para abrir

### 5.2 Criar nova aplicação Node.js

1. Clique em **"Create Application"**
2. Configure:
   - **Node.js version:** Selecione a versão 18.x ou superior
   - **Application mode:** Production
   - **Application root:** `/home/seu_usuario/public_html/brunos-loan`
   - **Application URL:** Seu domínio (ex: `brunosloan.com.br`)
   - **Application startup file:** `server/_core/index.ts`
   - **Passenger log file:** Deixe padrão
3. Clique em **"Create"**

### 5.3 Instalar dependências

1. Após criar a aplicação, você verá um botão **"Run NPM Install"**
2. Clique nele e aguarde (pode demorar 5-10 minutos)
3. Verifique se não há erros nos logs

---

## 🔧 Passo 6: Configurar Variáveis de Ambiente

### 6.1 Adicionar variáveis de ambiente

1. Na página da aplicação Node.js, role até **"Environment variables"**
2. Clique em **"Edit"** ou **"Add Variable"**
3. Adicione cada variável do arquivo `.env.production`:

```
DATABASE_URL = mysql://usuario:senha@localhost:3306/database
JWT_SECRET = seu_segredo_aqui
NODE_ENV = production
PORT = 3000
VITE_APP_TITLE = Bruno's Loan
```

4. Clique em **"Save"** após adicionar todas

---

## 🗃️ Passo 7: Inicializar o Banco de Dados

### 7.1 Conectar via SSH

1. Abra o terminal (Mac/Linux) ou PuTTY (Windows)
2. Conecte ao servidor:
   ```bash
   ssh seu_usuario@seu-dominio.com
   ```
3. Digite sua senha quando solicitado

### 7.2 Navegar até a pasta do projeto

```bash
cd ~/public_html/brunos-loan
```

### 7.3 Executar migrações do banco de dados

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

ou

```bash
pnpm db:push
```

### 7.4 Popular banco de dados (opcional)

Se você quiser adicionar os dados de exemplo:

```bash
node seed-data.mjs
```

---

## 🌐 Passo 8: Configurar Domínio e SSL

### 8.1 Apontar domínio

Se você tem um domínio no GoDaddy:

1. Vá em **"Meus Produtos"** → **"Domínios"**
2. Clique em **"DNS"** no seu domínio
3. Adicione um registro A:
   - **Type:** A
   - **Name:** @ (ou www)
   - **Value:** IP do seu servidor VPS
   - **TTL:** 600

### 8.2 Instalar certificado SSL (HTTPS)

1. No cPanel, procure por **"SSL/TLS Status"**
2. Selecione seu domínio
3. Clique em **"Run AutoSSL"**
4. Aguarde a instalação (1-5 minutos)

---

## ✅ Passo 9: Iniciar a Aplicação

### 9.1 Reiniciar a aplicação Node.js

1. Volte para **"Setup Node.js App"** no cPanel
2. Clique na sua aplicação
3. Clique em **"Restart"**
4. Aguarde alguns segundos

### 9.2 Acessar o sistema

1. Abra o navegador
2. Acesse: `https://seu-dominio.com`
3. Você deve ver a tela de login do Bruno's Loan
4. Faça login com:
   - **Usuário:** financeiro
   - **Senha:** financeiro2025

---

## 🔍 Passo 10: Verificação e Testes

### 10.1 Verificar logs

1. No cPanel, vá em **"Setup Node.js App"**
2. Clique na sua aplicação
3. Role até **"Application Logs"**
4. Verifique se não há erros

### 10.2 Testar funcionalidades

Teste as principais funcionalidades:

- ✅ Login funciona
- ✅ Dashboard carrega com dados
- ✅ Cadastro de clientes funciona
- ✅ Cadastro de empréstimos funciona
- ✅ Gráficos são exibidos corretamente
- ✅ Download de PDF funciona

---

## 🐛 Solução de Problemas

### Erro: "Application failed to start"

**Solução:**
1. Verifique os logs da aplicação
2. Certifique-se de que todas as dependências foram instaladas
3. Verifique se o arquivo de startup está correto
4. Tente reinstalar dependências: **"Run NPM Install"**

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se o banco de dados foi criado corretamente
2. Teste a conexão com o MySQL no cPanel → **"phpMyAdmin"**
3. Verifique se a variável `DATABASE_URL` está correta
4. Certifique-se de que o usuário tem privilégios no banco

### Página em branco ou erro 500

**Solução:**
1. Verifique os logs de erro no cPanel
2. Certifique-se de que o build do frontend foi executado
3. Verifique permissões dos arquivos (devem ser 755 para pastas, 644 para arquivos)
4. Tente limpar cache: **"Restart"** na aplicação Node.js

### Site não carrega (erro de DNS)

**Solução:**
1. Verifique se o domínio está apontando para o IP correto
2. Aguarde propagação do DNS (pode levar até 48 horas)
3. Teste com `ping seu-dominio.com` no terminal
4. Use [whatsmydns.net](https://whatsmydns.net) para verificar propagação

### SSL não funciona (aviso de segurança)

**Solução:**
1. Certifique-se de que o certificado SSL foi instalado
2. Force HTTPS no `.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```
3. Aguarde alguns minutos para o certificado propagar

---

## 💰 Custos no GoDaddy

### Planos recomendados:

**VPS Básico:**
- **Preço:** $19.99/mês (primeiro ano com desconto)
- **Recursos:** 2 GB RAM, 40 GB SSD
- **Adequado para:** 100-500 usuários simultâneos

**VPS Intermediário:**
- **Preço:** $49.99/mês
- **Recursos:** 4 GB RAM, 80 GB SSD
- **Adequado para:** 500-2000 usuários simultâneos

**Custos adicionais:**
- Domínio: $11.99/ano
- SSL: Gratuito (Let's Encrypt via cPanel)
- Backups: $2.99/mês (opcional)

---

## 🔄 Atualizações Futuras

Para atualizar o sistema depois:

1. Faça backup do banco de dados (phpMyAdmin → Export)
2. Faça backup dos arquivos atuais
3. Faça upload dos novos arquivos via FTP
4. Reinstale dependências se necessário
5. Execute migrações: `pnpm db:push`
6. Reinicie a aplicação no cPanel

---

## ⚖️ Comparação: GoDaddy vs Railway

| Aspecto | GoDaddy VPS | Railway |
|---------|-------------|---------|
| **Custo mensal** | $19.99 - $49.99 | $5 - $20 (pay-as-you-go) |
| **Facilidade** | ⭐⭐ (Médio) | ⭐⭐⭐⭐⭐ (Muito fácil) |
| **Tempo de setup** | 1-2 horas | 15-30 minutos |
| **Suporte** | Telefone/Chat | Discord/Docs |
| **Escalabilidade** | Manual | Automática |
| **Backups** | Manual | Automático |

**Recomendação:** Se você já tem um plano VPS no GoDaddy, use-o. Caso contrário, Railway é mais simples e econômico.

---

## 📞 Suporte

Se encontrar problemas:

1. **Suporte GoDaddy:** [godaddy.com/help](https://www.godaddy.com/help)
2. **Telefone:** 0800-761-0026 (Brasil)
3. **Chat:** Disponível 24/7 no painel de controle

---

## 🎉 Parabéns!

Seu sistema **Bruno's Loan** agora está hospedado no GoDaddy e acessível via seu domínio personalizado!

**Próximos passos sugeridos:**

- Configure backups automáticos
- Monitore logs regularmente
- Configure firewall para segurança adicional
- Considere CDN para melhor performance

---

**Criado para o projeto Bruno's Loan**  
*Sistema de Gestão de Empréstimos*
