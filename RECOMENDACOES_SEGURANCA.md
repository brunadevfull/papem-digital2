# Recomendações de Segurança - Sistema da Marinha
## Ações Urgentes Antes de Deploy em Produção

**Data:** 30/10/2025
**Status:** 🔴 CRÍTICO - Implementar IMEDIATAMENTE

---

## 🚨 AÇÕES OBRIGATÓRIAS

### 1. Trocar Credenciais Expostas

As seguintes credenciais foram encontradas no código e **DEVEM** ser trocadas:

#### Banco de Dados
```bash
# Senha atual: suasenha123
# Conectar ao PostgreSQL e trocar:
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'NOVA_SENHA_FORTE_AQUI';
```

**Requisitos para senha forte:**
- Mínimo 16 caracteres
- Letras maiúsculas e minúsculas
- Números
- Caracteres especiais
- Exemplo: `Mb2025!Sec@Db#Prod$`

#### OpenWeather API Key
```bash
# API Key exposta: f8f44e0ebe16dbd77aad8ba878ea97e9

# 1. Acessar: https://openweathermap.org/
# 2. Login na sua conta
# 3. Ir em "API keys"
# 4. Revogar a chave antiga
# 5. Criar nova chave
# 6. Adicionar no .env:
VITE_OPENWEATHER_API_KEY=nova_chave_aqui
```

#### Credenciais de Proxy
```bash
# Usuário: 11111062
# Senha: BruN@2025GlowUp

# Trocar senha do proxy corporativo
# Atualizar no .env:
HTTP_PROXY=http://11111062:NOVA_SENHA@proxy-1dn.mb:6060
HTTPS_PROXY=http://11111062:NOVA_SENHA@proxy-1dn.mb:6060
```

---

### 2. Configurar Arquivo .env

```bash
# 1. Copiar template
cp .env.example .env

# 2. Editar com as credenciais reais
nano .env

# 3. Definir permissões restritas
chmod 600 .env

# 4. NUNCA commitar .env no git
# (já está no .gitignore, mas verificar)
git rm --cached .env 2>/dev/null || true
```

**Conteúdo mínimo do .env:**
```env
# BANCO DE DADOS - TROCAR SENHA!
DATABASE_URL=postgresql://postgres:SENHA_FORTE_AQUI@localhost:5432/marinha_papem

# SEGURANÇA - TROCAR POR STRING ALEATÓRIA!
SESSION_SECRET=$(openssl rand -base64 32)

# API EXTERNA - NOVA CHAVE
VITE_OPENWEATHER_API_KEY=nova_chave_aqui

# PROXY - SENHA ATUALIZADA
HTTP_PROXY=http://usuario:senha_nova@proxy-1dn.mb:6060
HTTPS_PROXY=http://usuario:senha_nova@proxy-1dn.mb:6060

# CORS - APENAS IPs AUTORIZADOS
ALLOWED_ORIGINS=http://IP_SERVIDOR:5000,http://IP_BACKUP:5000
```

---

### 3. Gerar Session Secret Forte

```bash
# Gerar string aleatória
openssl rand -base64 32

# Copiar resultado e adicionar no .env:
SESSION_SECRET=resultado_do_comando_aqui
```

---

### 4. Configurar CORS para Produção

**Editar `.env`:**
```env
# Apenas IPs da sua rede interna
ALLOWED_ORIGINS=http://192.168.1.100:5000,http://10.0.0.50:5000,http://172.16.0.10:5000

# NUNCA usar * em produção
# ALLOWED_ORIGINS=* ❌ ERRADO
```

---

### 5. Configurar Firewall

```bash
# Oracle Linux - Abrir apenas porta necessária
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="192.168.1.0/24" port protocol="tcp" port="5000" accept'
sudo firewall-cmd --reload

# Bloquear acesso externo (apenas rede interna)
sudo firewall-cmd --permanent --zone=public --remove-port=5000/tcp
sudo firewall-cmd --reload
```

---

## 🔒 CHECKLIST DE SEGURANÇA

Antes de colocar em produção, verificar:

### Credenciais
- [ ] Senha do banco de dados trocada
- [ ] OpenWeather API key revogada e recriada
- [ ] Senha do proxy atualizada
- [ ] Session secret gerado aleatoriamente
- [ ] Arquivo .env criado e configurado
- [ ] .env adicionado ao .gitignore
- [ ] Permissões do .env configuradas (chmod 600)

