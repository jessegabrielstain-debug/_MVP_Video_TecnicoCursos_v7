#!/usr/bin/env bash
set -euo pipefail
echo "[deploy-staging] Iniciando deploy da aplicação Next.js para staging"
ROOT_DIR=$(pwd)
APP_DIR="$ROOT_DIR/estudio_ia_videos/app"
cd "$APP_DIR"
echo "Instalando dependências (app)"
npm ci
echo "Build produção"
npm run build
echo "Export (se aplicável)"
if npm run | grep -q "export"; then npm run export || echo "Export não configurado"; fi
echo "Deploy concluído. Inicie com: npm run start"