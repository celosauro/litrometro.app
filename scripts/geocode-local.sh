#!/bin/bash

# ==============================================
# Script de Geocodificação Local (Cronjob)
# Executa a geocodificação em loop até completar
# ==============================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Intervalo entre execuções (em segundos)
INTERVALO=${1:-86400}  # Padrão: 24 horas

# Contador de execuções
EXECUCOES=0

# Diretório do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}   Geocodificação Local - Litrômetro${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "📁 Diretório: ${PROJECT_DIR}"
echo -e "⏱️  Intervalo: ${INTERVALO} segundos"
echo -e "🛑 Pressione Ctrl+C para parar"
echo ""

# Função para limpar ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}Parando...${NC}"
    echo -e "${GREEN}✓ Total de execuções: ${EXECUCOES}${NC}"
    exit 0
}

# Captura Ctrl+C
trap cleanup SIGINT SIGTERM

# Muda para o diretório do projeto
cd "$PROJECT_DIR" || exit 1

# Carrega nvm se disponível
if [ -f "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use 22 > /dev/null 2>&1
fi

# Loop principal
while true; do
    EXECUCOES=$((EXECUCOES + 1))
    
    echo -e "${BLUE}─────────────────────────────────────${NC}"
    echo -e "${GREEN}[Execução #${EXECUCOES}]${NC} $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "${BLUE}─────────────────────────────────────${NC}"
    
    # Executa o script de geocodificação
    npm run geocode 2>&1
    
    EXIT_CODE=$?
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓ Geocodificação concluída com sucesso${NC}"
    else
        echo -e "${RED}✗ Erro na geocodificação (código: ${EXIT_CODE})${NC}"
    fi
    
    # Verifica se ainda há pendentes
    PENDENTES=$(node -e "
        const fs = require('fs');
        const path = require('path');
        const geocache = JSON.parse(fs.readFileSync('./public/dados/geocache.json'));
        const municipiosDir = './public/dados/municipios';
        const cnpjsSemCoordenada = new Set();
        fs.readdirSync(municipiosDir).forEach(file => {
            if (file.endsWith('.json')) {
                try {
                    const data = JSON.parse(fs.readFileSync(path.join(municipiosDir, file)));
                    if (data.estabelecimentos) {
                        data.estabelecimentos.forEach(item => {
                            if ((item.latitude === 0 || item.longitude === 0) && !geocache[item.cnpj]) {
                                cnpjsSemCoordenada.add(item.cnpj);
                            }
                        });
                    }
                } catch (e) {}
            }
        });
        console.log(cnpjsSemCoordenada.size);
    " 2>/dev/null)
    
    if [ "$PENDENTES" = "0" ]; then
        echo ""
        echo -e "${GREEN}🎉 Todos os estabelecimentos foram geocodificados!${NC}"
        echo -e "${GREEN}✓ Total de execuções: ${EXECUCOES}${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${YELLOW}⏳ Pendentes: ${PENDENTES} estabelecimentos${NC}"
    echo -e "${YELLOW}⏰ Próxima execução em ${INTERVALO} segundos...${NC}"
    echo ""
    
    # Aguarda o intervalo
    sleep "$INTERVALO"
done
