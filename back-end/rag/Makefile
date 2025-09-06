# =================================================================
# RAG SYSTEM OPTIMIZED - STREAMLINED MAKEFILE  
# =================================================================

.DEFAULT_GOAL := help
PYTHON := python
DOCKER_COMPOSE := docker-compose -f docker/docker-compose.yml

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
BLUE := \033[0;34m
NC := \033[0m # No Color

##@ Quick Start Commands

.PHONY: install
install: ## Install dependencies (same as: uv pip install -e .)
	@echo "$(BLUE)📦 Installing RAG system...$(NC)"
	uv pip install -e .
	@echo "$(GREEN)✅ Installation complete!$(NC)"

.PHONY: setup
setup: install setup-env infra-up ## Complete initial setup
	@echo "$(GREEN)🎉 RAG System setup complete!$(NC)"
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "   1. Edit .env with your API keys"  
	@echo "   2. Run: $(PYTHON) scripts/create_sample_pdfs.py"
	@echo "   3. Run: $(PYTHON) scripts/run_etl_pdf.py"

.PHONY: setup-env
setup-env: ## Copy environment template
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "$(YELLOW)⚠️  Please edit .env with your API keys$(NC)"; \
	else \
		echo "$(GREEN)✅ .env already exists$(NC)"; \
	fi

##@ Infrastructure Commands

.PHONY: infra-up
infra-up: ## Start MongoDB
	@echo "$(BLUE)🚀 Starting MongoDB...$(NC)"
	$(DOCKER_COMPOSE) up -d
	@echo "$(GREEN)✅ Infrastructure started!$(NC)"

.PHONY: infra-down  
infra-down: ## Stop MongoDB
	@echo "$(BLUE)🛑 Stopping infrastructure...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✅ Infrastructure stopped!$(NC)"

.PHONY: infra-logs
infra-logs: ## View infrastructure logs
	$(DOCKER_COMPOSE) logs -f

##@ Pipeline Commands

.PHONY: create-samples
create-samples: ## Create sample PDF files for testing
	@echo "$(BLUE)📄 Creating sample PDFs...$(NC)"
	$(PYTHON) scripts/create_sample_pdfs.py
	@echo "$(GREEN)✅ Sample PDFs created!$(NC)"

.PHONY: process-pdfs
process-pdfs: ## Process PDFs into MongoDB
	@echo "$(BLUE)📄 Processing PDF documents...$(NC)"
	$(PYTHON) scripts/run_etl_pdf.py
	@echo "$(GREEN)✅ PDF processing complete!$(NC)"

.PHONY: build-index
build-index: ## Build RAG vector index
	@echo "$(BLUE)🔍 Building RAG vector index...$(NC)"
	$(PYTHON) scripts/build_rag_index.py
	@echo "$(GREEN)✅ RAG index built!$(NC)"

.PHONY: full-pipeline
full-pipeline: create-samples process-pdfs build-index ## Run complete pipeline with samples
	@echo "$(GREEN)🎉 Full pipeline complete!$(NC)"

##@ Testing & Web Interface

.PHONY: test-agent
test-agent: ## Test RAG agent with sample query
	@echo "$(BLUE)🤖 Testing RAG agent...$(NC)"
	$(PYTHON) tools/run_agent.py

.PHONY: test-interactive
test-interactive: ## Run interactive career counseling session
	@echo "$(BLUE)💬 Starting interactive session...$(NC)"
	$(PYTHON) tools/run_agent.py --interactive

.PHONY: web-server
web-server: ## Start web interface server
	@echo "$(BLUE)🌐 Starting web server...$(NC)"
	@echo "$(YELLOW)Open http://localhost:5000 in your browser$(NC)"
	$(PYTHON) tools/web_server.py

.PHONY: check-db
check-db: ## Check database status and collections
	@echo "$(BLUE)📊 Checking database status...$(NC)"
	$(PYTHON) scripts/check_db_status.py

.PHONY: clean-db
clean-db: ## Clean all database collections
	@echo "$(YELLOW)⚠️  Cleaning database...$(NC)"
	$(PYTHON) scripts/clean_database.py --yes

##@ Development Commands

.PHONY: test
test: ## Run test suite
	pytest tests/ -v

.PHONY: format
format: ## Format code with ruff  
	ruff format .

.PHONY: lint
lint: ## Check code with ruff
	ruff check .

.PHONY: lint-fix
lint-fix: ## Fix linting issues
	ruff check --fix .

##@ Utility Commands

.PHONY: clean
clean: ## Clean temporary files and caches
	@echo "$(BLUE)🧹 Cleaning temporary files...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo "$(GREEN)✅ Cleanup complete!$(NC)"

.PHONY: reset
reset: infra-down clean-db infra-up ## Reset everything (infrastructure + database)
	@echo "$(GREEN)🔄 System reset complete!$(NC)"

.PHONY: help
help: ## Display this help message
	@awk 'BEGIN {FS = ":.*##"; printf "\n$(BLUE)RAG System Optimized$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)
	@echo "\n$(BLUE)Direct Commands (no Make needed):$(NC)"
	@echo "  $(YELLOW)uv pip install -e .$(NC)              # Install dependencies"
	@echo "  $(YELLOW)python scripts/run_etl_pdf.py$(NC)    # Process PDFs"
	@echo "  $(YELLOW)python scripts/check_db_status.py$(NC) # Check database"
	@echo "  $(YELLOW)python tools/run_agent.py$(NC)        # Test agent"
