# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [2.4.0] - 2025-12-07

### Consolidação
- Arquivados 192 arquivos de documentação obsoleta para `_archive/docs-legacy/`
- Estrutura de raiz limpa com apenas README.md, CONTRIBUTING.md, SECURITY.md, CHANGELOG.md e LICENSE

### Em Andamento
- Unificação de pastas de teste
- Resolução de tipos `any` (144 ocorrências identificadas)
- Remoção de `@ts-nocheck` (1 arquivo)

## [2.3.0] - 2025-11-26

### Adicionado
- Sistema TTS + Avatar Studio integrado
- Pipeline de renderização com BullMQ e Redis
- Dashboard unificado com métricas em tempo real
- Sistema de templates NR (Normas Regulamentadoras)
- Suporte a múltiplos engines TTS (ElevenLabs, Google, Azure)

### Melhorado
- Performance do processamento PPTX
- UI/UX do editor de vídeo
- Sistema de autenticação com Supabase

## [2.2.0] - 2025-11-18

### Adicionado
- Editor de timeline multi-track profissional
- Sistema de exportação de vídeo com FFmpeg
- Integração com Remotion para composição de vídeo
- Avatar 3D com talking photo

### Corrigido
- Links de navegação quebrados na navbar
- Rotas de autenticação (/register → /signup)

## [2.1.0] - 2025-11-10

### Adicionado
- Processamento de PPTX com extração de slides
- Preview em tempo real de apresentações
- Sistema de cache para assets

## [2.0.0] - 2025-10-15

### Adicionado
- Migração para Next.js 14 App Router
- Integração com Supabase (Auth + Storage + Database)
- Sistema RBAC (Role-Based Access Control)
- Dashboard administrativo

### Alterado
- Estrutura de projeto reorganizada em monorepo
- Nova arquitetura de componentes com Radix UI

## [1.0.0] - 2025-09-01

### Adicionado
- Versão inicial do MVP
- Upload básico de arquivos
- Geração de vídeo simples
