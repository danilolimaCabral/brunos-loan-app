# Guia Rápido - Funcionalidades de Edição

## 🎯 Visão Geral

Este guia apresenta de forma rápida e prática como usar as novas funcionalidades de edição implementadas no sistema de gerenciamento de empréstimos.

---

## 📝 Editar Empréstimo

### Onde encontrar
- Página de detalhes do empréstimo
- Botão "Editar Empréstimo" no canto superior direito

### O que pode ser editado
- ✅ Valor emprestado
- ✅ Taxa de juros
- ✅ Data do empréstimo
- ✅ Data de vencimento

### Passo a passo
1. Acesse a lista de empréstimos
2. Clique no empréstimo desejado ou no ícone de olho
3. Clique em "Editar Empréstimo"
4. Modifique os campos necessários
5. Clique em "Salvar Alterações"

---

## 💰 Editar Parcelas (Empréstimos Parcelados)

### Onde encontrar
- Página de detalhes do empréstimo parcelado
- Botão "Editar" em cada linha da tabela de parcelas

### O que pode ser editado
- ✅ Valor da parcela
- ✅ Data de vencimento
- ✅ Data de pagamento
- ✅ Status (Pendente/Pago/Atrasado)

### Passo a passo
1. Acesse os detalhes do empréstimo
2. Localize a parcela na tabela
3. Clique no botão "Editar"
4. Modifique os campos necessários
5. Clique em "Salvar Alterações"

### Excluir parcela
1. Localize a parcela na tabela
2. Clique no ícone de lixeira (🗑️)
3. Confirme a exclusão
4. ⚠️ **Apenas administradores podem excluir**

---

## 💵 Editar Pagamentos de Juros (Juros Recorrente)

### Onde encontrar
- Página de detalhes do empréstimo com juros recorrente
- Botão "Editar" em cada linha da tabela de histórico

### O que pode ser editado
- ✅ Valor pago
- ✅ Data do pagamento
- ✅ Observação

### Passo a passo
1. Acesse os detalhes do empréstimo
2. Localize o pagamento na tabela de histórico
3. Clique no botão "Editar"
4. Modifique os campos necessários
5. Clique em "Salvar Alterações"

### Excluir pagamento
1. Localize o pagamento na tabela
2. Clique no ícone de lixeira (🗑️)
3. Confirme a exclusão
4. ⚠️ **Apenas administradores podem excluir**

---

## 📊 Editar Amortizações (Juros Recorrente)

### Onde encontrar
- Página de detalhes do empréstimo com juros recorrente
- Botão "Editar" em cada linha da tabela de histórico

### O que pode ser editado
- ✅ Valor amortizado
- ✅ Data da amortização
- ✅ Observação

### ⚡ Recalculo Automático
Ao editar uma amortização, o sistema **automaticamente recalcula**:
- Saldo devedor
- Juros mensais
- Status do empréstimo

### Passo a passo
1. Acesse os detalhes do empréstimo
2. Localize a amortização na tabela de histórico
3. Clique no botão "Editar"
4. Modifique o valor ou data
5. Clique em "Salvar Alterações"
6. ✨ O sistema recalcula tudo automaticamente

### Excluir amortização
1. Localize a amortização na tabela
2. Clique no ícone de lixeira (🗑️)
3. Confirme a exclusão
4. ✨ O sistema **reverte** automaticamente os cálculos
5. ⚠️ **Apenas administradores podem excluir**

---

## 🔍 Acesso Rápido pela Lista

### Nova funcionalidade
Na lista de empréstimos, agora você pode:
- Ver o **tipo** de cada empréstimo (badge colorido)
- Clicar no ícone de **edição** (✏️) para ir direto aos detalhes
- Ver o **valor emprestado** em vez do valor total

### Badges de tipo
- 🔵 **Azul**: Juros Recorrente
- 🟢 **Verde**: Parcelado

---

## ⚠️ Permissões

### Todos os usuários podem
- ✅ Editar empréstimos
- ✅ Editar parcelas
- ✅ Editar pagamentos de juros
- ✅ Editar amortizações

### Apenas administradores podem
- 🔒 Excluir parcelas
- 🔒 Excluir pagamentos de juros
- 🔒 Excluir amortizações
- 🔒 Ver informações de auditoria

---

## 📋 Auditoria

### O que é registrado
Todas as edições registram:
- 👤 **Quem** fez a modificação
- 📅 **Quando** foi modificado

### Onde ver
- Na página de detalhes do empréstimo
- Alerta no final das informações (apenas para administradores)

---

## 💡 Dicas Importantes

### ✅ Boas Práticas
1. **Sempre verifique** os valores antes de salvar
2. **Use observações** para registrar o motivo das alterações
3. **Confirme** os recalculos automáticos após editar amortizações
4. **Teste** primeiro em um empréstimo de teste se não tiver certeza

### ⚠️ Atenção
1. **Exclusões são permanentes** - não podem ser desfeitas
2. **Editar amortizações** altera automaticamente saldos e juros
3. **Excluir amortizações** reverte os cálculos
4. **Campos obrigatórios** devem ser preenchidos (marcados com *)

### 🚫 Evite
1. Editar valores sem necessidade
2. Excluir registros sem confirmar o impacto
3. Alterar datas de forma inconsistente
4. Deixar observações vazias em alterações importantes

---

## 🆘 Problemas Comuns

### Não consigo excluir
- ✅ Verifique se você é **administrador**
- ✅ Apenas administradores podem excluir registros

### Valores não batem após edição
- ✅ Aguarde o **recalculo automático** (amortizações)
- ✅ Atualize a página se necessário
- ✅ Verifique se todas as edições foram salvas

### Botão de editar não aparece
- ✅ Verifique se você está **logado**
- ✅ Atualize a página
- ✅ Verifique sua **conexão com o banco de dados**

---

## 📞 Suporte

Se encontrar algum problema ou tiver dúvidas:
1. Consulte a documentação completa em `MELHORIAS_IMPLEMENTADAS.md`
2. Verifique os logs do sistema
3. Entre em contato com a equipe de desenvolvimento

---

## ✨ Resumo Rápido

| Ação | Onde | Como | Quem |
|------|------|------|------|
| Editar Empréstimo | Detalhes | Botão "Editar Empréstimo" | Todos |
| Editar Parcela | Tabela de Parcelas | Botão "Editar" | Todos |
| Excluir Parcela | Tabela de Parcelas | Ícone 🗑️ | Admin |
| Editar Pagamento Juros | Tabela de Histórico | Botão "Editar" | Todos |
| Excluir Pagamento Juros | Tabela de Histórico | Ícone 🗑️ | Admin |
| Editar Amortização | Tabela de Histórico | Botão "Editar" | Todos |
| Excluir Amortização | Tabela de Histórico | Ícone 🗑️ | Admin |

---

**Versão**: 2.0.0  
**Data**: 14 de Novembro de 2025  
**Status**: ✅ Todas as funcionalidades implementadas e testadas
