# Litrômetro - Makefile
# Preços de Combustíveis em Alagoas

# Carregar NVM antes de executar npm
SHELL := /bin/bash
NVM_INIT := source ~/.nvm/nvm.sh &&

# Porta fixa para o servidor de desenvolvimento
DEV_PORT := 5173

.PHONY: help install dev build preview lint clean collect geocode geocode-local validate fix-coords all stop

# Cores para output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RESET := \033[0m

help: ## Mostra esta ajuda
	@echo "$(CYAN)Litrômetro - Comandos disponíveis:$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─────────────────────────────────────────────────────────────
# Setup e Dependências
# ─────────────────────────────────────────────────────────────

install: ## Instala dependências do projeto
	@echo "$(CYAN)📦 Instalando dependências...$(RESET)"
	$(NVM_INIT) npm install

# ─────────────────────────────────────────────────────────────
# Desenvolvimento
# ─────────────────────────────────────────────────────────────

stop: ## Para o servidor de desenvolvimento
	@echo "$(YELLOW)🛑 Parando servidor na porta $(DEV_PORT)...$(RESET)"
	@-lsof -ti:$(DEV_PORT) | xargs -r kill -9 2>/dev/null || true
	@echo "$(GREEN)✅ Porta $(DEV_PORT) liberada$(RESET)"

dev: stop ## Inicia servidor de desenvolvimento (porta $(DEV_PORT))
	@echo "$(CYAN)🚀 Iniciando servidor de desenvolvimento na porta $(DEV_PORT)...$(RESET)"
	$(NVM_INIT) npm run dev -- --port $(DEV_PORT)

build: ## Compila para produção
	@echo "$(CYAN)🔨 Compilando para produção...$(RESET)"
	$(NVM_INIT) npm run build

preview: ## Visualiza build de produção
	@echo "$(CYAN)👀 Visualizando build de produção...$(RESET)"
	$(NVM_INIT) npm run preview

lint: ## Executa linter (ESLint)
	@echo "$(CYAN)🔍 Executando linter...$(RESET)"
	$(NVM_INIT) npm run lint

# ─────────────────────────────────────────────────────────────
# Dados e Coleta
# ─────────────────────────────────────────────────────────────

collect: ## Coleta preços da API SEFAZ/AL (salva em JSON)
	@echo "$(CYAN)📊 Coletando preços de combustíveis...$(RESET)"
	$(NVM_INIT) npm run collect

collect-supabase: ## Coleta preços e salva no Supabase
	@echo "$(CYAN)📊 Coletando preços (Supabase)...$(RESET)"
	$(NVM_INIT) npm run collect:supabase

process-history: ## Processa histórico e atualiza min/max/médio
	@echo "$(CYAN)📈 Processando histórico de preços...$(RESET)"
	$(NVM_INIT) npm run process:history

migrate-json: ## Migra dados JSON existentes para Supabase
	@echo "$(CYAN)📦 Migrando JSON → Supabase...$(RESET)"
	$(NVM_INIT) npm run migrate:json

geocode: ## Geocodifica endereços dos estabelecimentos
	@echo "$(CYAN)📍 Geocodificando endereços...$(RESET)"
	$(NVM_INIT) npm run geocode

geocode-local: ## Executa geocodificação contínua (cronjob local)
	@echo "$(CYAN)🔄 Iniciando geocodificação contínua...$(RESET)"
	$(NVM_INIT) npm run geocode:local

# ─────────────────────────────────────────────────────────────
# Validação de Coordenadas (Google Maps API)
# ─────────────────────────────────────────────────────────────

validate: ## Valida coordenadas com Google Maps (apenas relatório)
	@echo "$(CYAN)🔍 Validando coordenadas...$(RESET)"
	$(NVM_INIT) npm run coord:validate

fix-coords: ## Valida e corrige coordenadas incorretas
	@echo "$(CYAN)🔧 Validando e corrigindo coordenadas...$(RESET)"
	$(NVM_INIT) npm run coord:fix

validate-limit: ## Valida coordenadas com limite (ex: make validate-limit LIMIT=50)
	@echo "$(CYAN)🔍 Validando coordenadas (limite: $(LIMIT))...$(RESET)"
	$(NVM_INIT) npm run coord:validate -- --limite=$(LIMIT)

fix-coords-limit: ## Corrige coordenadas com limite (ex: make fix-coords-limit LIMIT=50)
	@echo "$(CYAN)🔧 Corrigindo coordenadas (limite: $(LIMIT))...$(RESET)"
	$(NVM_INIT) npm run coord:fix -- --limite=$(LIMIT)

# ─────────────────────────────────────────────────────────────
# Utilitários
# ─────────────────────────────────────────────────────────────

clean: ## Remove arquivos de build e cache
	@echo "$(CYAN)🧹 Limpando arquivos...$(RESET)"
	rm -rf dist node_modules/.vite

clean-all: ## Remove todos os arquivos gerados (incluindo node_modules)
	@echo "$(YELLOW)⚠️  Removendo node_modules e arquivos de build...$(RESET)"
	rm -rf dist node_modules

# ─────────────────────────────────────────────────────────────
# Fluxos Completos
# ─────────────────────────────────────────────────────────────

update-data: collect geocode ## Coleta dados e geocodifica
	@echo "$(GREEN)✅ Dados atualizados!$(RESET)"

full-update: collect geocode fix-coords ## Coleta, geocodifica e valida coordenadas
	@echo "$(GREEN)✅ Atualização completa!$(RESET)"

all: install update-data build ## Setup completo: instala, coleta dados e compila
	@echo "$(GREEN)✅ Projeto pronto!$(RESET)"