### Configuração do Servidor
- [ ] NODE_ENV=production no .env
- [ ] CORS configurado apenas com IPs autorizados
- [ ] NODE_TLS_REJECT_UNAUTHORIZED removido
- [ ] Firewall configurado (apenas rede interna)
- [ ] SSL/TLS configurado (se aplicável)

### Banco de Dados
- [ ] PostgreSQL com senha forte
- [ ] Acesso restrito apenas do localhost
- [ ] Backups automáticos configurados
- [ ] Logs de auditoria habilitados

### Sistema Operacional
- [ ] Oracle Linux atualizado (yum update)
- [ ] SELinux habilitado
- [ ] Fail2ban instalado (opcional)
- [ ] Logs de sistema monitorados

### Aplicação
- [ ] Sistema rodando com usuário não-root
- [ ] PM2 configurado para restart automático
- [ ] Rate limiting habilitado
- [ ] Logs de acesso configurados
- [ ] Monitoramento de recursos ativo

---

## 🛡️ CONFIGURAÇÕES AVANÇADAS (Recomendadas)

### 1. Rate Limiting

Adicionar ao início do código (após imports):
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // máximo de requisições
  message: 'Muitas requisições deste IP, tente novamente em 1 minuto',
});

app.use('/api/', limiter);
```

**Instalar dependência:**
```bash
npm install express-rate-limit
```

### 2. Helmet.js (Security Headers)

```bash
npm install helmet
```

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
}));
```

### 3. Logs Estruturados

```bash
npm install winston
```

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usar ao invés de console.log
logger.info('Servidor iniciado', { port: 5000 });
logger.error('Erro ao processar', { error: err.message });
```

### 4. Validação de Input

Sempre validar dados recebidos:
```javascript
// Usar Zod schemas existentes
const result = schema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ error: 'Dados inválidos' });
}
```

### 5. Sanitização de Dados

```bash
npm install xss
```

```javascript
import xss from 'xss';

// Sanitizar strings antes de salvar
const cleanTitle = xss(req.body.title);
const cleanContent = xss(req.body.content);
```

---

## 🔍 MONITORAMENTO

### Logs a Monitorar

```bash
# Logs do sistema
tail -f /var/log/messages

# Logs da aplicação
tail -f logs/sistema.log

# Logs do PM2
pm2 logs papem-digital

# Logs do PostgreSQL
tail -f /var/lib/pgsql/data/log/postgresql-*.log
```

### Alertas Importantes

Configurar alertas para:
- Múltiplas tentativas de login falhadas
- Uso excessivo de CPU/memória
- Disco cheio (>80%)
- Conexões ao banco falhando
- Erros 500 em sequência

---

## 📞 CONTATOS DE EMERGÊNCIA

Caso identifique algum problema de segurança:

1. **Desligar o sistema imediatamente:**
   ```bash
   pm2 stop papem-digital
   ```

2. **Verificar logs para atividade suspeita:**
   ```bash
   grep "ERRO\|ERROR\|FAIL" logs/sistema.log | tail -100
   ```

3. **Trocar credenciais comprometidas**

4. **Documentar o incidente**

---

## ✅ VERIFICAÇÃO FINAL

Antes de considerar o sistema seguro:

```bash
# 1. Verificar que .env não está no git
git ls-files | grep .env
# Resultado deve ser vazio

# 2. Verificar permissões do .env
ls -la .env
# Deve ser: -rw------- (600)

# 3. Testar CORS
curl -H "Origin: http://site-malicioso.com" http://localhost:5000/api/status
# Deve bloquear se não estiver na whitelist

# 4. Verificar rate limiting (se implementado)
for i in {1..110}; do curl http://localhost:5000/api/status; done
# Deve bloquear após 100 requisições

# 5. Verificar que credenciais não estão expostas
grep -r "suasenha123" . 2>/dev/null
# Resultado deve ser vazio

# 6. Verificar NODE_TLS_REJECT_UNAUTHORIZED
grep -r "NODE_TLS_REJECT_UNAUTHORIZED" . 2>/dev/null
# Deve estar comentado em ecosystem.config.js
```

---

## 📚 REFERÊNCIAS

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- Node.js Security Best Practices: https://nodejs.org/en/docs/guides/security/
- Express Security: https://expressjs.com/en/advanced/best-practice-security.html

---

**IMPORTANTE:** Este documento deve ser revisado e atualizado a cada 3 meses ou após qualquer incidente de segurança.

**Última atualização:** 30/10/2025
**Próxima revisão:** 30/01/2026
