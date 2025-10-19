# Sistema de Display da Marinha – Guia Final

Este repositório concentra a versão 2.0 do sistema de visualização de PLASA, escalas de serviço e avisos operacionais da Marinha do Brasil. O objetivo deste README é reunir, em um único documento, todas as informações necessárias para instalar, operar, manter e evoluir a plataforma em qualquer ambiente (laboratório, navio ou centro de comando).

## 📦 Visão Geral

- **Stack principal**: React + TypeScript (frontend), Express + Node.js (backend), Drizzle ORM + PostgreSQL (persistência) e Tailwind CSS (estilos).
- **Componentes executáveis**: servidor HTTP com API REST e WebSocket, painel administrativo protegido por sessão e display responsivo em tela cheia.
- **Fluxo operacional**: administradores fazem upload de PDFs (PLASA e escalas), definem avisos, e o display principal alterna automaticamente entre os documentos, atualizando relógio, clima e pôr do sol.
- **Foco da versão 2.0**: desempenho (cache de PDFs, renderização em 60 fps), responsividade total e automação (atualização diária do pôr do sol, auto-restart de rolagem, scripts de empacotamento offline).

## 🧱 Arquitetura

| Camada | Tecnologias | Responsabilidades |
| ------ | ----------- | ----------------- |
| Frontend (`client/`) | React, Vite, Tailwind, shadcn/ui, Framer Motion | Renderiza o display, painel admin, componentes interativos e animações. |
| Backend (`server/`) | Express, Drizzle ORM, Multer, sessions, WebSocket | Gerencia uploads, autenticação de sessão, agendamento de sunset, APIs REST e broadcast em tempo real. |
| Compartilhado (`shared/`) | TypeScript | Tipos e contratos usados em ambos os lados. |
| Armazenamento | PostgreSQL, diretório `uploads/` | Persistência de metadados (Drizzle) e arquivos enviados (PLASA, escalas, avisos). |

Comunicação interna:
1. O painel admin envia PDFs/avisos via endpoints REST (`server/routes.ts`).
2. O backend salva arquivos em `uploads/` e registra metadados no banco (`server/db-storage.ts`).
3. WebSockets notificam o display sobre atualizações em tempo real.
4. Um job periódico obtém o horário do pôr do sol (API externa + fallback local) e atualiza o estado exibido.

## ✨ Funcionalidades Principais

- Exibição contínua de documentos PLASA com rolagem suave e reinício automático após o término.
- Alternância entre escalas de serviço a cada 30 s com transições animadas.
- Painel administrativo completo para upload, gestão de avisos e ajuste de parâmetros do display.
- Avisos prioritários em tempo real, relógio centralizado e cálculo automático do pôr do sol no fuso do Rio de Janeiro.
- Scripts de empacotamento offline para ambientes sem internet, incluindo instalação assistida em Oracle Linux/RHEL.
- Monitoramento extensivo por logs de acesso e middleware de latência no servidor Express.

## ✅ Pré-requisitos

| Item | Versão recomendada |
| ---- | ------------------ |
| Sistema operacional | Oracle Linux 8+, RHEL 8+, Ubuntu 20.04+, Debian 11+ |
| Node.js | 20.x (LTS) |
| npm | 10.x |
| Banco de dados | PostgreSQL 15+ (local ou remoto) |
| Ferramentas opcionais | Git, tar, unzip, firewall-cmd/ufw |

