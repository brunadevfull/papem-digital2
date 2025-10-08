#!/bin/bash
set -e

# Criar estrutura temporária
TEMP="temp_package"
mkdir -p "$TEMP"/{src,runtime,install}

# Copiar código fonte
echo "Copiando código fonte..."
cp package*.json "$TEMP/src/"
for item in *.md *.js *.ts *.config.* .env.example .gitignore; do
    [[ -f "$item" ]] && cp "$item" "$TEMP/src/" 2>/dev/null || true
done

# Copiar diretórios (método seguro)
[[ -d "client" ]] && tar -cf - client | tar -xf - -C "$TEMP/src/"
[[ -d "server" ]] && tar -cf - server | tar -xf - -C "$TEMP/src/"
[[ -d "shared" ]] && tar -cf - shared | tar -xf - -C "$TEMP/src/"
[[ -d "uploads" ]] && tar -cf - uploads | tar -xf - -C "$TEMP/src/" || mkdir -p "$TEMP/src/uploads"

# Download Node.js
echo "Baixando Node.js..."
cd "$TEMP/runtime"
curl -fsSL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz
tar -xf node.tar.xz --strip-components=1
rm node.tar.xz
cd ../..

# Script de instalação
cat > "$TEMP/install/install.sh" << 'INSTALLEOF'
#!/bin/bash
set -e

echo "=== INSTALADOR Sistema Display Marinha ==="

[[ $EUID -ne 0 ]] && { echo "Execute como root: sudo ./install.sh"; exit 1; }

DEST="/opt/display-marinha"
USER="display-marinha"

echo "Instalando em $DEST"
rm -rf "$DEST" 2>/dev/null || true
mkdir -p "$DEST"

if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/false -d "$DEST" "$USER"
fi

echo "Copiando arquivos..."
cp -r runtime/* "$DEST/"
cp -r src/* "$DEST/"
chmod +x "$DEST/bin/"*

cd "$DEST"
echo "Instalando dependências..."
export PATH="$DEST/bin:$PATH"
npm install --production --no-optional

chown -R "$USER:$USER" "$DEST"

cat > start.sh << 'STARTSCRIPT'
#!/bin/bash
export PATH="/opt/display-marinha/bin:$PATH"
cd /opt/display-marinha
npm run dev
STARTSCRIPT

chmod +x start.sh
chown "$USER:$USER" start.sh

[[ -f .env.example && ! -f .env ]] && {
    cp .env.example .env
    chown "$USER:$USER" .env
}

cat > /etc/systemd/system/display-marinha.service << 'SERVICEEOF'
[Unit]
Description=Sistema Display Marinha
After=network.target

[Service]
Type=simple
User=display-marinha
WorkingDirectory=/opt/display-marinha
Environment=PATH=/opt/display-marinha/bin:/usr/bin:/bin
ExecStart=/opt/display-marinha/start.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

if command -v firewall-cmd &>/dev/null; then
    firewall-cmd --permanent --add-port=5000/tcp &>/dev/null || true
    firewall-cmd --reload &>/dev/null || true
fi

systemctl daemon-reload
systemctl enable display-marinha
systemctl start display-marinha

sleep 8
if systemctl is-active --quiet display-marinha; then
    echo "✅ Instalação concluída!"
    echo "🌐 Interface: http://localhost:5000"
    echo "🔧 Admin: http://localhost:5000/admin"
else
    echo "❌ Falha na inicialização"
    echo "Logs: journalctl -u display-marinha -f"
    exit 1
fi
INSTALLEOF

chmod +x "$TEMP/install/install.sh"

# README
cat > "$TEMP/README.txt" << 'READMEEOF'
SISTEMA DISPLAY MARINHA - PACOTE OFFLINE

INSTALAÇÃO:
1. tar -xzf sistema-display-marinha-offline.tar.gz
2. cd temp_package
3. sudo ./install/install.sh

ACESSO:
- Interface: http://localhost:5000
- Admin: http://localhost:5000/admin

COMANDOS:
- Status: systemctl status display-marinha
- Logs: journalctl -u display-marinha -f
- Restart: systemctl restart display-marinha

CONTEÚDO:
✅ Código fonte completo
✅ Node.js 18.20.4 para Linux
✅ Scripts de instalação automática
✅ Suporte para Oracle Linux offline
READMEEOF

# Criar pacote final
echo "Criando pacote final..."
tar -czf sistema-display-marinha-offline.tar.gz "$TEMP"
rm -rf "$TEMP"

SIZE=$(du -h sistema-display-marinha-offline.tar.gz | cut -f1)
echo ""
echo "✅ PACOTE CRIADO: sistema-display-marinha-offline.tar.gz"
echo "📏 Tamanho: $SIZE"
echo ""
echo "INSTALAÇÃO NO ORACLE LINUX:"
echo "1. tar -xzf sistema-display-marinha-offline.tar.gz"
echo "2. cd temp_package"
echo "3. sudo ./install/install.sh"
echo ""
echo "✅ PRONTO PARA USO OFFLINE!"
