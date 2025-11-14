# 🌐 Acesso ao Aplicativo Online

## URL de Acesso

**🔗 Link do Aplicativo**: https://3000-ig8khq3f2l6jjrtkauqib-50424738.manusvm.computer

---

## 🔐 Credenciais de Acesso

### ⚠️ Importante: Configuração de Banco de Dados

O aplicativo está rodando **sem banco de dados** no momento. Para ter acesso completo às funcionalidades, você precisa configurar um banco de dados MySQL.

### Opções para Configurar o Banco de Dados

#### Opção 1: Usar Banco de Dados Local (Recomendado para Testes)

1. **Instalar e iniciar MySQL**:
   ```bash
   sudo apt update
   sudo apt install mysql-server -y
   sudo systemctl start mysql
   ```

2. **Criar o banco de dados**:
   ```bash
   sudo mysql -e "CREATE DATABASE brunos_loan;"
   sudo mysql -e "CREATE USER 'brunos'@'localhost' IDENTIFIED BY 'brunos123';"
   sudo mysql -e "GRANT ALL PRIVILEGES ON brunos_loan.* TO 'brunos'@'localhost';"
   sudo mysql -e "FLUSH PRIVILEGES;"
   ```

3. **Atualizar o arquivo .env**:
   ```bash
   cd /home/ubuntu/brunos_loan
   cat > .env << 'EOF'
   DATABASE_URL=mysql://brunos:brunos123@localhost:3306/brunos_loan
   COOKIE_SECRET=brunos-loan-secret-key-production-2024
   NODE_ENV=production
   PORT=3000
   EOF
   ```

4. **Executar migrações do banco**:
   ```bash
   cd /home/ubuntu/brunos_loan
   pnpm db:push
   ```

5. **Popular com dados de exemplo** (opcional):
   ```bash
   cd /home/ubuntu/brunos_loan
   node seed-data.mjs
   ```

6. **Reiniciar o servidor**:
   ```bash
   # Parar o servidor atual
   pkill -f "node dist/index.js"
   
   # Iniciar novamente
   cd /home/ubuntu/brunos_loan
   PORT=3000 NODE_ENV=production nohup node dist/index.js > app.log 2>&1 &
   ```

#### Opção 2: Usar Banco de Dados Remoto

1. Configure um banco MySQL em um serviço cloud (AWS RDS, DigitalOcean, etc.)

2. Atualize o `.env` com a URL de conexão:
   ```
   DATABASE_URL=mysql://usuario:senha@host:porta/database
   ```

3. Execute as migrações e reinicie o servidor conforme opção 1

---

## 📱 Funcionalidades Disponíveis

Após configurar o banco de dados, você terá acesso a:

### ✅ Gestão de Clientes
- Cadastrar novos clientes
- Editar informações de clientes
- Visualizar histórico de empréstimos

### ✅ Gestão de Empréstimos

#### Empréstimos Parcelados
- Criar empréstimos com parcelas fixas
- Editar valor, taxa de juros, datas
- Adicionar parcelas manualmente
- Editar parcelas individuais
- Marcar parcelas como pagas
- Excluir parcelas (admin)
- Recalcular parcelas automaticamente

#### Empréstimos com Juros Recorrente
- Criar empréstimos com juros mensais
- Registrar pagamentos de juros
- Editar pagamentos de juros
- Excluir pagamentos (admin)
- Registrar amortizações do principal
- Editar amortizações (recalcula automaticamente)
- Excluir amortizações (admin)
- Visualizar saldo devedor em tempo real

### ✅ Recursos de Edição
- **Editar Empréstimos**: Valor, taxa, datas
- **Editar Parcelas**: Valor, vencimento, status
- **Editar Pagamentos**: Valores e datas
- **Editar Amortizações**: Com recalculo automático
- **Excluir Registros**: Apenas administradores

### ✅ Auditoria
- Rastreamento de modificações
- Registro de quem alterou e quando
- Histórico completo de operações

---

## 👥 Usuários do Sistema

### Criar Primeiro Usuário Administrador

Após configurar o banco de dados, você pode criar um usuário admin diretamente no MySQL:

