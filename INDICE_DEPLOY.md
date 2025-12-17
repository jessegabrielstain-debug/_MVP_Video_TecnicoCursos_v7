# 📚 Índice Completo - Deploy MVP Video TécnicoCursos v7

## 🎯 Início Rápido

### Para Começar AGORA:
1. **`DEPLOY_FINAL.md`** ⭐⭐⭐ - **COMECE AQUI**
2. **`COMECE_AQUI.txt`** ⭐⭐ - Instruções simplificadas
3. **`EXECUTAR_AGORA.txt`** ⭐ - Passo a passo

---

## 📖 Guias de Deploy

### Guias Principais
| Arquivo | Descrição | Quando Usar |
|---------|-----------|-------------|
| **`DEPLOY_FINAL.md`** | Guia final consolidado | **Primeiro deploy** |
| **`INICIO_RAPIDO.md`** | Guia rápido | Deploy rápido |
| **`DEPLOY.md`** | Guia completo detalhado | Troubleshooting |
| **`RESUMO_DEPLOY.md`** | Resumo executivo | Visão geral |
| **`README_DEPLOY.md`** | README principal | Referência geral |

### Checklists e Procedimentos
| Arquivo | Descrição |
|---------|-----------|
| **`CHECKLIST_DEPLOY.md`** | Checklist passo a passo |
| **`COMECE_AQUI.txt`** | Instruções texto simples |
| **`EXECUTAR_AGORA.txt`** | Comandos prontos |

---

## 🔧 Scripts de Deploy

### Localização: `scripts/deploy/`

#### Scripts Principais
| Script | Função | Quando Usar |
|--------|--------|-------------|
| **`complete-deploy.sh`** ⭐ | Deploy completo (tudo em um) | **Primeira vez** |
| **`diagnose.sh`** 🔍 | Diagnóstico do sistema | Quando algo não funciona |
| **`quick-fix.sh`** 🔧 | Correções rápidas | Problemas comuns |

#### Scripts Específicos
| Script | Função |
|--------|--------|
| `vps-initial-setup.sh` | Setup inicial do VPS apenas |
| `deploy-production.sh` | Deploy apenas da aplicação |
| `verify-deployment.sh` | Verificar deploy |

#### Scripts Windows (PowerShell)
| Script | Função |
|--------|--------|
| `DEPLOY_AUTOMATICO.ps1` | Deploy automático Windows |
| `deploy-now.ps1` | Script PowerShell simples |
| `executar-deploy.ps1` | Script PowerShell alternativo |

---

## 🚀 Comando Único de Deploy

```bash
ssh root@168.231.90.64
curl -fsSL https://raw.githubusercontent.com/jessegabrielstain-debug/_MVP_Video_TecnicoCursos_v7/main/scripts/deploy/complete-deploy.sh | bash
```

---

## ✅ Checklist Rápido

- [ ] VPS acessível via SSH
- [ ] Script executado
- [ ] `.env.production` configurado
- [ ] 4 containers rodando
- [ ] Health check passando
- [ ] Aplicação acessível

---

**Veja `DEPLOY_FINAL.md` para instruções completas!**
