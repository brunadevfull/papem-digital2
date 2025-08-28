# Compatibilidade de Bibliotecas Ubuntu → Oracle Linux

**Sistema da Marinha do Brasil**

---

## ✅ RESPOSTA RÁPIDA: SIM, É COMPATÍVEL

**Ubuntu e Oracle Linux são ambos baseados em Linux x64 e usam bibliotecas compatíveis.**

---

## 📋 Compatibilidade por Componente

### Node.js e NPM
- ✅ **100% Compatível** - Node.js usa binários universais Linux x64
- ✅ **Dependências npm** - Todas compatíveis entre distros Linux
- ✅ **Módulos nativos** - Compilados para arquitetura x64 genérica

### Bibliotecas do Sistema (RPMs)
- ✅ **Git, curl, wget** - Presentes em ambas as distros
- ✅ **Nginx, firewalld** - Compatíveis entre RHEL-family
- ✅ **Python 3** - Versões similares disponíveis

### Google Chrome & ChromeDriver
- ✅ **Chrome** - Mesmo pacote .rpm para RHEL/Oracle Linux
- ✅ **ChromeDriver** - Binário universal Linux x64

---

## 🔧 Por que funciona?

### Arquitetura
```
Ubuntu 20.04/22.04 x64  →  Oracle Linux 8/9 x64
        ↓                           ↓
    glibc 2.31+                 glibc 2.28+
        ↓                           ↓
   Kernel Linux                Kernel Linux
        ↓                           ↓
     x86_64                      x86_64
```

### Bibliotecas Base
- **glibc**: Ambas usam versões compatíveis
- **libssl**: OpenSSL presente em ambas
- **zlib**: Biblioteca padrão Linux
- **pthread**: Threading POSIX padrão

---

## ⚠️ Pontos de Atenção

### Gerenciador de Pacotes
```bash
# Ubuntu usa apt
sudo apt install git curl

# Oracle Linux usa dnf/yum
sudo dnf install git curl
```

### Caminhos de Sistema
```bash
# Ambos usam os mesmos caminhos padrão
/usr/bin/node
/usr/local/bin/
/opt/
/etc/systemd/system/
```

### Usuários e Permissões
```bash
# Ambos seguem padrão Linux
nobody:nobody
systemctl
firewall-cmd
```

---

## 🚀 Como os Scripts Resolvem

### Script de Empacotamento
1. **Baixa Node.js** - Binário universal Linux x64
2. **Empacota dependências npm** - node_modules completo
3. **Inclui RPMs** - Para Oracle Linux especificamente
4. **Testa compatibilidade** - Durante instalação

### Script de Instalação
1. **Detecta sistema** - Oracle Linux 7/8/9
2. **Instala dependências** - Via dnf/yum
3. **Configura serviços** - Via systemd
4. **Testa funcionamento** - Antes de finalizar

---

## 📋 Checklist de Compatibilidade

### Na sua máquina Ubuntu:
- [x] Node.js funcionando
- [x] npm install sem erros
- [x] Sistema rodando corretamente
- [x] Testes passando

### No Oracle Linux:
- [x] Mesma arquitetura (x64)
- [x] glibc compatível (2.28+)
- [x] systemd disponível
- [x] firewalld instalado

---

## 🔍 Teste de Compatibilidade

### Antes de empacotar (Ubuntu):
```bash
# Verificar arquitetura
uname -m  # deve ser x86_64

# Verificar glibc
ldd --version

# Testar aplicação
npm run dev
```

### Após instalar (Oracle Linux):
```bash
# Verificar instalação
systemctl status sistema-marinha

# Testar acesso
curl http://localhost:5000

# Executar testes
./teste.sh
```

---

## 💡 Resumo Técnico

**O empacotamento offline funciona porque:**

1. **Node.js** é distribuído como binário universal Linux
2. **npm** empacota todas as dependências no node_modules
3. **RPMs** são baixados especificamente para Oracle Linux
4. **Scripts** detectam e configuram o ambiente automaticamente

**Resultado:** Sistema 100% funcional mesmo sendo empacotado no Ubuntu.

---

## 📞 Solução de Problemas

### Se algo não funcionar:
1. Verificar logs: `journalctl -u sistema-marinha`
2. Testar manualmente: `cd /opt/sistema-marinha && npm run dev`
3. Verificar permissões: `ls -la /opt/sistema-marinha`
4. Reinstalar dependências: `npm install --production`

### Comandos de diagnóstico:
```bash
# Arquitetura
uname -a

# Bibliotecas
ldd /usr/local/bin/node

# Processos
ps aux | grep node

# Portas
netstat -tulpn | grep 5000
```

---

**Sistema da Marinha do Brasil - PAPEM**