#!/bin/bash

# Sistema Display Marinha - Gerador de Pacote Offline Completo
# Versão otimizada para Replit com TODAS as dependências

set -e

echo "=== GERADOR DE PACOTE OFFLINE COMPLETO ==="
echo "Sistema Display Marinha com todas as dependências npm"

# Configurações
PACOTE_DIR="marinha-display-offline"
PACOTE_FINAL="sistema-marinha-completo-offline.tar.gz"

# Limpeza
echo "🧹 Limpando arquivos anteriores..."
rm -rf "$PACOTE_DIR" "$PACOTE_FINAL" 2>/dev/null || true

# Verificar se dependências estão instaladas
if [[ ! -d "node_modules" ]] || [[ $(ls node_modules 2>/dev/null | wc -l) -lt 50 ]]; then
    echo "📦 Instalando dependências primeiro..."
    npm install
fi

# Contar dependências
DEPS_COUNT=$(ls node_modules 2>/dev/null | wc -l)
echo "✅ Dependências disponíveis: $DEPS_COUNT pacotes"

# Criar estrutura do pacote
echo "📁 Criando estrutura do pacote..."
mkdir -p "$PACOTE_DIR"/{sistema,nodejs,scripts,docs}

# Copiar aplicação COMPLETA
echo "📦 Copiando aplicação com todas as dependências..."
cp -r package.json package-lock.json "$PACOTE_DIR/sistema/"
cp -r client server shared "$PACOTE_DIR/sistema/"
cp -r node_modules "$PACOTE_DIR/sistema/" 2>/dev/null || echo "⚠️  node_modules será instalado no destino"
cp *.md *.js *.ts *.config.* "$PACOTE_DIR/sistema/" 2>/dev/null || true
cp .env.example "$PACOTE_DIR/sistema/" 2>/dev/null || true
cp .gitignore "$PACOTE_DIR/sistema/" 2>/dev/null || true

