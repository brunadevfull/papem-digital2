# Sistema da Marinha - Instalação Offline
**Passo-a-Passo Completo**

**Autor: 2SG Bruna Rocha**  
**Marinha do Brasil**

---

## 📋 PARTE 1: PREPARAR PACOTE (Na sua máquina com internet)

### Passo 1: Preparar o sistema
```bash
# Certifique-se que está na pasta do projeto
cd sistema-marinha

# Verificar se os scripts existem
ls -la *.sh

# Dar permissão de execução
chmod +x criar-pacote-offline.sh
chmod +x empacotamento-offline.sh
```

### Passo 2: Criar o pacote offline
```bash
# OPÇÃO A: Pacote simples (mais rápido)
./criar-pacote-offline.sh

# OPÇÃO B: Pacote completo (recomendado para Oracle Linux)
./empacotamento-offline.sh
```

### Passo 3: Verificar o pacote criado
```bash
# Verificar se o arquivo foi criado
ls -lh sistema-marinha-offline-*.tar.gz

# Exemplo de saída:
# sistema-marinha-offline-20250618.tar.gz (150MB - 2GB)
```

---

## 📦 PARTE 2: TRANSFERIR PARA ORACLE LINUX

### Passo 4: Copiar arquivo para o servidor
```bash
# Via SCP (se tiver acesso SSH)
scp sistema-marinha-offline-*.tar.gz usuario@servidor:/tmp/

# Via pendrive/mídia física
# Copie o arquivo .tar.gz para um pendrive
# Conecte no servidor Oracle Linux
```

---

## 🖥️ PARTE 3: INSTALAR NO ORACLE LINUX

### Passo 5: Conectar no servidor Oracle Linux
```bash
# SSH no servidor
ssh usuario@servidor

# Ou acesso direto ao console
```

### Passo 6: Extrair e instalar
```bash
# Ir para o diretório onde está o arquivo
cd /tmp

# Extrair o pacote
tar -xzf sistema-marinha-offline-*.tar.gz

# Entrar na pasta extraída
cd pacote-offline-marinha

# IMPORTANTE: Instalar como root
sudo ./instalar.sh
```

### Passo 7: Verificar instalação
```bash
# Verificar se o serviço foi criado
sudo systemctl status sistema-marinha

# Iniciar o serviço
sudo systemctl start sistema-marinha

# Verificar se está rodando
sudo systemctl status sistema-marinha

# Ver logs em tempo real
sudo journalctl -u sistema-marinha -f
```

---

## 🌐 PARTE 4: ACESSAR O SISTEMA

### Passo 8: Configurar firewall (se necessário)
```bash
# Verificar portas abertas
sudo firewall-cmd --list-ports

# Se a porta 5000 não estiver aberta
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

### Passo 9: Acessar via browser
```
# No navegador do servidor ou rede local
http://IP_DO_SERVIDOR:5000

# Página principal (display)
http://IP_DO_SERVIDOR:5000

# Painel administrativo
http://IP_DO_SERVIDOR:5000/admin
```

---

## 🔧 RESOLUÇÃO DE PROBLEMAS

### Se o Node.js não foi instalado:
```bash
# Verificar se Node.js existe
node --version

# Se não existir, instalar manualmente
cd /opt
sudo tar -xf /caminho/para/pacote/binarios/node-v20.15.1-linux-x64.tar.xz
sudo ln -sf /opt/node-v*/bin/node /usr/local/bin/node
sudo ln -sf /opt/node-v*/bin/npm /usr/local/bin/npm
```

### Se o serviço não iniciar:
```bash
# Ver logs detalhados
sudo journalctl -u sistema-marinha --no-pager

# Verificar se as dependências estão instaladas
cd /opt/sistema-marinha
ls -la node_modules/

# Reinstalar dependências se necessário
sudo npm install
```

### Testar manualmente:
```bash
# Parar o serviço
sudo systemctl stop sistema-marinha

# Executar manualmente para ver erros
cd /opt/sistema-marinha
sudo -u nobody npm run dev
```

---

## 📞 COMANDOS ÚTEIS

```bash
# Parar sistema
sudo systemctl stop sistema-marinha

# Iniciar sistema  
sudo systemctl start sistema-marinha

# Reiniciar sistema
sudo systemctl restart sistema-marinha

# Ver status
sudo systemctl status sistema-marinha

# Ver logs
sudo journalctl -u sistema-marinha -f

# Executar testes
cd /opt/sistema-marinha
./teste.sh
```

---

## ⚠️ IMPORTANTE

1. **Execute sempre como root** para instalação
2. **Firewall** deve permitir porta 5000
3. **Espaço em disco** necessário: ~500MB-2GB
4. **Oracle Linux** 7, 8 ou 9 suportados
5. **Backup** dos dados antes de atualizações

---

**Sistema desenvolvido por 2SG Bruna Rocha**  
**Marinha do Brasil - PAPEM**