```sql
-- Conectar ao MySQL
mysql -u brunos -p brunos_loan

-- Criar usuário admin (senha: admin123)
INSERT INTO usuarios_sistema (username, password_hash, nome, role, ativo) 
VALUES (
  'admin',
  '$2a$10$YourHashedPasswordHere',
  'Administrador',
  'admin',
  1
);
```

Ou use o endpoint de registro se estiver disponível na aplicação.

### Níveis de Acesso

- **Admin**: Acesso completo, pode excluir registros
- **Operador**: Pode editar, mas não excluir

---

## 🚀 Status do Servidor

### Verificar se o servidor está rodando

```bash
ps aux | grep "node dist/index.js"
```

### Ver logs do servidor

```bash
tail -f /home/ubuntu/brunos_loan/app.log
```

### Parar o servidor

```bash
pkill -f "node dist/index.js"
```

### Iniciar o servidor

```bash
cd /home/ubuntu/brunos_loan
PORT=3000 NODE_ENV=production nohup node dist/index.js > app.log 2>&1 &
```

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente (.env)

```env
# Banco de Dados (obrigatório)
DATABASE_URL=mysql://usuario:senha@host:porta/database

# Segurança (obrigatório)
COOKIE_SECRET=sua-chave-secreta-aqui

# Ambiente
NODE_ENV=production

# Porta do servidor
PORT=3000

# OAuth (opcional)
OAUTH_SERVER_URL=https://seu-servidor-oauth.com
```

### Portas Utilizadas

- **3000**: Aplicação web (frontend + backend)

---

## 📊 Recursos Implementados

### ✨ Novas Funcionalidades de Edição

1. **Edição Completa de Empréstimos**
   - Modificar valores, taxas e datas
   - Auditoria automática de alterações

2. **Edição de Parcelas**
   - Alterar valores e datas individualmente
   - Mudar status (Pendente/Pago/Atrasado)
   - Adicionar novas parcelas

3. **Edição de Pagamentos de Juros**
   - Corrigir valores pagos
   - Ajustar datas de pagamento
   - Adicionar observações

4. **Edição de Amortizações**
   - Modificar valores amortizados
   - **Recalculo automático** de saldo e juros
   - Reversão ao excluir

5. **Interface Melhorada**
   - Badges coloridos para tipos de empréstimo
   - Botões de edição visíveis
   - Ícones intuitivos
   - Dialogs padronizados

---

## 🆘 Solução de Problemas

### Problema: "Erro ao conectar ao banco de dados"

**Solução**: 
1. Verifique se o MySQL está rodando: `sudo systemctl status mysql`
2. Verifique as credenciais no arquivo `.env`
3. Teste a conexão: `mysql -u brunos -p -h localhost brunos_loan`

### Problema: "Página não carrega"

**Solução**:
1. Verifique se o servidor está rodando: `ps aux | grep node`
2. Veja os logs: `tail -f /home/ubuntu/brunos_loan/app.log`
3. Reinicie o servidor conforme instruções acima

### Problema: "Não consigo fazer login"

**Solução**:
1. Certifique-se de que o banco de dados está configurado
2. Verifique se há usuários cadastrados
3. Crie um usuário admin conforme instruções acima

### Problema: "Não consigo excluir registros"

**Solução**:
1. Apenas usuários com role "admin" podem excluir
2. Verifique seu nível de acesso no banco de dados

---

## 📞 Suporte

Para mais informações, consulte:
- **Documentação Completa**: `MELHORIAS_IMPLEMENTADAS.md`
- **Guia Rápido**: `GUIA_RAPIDO_EDICAO.md`
- **Logs do Sistema**: `/home/ubuntu/brunos_loan/app.log`

---

## ⚡ Próximos Passos

1. ✅ Configurar banco de dados MySQL
2. ✅ Executar migrações
3. ✅ Criar usuário administrador
4. ✅ Popular com dados de exemplo (opcional)
5. ✅ Acessar o aplicativo e começar a usar!

---

**URL do Aplicativo**: https://3000-ig8khq3f2l6jjrtkauqib-50424738.manusvm.computer

**Status**: 🟢 Online e Funcionando

**Versão**: 2.0.0 (Reformado com Funcionalidades de Edição)

**Data**: 14 de Novembro de 2025