# Criar diretório uploads
mkdir -p "$PACOTE_DIR/sistema/uploads"
[[ -d "uploads" ]] && cp -r uploads/* "$PACOTE_DIR/sistema/uploads/" 2>/dev/null || true

# Download Node.js compatível
echo "📥 Baixando Node.js para Linux..."
cd "$PACOTE_DIR/nodejs"

# Usar versão estável compatível com Oracle Linux
NODE_VER="18.20.4"
NODE_PKG="node-v${NODE_VER}-linux-x64.tar.xz"

if curl -fsSL "https://nodejs.org/dist/v${NODE_VER}/${NODE_PKG}" -o "$NODE_PKG"; then
    echo "📦 Extraindo Node.js..."
    
    # Método simples de extração
    if command -v xz >/dev/null 2>&1; then
        xz -d "$NODE_PKG"
        tar -xf "node-v${NODE_VER}-linux-x64.tar"
        mv "node-v${NODE_VER}-linux-x64"/* .
        rm -rf "node-v${NODE_VER}-linux-x64" "node-v${NODE_VER}-linux-x64.tar"
    else
        # Fallback se xz não estiver disponível
        echo "⚠️  xz não disponível, usando extração alternativa..."
        tar -xJf "$NODE_PKG" 2>/dev/null || {
            echo "❌ Não foi possível extrair Node.js"
            cd ../..
            rm -rf "$PACOTE_DIR"
            exit 1
        }
        mv "node-v${NODE_VER}-linux-x64"/* .
        rm -rf "node-v${NODE_VER}-linux-x64" "$NODE_PKG"
    fi
    
    echo "✅ Node.js extraído com sucesso"
else
    echo "❌ Falha ao baixar Node.js"
    cd ../..
    rm -rf "$PACOTE_DIR"
    exit 1
fi

cd ../..

# Verificar se Node.js foi extraído corretamente
if [[ ! -f "$PACOTE_DIR/nodejs/bin/node" ]]; then
    echo "❌ Node.js não foi extraído corretamente"
    rm -rf "$PACOTE_DIR"
    exit 1
fi

# Criar script de instalação robusto
echo "📝 Criando script de instalação..."

cat > "$PACOTE_DIR/scripts/instalar.sh" << 'EOF'
#!/bin/bash

# Instalador Sistema Display Marinha - Offline
set -e

echo "=== INSTALADOR OFFLINE - Sistema Display Marinha ==="

# Verificar root
if [[ $EUID -ne 0 ]]; then
    echo "❌ Execute como root: sudo ./instalar.sh"
    exit 1
fi

# Configurações
DESTINO="/opt/display-marinha"
USUARIO="display-marinha"

echo "📁 Instalando em $DESTINO"
mkdir -p "$DESTINO"

# Criar usuário do sistema
echo "👤 Configurando usuário do sistema"
if ! id "$USUARIO" &>/dev/null; then
    useradd -r -s /bin/false -d "$DESTINO" "$USUARIO"
fi

# Copiar Node.js
echo "📦 Instalando Node.js"
cp -r nodejs/* "$DESTINO/"
chmod +x "$DESTINO/bin/"*

# Copiar sistema
echo "📁 Instalando aplicação"
cp -r sistema/* "$DESTINO/"

# Verificar e instalar dependências se necessário
echo "📦 Verificando dependências"
cd "$DESTINO"

if [[ ! -d "node_modules" ]] || [[ $(ls node_modules 2>/dev/null | wc -l) -lt 20 ]]; then
    echo "📥 Instalando dependências..."
    export PATH="$DESTINO/bin:$PATH"
    npm install --production --no-optional 2>/dev/null || {
        echo "⚠️  Usando dependências do pacote..."
    }
fi

# Configurar permissões
chown -R "$USUARIO:$USUARIO" "$DESTINO"

# Criar script de inicialização
cat > "$DESTINO/iniciar.sh" << 'INICEOF'
#!/bin/bash
export PATH="/opt/display-marinha/bin:$PATH"
cd /opt/display-marinha

echo "Iniciando Sistema Display Marinha..."
npm run dev
INICEOF

chmod +x "$DESTINO/iniciar.sh"
chown "$USUARIO:$USUARIO" "$DESTINO/iniciar.sh"

# Configurar arquivo .env
if [[ -f "$DESTINO/.env.example" && ! -f "$DESTINO/.env" ]]; then
    cp "$DESTINO/.env.example" "$DESTINO/.env"
    chown "$USUARIO:$USUARIO" "$DESTINO/.env"
fi

# Criar serviço systemd
echo "🔧 Configurando serviço"
cat > /etc/systemd/system/display-marinha.service << 'SERVEOF'
[Unit]
Description=Sistema Display Marinha
After=network.target

[Service]
Type=simple
User=display-marinha
WorkingDirectory=/opt/display-marinha
Environment=PATH=/opt/display-marinha/bin:/usr/local/bin:/usr/bin:/bin
Environment=NODE_ENV=production
ExecStart=/opt/display-marinha/iniciar.sh
Restart=always
RestartSec=15
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVEOF

# Configurar firewall se disponível
echo "🔥 Configurando firewall"
if command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-port=5000/tcp &>/dev/null || true
    firewall-cmd --reload &>/dev/null || true
fi

# Configurar SELinux se ativo
if command -v setsebool &>/dev/null; then
    setsebool -P httpd_can_network_connect 1 &>/dev/null || true
fi

# Ativar e iniciar serviço
echo "🚀 Iniciando serviço"
systemctl daemon-reload
systemctl enable display-marinha
systemctl start display-marinha

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
if systemctl is-active --quiet display-marinha; then
    echo "✅ Instalação concluída com sucesso!"
    echo ""
    echo "🌐 Acesso: http://localhost:5000"
    echo "🔧 Admin: http://localhost:5000/admin"
    echo ""
    echo "📋 Comandos úteis:"
    echo "   Status: systemctl status display-marinha"
    echo "   Logs: journalctl -u display-marinha -f"
    echo "   Restart: systemctl restart display-marinha"
    echo "   Stop: systemctl stop display-marinha"
else
    echo "❌ Falha na inicialização do serviço"
    echo "Verifique os logs: journalctl -u display-marinha -f"
    exit 1
fi
EOF

chmod +x "$PACOTE_DIR/scripts/instalar.sh"

# Script de teste
cat > "$PACOTE_DIR/scripts/testar.sh" << 'EOF'
#!/bin/bash

echo "=== TESTE DO SISTEMA ==="

# Verificar serviço
if systemctl is-active --quiet display-marinha; then
    echo "✅ Serviço ativo"
else
    echo "❌ Serviço inativo"
    echo "Iniciar: systemctl start display-marinha"
    exit 1
fi

# Testar conectividade
echo "🌐 Testando conectividade..."
for i in {1..15}; do
    if curl -s http://localhost:5000/health >/dev/null 2>&1; then
        echo "✅ Sistema respondendo"
        break
    fi
    if [[ $i -eq 15 ]]; then
        echo "❌ Sistema não responde após 15 tentativas"
        echo "Verifique: journalctl -u display-marinha -f"
        exit 1
    fi
    echo "Tentativa $i/15..."
    sleep 3
done

# Verificar dependências
DEPS=$(ls /opt/display-marinha/node_modules 2>/dev/null | wc -l)
if [[ $DEPS -gt 30 ]]; then
    echo "✅ Dependências: $DEPS pacotes"
else
    echo "⚠️  Poucas dependências: $DEPS pacotes"
fi

echo "✅ Teste concluído"
echo "🌐 Acesse: http://localhost:5000"
EOF

chmod +x "$PACOTE_DIR/scripts/testar.sh"

# Documentação
echo "📖 Copiando documentação..."
[[ -f "README.md" ]] && cp README.md "$PACOTE_DIR/docs/"
[[ -f "INSTALACAO-LOCAL.md" ]] && cp INSTALACAO-LOCAL.md "$PACOTE_DIR/docs/"

# README de instalação
cat > "$PACOTE_DIR/LEIA-ME.txt" << 'EOF'
=== SISTEMA DISPLAY MARINHA - PACOTE OFFLINE COMPLETO ===

Este pacote contém TUDO necessário para funcionar offline:
- Sistema completo com dependências
- Node.js para Linux
- Scripts de instalação automática

INSTALAÇÃO SIMPLES:

1. Extrair o pacote:
   tar -xzf sistema-marinha-completo-offline.tar.gz

2. Entrar no diretório:
   cd marinha-display-offline

3. Instalar (como root):
   sudo ./scripts/instalar.sh

4. Testar:
   ./scripts/testar.sh

ACESSO:
- Interface: http://localhost:5000
- Painel Admin: http://localhost:5000/admin

GERENCIAMENTO:
- Status: systemctl status display-marinha
- Logs: journalctl -u display-marinha -f
- Reiniciar: systemctl restart display-marinha
- Parar: systemctl stop display-marinha

CARACTERÍSTICAS:
✅ Funcionamento 100% offline
✅ Todas as dependências incluídas
✅ Instalação automática
✅ Serviço systemd
✅ Configuração de firewall
✅ Suporte SELinux

SUPORTE:
Consulte docs/INSTALACAO-LOCAL.md para detalhes.
EOF

# Verificação final
echo "🔍 Verificação final do pacote..."

# Verificar Node.js
if [[ ! -f "$PACOTE_DIR/nodejs/bin/node" ]]; then
    echo "❌ Node.js não encontrado"
    rm -rf "$PACOTE_DIR"
    exit 1
fi

# Verificar aplicação
if [[ ! -f "$PACOTE_DIR/sistema/package.json" ]]; then
    echo "❌ Aplicação não copiada"
    rm -rf "$PACOTE_DIR"
    exit 1
fi

# Verificar scripts
if [[ ! -x "$PACOTE_DIR/scripts/instalar.sh" ]]; then
    echo "❌ Script de instalação inválido"
    rm -rf "$PACOTE_DIR"
    exit 1
fi

echo "✅ Verificação passou"

# Criar pacote final
echo "📦 Criando pacote final..."
tar -czf "$PACOTE_FINAL" "$PACOTE_DIR"

# Limpeza
rm -rf "$PACOTE_DIR"

# Resultado
TAMANHO=$(du -h "$PACOTE_FINAL" | cut -f1)

echo ""
echo "✅ PACOTE OFFLINE COMPLETO CRIADO!"
echo ""
echo "📦 Arquivo: $PACOTE_FINAL"
echo "📏 Tamanho: $TAMANHO"
echo "📦 Dependências: $DEPS_COUNT pacotes incluídos"
echo ""
echo "🚀 PARA INSTALAR NO ORACLE LINUX (SEM INTERNET):"
echo "   1. Transferir: $PACOTE_FINAL"
echo "   2. Extrair: tar -xzf $PACOTE_FINAL"
echo "   3. Instalar: cd marinha-display-offline && sudo ./scripts/instalar.sh"
echo "   4. Testar: ./scripts/testar.sh"
echo ""
echo "🌐 Após instalação: http://localhost:5000"
echo ""
echo "✅ SISTEMA PRONTO PARA ORACLE LINUX OFFLINE!"