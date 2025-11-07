# Testes manuais das configurações de exibição

Estas verificações garantem que as configurações de exibição são persistidas no banco de dados, continuam disponíveis quando o backend está indisponível temporariamente e permanecem sincronizadas entre diferentes dispositivos.

## Pré-requisitos
- Aplicação backend executando com o banco de dados migrado até a migração `0008_create_display_settings.sql`.
- Pelo menos dois navegadores ou dispositivos diferentes (ex.: computador + tablet).

## Cenários

### 1. Migração inicial
1. Execute as migrations (`npm run db:migrate` ou processo equivalente).
2. Verifique no banco se a tabela `display_settings` foi criada e contém a linha padrão (`SELECT * FROM display_settings;`).
3. Resultado esperado: uma única linha com valores padrão (`normal`, `30000`, `3`, etc.).

### 2. Sincronização padrão
1. Abra a aplicação administrativa e autentique-se.
2. Altere cada controle de configuração (intervalo de escala, intervalo de cardápio, velocidade de rolagem, reinício automático).
3. Resultado esperado: os toasts indicam atualização bem-sucedida. Atualize a página e confirme que os valores permanecem aplicados.
4. Valide diretamente no banco (`SELECT * FROM display_settings;`) que os valores foram atualizados.

### 3. Persistência entre dispositivos
1. Em um segundo navegador/dispositivo, abra a página principal do display.
2. Confirme que as configurações refletidas no passo anterior são utilizadas (ex.: tempos de alternância correspondentes).
3. Atualize o segundo dispositivo para garantir que os valores permanecem idênticos.

### 4. Falha temporária do backend
1. Com o display aberto, interrompa o backend (desligue o servidor ou bloqueie as requisições).
2. Tente alterar uma configuração na interface administrativa.
3. Resultado esperado: o toast indica que o ajuste foi salvo localmente e será sincronizado posteriormente.
4. Reative o backend; a sincronização ocorre automaticamente (acompanhe os logs ou atualize a página para confirmar que o valor persistiu no banco).

### 5. Cache do frontend
1. Com o backend desligado, recarregue o display.
2. Resultado esperado: o aplicativo utiliza o cache local (`localStorage`) com os últimos valores conhecidos.
3. Reative o backend e aguarde alguns segundos; as configurações são novamente sincronizadas com o servidor.

### 6. Resiliência a dados inválidos
1. No banco de dados, altere manualmente um valor da tabela `display_settings` para um intervalo inválido (ex.: `-10`).
2. Carregue o display; o frontend deve normalizar o valor para o mínimo permitido.
3. Ajuste uma configuração pela interface administrativa para confirmar que os valores retornam para faixas válidas e são persistidos.

> Observação: documente eventuais diferenças encontradas durante os testes, anexando logs e capturas de tela se necessário.
