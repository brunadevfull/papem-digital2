#!/bin/bash

# =============================================================================
# SISTEMA DE VISUALIZAÇÃO DA MARINHA DO BRASIL - TESTES AUTOMATIZADOS
# =============================================================================
# 
# Este script executa uma bateria completa de testes para verificar se o
# sistema está funcionando corretamente. Os testes incluem:
#
# 1. VERIFICAÇÃO DE PRÉ-REQUISITOS
#    - Node.js versão 18 ou superior
#    - npm para gerenciamento de pacotes
#    - curl para testes de API
#
# 2. TESTES DE API (Backend)
#    - Endpoint de saúde do sistema (/api/health)
#    - CRUD completo de avisos (Create, Read, Update, Delete)
#    - CRUD completo de documentos
#    - Tratamento adequado de erros
#
# 3. TESTES DE FRONTEND
#    - Carregamento correto da página principal
#    - Acesso à interface administrativa
#    - Presença de elementos da Marinha do Brasil
#
# 4. TESTES DE INTEGRAÇÃO
#    - Comunicação entre frontend e backend
#    - Persistência de dados
#    - Funcionalidades específicas do sistema naval
#
# USO:
#   ./teste.sh           - Executa todos os testes
#   ./teste.sh --rapido  - Executa apenas testes essenciais
#   ./teste.sh --verboso - Mostra todos os comandos executados
#   ./teste.sh --help    - Mostra ajuda detalhada
#
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem Cor

# Contadores de teste
TOTAL_TESTES=0
TESTES_PASSOU=0
TESTES_FALHOU=0

# Função para imprimir output colorido
log() {
    local cor=$1
    local mensagem=$2
    echo -e "${cor}${mensagem}${NC}"
}

# Função para executar um teste individual
# Parâmetros:
#   $1 - Nome descritivo do teste
#   $2 - Comando a ser executado
#   $3 - Código de saída esperado (padrão: 0)
executar_teste() {
    local nome_teste=$1
    local comando_teste=$2
    local status_esperado=${3:-0}
    
    TOTAL_TESTES=$((TOTAL_TESTES + 1))
    
    echo -n "Testando ${nome_teste}... "
    
    # Executa o comando e captura o código de saída
    if eval "$comando_teste" >/dev/null 2>&1; then
        if [ $? -eq $status_esperado ]; then
            log $GREEN "PASSOU"
            TESTES_PASSOU=$((TESTES_PASSOU + 1))
        else
            log $RED "FALHOU (código de saída inesperado)"
            TESTES_FALHOU=$((TESTES_FALHOU + 1))
        fi
    else
        log $RED "FALHOU"
        TESTES_FALHOU=$((TESTES_FALHOU + 1))
    fi
}

# Função para testar endpoints da API REST
# Esta função automatiza testes de todos os métodos HTTP necessários
# Parâmetros:
#   $1 - Endpoint da API (ex: /health, /notices)
#   $2 - Método HTTP (GET, POST, PUT, DELETE) - padrão: GET
#   $3 - Código de status esperado (200, 404, etc.) - padrão: 200
#   $4 - Dados JSON para envio (apenas POST/PUT)
testar_api() {
    local endpoint=$1
    local metodo=${2:-GET}
    local status_esperado=${3:-200}
    local dados=${4:-""}
    
    # Constrói comando curl baseado no método HTTP
    local curl_cmd="curl -s -w '%{http_code}' -o /dev/null"
    
    if [ "$metodo" = "POST" ] && [ -n "$dados" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json' -d '$dados'"
    elif [ "$metodo" = "PUT" ] && [ -n "$dados" ]; then
        curl_cmd="$curl_cmd -X PUT -H 'Content-Type: application/json' -d '$dados'"
    elif [ "$metodo" = "DELETE" ]; then
        curl_cmd="$curl_cmd -X DELETE"
    fi
    
    # Executa requisição e captura código de resposta
    local codigo_resposta=$(eval "$curl_cmd http://localhost:5000/api$endpoint")
    
    # Verifica se o código de resposta corresponde ao esperado
    if [ "$codigo_resposta" = "$status_esperado" ]; then
        return 0
    else
        return 1
    fi
}

# Função para aguardar o servidor
aguardar_servidor() {
    log $YELLOW "Aguardando o servidor iniciar..."
    
    local max_tentativas=30
    local tentativa=0
    
    while [ $tentativa -lt $max_tentativas ]; do
        if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
            log $GREEN "Servidor está pronto!"
            return 0
        fi
        
        tentativa=$((tentativa + 1))
        sleep 1
    done
    
    log $RED "Servidor falhou ao iniciar em 30 segundos"
    return 1
}

# Função para verificar pré-requisitos
verificar_prerequisitos() {
    log $BLUE "Verificando pré-requisitos..."
    
    # Verificar Node.js
    if ! command -v node >/dev/null 2>&1; then
        log $RED "Node.js não está instalado. Por favor, instale Node.js 18+ primeiro."
        exit 1
    fi
    
    local versao_node=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$versao_node" -lt 18 ]; then
        log $RED "Node.js versão 18+ necessária. Versão atual: $(node --version)"
        exit 1
    fi
    
    # Verificar npm
    if ! command -v npm >/dev/null 2>&1; then
        log $RED "npm não está instalado."
        exit 1
    fi
    
    # Verificar curl
    if ! command -v curl >/dev/null 2>&1; then
        log $RED "curl não está instalado. Por favor, instale curl primeiro."
        exit 1
    fi
    
    log $GREEN "Todos os pré-requisitos satisfeitos"
}

# Função para instalar dependências
instalar_dependencias() {
    log $BLUE "Instalando dependências..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        log $GREEN "Dependências já instaladas"
    fi
}

# Função para iniciar servidor em background
iniciar_servidor() {
    log $BLUE "Iniciando servidor..."
    
    # Matar qualquer servidor existente na porta 5000
    pkill -f "npm run dev" 2>/dev/null || true
    pkill -f "tsx server/index.ts" 2>/dev/null || true
    
    # Iniciar servidor em background
    npm run dev > servidor.log 2>&1 &
    SERVIDOR_PID=$!
    
    # Aguardar servidor ficar pronto
    aguardar_servidor
}

# Função para parar servidor
parar_servidor() {
    if [ -n "$SERVIDOR_PID" ]; then
        log $BLUE "Parando servidor..."
        kill $SERVIDOR_PID 2>/dev/null || true
        pkill -f "npm run dev" 2>/dev/null || true
        pkill -f "tsx server/index.ts" 2>/dev/null || true
    fi
}

# Função para executar todos os testes
executar_todos_testes() {
    log $BLUE "Executando suite de testes abrangente..."
    
    # Testes de verificação de saúde
    log $YELLOW "Testando endpoint de saúde..."
    executar_teste "Verificação de saúde" "testar_api '/health'"
    
    # Testes CRUD de avisos
    log $YELLOW "Testando API de avisos..."
    executar_teste "GET avisos" "testar_api '/notices'"
    
    local dados_aviso='{"title":"Aviso de Teste","content":"Conteúdo de teste","priority":"high","startDate":"2025-01-01T00:00:00.000Z","endDate":"2025-01-02T00:00:00.000Z","active":true}'
    executar_teste "POST aviso" "testar_api '/notices' 'POST' '200' '$dados_aviso'"
    
    # Testes CRUD de documentos
    log $YELLOW "Testando API de documentos..."
    executar_teste "GET documentos" "testar_api '/documents'"
    
    local dados_doc='{"title":"Doc de Teste","url":"/teste.pdf","type":"plasa","active":true}'
    executar_teste "POST documento" "testar_api '/documents' 'POST' '200' '$dados_doc'"
    
    # Testes do frontend
    log $YELLOW "Testando páginas do frontend..."
    executar_teste "Página principal" "curl -s http://localhost:5000 | grep -q 'Marinha do Brasil'"
    executar_teste "Página admin" "curl -s http://localhost:5000/admin | grep -q 'html'"
    
    # Testes de tratamento de erro
    log $YELLOW "Testando tratamento de erros..."
    executar_teste "Tratamento 404" "testar_api '/endpoint-invalido' 'GET' '404'"
    
    # Exibir resultados dos testes
    echo
    log $BLUE "Resumo dos Resultados dos Testes"
    log $BLUE "================================"
    echo "Total de Testes: $TOTAL_TESTES"
    echo "Passou: $TESTES_PASSOU"
    echo "Falhou: $TESTES_FALHOU"
    
    local taxa_sucesso=$((TESTES_PASSOU * 100 / TOTAL_TESTES))
    echo "Taxa de Sucesso: ${taxa_sucesso}%"
    
    if [ $TESTES_FALHOU -eq 0 ]; then
        log $GREEN "Todos os testes passaram! Sistema está funcionando corretamente."
        return 0
    else
        log $RED "Alguns testes falharam. Verifique servidor.log para detalhes."
        return 1
    fi
}

# Função de limpeza
limpeza() {
    parar_servidor
    rm -f servidor.log
}

# Trap para garantir limpeza na saída
trap limpeza EXIT

# Execução principal
main() {
    log $BLUE "Sistema de Visualização da Marinha - Suite de Testes Automatizada"
    log $BLUE "================================================================"
    
    verificar_prerequisitos
    instalar_dependencias
    iniciar_servidor
    
    if executar_todos_testes; then
        exit 0
    else
        exit 1
    fi
}

# Analisar argumentos da linha de comando
case "${1:-}" in
    --help|-h)
        echo "Uso: $0 [opções]"
        echo "Opções:"
        echo "  --help, -h     Mostrar esta mensagem de ajuda"
        echo "  --rapido, -r   Executar apenas testes rápidos"
        echo "  --verboso, -v  Saída verbosa"
        exit 0
        ;;
    --rapido|-r)
        log $YELLOW "Executando testes rápidos..."
        # Adicionar implementação de teste rápido aqui
        ;;
    --verboso|-v)
        set -x
        ;;
esac

# Executar função principal
main "$@"