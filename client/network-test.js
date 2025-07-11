const os = require('os');
const net = require('net');

console.log('🔍 DIAGNÓSTICO DE REDE\n');

// 1. Mostrar todos os IPs
console.log('📡 IPs da Máquina:');
const interfaces = os.networkInterfaces();
Object.keys(interfaces).forEach((name) => {
  const networkInterface = interfaces[name];
  if (networkInterface) {
    networkInterface.forEach((netInterface) => {
      if (netInterface.family === 'IPv4') {
        console.log(`   ${name}: ${netInterface.address} ${netInterface.internal ? '(interno)' : '(rede)'}`);
      }
    });
  }
});

// 2. Testar se a porta está livre
console.log('\n🔍 Testando Porta 5000:');
const server = net.createServer();

server.listen(5000, '0.0.0.0', () => {
  console.log('✅ Porta 5000 está disponível');
  server.close();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('⚠️  Porta 5000 já está em uso (isso é normal se o servidor estiver rodando)');
  } else {
    console.log('❌ Erro na porta 5000:', err.message);
  }
});

// 3. Mostrar informações do sistema
console.log('\n💻 Informações do Sistema:');
console.log(`   OS: ${os.type()} ${os.release()}`);
console.log(`   Hostname: ${os.hostname()}`);
console.log(`   Platform: ${os.platform()}`);
console.log(`   Arch: ${os.arch()}`);

// 4. Comandos úteis
console.log('\n🛠️  Comandos Úteis:');
console.log('   Windows:');
console.log('   - Verificar porta: netstat -an | findstr :5000');
console.log('   - Liberar firewall: New-NetFirewallRule -DisplayName "Node 5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow');
console.log('   - Ver IP: ipconfig');
console.log('\n   Linux/Mac:');
console.log('   - Verificar porta: netstat -an | grep :5000');
console.log('   - Liberar firewall: sudo ufw allow 5000');
console.log('   - Ver IP: ifconfig ou ip addr show');

console.log('\n📝 Próximos Passos:');
console.log('   1. Execute: npm run dev');
console.log('   2. Teste local: http://localhost:5000');
console.log('   3. Teste rede: use um dos IPs de rede listados acima');
console.log('   4. Se não funcionar, verifique firewall');