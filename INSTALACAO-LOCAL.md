# Instalação Local - Sistema de Display da Marinha

## Versão: 2.0
**Última atualização: 20/06/2025**

## Pré-requisitos

### Sistema Operacional Suportado
- Oracle Linux 8+ / RHEL 8+
- Ubuntu 20.04+ / Debian 11+
- CentOS 8+

### Dependências do Sistema
```bash
# Oracle Linux / RHEL / CentOS
sudo dnf update
sudo dnf install -y curl wget git unzip tar gzip

# Ubuntu / Debian
sudo apt update
sudo apt install -y curl wget git unzip tar gzip
```

### Node.js 20+ LTS
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verificar instalação
node --version  # deve ser v20.x.x
npm --version   # deve ser 10.x.x
```

## Instalação Online (com internet)

### 1. Clonar o repositório
```bash
git clone <url-do-repositorio>
cd sistema-display-marinha
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar ambiente
```bash
# Criar arquivo de configuração
cp .env.example .env

# Editar configurações (opcional)
nano .env
```

### 4. Executar o sistema
```bash
# Modo desenvolvimento (recomendado para testes)
npm run dev

# Modo produção
npm run build
npm start
```

## Instalação Offline (sem internet)

### 1. Preparar pacote offline (máquina com internet)
```bash
# Executar script de empacotamento
./empacotamento-offline.sh

# Isso criará o arquivo: sistema-display-marinha-offline.tar.gz
```

### 2. Transferir para máquina de destino
```bash
# Copiar arquivo via USB, rede interna, etc.
scp sistema-display-marinha-offline.tar.gz usuario@servidor:/tmp/
```

### 3. Instalar na máquina de destino
```bash
# Extrair pacote
cd /opt
sudo tar -xzf /tmp/sistema-display-marinha-offline.tar.gz
sudo chown -R display:display sistema-display-marinha

# Entrar no diretório
cd sistema-display-marinha

# Executar instalação offline
sudo ./setup-oracle-linux.sh
```

## Configuração de Rede

### Firewall
```bash
# Oracle Linux / RHEL / CentOS
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload

# Ubuntu / Debian (UFW)
sudo ufw allow 5000/tcp
```

### SELinux (Oracle Linux / RHEL)
```bash
# Verificar status
sestatus

# Se necessário, permitir conexões na porta 5000
sudo setsebool -P httpd_can_network_connect 1
sudo semanage port -a -t http_port_t -p tcp 5000
```

## Funcionalidades do Sistema

### Interface Principal (/)
- **Exibição PLASA**: Documentos de plano de serviço semanal com scroll automático
- **Exibição Escala**: Rotação automática entre escalas de serviço (30s por documento)
- **Avisos Importantes**: Notificações prioritárias em tempo real
- **Data/Hora**: Atualização contínua com horário do pôr do sol para Rio de Janeiro
- **Layout Responsivo**: Adapta-se automaticamente a diferentes tamanhos de tela

### Painel Administrativo (/admin)
- **Gerenciamento de Avisos**: Criar, editar e excluir notificações
- **Upload de Documentos**: PDFs para PLASA e Escala de Serviço
- **Configurações**: Velocidade de scroll, intervalo de alternância
- **Visualização em Tempo Real**: Preview dos documentos carregados

### Recursos Técnicos
- **Processamento PDF**: Conversão automática para visualização
- **Cache Inteligente**: Otimização de performance para documentos grandes
- **Auto-restart**: Reinício automático do scroll após conclusão
- **API REST**: Endpoints para integração externa
- **Timezone Automático**: Atualização diária do horário do pôr do sol

## Acessar o Sistema

### URLs de Acesso
- **Interface Principal**: http://localhost:5000
- **Painel Admin**: http://localhost:5000/admin

### Acesso Remoto
Para acesso de outras máquinas na rede:
```bash
# Descobrir IP da máquina
ip addr show | grep inet

# Acessar via: http://IP_DA_MAQUINA:5000
```

## Solução de Problemas

### Erro: "EACCES: permission denied"
```bash
# Definir owner correto
sudo chown -R $USER:$USER /caminho/para/projeto
```

