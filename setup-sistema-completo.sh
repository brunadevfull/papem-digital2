#!/bin/bash

# Script de Setup Completo do Sistema de Visualização da Marinha
# Execute este script para configurar banco e dependências automaticamente

echo "🚀 Iniciando setup completo do sistema..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# Verificar se PostgreSQL está disponível
check_postgres() {
    print_status "Verificando PostgreSQL..."
    
    if [ -n "$DATABASE_URL" ]; then
        print_success "DATABASE_URL encontrada: usando banco configurado"
        return 0
    fi
    
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL encontrado no sistema"
        return 0
    else
        print_error "PostgreSQL não encontrado"
        print_warning "Configure a variável DATABASE_URL ou instale PostgreSQL"
        return 1
    fi
}

# Configurar banco de dados
setup_database() {
    print_status "Configurando banco de dados..."
    
    if [ -n "$DATABASE_URL" ]; then
        print_status "Executando script SQL no banco remoto..."
        psql "$DATABASE_URL" -f setup-database.sql
    else
        print_status "Configurando banco local..."
        sudo -u postgres psql -f setup-database.sql
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Banco de dados configurado com sucesso"
    else
        print_error "Falha na configuração do banco"
        return 1
    fi
}

# Instalar dependências Node.js
install_dependencies() {
    print_status "Instalando dependências..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json não encontrado"
        return 1
    fi
    
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Dependências instaladas"
    else
        print_error "Falha na instalação de dependências"
        return 1
    fi
}

# Executar migrations Drizzle
run_migrations() {
    print_status "Executando migrations do Drizzle..."
    
    npm run db:push
    
    if [ $? -eq 0 ]; then
        print_success "Migrations executadas"
    else
        print_warning "Falha nas migrations - pode não ser crítico"
    fi
}

# Criar diretórios necessários
create_directories() {
    print_status "Criando diretórios necessários..."
    
    mkdir -p uploads
    mkdir -p cache/pdf-pages
    mkdir -p logs
    
    chmod 755 uploads cache logs
    chmod 755 cache/pdf-pages
    
    print_success "Diretórios criados"
}

# Configurar variáveis de ambiente
setup_env() {
    print_status "Verificando variáveis de ambiente..."
    
    if [ ! -f ".env" ]; then
        print_status "Criando arquivo .env..."
        cp .env.example .env
        print_warning "Configure as variáveis em .env conforme necessário"
    fi
    
    # Verificar variáveis críticas
    if [ -z "$DATABASE_URL" ] && [ -z "$PGHOST" ]; then
        print_warning "Nenhuma configuração de banco encontrada"
        print_warning "Configure DATABASE_URL ou variáveis PG* no .env"
    fi
}

# Verificar portas disponíveis
check_ports() {
    print_status "Verificando portas..."
    
    if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
        print_warning "Porta 5000 em uso - pare o serviço antes de continuar"
    else
        print_success "Porta 5000 disponível"
    fi
}

# Função principal
main() {
    echo ""
    print_status "=== SETUP SISTEMA MARINHA ==="
    echo ""
    
    # Verificar se estamos no diretório correto
    if [ ! -f "package.json" ] || [ ! -f "drizzle.config.ts" ]; then
        print_error "Execute este script no diretório raiz do projeto"
        exit 1
    fi
    
    # Executar verificações e setup
    check_postgres || exit 1
    setup_env
    create_directories
    install_dependencies || exit 1
    setup_database || exit 1
    run_migrations
    check_ports
    
    echo ""
    print_success "=== SETUP CONCLUÍDO ==="
    echo ""
    print_status "Para iniciar o sistema:"
    print_status "  npm run dev"
    echo ""
    print_status "URLs de acesso:"
    print_status "  - Interface principal: http://localhost:5000"
    print_status "  - Painel admin: http://localhost:5000/admin"
    echo ""
    print_status "Usuário padrão: admin / admin123"
    echo ""
}

# Executar apenas se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi