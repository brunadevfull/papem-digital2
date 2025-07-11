#!/bin/bash
# setup-postgres.sh - Script para ativar PostgreSQL no sistema

echo "🔧 Configurando PostgreSQL para persistência de avisos..."

# 1. Criar arquivo .env
echo "📝 Criando arquivo .env..."
echo "DATABASE_URL=postgresql://postgres@localhost:5432/marinha_display" > .env
echo "✅ Arquivo .env criado"

# 2. Verificar se PostgreSQL está rodando
echo "🔍 Verificando PostgreSQL..."
if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL está rodando"
else
    echo "❌ PostgreSQL não está rodando - iniciando..."
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# 3. Testar conexão com banco
echo "🧪 Testando conexão com banco..."
if sudo -u postgres psql -d marinha_display -c "SELECT COUNT(*) FROM notices;" > /dev/null 2>&1; then
    echo "✅ Conexão com banco funcionando"
else
    echo "❌ Erro na conexão com banco - verificar configuração"
    exit 1
fi

# 4. Verificar dependências Node.js
echo "📦 Verificando dependências..."
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
fi

# 5. Backup do storage.ts original
echo "💾 Fazendo backup do storage.ts..."
if [ ! -f "server/storage.ts.backup" ]; then
    cp server/storage.ts server/storage.ts.backup
    echo "✅ Backup criado: server/storage.ts.backup"
fi

echo ""
echo "🎉 Configuração completa!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Substituir server/db-storage.ts pelo código corrigido"
echo "   2. Alterar server/storage.ts para usar createStorage()"
echo "   3. Reiniciar servidor: npm start"
echo ""
echo "🔍 Para verificar:"
echo "   • Logs devem mostrar: 'DATABASE_URL detectada - usando PostgreSQL'"
echo "   • Avisos criados devem persistir após restart"
echo ""
echo "📊 Status atual:"
echo "   • PostgreSQL: $(sudo systemctl is-active postgresql)"
echo "   • Banco: marinha_display"
echo "   • Arquivo .env: $([ -f .env ] && echo "✅ Existe" || echo "❌ Não existe")"
echo "   • Backup storage: $([ -f server/storage.ts.backup ] && echo "✅ Criado" || echo "❌ Não criado")"
