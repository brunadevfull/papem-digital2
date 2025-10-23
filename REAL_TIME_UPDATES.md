# Atualizações em Tempo Real para Documentos

## Resumo
Implementação de sistema de atualização automática de documentos na TV, permitindo que alterações feitas pelo admin em outra máquina sejam refletidas automaticamente no display.

## Solução Implementada

### Fase 1: Polling Periódico (Implementado ✅)
Sistema de consulta periódica ao servidor para buscar novos documentos.

**Características:**
- Intervalo configurável (padrão: 60 segundos)
- Pode ser desabilitado definindo intervalo = 0
- Fallback automático se SSE não estiver disponível
- Baixo overhead no servidor

**Arquivos modificados:**
- `client/src/context/DisplayContext.tsx`
  - Adicionado estado `documentRefreshInterval` (padrão: 60000ms)
  - Adicionado `refreshDocuments()` para atualização manual
  - Adicionado `setDocumentRefreshInterval()` para configurar intervalo
  - Implementado useEffect para polling automático
  - Persistência do intervalo no localStorage

### Fase 2: SSE (Server-Sent Events) para Tempo Real (Implementado ✅)
Sistema de notificação em tempo real usando PostgreSQL LISTEN/NOTIFY.

**Características:**
- Atualizações instantâneas quando documentos são adicionados/modificados/removidos
- Heartbeat a cada 30 segundos para manter conexão
- Reconexão automática em caso de falha
- Zero overhead de polling quando SSE está ativo

**Arquivos criados:**
- `server/documentsListener.ts` - Listener PostgreSQL para canal `documents_changed`
- `migrations/0007_add_notify_triggers.sql` - Triggers PostgreSQL para NOTIFY

**Arquivos modificados:**
- `server/routes.ts`
  - Adicionado endpoint SSE `/api/documents/stream`
  - Adicionado gerenciamento de subscribers SSE
  - Adicionado broadcast de atualizações
  - Integrado listener PostgreSQL

- `client/src/context/DisplayContext.tsx`
  - Adicionado useEffect para conexão EventSource
  - Implementado tratamento de eventos SSE
  - Reconexão automática com delay de 5s

## Como Funciona

### Fluxo de Atualização

1. **Admin adiciona/atualiza documento** →
2. **PostgreSQL Trigger** executa `pg_notify('documents_changed', ...)` →
3. **Listener Node.js** recebe notificação →
4. **Broadcast SSE** envia para todos os displays conectados →
5. **Display** recebe evento e atualiza documentos →
6. **TV atualiza automaticamente** 🎉

### Fallback
Se SSE falhar:
- Polling continua funcionando (a cada 60s por padrão)
- Display tenta reconectar SSE automaticamente

## Configuração

### Backend
1. Aplicar migration:
```bash
psql $DATABASE_URL < migrations/0007_add_notify_triggers.sql
```

### Frontend
Configurar intervalo de polling (opcional):
```javascript
const { setDocumentRefreshInterval } = useDisplay();

// Atualizar a cada 2 minutos
setDocumentRefreshInterval(120000);

// Desabilitar polling (apenas SSE)
setDocumentRefreshInterval(0);
```

## Teste Manual

### Testar Polling
1. Abrir display em uma aba do navegador
2. Em outra aba, fazer login como admin
3. Adicionar/remover um documento
4. Aguardar até 60 segundos
5. Display deve atualizar automaticamente

### Testar SSE
1. Verificar console do display: deve mostrar `✅ Conexão SSE de documentos estabelecida`
2. Adicionar/remover documento como admin
3. Display deve atualizar **imediatamente**
4. Console deve mostrar `📡 Evento SSE de documentos recebido: update`

## Monitoramento

### Logs do Servidor
```
📡 Listener PostgreSQL iniciado. Aguardando notificações em "documents_changed".
📡 NOTIFY documents_changed recebido: { id: 123, operation: 'INSERT' }
```

### Logs do Cliente
```
📡 Conectando ao SSE de documentos: http://localhost:5000/api/documents/stream
✅ Conexão SSE de documentos estabelecida
📡 Evento SSE de documentos recebido: update
🔄 Atualizando documentos do servidor...
```

## Compatibilidade

- ✅ Ambas as soluções (Polling + SSE) funcionam simultaneamente
- ✅ SSE funciona em todos os navegadores modernos
- ✅ Polling funciona como fallback universal
- ✅ Zero mudanças necessárias na UI existente
- ✅ Backward compatible com versões anteriores

## Performance

### Polling (60s)
- Requests/hora: 60
- Latência: 0-60s
- Overhead: Baixo

### SSE
- Requests/hora: 1 (inicial) + heartbeats
- Latência: <1s
- Overhead: Mínimo (apenas eventos reais)

### Recomendação
- **Desenvolvimento/Teste**: Polling 30-60s
- **Produção**: SSE ativado + Polling 300s (5min) como fallback

## Troubleshooting

### Display não atualiza
1. Verificar console do navegador
2. Verificar se SSE está conectado
3. Verificar intervalo de polling: `documentRefreshInterval`
4. Verificar se trigger PostgreSQL está ativa:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'documents_notify_trigger';
   ```

### SSE desconecta frequentemente
1. Verificar firewall/proxy
2. Verificar timeout de conexão HTTP
3. Polling continuará funcionando como fallback

## Próximos Passos (Opcional)

- [ ] Adicionar UI para configurar intervalo de polling
- [ ] Adicionar indicador visual de "atualização disponível"
- [ ] Implementar diff para atualizar apenas documentos alterados
- [ ] Adicionar métricas de tempo de atualização
