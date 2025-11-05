/*
 * Sistema de Visualização da Marinha do Brasil
 * Servidor Principal - VERSÃO SUPER ABERTA (SEM RESTRIÇÕES)
 */
import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { logger } from "./utils/logger";

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
  const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];

  logger.access(req.method, req.url, clientIP);

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
    logger.success(`CORS Preflight ACEITO: ${req.url} | Cliente: ${clientIP}`);
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
    logger.response(req.method, req.path, res.statusCode, duration, clientIP);
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

      logger.error(`ERRO: ${status} - ${message}`, err);
      res.status(status).json({ message });
    });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5001;
  const networkIPs = getNetworkIPs();
  
  // ESCUTAR EM TODAS AS INTERFACES POSSÍVEIS
  server.listen({
    port,
    host: "0.0.0.0", // TODAS as interfaces
    reusePort: true,
    backlog: 511 // Máximo de conexões pendentes
  }, () => {
    logger.startup('\n🔓 ========================================');
    logger.startup('   MARINHA DO BRASIL - SERVIDOR ABERTO');
    logger.startup('   🚨 MODO SEM RESTRIÇÕES ATIVO 🚨');
    logger.startup('========================================');
    logger.startup(`📡 Servidor rodando na porta ${port}`);
    logger.startup('🔓 CORS: COMPLETAMENTE ABERTO');
    logger.startup('🔓 Firewall: DESABILITADO');
    logger.startup('🔓 Cache: DESABILITADO');
    logger.startup('\n🌐 ACESSE DE QUALQUER LUGAR:');
    logger.startup(`   Local:      http://localhost:${port}`);
    logger.startup(`   Local IP:   http://127.0.0.1:${port}`);

    networkIPs.forEach(ip => {
      logger.startup(`   Rede:       http://${ip}:${port}`);
      logger.startup(`   Admin:      http://${ip}:${port}/admin`);
    });

    logger.startup('\n📱 TESTE EM QUALQUER DISPOSITIVO:');
    logger.startup('   • Computadores na rede');
    logger.startup('   • Celulares no WiFi');
    logger.startup('   • Tablets');
    logger.startup('   • Qualquer navegador');

    logger.startup('\n🔧 URLs DE TESTE:');
    networkIPs.forEach(ip => {
      logger.startup(`   http://${ip}:${port}/ping`);
    });

    logger.startup('\n⚠️  AVISO: Modo de desenvolvimento');
    logger.startup('   Todas as restrições foram removidas');
    logger.startup('   Use apenas em redes confiáveis');
    logger.startup('========================================\n');

    // Sistema BONO automático removido por problemas de renderização
    logger.startup('🚀 Sistema iniciado com sucesso');
  });
  } catch (error) {
    logger.error('Erro ao iniciar servidor', error);
  }
})();
