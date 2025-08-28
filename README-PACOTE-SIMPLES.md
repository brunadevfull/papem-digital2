# Sistema Display Marinha - Pacote Offline SIMPLES

## Situação

✅ **Sistema funcionando perfeitamente no Replit**
- Horário pôr do sol: 17:18 (Rio de Janeiro)
- Layout responsivo completo
- PLASA com scroll automático
- Escalas alternando a cada 30s
- Todas as 335 dependências instaladas

## Solução ÚNICA

**UM SCRIPT SÓ** → `pacote-offline-final.sh`

### Como usar:

1. **Copie este código do Replit para sua máquina local**
2. **Execute o script:**
   ```bash
   chmod +x pacote-offline-final.sh
   ./pacote-offline-final.sh
   ```
3. **Resultado:** `sistema-marinha-offline.tar.gz`

### Instalação no Oracle Linux:

```bash
tar -xzf sistema-marinha-offline.tar.gz
cd sistema-marinha-offline
sudo ./instalar.sh
```

**Pronto!** Sistema rodando em `http://localhost:5000`

## O que o script faz:

1. Baixa Node.js para Linux
2. Copia todo o código fonte  
3. Instala todas as 335 dependências
4. Cria instalador automático
5. Compacta tudo em um arquivo

## Comandos no Oracle Linux:

```bash
# Status
systemctl status display-marinha

# Logs  
journalctl -u display-marinha -f

# Reiniciar
systemctl restart display-marinha
```

**Fim.** Sem complicação, sem arquivos extras.