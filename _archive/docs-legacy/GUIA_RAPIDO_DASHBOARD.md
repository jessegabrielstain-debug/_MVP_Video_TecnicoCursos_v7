# 🎬 Dashboard Supabase - Guia Rápido

**Versão 2.0** | Outubro 2025 | Avatar 3D Studio

---

## 🚀 Início Rápido (3 Passos)

### 1️⃣ Executar Auditoria
```powershell
.\migrate-to-supabase.ps1 -ReportPath "supabase-audit.json"
```

### 2️⃣ Abrir Dashboard
```powershell
start chrome "C:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7\dashboard-supabase.html"
```

### 3️⃣ Atualizar Dados
Clique em **🔄 Atualizar Dados** no dashboard

---

## 🎛️ Botões Principais

| Botão | Função |
|-------|--------|
| 🔄 Atualizar Dados | Recarrega avatares, vozes e estatísticas do Supabase |
| 🔗 Testar Conexão | Valida conectividade com API REST |
| 📋 Recarregar Auditoria | Re-lê o arquivo `supabase-audit.json` |

---

## 📊 Seções do Dashboard

### **Cards de Estatísticas**
- 🎥 **Avatares Disponíveis**: Total de modelos cadastrados
- 🎙️ **Perfis de Voz**: Total de vozes configuradas  
- ⚡ **Jobs de Render**: Status de acessibilidade
- 📊 **Analytics**: Status de acessibilidade
- 🕒 **Última Auditoria**: Timestamp e modo (anon/service)

### **Tabelas de Dados**
- 🤖 **Modelos de Avatar**: Nome, Tipo, Gênero, Status
- 🎤 **Perfis de Voz**: Nome, Idioma, Gênero, Status
- 📈 **Status do Sistema**: CPU, GPU, Taxa Sucesso, Total Renders
- 🛡️ **Restrições Detectadas**: Tabelas bloqueadas por RLS
- 🔧 **Logs de Atividade**: Histórico das últimas operações

---

## 🔧 Solução Rápida de Problemas

| Problema | Solução Rápida |
|----------|----------------|
| "Arquivo de auditoria não encontrado" | Execute `.\migrate-to-supabase.ps1 -ReportPath "supabase-audit.json"` |
| "Não foi possível carregar avatares" | Verifique conexão: clique em **🔗 Testar Conexão** |
| "System Stats indisponíveis" | Normal se tabela vazia. Execute renders para popular. |
| Dashboard não atualiza | Pressione `Ctrl + Shift + R` para forçar reload |
| Dados desatualizados | Clique em **🔄 Atualizar Dados** |

---

## 📁 Arquivos Importantes

```
📁 C:\xampp\htdocs\_MVP_Video_TecnicoCursos_v7\
  ├── dashboard-supabase.html              ← Dashboard principal
  ├── supabase-audit.json                  ← Dados de auditoria
  ├── migrate-to-supabase.ps1              ← Script PowerShell
  ├── README_DASHBOARD_SUPABASE.md         ← Documentação completa
  └── RESUMO_DASHBOARD_IMPLEMENTATION.md   ← Detalhes técnicos
```

---

## 🌐 Credenciais Supabase

**URL**: `https://ofhzrdiadxigrvmrhaiz.supabase.co`  
**Modo**: Anônimo (somente leitura)  
**Auto-refresh**: A cada 5 minutos

---

## 🎨 Legenda de Cores

| Badge | Significado |
|-------|-------------|
| 🟢 **Verde** | Operacional / Ativo / Sucesso |
| 🟡 **Amarelo** | Processando / Aguardando |
| 🔴 **Vermelho** | Erro / Restrito / Inativo |
| 🔵 **Azul** | Informação / Neutro |

---

## 📞 Suporte

- **Documentação Completa**: `README_DASHBOARD_SUPABASE.md`
- **Detalhes Técnicos**: `RESUMO_DASHBOARD_IMPLEMENTATION.md`
- **Console do Navegador**: Pressione `F12` para debug

---

## ✅ Checklist de Uso

- [ ] Executar auditoria PowerShell
- [ ] Abrir dashboard no navegador
- [ ] Verificar conexão com Supabase
- [ ] Conferir timestamp da auditoria
- [ ] Revisar restrições detectadas
- [ ] Validar lista de avatares (6 esperados)
- [ ] Validar lista de vozes (8 esperados)
- [ ] Monitorar logs de atividade

---

**🎯 Objetivo**: Monitoramento visual e diagnóstico do sistema Avatar 3D Studio integrado ao Supabase.

**📅 Atualizado**: 08/10/2025 | **Status**: ✅ Operacional
