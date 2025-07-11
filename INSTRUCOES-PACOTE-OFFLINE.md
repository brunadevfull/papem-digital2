# Sistema Display Marinha - Pacote Offline para Oracle Linux

## Situação Atual

O sistema está funcionando perfeitamente no Replit com todas as funcionalidades implementadas:

- ✅ Horário do pôr do sol corrigido (17:18 para Rio de Janeiro)
- ✅ Layout responsivo completo (mobile, tablet, desktop)
- ✅ Sistema de exibição de PLASA e Escalas funcionando
- ✅ Cache inteligente e auto-restart implementados
- ✅ Todas as 335 dependências npm instaladas

## Problema com Empacotamento no Replit

O ambiente Replit tem limitações para criar pacotes offline devido a:
- Restrições no sistema de arquivos virtual
- Problemas com links simbólicos no node_modules
- Timeouts em downloads grandes

## Solução: Criar Pacote na Máquina Local

### Opção 1: Script Automático (Recomendado)

Execute este script em uma máquina com internet para criar o pacote completo:

```bash
#!/bin/bash
# criar-pacote-offline-local.sh

set -e

echo "=== Criando Pacote Offline - Sistema Display Marinha ==="

# Baixar código fonte do Replit
echo "📥 Baixando código fonte..."
git clone https://github.com/seu-usuario/sistema-display-marinha.git || {
    echo "Baixe o código fonte manualmente do Replit"
    echo "Ou copie todos os arquivos para um diretório local"
}

# Ou usar arquivos locais se já tiver
PROJETO_DIR="./sistema-display-marinha"
[[ ! -d "$PROJETO_DIR" ]] && PROJETO_DIR="."

cd "$PROJETO_DIR"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Criar estrutura do pacote
echo "📁 Criando estrutura do pacote offline..."
PACOTE_DIR="sistema-display-marinha-offline"
rm -rf "$PACOTE_DIR" 2>/dev/null || true
mkdir -p "$PACOTE_DIR"/{app,nodejs,install}

# Copiar aplicação completa
echo "📋 Copiando aplicação..."
cp -r package*.json client server shared uploads *.md *.js *.ts *.config.* .env.example .gitignore "$PACOTE_DIR/app/" 2>/dev/null || true

# Copiar node_modules (com todas as dependências)
echo "📦 Copiando dependências (pode demorar)..."
cp -r node_modules "$PACOTE_DIR/app/"

# Baixar Node.js para Linux
echo "📥 Baixando Node.js para Linux..."
cd "$PACOTE_DIR/nodejs"
curl -fsSL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz
tar -xf node.tar.xz --strip-components=1
rm node.tar.xz
cd ../..

# Criar script de instalação
cat > "$PACOTE_DIR/install/instalar.sh" << 'EOF'
#!/bin/bash
set -e

echo "=== INSTALADOR Sistema Display Marinha ==="

[[ $EUID -ne 0 ]] && { echo "Execute como root: sudo ./instalar.sh"; exit 1; }

DEST="/opt/display-marinha"
USER="display-marinha"

echo "📁 Instalando em $DEST"
rm -rf "$DEST" 2>/dev/null || true
mkdir -p "$DEST"

echo "👤 Criando usuário do sistema"
if ! id "$USER" &>/dev/null; then
    useradd -r -s /bin/false -d "$DEST" "$USER"
fi

echo "📦 Instalando Node.js e aplicação"
cp -r nodejs/* "$DEST/"
cp -r app/* "$DEST/"
chmod +x "$DEST/bin/"*
chown -R "$USER:$USER" "$DEST"

echo "📝 Configurando serviço"
cat > "$DEST/start.sh" << 'STARTEOF'
#!/bin/bash
export PATH="/opt/display-marinha/bin:$PATH"
cd /opt/display-marinha
npm run dev
STARTEOF

chmod +x "$DEST/start.sh"
chown "$USER:$USER" "$DEST/start.sh"

[[ -f "$DEST/.env.example" && ! -f "$DEST/.env" ]] && {
    cp "$DEST/.env.example" "$DEST/.env"
    chown "$USER:$USER" "$DEST/.env"
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
Environment=NODE_ENV=production
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

sleep 10
if systemctl is-active --quiet display-marinha; then
    echo "✅ Instalação concluída!"
    echo "🌐 Interface: http://localhost:5000"
    echo "🔧 Admin: http://localhost:5000/admin"
else
    echo "❌ Falha na inicialização"
    echo "Logs: journalctl -u display-marinha -f"
    exit 1
fi
EOF

chmod +x "$PACOTE_DIR/install/instalar.sh"

# Criar README
cat > "$PACOTE_DIR/README.txt" << 'EOF'
SISTEMA DISPLAY MARINHA - PACOTE OFFLINE COMPLETO

CONTEÚDO:
- app/: Aplicação completa com todas as dependências
- nodejs/: Node.js 18.20.4 para Linux
- install/: Script de instalação automática

INSTALAÇÃO NO ORACLE LINUX (SEM INTERNET):
1. tar -xzf sistema-display-marinha-offline.tar.gz
2. cd sistema-display-marinha-offline
3. sudo ./install/instalar.sh

ACESSO:
- Interface: http://localhost:5000
- Admin: http://localhost:5000/admin

COMANDOS:
- Status: systemctl status display-marinha
- Logs: journalctl -u display-marinha -f
- Restart: systemctl restart display-marinha
EOF

# Criar pacote final
echo "📦 Criando pacote final..."
tar -czf sistema-display-marinha-offline.tar.gz "$PACOTE_DIR"
rm -rf "$PACOTE_DIR"

SIZE=$(du -h sistema-display-marinha-offline.tar.gz | cut -f1)
echo ""
echo "✅ PACOTE CRIADO: sistema-display-marinha-offline.tar.gz"
echo "📏 Tamanho: $SIZE"
echo ""
echo "Para instalar no Oracle Linux:"
echo "1. Transferir arquivo para o servidor"
echo "2. tar -xzf sistema-display-marinha-offline.tar.gz"
echo "3. cd sistema-display-marinha-offline"
echo "4. sudo ./install/instalar.sh"
```

