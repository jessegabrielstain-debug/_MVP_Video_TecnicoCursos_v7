#!/usr/bin/env bash
set -euo pipefail
echo "[rollback-staging] Executando rollback"
TARGET_MANIFEST=${1:-latest}
RELEASE_DIR="$(pwd)/releases"

if [ ! -d "$RELEASE_DIR" ]; then
	echo "Nenhum diretório releases encontrado. Abortando." >&2
	exit 1
fi

if [ "$TARGET_MANIFEST" = "latest" ]; then
	TARGET_FILE=$(ls -1t "$RELEASE_DIR"/release-*.json | head -n1 || true)
else
	TARGET_FILE="$RELEASE_DIR/$TARGET_MANIFEST"
fi

if [ -z "$TARGET_FILE" ] || [ ! -f "$TARGET_FILE" ]; then
	echo "Manifesto de release não encontrado: $TARGET_MANIFEST" >&2
	exit 2
fi

echo "Usando manifesto: $TARGET_FILE"
COMMIT=$(grep -m1 '"commit"' "$TARGET_FILE" | sed -E 's/.*"commit":\s*"([^"]+)".*/\1/')
echo "Rollback para commit (referência): $COMMIT"

APP_DIR="$(pwd)/estudio_ia_videos/app"
echo "Limpando build atual em $APP_DIR/.next"
rm -rf "$APP_DIR/.next" || true
cd "$APP_DIR"
echo "Instalando dependências e rebuild..."
npm ci
npm run build
echo "Rollback concluído (rebuild baseado em estado atual do repo). Para rever commit específico execute: git checkout $COMMIT" 