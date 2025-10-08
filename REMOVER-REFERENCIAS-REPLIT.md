# 🚨 REFERÊNCIAS DO REPLIT PARA REMOVER DO CÓDIGO

## ARQUIVOS QUE PRECISAM SER LIMPOS

### 1. **replit.md** - RENOMEAR E LIMPAR
```
AÇÃO: Renomear para "SISTEMA-DOCUMENTACAO.md" ou "README-SISTEMA.md"
REMOVER: Título "Navy Display System - Replit Configuration"
ALTERAR PARA: "Navy Display System - Documentação Técnica"
```

### 2. **public/index.html** - LINHA 7
```html
<!-- REMOVER ESTA LINHA COMPLETAMENTE: -->
<script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script>
```

### 3. **client/index.html** - LINHA 9
```html
<!-- REMOVER ESTA LINHA COMPLETAMENTE: -->
<script type="text/javascript" src="https://replit.com/public/js/replit-dev-banner.js"></script>
```

### 4. **client/src/components/PDFViewer copy.tsx** - LINHAS 8-20
```javascript
// SUBSTITUIR TODA A FUNÇÃO getBackendUrl:
const getBackendUrl = (path: string): string => {
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // REMOVER: Detectar se estamos no Replit ou desenvolvimento local
  // REMOVER: const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.co');
  
  // SIMPLIFICAR PARA:
  const currentHost = window.location.hostname;
  
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    // Produção - usar porta 5000
    if (path.startsWith('/')) {
      return `http://${currentHost}:5000${path}`;
    }
    return `http://${currentHost}:5000/${path}`;
  }
  
  // Desenvolvimento local
  if (path.startsWith('/')) {
    return `http://localhost:5000${path}`;
  }
  return `http://localhost:5000/${path}`;
};
```

### 5. **client/src/context/DisplayContext.tsx** - LINHAS 50-80
```javascript
// SUBSTITUIR TODA A FUNÇÃO getBackendUrl:
const getBackendUrl = (path: string): string => {
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  const currentHost = window.location.hostname;
  
  // REMOVER TODAS as referências a Replit:
  // REMOVER: const isReplit = currentHost.includes('replit.dev') || currentHost.includes('replit.co');
  // REMOVER: console.log(`🌐 DisplayContext Backend URL (Replit): ${currentOrigin}`);
  
  // SIMPLIFICAR PARA:
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    console.log(`🌐 DisplayContext: Detectado acesso via rede: ${currentHost}`);
    
    if (path.startsWith('/')) {
      return `http://${currentHost}:5000${path}`;
    }
    return `http://${currentHost}:5000/${path}`;
  }
  
  console.log(`🌐 DisplayContext Backend URL (Local): localhost:5000`);
  
  if (path.startsWith('/')) {
    return `http://localhost:5000${path}`;
  }
  return `http://localhost:5000/${path}`;
};
```

### 6. **client/src/pages/Admin.tsx** - MÚLTIPLAS LINHAS
```javascript
// LOCALIZAR E SUBSTITUIR:

// LINHA ~50: getBackendUrl function
// REMOVER: console.log('🌐 Admin: Detectado Replit, usando mesmo origin:', currentOrigin);
// REMOVER: const isReplit = currentHost.includes('replit.dev') || currentHost.includes('replit.co');

// SIMPLIFICAR PARA detecção simples de ambiente local vs produção
```

### 7. **package.json** - LINHAS 75-76
```json
// REMOVER ESTAS DEPENDÊNCIAS:
"@replit/vite-plugin-cartographer": "^0.2.7",
"@replit/vite-plugin-runtime-error-modal": "^0.0.3",
```

### 8. **INSTRUCOES-PACOTE-OFFLINE.md** - MÚLTIPLAS REFERÊNCIAS
```markdown
// SUBSTITUIR todas as menções:
"Sistema está totalmente funcional no Replit" 
PARA: 
"Sistema está totalmente funcional em ambiente de desenvolvimento"

"Baixar código fonte completo do Replit"
PARA:
"Baixar código fonte completo do repositório"
```

### 9. **gerar-pacote-completo.sh** - LINHA 4
```bash
# SUBSTITUIR:
# Versão otimizada para Replit com TODAS as dependências
# PARA:
# Versão otimizada para produção com TODAS as dependências
```

## ARQUIVOS QUE ESTÃO LIMPOS
✅ `vite.config.ts` - Não contém referências diretas
✅ `server/` - Backend está limpo
✅ `shared/` - Schemas estão limpos
✅ Demais componentes React estão limpos

## PRÓXIMOS PASSOS

1. **EXECUTAR LIMPEZA**: Remover todas as referências listadas acima
2. **TESTAR LOCALMENTE**: Verificar se sistema funciona sem referências Replit
3. **RENOMEAR ARQUIVOS**: 
   - `replit.md` → `DOCUMENTACAO-SISTEMA.md`
   - `.replit` → pode ser removido (arquivo de configuração Replit)
4. **ATUALIZAR TÍTULOS**: Remover "Replit" de todos os cabeçalhos e comentários
5. **VERIFICAR LOGS**: Garantir que console.log não menciona "Replit"

## RESULTADO FINAL
Sistema completamente limpo, pronto para entrega/auditoria sem rastros de plataforma de desenvolvimento online.