Para ambientes com firewall ou SELinux, consulte a seção [Implantação em Produção](#-implantação-em-produção).

## 🚀 Primeiros Passos

1. **Clonar o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd papem-digital2
   ```
2. **Configurar variáveis de ambiente**
   ```bash
   cp .env.example .env
   # Ajuste PORT, URLs e diretórios de upload conforme o ambiente
   ```
3. **Instalar dependências**
   ```bash
   npm install
   ```
4. **Preparar banco de dados**
   ```bash
   npm run db:push     # aplica o schema Drizzle
   psql < setup-database.sql   # alternativa completa
   ```

> **Importante**: garanta que a tabela `documents` contenha as colunas `tags text[]` e `unit text CHECK (unit IN ('EAGM','1DN'))` para compatibilidade com o `storage.createDocument`.

## 🧪 Execução e Testes

- **Desenvolvimento** (`PORT` padrão 5001 no servidor com hot reload):
  ```bash
  npm run dev
  # Frontend + backend executando via tsx e Vite (modo aberto / sem restrições)
  ```
- **Build de produção**:
  ```bash
  npm run build   # compila frontend e bundle do servidor
  npm start       # inicia servidor Node em modo production
  ```
- **Testes automatizados**:
  ```bash
  node test.js
  ./teste.sh      # suites adicionais/smoke tests
  ```

URLs padrão:
- Display principal: http://localhost:5001/
- Painel administrativo: http://localhost:5001/admin
- Ping rápido (rede local): http://<IP_DA_MAQUINA>:5001/ping

## 🧰 Scripts Úteis

| Comando | Descrição |
| ------- | --------- |
| `npm run dev` | Sobe servidor Express com Vite integrado e CORS liberado para testes. |
| `npm run build` | Gera build do frontend e empacota o backend via esbuild. |
| `npm start` | Executa artefatos em `dist/` com `NODE_ENV=production`. |
| `npm run check` | Verificação TypeScript (tsc). |
| `npm run db:push` | Sincroniza schema com o banco via Drizzle Kit. |
| `./setup-sistema-completo.sh` | Automatiza instalação + configuração para ambientes novos. |
| `./gerar-pacote-completo.sh` | Produz pacote offline com dependências, dados e scripts de instalação. |
| `./setup-oracle-linux.sh` | Executa instalação assistida em Oracle Linux (firewall, serviços, dependências). |

## 🗂️ Estrutura de Diretórios

```
/
├── client/                # Frontend React (display + admin)
│   ├── src/components/    # Componentes visuais, PDF viewer, avisos
│   ├── src/pages/         # Páginas públicas e administrativas
│   └── src/utils/         # Utilitários (sunset, formatação, fetch)
├── server/                # Backend Express + Drizzle
│   ├── index.ts           # Bootstrap do servidor (CORS aberto, logging, WS)
│   ├── routes.ts          # Endpoints REST (uploads, avisos, autenticação)
│   ├── db-storage.ts      # Camada de persistência via Drizzle
│   └── vite.ts            # Integração Vite/Express no modo dev
├── shared/                # Tipagens compartilhadas (TS)
├── uploads/               # PDFs enviados + cache de renderização
├── migrations/            # Scripts SQL/Drizzle para evolução do schema
├── public/                # Assets estáticos adicionais
└── scripts *.sh           # Automação (setup, pacotes, testes)
```

## 🗄️ Banco de Dados e Armazenamento

- **Drizzle ORM** centraliza migrations em `migrations/` e possui helpers no backend (`db-storage.ts`).
- **PostgreSQL** é o alvo principal; utilize `setup-database.sql` para provisionar um ambiente limpo.
- **Uploads** ficam em `uploads/` e devem possuir permissões 755 (diretórios) / 644 (arquivos).
- Para backups, compacte `uploads/`, `.env`, `package*.json` e dumps SQL (ex.: `backup-completo-banco.sql`).

## 🖥️ Painel Administrativo & Fluxo Operacional

1. Acesse `/admin` autenticado na mesma rede.
2. Faça upload dos PDFs de PLASA e escalas (aceita múltiplos arquivos, rotaciona automaticamente).
3. Cadastre avisos com níveis de prioridade; o display exibe em tempo real via WebSocket.
4. Ajuste parâmetros como velocidade de scroll e intervalo de alternância diretamente no painel.
5. Acompanhe visualização instantânea para validar documentos antes de publicar.

## 🌇 Automação e Serviços em Segundo Plano

- **Horário do pôr do sol**: job diário consome `sunrise-sunset.org` e mantém fallback local (latitude/longitude configuráveis via `.env`).
- **Auto-restart da rolagem**: ao atingir o fim do PDF, reinicia automaticamente garantindo exibição contínua.
- **Cache inteligente**: pré-renderização de páginas e otimização de imagens para reduzir uso de CPU e garantir 60 fps.
- **Logging**: middleware no Express registra IP, método, status e latência de cada requisição para auditoria.

## 🌐 Pacote Offline e Instalação Sem Internet

Para ambientes desconectados, utilize os scripts fornecidos:

1. **Gerar pacote offline** (máquina com internet)
   ```bash
   ./gerar-pacote-completo.sh        # inclui dependências, dumps e instaladores
   # ou
   ./pacote-offline-final.sh         # versão final com verificações adicionais
   ```
2. **Transferir para a máquina destino** e extrair o `.tar.gz`.
3. **Executar instaladores**:
   ```bash
   sudo ./setup-oracle-linux.sh      # prepara Oracle Linux/RHEL (firewall, serviços, Node.js)
   sudo ./setup-sistema-completo.sh  # cria estrutura, restaura backups e inicia serviço
   ```

Consulte também `INSTALACAO-OFFLINE.md`, `INSTRUCOES-PACOTE-OFFLINE.md` e `README-PACOTE-SIMPLES.md` para fluxos específicos.

## 🏭 Implantação em Produção

1. **Firewall/SELinux**: libere a porta configurada (padrão 5000 em produção) via `firewall-cmd` ou `ufw`.
2. **Usuário dedicado**: crie um usuário de serviço (`display`) e conceda permissões a `/opt/display-marinha`.
3. **systemd**: utilize o modelo descrito em `INSTALACAO-LOCAL.md` para criar `display-marinha.service` apontando para `node dist/index.js`.
4. **Proxy reverso (opcional)**: configure Nginx/Apache para expor HTTPS e compressão.
5. **Reinício automático**: o serviço está configurado com `Restart=always` e `RestartSec=10` para garantir alta disponibilidade.

## 💾 Backup e Recuperação

- **Backup completo**:
  ```bash
  tar -czf backup-display-$(date +%Y%m%d-%H%M).tar.gz \
      uploads/ .env package.json package-lock.json
  pg_dump > backup-completo-banco.sql
  ```
- **Restaurar**:
  ```bash
  tar -xzf backup-display-AAAAmmdd-HHMM.tar.gz
  psql < backup-completo-banco.sql
  ```
- **Somente uploads**:
  ```bash
  tar -czf backup-uploads-$(date +%Y%m%d).tar.gz uploads/
  ```

Armazene os backups em mídia externa/segura e valide a restauração periodicamente.

## 📊 Logs, Monitoramento e Limpeza

- Logs padrão são gravados conforme `LOG_LEVEL` e `LOG_FILE` do `.env`.
- Para ambientes de produção, utilize `journalctl -u display-marinha -f` ao instalar via systemd.
- Limpeza de cache/logs:
  ```bash
  rm -rf uploads/cache/*
  find logs/ -name "*.log" -mtime +30 -delete
  ```
- Para debugging em desenvolvimento, o servidor imprime IPs, URLs e status no console.

## 🛠️ Solução de Problemas Rápidos

| Sintoma | Correção sugerida |
| ------- | ----------------- |
| `EACCES: permission denied` ao salvar uploads | Ajuste owner/permissões de `uploads/` (`sudo chown -R display:display uploads`). |
| `Error: Cannot find module` após atualizar dependências | `rm -rf node_modules package-lock.json && npm install`. |
| Porta indisponível | Identifique processo (`sudo netstat -tulpn | grep :5001`) ou altere `PORT` no `.env`. |
| Horário do pôr do sol incorreto | Verifique conectividade com `sunrise-sunset.org`; fallback local usa lat/long definidos no `.env`. |
| PDFs não carregam | Confira permissões/estrutura da pasta `uploads/` e limite de tamanho (`MAX_FILE_SIZE`). |

## 📚 Documentação Complementar

- [INSTALACAO-LOCAL.md](INSTALACAO-LOCAL.md): guia completo de instalação online/offline, manutenção e serviço systemd.
- [INSTALACAO-OFFLINE.md](INSTALACAO-OFFLINE.md): processo detalhado para empacotamento e implantação sem internet.
- [COMPATIBILIDADE-LIBS.md](COMPATIBILIDADE-LIBS.md): matriz de compatibilidade de bibliotecas.
- [RESUMO-MELHORIAS.md](RESUMO-MELHORIAS.md): changelog técnico e melhorias da versão 2.0.
- Scripts adicionais em `./scripts-*.sh` descrevem rotinas específicas (limpeza de cache, testes Selenium, etc.).

---

**Suporte**: em caso de dúvidas ou necessidade de customizações, consulte a equipe responsável pela manutenção ou abra um chamado interno descrevendo o ambiente, logs relevantes e passos para reprodução.
