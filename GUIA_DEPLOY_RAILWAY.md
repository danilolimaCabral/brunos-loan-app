# Guia de Deploy do Bruno's Loan no Railway

Este guia detalha o processo completo para hospedar o sistema Bruno's Loan no Railway, incluindo banco de dados MySQL e aplicação Node.js.

---

## 📋 Pré-requisitos

Antes de começar, você precisará:

1. **Conta no GitHub** (gratuita) - [github.com](https://github.com)
2. **Conta no Railway** (gratuita) - [railway.app](https://railway.app)
3. **Código-fonte do projeto** (você já tem)

---

## 🚀 Passo 1: Preparar o Código para Deploy

### 1.1 Criar conta no GitHub (se ainda não tiver)

1. Acesse [github.com](https://github.com)
2. Clique em **"Sign up"**
3. Preencha seus dados e confirme o e-mail

### 1.2 Criar um novo repositório no GitHub

1. Faça login no GitHub
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Configure:
   - **Repository name:** `brunos-loan`
   - **Description:** "Sistema de Gestão de Empréstimos"
   - **Visibility:** Private (recomendado) ou Public
5. **NÃO** marque "Add a README file"
6. Clique em **"Create repository"**

### 1.3 Fazer upload do código para o GitHub

Você tem duas opções:

**Opção A: Via Interface Web (Mais Simples)**

1. Na página do repositório criado, clique em **"uploading an existing file"**
2. Arraste todos os arquivos do projeto para a área de upload
3. Adicione uma mensagem: "Initial commit"
4. Clique em **"Commit changes"**

**Opção B: Via Git (Linha de Comando)**

Se você tiver Git instalado, execute no terminal dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/brunos-loan.git
git push -u origin main
```

---

## 🛤️ Passo 2: Criar Conta no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"Login"** ou **"Start a New Project"**
3. Faça login com sua conta do GitHub (recomendado)
4. Autorize o Railway a acessar seus repositórios

---

## 🗄️ Passo 3: Criar o Banco de Dados MySQL

### 3.1 Criar novo projeto no Railway

1. No dashboard do Railway, clique em **"New Project"**
2. Selecione **"Provision MySQL"**
3. Aguarde alguns segundos enquanto o banco é criado

### 3.2 Obter credenciais do banco de dados

1. Clique no card do **MySQL** que foi criado
2. Vá na aba **"Variables"**
3. Anote os seguintes valores (você vai precisar):
   - `MYSQL_URL` (ou `DATABASE_URL`)
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USER`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`

---

## 🚢 Passo 4: Deploy da Aplicação

### 4.1 Adicionar serviço da aplicação

1. No mesmo projeto, clique em **"New"** → **"GitHub Repo"**
2. Selecione o repositório **`brunos-loan`** que você criou
3. Clique em **"Deploy Now"**
4. Aguarde o Railway detectar automaticamente que é um projeto Node.js

### 4.2 Configurar variáveis de ambiente

1. Clique no card do serviço da aplicação (não o MySQL)
2. Vá na aba **"Variables"**
3. Clique em **"New Variable"** e adicione as seguintes variáveis:

**Variáveis obrigatórias:**

```
DATABASE_URL=mysql://usuario:senha@host:porta/database
```
(Use o valor `MYSQL_URL` que você anotou no Passo 3.2)

```
JWT_SECRET=seu_segredo_super_secreto_aqui_123456
```
(Crie uma senha forte e aleatória)

```
NODE_ENV=production
```

**Variáveis opcionais (para funcionalidades de e-mail):**

```
VITE_APP_TITLE=Bruno's Loan
VITE_APP_LOGO=https://seu-logo-url.com/logo.png
```

### 4.3 Configurar comando de build

1. Ainda na aba **"Variables"**, role até **"Service Settings"**
2. Em **"Build Command"**, adicione:
   ```
   pnpm install && pnpm db:push && pnpm build
   ```

3. Em **"Start Command"**, adicione:
   ```
   pnpm start
   ```

### 4.4 Configurar porta

1. Vá em **"Settings"** do serviço
2. Em **"Networking"**, clique em **"Generate Domain"**
3. O Railway vai gerar um domínio público (ex: `brunos-loan-production.up.railway.app`)

---

## ✅ Passo 5: Verificar Deploy

### 5.1 Acompanhar logs

1. Clique no serviço da aplicação
2. Vá na aba **"Deployments"**
3. Clique no deployment mais recente
4. Veja os logs em tempo real

### 5.2 Acessar a aplicação

1. Após o deploy concluir (status "Success"), clique no domínio gerado
2. Você será redirecionado para a tela de login do Bruno's Loan
3. Use as credenciais:
   - **Usuário:** financeiro
   - **Senha:** financeiro2025

---

## 🔧 Passo 6: Configurações Adicionais (Opcional)

### 6.1 Domínio personalizado

1. No serviço da aplicação, vá em **"Settings"**
2. Em **"Domains"**, clique em **"Custom Domain"**
3. Adicione seu domínio (ex: `brunosloan.com`)
4. Configure os registros DNS conforme instruções do Railway

### 6.2 Configurar backups do banco de dados

1. Clique no card do **MySQL**
2. Vá em **"Settings"**
3. Em **"Backups"**, ative backups automáticos

### 6.3 Monitoramento

1. No dashboard do projeto, você pode ver:
   - **Uso de recursos** (CPU, memória, rede)
   - **Logs em tempo real**
   - **Métricas de performance**

---

## 💰 Custos e Limites

### Plano Gratuito (Trial)

- **$5 de crédito mensal** (renova todo mês)
- Suficiente para:
  - 1 aplicação Node.js pequena/média
  - 1 banco de dados MySQL
  - Tráfego moderado (~100-500 usuários/mês)

### Quando o crédito acabar

- O Railway pausará os serviços automaticamente
- Você pode adicionar um cartão de crédito para continuar (pay-as-you-go)
- Custo estimado: $5-20/mês dependendo do uso

---

## 🐛 Solução de Problemas

### Erro: "Build failed"

**Solução:**
1. Verifique os logs de build
2. Certifique-se de que o `package.json` está correto
3. Tente fazer rebuild: **"Settings"** → **"Redeploy"**

### Erro: "Cannot connect to database"

**Solução:**
1. Verifique se a variável `DATABASE_URL` está correta
2. Certifique-se de que o MySQL está rodando (card verde no dashboard)
3. Teste a conexão manualmente nos logs

### Erro: "Application crashed"

**Solução:**
1. Veja os logs em **"Deployments"** → **"View Logs"**
2. Procure por erros de variáveis de ambiente faltando
3. Verifique se o comando de start está correto

### Página em branco ou erro 404

**Solução:**
1. Verifique se o build do frontend foi concluído
2. Certifique-se de que o comando de build inclui `pnpm build`
3. Verifique os logs do servidor

---

## 📞 Suporte

Se encontrar problemas:

1. **Documentação do Railway:** [docs.railway.app](https://docs.railway.app)
2. **Discord do Railway:** [discord.gg/railway](https://discord.gg/railway)
3. **GitHub Issues:** Crie uma issue no seu repositório

---

## 🎉 Parabéns!

Seu sistema **Bruno's Loan** agora está online e acessível publicamente. Você pode compartilhar o link com seus clientes e começar a usar o sistema para gerenciar seus empréstimos.

**Próximos passos sugeridos:**

- Configure um domínio personalizado
- Ative backups automáticos do banco de dados
- Monitore o uso de recursos no dashboard
- Considere adicionar SSL/HTTPS (Railway já fornece por padrão)

---

**Criado para o projeto Bruno's Loan**  
*Sistema de Gestão de Empréstimos*
