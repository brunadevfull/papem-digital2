#!/bin/bash

# UM SCRIPT SIMPLES - Sistema Display Marinha Offline
# Execute este script em qualquer máquina Linux com internet

set -e

echo "=== CRIANDO PACOTE OFFLINE ÚNICO ==="

# Limpar arquivos antigos
rm -rf sistema-marinha-offline* temp* offline* 2>/dev/null || true

echo "Baixando Node.js..."
curl -fsSL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz

echo "Criando estrutura..."
mkdir -p sistema-marinha-offline/{app,node}

echo "Extraindo Node.js..."
tar -xf node.tar.xz -C sistema-marinha-offline/node --strip-components=1
rm node.tar.xz

echo "Copiando aplicação..."
cp -r package*.json client server shared uploads *.md *.js *.ts *.config.* .env.example sistema-marinha-offline/app/ 2>/dev/null || true

echo "Instalando dependências..."
cd sistema-marinha-offline/app
../node/bin/npm install --production
cd ../..

echo "Criando instalador..."
cat > sistema-marinha-offline/instalar.sh << 'EOF'
#!/bin/bash
set -e

[[ $EUID -ne 0 ]] && { echo "Execute: sudo ./instalar.sh"; exit 1; }

DEST="/opt/display-marinha"
rm -rf "$DEST" 2>/dev/null || true
mkdir -p "$DEST"

if ! id display-marinha &>/dev/null; then
    useradd -r -s /bin/false display-marinha
fi

cp -r node/* "$DEST/"
cp -r app/* "$DEST/"
chown -R display-marinha:display-marinha "$DEST"

cat > "$DEST/start.sh" << 'STARTEOF'
#!/bin/bash
cd /opt/display-marinha
export PATH="/opt/display-marinha/bin:$PATH"
npm run dev
STARTEOF

chmod +x "$DEST/start.sh"

cat > /etc/systemd/system/display-marinha.service << 'SERVICEEOF'
[Unit]
Description=Display Marinha
After=network.target

[Service]
User=display-marinha
WorkingDirectory=/opt/display-marinha
Environment=PATH=/opt/display-marinha/bin:/usr/bin
ExecStart=/opt/display-marinha/start.sh
Restart=always

[Install]
WantedBy=multi-user.target
SERVICEEOF

systemctl daemon-reload
systemctl enable display-marinha
systemctl start display-marinha

echo "✅ Instalado! Acesse: http://localhost:5000"
EOF

chmod +x sistema-marinha-offline/instalar.sh

echo "Compactando..."
tar -czf sistema-marinha-offline.tar.gz sistema-marinha-offline
rm -rf sistema-marinha-offline

SIZE=$(du -h sistema-marinha-offline.tar.gz | cut -f1)

echo ""
echo "✅ PRONTO: sistema-marinha-offline.tar.gz ($SIZE)"
echo ""
echo "INSTALAÇÃO NO ORACLE LINUX:"
echo "1. tar -xzf sistema-marinha-offline.tar.gz"  
echo "2. cd sistema-marinha-offline"
echo "3. sudo ./instalar.sh"
echo "4. Acesse: http://localhost:5000"
echo ""
echo "FIM - Só isso!"