### Erro: "Error: Cannot find module"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Porta em uso
```bash
# Verificar processo usando a porta 5000
sudo netstat -tulpn | grep :5000
sudo kill -9 <PID>

# Ou usar porta alternativa
PORT=5001 npm run dev
```

### PDF não carrega
```bash
# Verificar permissões da pasta uploads
ls -la uploads/
sudo chmod 755 uploads/
sudo chmod 644 uploads/*
```

### Horário do pôr do sol incorreto
```bash
# O sistema busca automaticamente via API externa
# Em caso de falha, usa cálculo local como fallback
# Logs disponíveis no console do navegador (F12)
```

## Manutenção

### Logs do Sistema
```bash
# Ver logs em tempo real
npm run dev 2>&1 | tee logs/sistema.log

# Logs específicos
mkdir -p logs
echo "$(date): Sistema iniciado" >> logs/display.log
```

### Backup
```bash
# Backup completo
tar -czf backup-display-$(date +%Y%m%d-%H%M).tar.gz \
    uploads/ .env package.json package-lock.json

# Backup apenas uploads
tar -czf backup-uploads-$(date +%Y%m%d).tar.gz uploads/

# Restaurar backup
tar -xzf backup-display-YYYYMMDD-HHMM.tar.gz
```

### Limpeza de Cache
```bash
# Limpar cache de PDFs convertidos
rm -rf uploads/cache/
mkdir uploads/cache

# Limpar logs antigos
find logs/ -name "*.log" -mtime +30 -delete
```

### Atualizações
```bash
# Atualizar código (com internet)
git pull origin main
npm install
npm run build

# Reiniciar serviço
sudo systemctl restart display-marinha
```

## Instalação como Serviço (systemd)

### 1. Criar usuário do sistema
```bash
sudo useradd -r -s /bin/false display
sudo mkdir -p /opt/display-marinha
sudo chown display:display /opt/display-marinha
```

### 2. Criar arquivo de serviço
```bash
sudo nano /etc/systemd/system/display-marinha.service
```

### 3. Conteúdo do arquivo:
```ini
[Unit]
Description=Sistema de Display da Marinha v2.0
Documentation=file:///opt/display-marinha/README.md
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=display
Group=display
WorkingDirectory=/opt/display-marinha
ExecStart=/usr/bin/node server/index.js
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
TimeoutStopSec=20

# Variáveis de ambiente
Environment=NODE_ENV=production
Environment=PORT=5000

# Limites de recursos
LimitNOFILE=65536
LimitNPROC=32768

# Segurança
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/display-marinha/uploads

[Install]
WantedBy=multi-user.target
```

### 4. Ativar e iniciar serviço
```bash
sudo systemctl daemon-reload
sudo systemctl enable display-marinha
sudo systemctl start display-marinha
sudo systemctl status display-marinha

# Verificar logs
journalctl -u display-marinha -f
```

## Configurações Avançadas

### Proxy Reverso (Nginx)
```bash
# Instalar Nginx
sudo dnf install -y nginx

# Configurar site
sudo nano /etc/nginx/sites-available/display-marinha
```

```nginx
server {
    listen 80;
    server_name display.marinha.local;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoramento
```bash
# Script de monitoramento simples
nano monitor-display.sh
```

```bash
#!/bin/bash
if ! curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "$(date): Sistema fora do ar, reiniciando..." >> /var/log/display-monitor.log
    sudo systemctl restart display-marinha
fi
```

```bash
# Adicionar ao cron (verificar a cada 5 minutos)
crontab -e
*/5 * * * * /opt/display-marinha/monitor-display.sh
```

## Suporte e Troubleshooting

### Verificação Rápida do Sistema
```bash
# Verificar status geral
./teste.sh

# Verificar configuração
node -e "console.log('Node.js:', process.version); console.log('Plataforma:', process.platform);"

# Testar conectividade
curl -I http://localhost:5000

# Verificar logs detalhados
tail -f logs/sistema.log
```

### Informações do Sistema
- **Versão**: 2.0
- **Porta Padrão**: 5000
- **Documentação**: README.md
- **Logs**: Console do navegador + logs/
- **Cache**: uploads/cache/