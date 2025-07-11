/*
 * Sistema de Visualização da Marinha do Brasil
 * Servidor Principal - VERSÃO SUPER ABERTA (SEM RESTRIÇÕES)
 */
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

import os from "os";

const app = express();

// Função para obter todos os IPs da máquina
function getNetworkIPs(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  
  Object.keys(interfaces).forEach((name) => {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      networkInterface.forEach((netInterface) => {
        if (netInterface.family === 'IPv4' && !netInterface.internal) {
          ips.push(netInterface.address);
        }
      });
    }
  });
  
  return ips;
}

// CORS SUPER PERMISSIVO - PERMITE TUDO
app.use((req, res, next) => {
  const origin = req.get('Origin') || req.get('Referer') || 'unknown';
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  console.log(`🌐 ACESSO: ${req.method} ${req.url} | Cliente: ${clientIP} | Origem: ${origin}`);
  
  // HEADERS SUPER PERMISSIVOS - PERMITE TUDO DE TODOS OS LUGARES
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Expose-Headers', '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Headers de segurança permissivos
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
  res.header('X-Frame-Options', 'ALLOWALL');
  res.header('Content-Security-Policy', ''); // Remover CSP
  
  // Headers para cache
  res.header('Cache-Control', 'public, max-age=0');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    console.log(`✅ CORS Preflight ACEITO: ${req.url} | Cliente: ${clientIP}`);
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const start = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`${status} ${req.method} ${req.path} ${res.statusCode} em ${duration}ms | Cliente: ${clientIP}`);
  });

  next();
});

// Middleware para desabilitar cache completamente
app.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
});

(async () => {
  try {
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.log(`❌ ERRO: ${status} - ${message}`);
      res.status(status).json({ message });
    });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  const networkIPs = getNetworkIPs();
  
  // ESCUTAR EM TODAS AS INTERFACES POSSÍVEIS
  server.listen({
    port,
    host: "0.0.0.0", // TODAS as interfaces
    reusePort: true,
    backlog: 511 // Máximo de conexões pendentes
  }, () => {
    console.log('\n🔓 ========================================');
    console.log('   MARINHA DO BRASIL - SERVIDOR ABERTO');
    console.log('   🚨 MODO SEM RESTRIÇÕES ATIVO 🚨');
    console.log('========================================');
    console.log(`📡 Servidor rodando na porta ${port}`);
    console.log('🔓 CORS: COMPLETAMENTE ABERTO');
    console.log('🔓 Firewall: DESABILITADO');
    console.log('🔓 Cache: DESABILITADO');
    console.log('\n🌐 ACESSE DE QUALQUER LUGAR:');
    console.log(`   Local:      http://localhost:${port}`);
    console.log(`   Local IP:   http://127.0.0.1:${port}`);
    
    networkIPs.forEach(ip => {
      console.log(`   Rede:       http://${ip}:${port}`);
      console.log(`   Admin:      http://${ip}:${port}/admin`);
    });
    
    console.log('\n📱 TESTE EM QUALQUER DISPOSITIVO:');
    console.log('   • Computadores na rede');
    console.log('   • Celulares no WiFi');
    console.log('   • Tablets');
    console.log('   • Qualquer navegador');
    
    console.log('\n🔧 URLs DE TESTE:');
    networkIPs.forEach(ip => {
      console.log(`   http://${ip}:${port}/ping`);
    });
      
    console.log('\n⚠️  AVISO: Modo de desenvolvimento');
    console.log('   Todas as restrições foram removidas');
    console.log('   Use apenas em redes confiáveis');
    console.log('========================================\n');

    // Sistema BONO automático removido por problemas de renderização
    console.log('🚀 Sistema iniciado com sucesso');
  });
  } catch (error) {
    console.error('❌ Erro:', error);
  }
})();