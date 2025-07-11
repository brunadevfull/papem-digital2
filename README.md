# Sistema de Display da Marinha v2.0

Sistema completo de visualização para documentos PLASA e Escalas de Serviço da Marinha do Brasil com melhorias significativas de responsividade e funcionalidades automáticas.

## 🚀 Versão 2.0 - Novas Funcionalidades

- 🌅 **Horário do Pôr do Sol**: Atualização diária automática para Rio de Janeiro
- 📱 **Layout Totalmente Responsivo**: Adapta-se perfeitamente a todos os dispositivos
- ⚡ **Performance Otimizada**: Cache inteligente e processamento melhorado
- 🔄 **Auto-restart**: Reinício automático após conclusão do scroll
- 📊 **Sistema Robusto**: Tratamento de erros aprimorado e logs detalhados

## 📋 Funcionalidades Principais

- 📄 **Exibição PLASA**: Visualização automática com scroll suave de documentos do Plano de Serviço Semanal
- 📋 **Exibição Escala**: Rotação automática entre escalas de serviço a cada 30 segundos
- 📢 **Avisos Importantes**: Sistema de notificações em tempo real com prioridades
- 🕐 **Data/Hora Dinâmica**: Exibição contínua com horário do pôr do sol atualizado
- 🔧 **Painel Admin Completo**: Gerenciamento de documentos, avisos e configurações

## 🌐 Acesso ao Sistema

- **Interface Principal**: http://localhost:5000
- **Painel Administrativo**: http://localhost:5000/admin

## ⚡ Como usar

1. **Executar**: `npm run dev`
2. **Acessar**: http://localhost:5000
3. **Gerenciar**: Use /admin para upload de documentos e configurações

## 📱 Design Responsivo

- **Desktop**: Layout com PLASA (60%) e Escala/Avisos (40%)
- **Tablet**: Adaptação automática das proporções
- **Mobile**: Layout em coluna única otimizado

## 📁 Estrutura do Sistema

```
/
├── client/          # Frontend React + TypeScript
│   ├── src/pages/   # Páginas (Index, Admin)
│   ├── src/components/ # Componentes (PDFViewer, NoticeDisplay)
│   └── src/utils/   # Utilitários (sunsetUtils, pdfUtils)
├── server/          # Backend Express + Node.js
│   ├── routes.ts    # API endpoints
│   └── storage.ts   # Gerenciamento de dados
├── shared/          # Tipos TypeScript compartilhados
├── uploads/         # Arquivos PDF enviados
└── logs/           # Logs do sistema
```

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + Node.js + Multer
- **Processamento**: PDF.js para conversão automática
- **Styling**: shadcn/ui + Framer Motion
- **Build**: Vite com HMR

## 📦 Instalação

### Instalação Rápida (Online)
```bash
npm install
npm run dev
```

### Instalação Offline (Oracle Linux)
```bash
# 1. Preparar pacote (máquina com internet)
./empacotamento-offline.sh

# 2. Transferir e instalar (máquina de destino)
tar -xzf sistema-display-marinha-offline.tar.gz
cd sistema-display-offline-temp
sudo ./instalar-offline.sh
```

## 📖 Documentação

- **Instalação Local**: [INSTALACAO-LOCAL.md](INSTALACAO-LOCAL.md)
- **Compatibilidade**: [COMPATIBILIDADE-LIBS.md](COMPATIBILIDADE-LIBS.md)
- **Resumo de Melhorias**: [RESUMO-MELHORIAS.md](RESUMO-MELHORIAS.md)

## 🧪 Testes

```bash
# Testes automatizados
node test.js

# Testes específicos
./teste.sh
```

## 🔧 Configuração

O sistema funciona sem configuração adicional. Para personalizações avançadas, consulte o arquivo `.env.example`.

## 📈 Performance

- **Startup**: < 3 segundos
- **Scroll**: 60fps suave
- **Alternância**: Transições de 500ms
- **Cache**: Otimização automática de PDFs

## 🛡️ Segurança

- Validação completa de uploads
- Sanitização de dados
- Proteção contra XSS
- Limites de tamanho de arquivo

## 📞 Suporte

Para instalação em Oracle Linux sem internet ou dúvidas técnicas, consulte a documentação em `INSTALACAO-LOCAL.md`.

## 🔄 Changelog v2.0

### Melhorias Implementadas
- ✅ Horário do pôr do sol corrigido para 17:18 (Rio de Janeiro)
- ✅ Layout responsivo completo para todos os dispositivos
- ✅ Breakpoints otimizados (mobile, tablet, desktop, xl)
- ✅ Cache inteligente para PDFs convertidos
- ✅ Auto-restart do scroll após completar documento
- ✅ Tratamento de erros robusto
- ✅ Logs detalhados para debugging
- ✅ Script de empacotamento offline atualizado
- ✅ Documentação completa para Oracle Linux
- ✅ Testes automatizados atualizados

### Recursos Técnicos
- API externa para horário do pôr do sol (sunrise-sunset.org)
- Fallback local para cálculo quando API indisponível
- Timer automático para atualização à meia-noite
- Responsividade com viewport units (vh/vw)
- Transições suaves entre estados
- Gerenciamento de estado otimizado