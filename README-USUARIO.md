# Sistema de Visualização Naval - Guia do Usuário

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Acesso ao Sistema](#acesso-ao-sistema)
3. [Interface Principal](#interface-principal)
4. [Painel Administrativo](#painel-administrativo)
5. [Gerenciamento de Documentos](#gerenciamento-de-documentos)
6. [Sistema de Avisos](#sistema-de-avisos)
7. [Militares de Serviço](#militares-de-serviço)
8. [Configurações do Sistema](#configurações-do-sistema)
9. [Soluções de Problemas](#soluções-de-problemas)

---

## 🎯 Visão Geral

O Sistema de Visualização Naval foi desenvolvido para exibir documentos navais importantes como PLASA, BONO, Escalas e Cardápios de forma automatizada e organizada. O sistema oferece:

- **Exibição Automática**: Documentos são exibidos automaticamente com rotação entre diferentes tipos
- **Scroll Inteligente**: PLASAs e BONOs rolam automaticamente para leitura completa
- **Avisos Prioritários**: Sistema de avisos com níveis de prioridade (alta, média, baixa)
- **Informações Meteorológicas**: Temperatura atual e alertas meteorológicos do Rio de Janeiro
- **Gerenciamento de Oficiais**: Controle dos oficiais e contrames de serviço

---

## 🔐 Acesso ao Sistema

### Tela Principal (Visualização)
- **URL**: `http://seu-servidor:5000/`
- **Descrição**: Interface pública para visualização dos documentos
- **Acesso**: Aberto para todos os usuários

### Painel Administrativo
- **URL**: `http://seu-servidor:5000/admin`
- **Descrição**: Interface para gerenciamento do sistema
- **Acesso**: Restrito aos administradores

---

## 🖥️ Interface Principal

### Elementos da Tela

#### Cabeçalho
- **Logo**: Identificação do sistema com logo da Marinha
- **Temperatura**: Exibe temperatura atual do Rio de Janeiro
- **Oficiais de Serviço**: Mostra oficial do dia e contramestre atual
- **Data/Hora**: Informações atualizadas em tempo real

#### Área de Conteúdo
- **Documentos**: Exibição rotativa de PLASA, BONO, Escalas e Cardápios
- **Avisos**: Notificações importantes exibidas em destaque
- **Frase do Dia**: Frase motivacional naval renovada diariamente

#### Rodapé
- **Informações do Sistema**: Versão e status operacional
- **Indicadores**: Status de conexão e última atualização

---

## ⚙️ Painel Administrativo

### Acesso às Funcionalidades

O painel administrativo está organizado em 4 abas principais:

1. **📄 Documentos**: Gerenciamento de PDFs
2. **📢 Avisos**: Sistema de comunicações
3. **👮 Militares**: Controle de oficiais de serviço
4. **🔧 Sistema**: Configurações e manutenção

---

## 📄 Gerenciamento de Documentos

### Upload de Documentos

1. **Acesse** a aba "Documentos" no painel administrativo
2. **Clique** em "Adicionar Documento"
3. **Preencha** as informações:
   - **Título**: Nome descritivo do documento
   - **Tipo**: Selecione entre PLASA, BONO, Escala ou Cardápio
   - **Arquivo**: Selecione o arquivo PDF ou imagem
4. **Clique** em "Salvar Documento"

### Tipos de Documentos

#### PLASA (Plano de Adestramento)
- **Comportamento**: Scroll automático vertical
- **Duração**: Baseada no conteúdo do documento
- **Uso**: Documentos longos que requerem leitura completa

#### BONO (Boletim de Operações Navais)
- **Comportamento**: Scroll automático vertical
- **Duração**: Baseada no conteúdo do documento
- **Uso**: Boletins oficiais e comunicações importantes
- **Automação**: Download automático disponível

#### Escala de Serviço
- **Comportamento**: Exibição estática
- **Duração**: 30 segundos (configurável)
- **Uso**: Escalas de pessoal e horários
- **Rotação**: Alterna entre múltiplas escalas

#### Cardápio
- **Comportamento**: Exibição estática
- **Duração**: 30 segundos (configurável)
- **Uso**: Cardápios do refeitório e programação alimentar

### Gerenciamento de Documentos

#### Editar Documento
1. **Localize** o documento na lista
2. **Clique** no botão "Editar" (ícone de lápis)
3. **Modifique** as informações necessárias
4. **Salve** as alterações

#### Ativar/Desativar Documento
- **Ativo**: Documento aparece na rotação de exibição
- **Inativo**: Documento fica salvo mas não é exibido
- **Toggle**: Clique no interruptor para alternar o status

#### Excluir Documento
1. **Clique** no botão "Excluir" (ícone de lixeira)
2. **Confirme** a exclusão
3. **Atenção**: Esta ação é irreversível

---

## 📢 Sistema de Avisos

### Criação de Avisos

1. **Acesse** a aba "Avisos"
2. **Preencha** o formulário:
   - **Título**: Título do aviso (obrigatório)
   - **Conteúdo**: Texto do aviso (obrigatório)
   - **Prioridade**: Alta, Média ou Baixa
   - **Data de Início**: Quando o aviso deve começar a aparecer
   - **Data de Fim**: Quando o aviso deve parar de aparecer
   - **Status**: Ativo ou Inativo
3. **Clique** em "Salvar Aviso"

### Níveis de Prioridade

#### Alta Prioridade (Vermelha)
- **Aparência**: Fundo vermelho com texto branco
- **Uso**: Emergências, alertas críticos
- **Exemplo**: "ATENÇÃO: Exercício de abandono às 15:00h"

#### Média Prioridade (Amarela)
- **Aparência**: Fundo amarelo com texto escuro
- **Uso**: Informações importantes
- **Exemplo**: "Reunião de oficial às 14:00h no Comando"

#### Baixa Prioridade (Azul)
- **Aparência**: Fundo azul claro com texto escuro
- **Uso**: Informações gerais
- **Exemplo**: "Cardápio especial disponível no refeitório"

### Período de Validade

- **Configurável**: Defina data/hora de início e fim
- **Automático**: Avisos são exibidos/ocultados automaticamente
- **Flexível**: Pode ser ativado/desativado manualmente

---

## 👮 Militares de Serviço

### Configuração de Oficiais

1. **Acesse** a aba "Militares"
2. **Preencha** os campos:
   - **Oficial do Dia**: Nome completo com graduação
   - **Contramestre**: Nome completo com graduação
3. **Exemplo de Formato**:
   - "1º Tenente KARINE"
   - "Capitão-Tenente SILVA"
   - "1º Sargento RAFAELA"
4. **Clique** em "Salvar Oficiais"

### Dicas Importantes

- **Graduação**: Sempre inclua a graduação completa
- **Formato**: "Graduação NOME" (ex: "1º Tenente MARIA")
- **Persistência**: Dados são salvos no banco de dados
- **Atualização**: Informações aparecem automaticamente na tela principal

---

## 🔧 Configurações do Sistema

### Aba Sistema

#### Configurações de Exibição
- **Velocidade de Scroll**: Lenta, Normal ou Rápida
- **Intervalo de Alternância**: Tempo entre escalas (segundos)
- **Delay de Reinício**: Pausa no final do PLASA

#### Automação BONO
- **Status**: Ativo/Inativo
- **URL Personalizada**: Configure URL específica
- **Download Manual**: Força download imediato
- **Agendamento**: Download automático diário

#### Ferramentas de Manutenção
- **Limpar Cache**: Remove arquivos temporários
- **Informações do Sistema**: Dados técnicos
- **Logs**: Histórico de operações

### Alertas Meteorológicos

- **Automático**: Alertas do Rio de Janeiro
- **Configurável**: Tipos de alertas (chuva, vento, tempestade)
- **Tempo Real**: Atualização constante

---

## 🔧 Soluções de Problemas

### Problemas Comuns

#### Documento não aparece na tela
**Causas possíveis:**
- Documento está inativo
- Arquivo corrompido
- Problema de upload

**Soluções:**
1. Verifique se o documento está ativo
2. Tente fazer novo upload
3. Verifique o formato do arquivo (PDF, JPG, PNG)

#### Avisos não são exibidos
**Causas possíveis:**
- Aviso está inativo
- Período de validade expirado
- Problema de conexão

**Soluções:**
1. Verifique o status do aviso
2. Confirme as datas de início/fim
3. Teste a conexão com o servidor

#### Temperatura não atualiza
**Causas possíveis:**
- Problema de conexão com API
- Chave de API inválida
- Servidor offline

**Soluções:**
1. Verifique conexão com internet
2. Recarregue a página
3. Contate o administrador

#### Oficiais não aparecem
**Causas possíveis:**
- Nomes não salvos
- Problema de conexão com banco
- Formato incorreto

**Soluções:**
1. Verifique se os nomes foram salvos
2. Confirme o formato "Graduação NOME"
3. Teste a conexão com o servidor

### Limpeza de Cache

#### Quando usar:
- Sistema lento
- Documentos antigos aparecem
- Erros de carregamento

#### Como limpar:
1. **Acesse** Sistema > Manutenção
2. **Clique** em "Limpar Cache"
3. **Aguarde** confirmação
4. **Recarregue** a página

### Reinicialização do Sistema

#### Reinício Suave:
1. Recarregue a página (F5)
2. Limpe cache do navegador
3. Feche e abra o navegador

#### Reinício Completo:
1. Acesse o painel administrativo
2. Use ferramentas de manutenção
3. Limpe cache do servidor
4. Reinicie o serviço

---

## 📞 Suporte Técnico

### Contatos
- **Administrador do Sistema**: [Inserir contato]
- **Suporte Técnico**: [Inserir contato]
- **Emergência**: [Inserir contato]

### Informações Úteis
- **Versão do Sistema**: Navy Display v2.0
- **Última Atualização**: Julho 2025
- **Documentação Técnica**: Disponível em `README.md`

### Logs e Diagnóstico
- **Console do Navegador**: F12 para ver logs
- **Informações do Sistema**: Painel Admin > Sistema
- **Status do Servidor**: Verificação automática

---

## 📝 Notas Importantes

### Segurança
- Mantenha o painel administrativo seguro
- Use senhas fortes quando aplicável
- Monitore acessos ao sistema

### Backup
- Documentos são salvos no servidor
- Configurações ficam no banco de dados
- Faça backups regulares

### Performance
- Limite de 10MB por documento
- Cache automático para otimização
- Limpeza periódica recomendada

### Compatibilidade
- Navegadores modernos (Chrome, Firefox, Safari)
- Resolução mínima: 1024x768
- Suporte a dispositivos móveis

---

*Desenvolvido para a Marinha do Brasil - Sistema de Visualização Naval v2.0*