### Opção 2: Processo Manual

Se preferir fazer manualmente:

1. **Baixar código fonte completo do Replit**
2. **Em uma máquina com internet, executar:**
   ```bash
   npm install  # Instalar todas as dependências
   ```

3. **Baixar Node.js para Linux:**
   ```bash
   curl -fsSL https://nodejs.org/dist/v18.20.4/node-v18.20.4-linux-x64.tar.xz -o node.tar.xz
   ```

4. **Criar estrutura do pacote:**
   ```
   pacote-offline/
   ├── app/          # Todo o código + node_modules
   ├── nodejs/       # Node.js extraído
   └── install/      # Scripts de instalação
   ```

5. **Compactar:**
   ```bash
   tar -czf sistema-display-marinha-offline.tar.gz pacote-offline/
   ```

## Arquivos Essenciais para o Pacote

Certifique-se de incluir todos estes arquivos/diretórios:

### Código Fonte
- `package.json` e `package-lock.json`
- `client/` (frontend React)
- `server/` (backend Express)  
- `shared/` (tipos compartilhados)
- `uploads/` (diretório de uploads)
- `node_modules/` (TODAS as 335 dependências)
- Arquivos de configuração: `*.config.*`, `.env.example`
- Documentação: `*.md`

### Runtime
- Node.js 18.20.4 para Linux x64
- Binários npm inclusos

### Scripts de Instalação
- Script automático de instalação
- Configuração de serviço systemd
- Configuração de firewall
- Criação de usuário do sistema

## Lista de Dependências Incluídas

O pacote deve incluir todas estas dependências (335 total):

```json
{
  "@hookform/resolvers",
  "@radix-ui/react-*",
  "@tanstack/react-query",
  "react", "react-dom",
  "typescript",
  "vite",
  "express",
  "drizzle-orm",
  "tailwindcss",
  "lucide-react",
  "framer-motion",
  // ... e mais 320+ dependências
}
```

## Teste do Pacote

Após criar o pacote, teste em uma VM Oracle Linux limpa:

1. Transferir o arquivo `.tar.gz`
2. Extrair e executar instalação
3. Verificar se o serviço inicia
4. Testar acesso via http://localhost:5000
5. Verificar funcionalidades (PLASA, Escalas, Admin)

## Suporte

O sistema está totalmente funcional no Replit. O pacote offline permitirá a mesma funcionalidade em Oracle Linux sem internet, incluindo:

- Exibição automática de PLASA com scroll
- Rotação de escalas a cada 30 segundos  
- Horário do pôr do sol atualizado (17:18)
- Layout responsivo completo
- Painel administrativo
- Sistema de avisos

Qualquer dúvida sobre a criação do pacote ou instalação no Oracle Linux, consulte este documento.