#!/bin/bash

set -euo pipefail

REMOTE_NAME="${1:-origin}"
BRANCH=$(git symbolic-ref --short HEAD 2>/dev/null)

if [[ -z "$BRANCH" ]]; then
  echo "❌ Detached HEAD. Informe uma branch antes de publicar."
  exit 1
fi

echo "🔄 Sincronizando $BRANCH com $REMOTE_NAME..."
git pull --no-rebase "$REMOTE_NAME" "$BRANCH"

for ATTEMPT in 1 2 3; do
  echo "🚀 Tentativa de push $ATTEMPT/3 para $BRANCH..."

  if SAFE_PUSH_WRAPPER_ACTIVE=1 git push --no-verify "$REMOTE_NAME" "HEAD:refs/heads/$BRANCH"; then
    echo "✅ Push concluído com sucesso"
    exit 0
  fi

  if [[ "$ATTEMPT" -lt 3 ]]; then
    echo "⚠️  Push rejeitado. Atualizando branch e tentando novamente..."
    git pull --no-rebase "$REMOTE_NAME" "$BRANCH"
  fi
done

echo "❌ Push falhou após 3 tentativas."
exit 1