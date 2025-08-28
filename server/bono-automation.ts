/**
 * Sistema de Automação BONO
 * Converte páginas HTML do portal da Marinha em PDF automaticamente
 * Usa Puppeteer para renderização precisa
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { storage } from './storage.js';
import puppeteer from 'puppeteer';

interface BonoConfig {
  url: string;
  outputDir: string;
  filename: string;
  wkhtmltopdfOptions: string[];
}

export class BonoAutomation {
  private config: BonoConfig;
  private isRunning: boolean = false;
  private isEnabled: boolean = false;

  constructor() {
    this.config = {
      url: 'https://bono.marinha.mil.br/bono/issue/view/278',
      outputDir: './uploads',
      filename: `bono-${new Date().toISOString().split('T')[0]}.pdf`,
      wkhtmltopdfOptions: [
        '--page-size', 'A4',
        '--orientation', 'Portrait',
        '--margin-top', '10mm',
        '--margin-bottom', '10mm',
        '--margin-left', '10mm',
        '--margin-right', '10mm',
        '--encoding', 'UTF-8',
        '--javascript-delay', '2000',
        '--load-error-handling', 'ignore',
        '--load-media-error-handling', 'ignore'
      ]
    };
  }

  /**
   * Verifica se Puppeteer está disponível
   */
  async checkWkhtmltopdf(): Promise<boolean> {
    try {
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      await browser.close();
      return true;
    } catch (error) {
      console.error('❌ Erro ao verificar Puppeteer:', error);
      return false;
    }
  }

  /**
   * Instala dependências do Puppeteer (já instalado via npm)
   */
  async installWkhtmltopdf(): Promise<boolean> {
    try {
      console.log('📦 Verificando instalação do Puppeteer...');
      
      const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      await browser.close();
      
      console.log('✅ Puppeteer está funcionando corretamente');
      return true;
    } catch (error) {
      console.error('❌ Erro na verificação do Puppeteer:', error);
      return false;
    }
  }

  /**
   * Converte URL HTML para PDF
   */
  async convertHtmlToPdf(url: string, outputPath: string): Promise<boolean> {
    if (this.isRunning) {
      console.log('⚠️ Conversão já em andamento...');
      return false;
    }

    this.isRunning = true;
    console.log(`🔄 Convertendo ${url} para PDF usando Puppeteer...`);

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Configurar viewport e timeout
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navegar para a página
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Gerar PDF
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          bottom: '20mm',
          left: '15mm',
          right: '15mm'
        }
      });

      await browser.close();
      this.isRunning = false;

      console.log(`✅ PDF gerado com sucesso: ${outputPath}`);
      return true;

    } catch (error) {
      this.isRunning = false;
      console.log(`❌ Erro na conversão com Puppeteer:`, error);
      return false;
    }
  }

  /**
   * Baixa o BONO atual e adiciona ao sistema
   */
  async downloadCurrentBono(): Promise<boolean> {
    if (!this.isEnabled) {
      console.log('⚠️ Automação BONO está desativada');
      return false;
    }
    
    try {
      // Verificar se Puppeteer está disponível
      const hasPuppeteer = await this.checkWkhtmltopdf();
      if (!hasPuppeteer) {
        console.log('❌ Puppeteer não encontrado');
        const installed = await this.installWkhtmltopdf();
        if (!installed) {
          return false;
        }
      }

      // Garantir que o diretório existe
      await fs.mkdir(this.config.outputDir, { recursive: true });

      // Gerar nome do arquivo único
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `bono-auto-${timestamp}.pdf`;
      const outputPath = path.join(this.config.outputDir, filename);

      // Converter HTML para PDF
      const success = await this.convertHtmlToPdf(this.config.url, outputPath);
      
      if (success) {
        // Verificar se o arquivo foi criado
        try {
          const stats = await fs.stat(outputPath);
          if (stats.size > 0) {
            // Adicionar ao sistema como documento BONO
            await this.addBonoToSystem(filename, outputPath);
            console.log(`🎉 BONO automatizado adicionado: ${filename}`);
            return true;
          }
        } catch (error) {
          console.log('❌ Arquivo PDF não foi criado corretamente');
        }
      }

      return false;
    } catch (error) {
      console.log(`❌ Erro no download automático: ${error}`);
      return false;
    }
  }

  /**
   * Adiciona BONO automatizado ao sistema de documentos
   */
  private async addBonoToSystem(filename: string, filepath: string): Promise<void> {
    try {
      const document = {
        title: `BONO Automático - ${new Date().toLocaleDateString('pt-BR')}`,
        url: `/uploads/${filename}`,
        type: 'bono' as const,
        active: true
      };

      await storage.createDocument(document);
      console.log('📋 BONO automático adicionado ao sistema');
    } catch (error) {
      console.log(`❌ Erro ao adicionar BONO ao sistema: ${error}`);
    }
  }

  /**
   * Agenda download automático diário
   */
  startDailySchedule(): void {
    // Executar imediatamente uma vez
    this.downloadCurrentBono();

    // Agendar para executar todos os dias às 06:00
    const scheduleDaily = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(6, 0, 0, 0);
      
      const msUntilTomorrow = tomorrow.getTime() - now.getTime();
      
      setTimeout(() => {
        this.downloadCurrentBono();
        scheduleDaily(); // Reagendar para o próximo dia
      }, msUntilTomorrow);
    };

    scheduleDaily();
    console.log('⏰ Agendamento diário do BONO ativado (06:00 todos os dias)');
  }

  /**
   * Ativar/desativar automação
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log(`🤖 Automação BONO ${enabled ? 'ATIVADA' : 'DESATIVADA'}`);
  }

  /**
   * Verificar se automação está ativa
   */
  getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Download manual do BONO
   */
  async manualDownload(): Promise<{ success: boolean; message: string; filename?: string }> {
    try {
      const success = await this.downloadCurrentBono();
      
      if (success) {
        return {
          success: true,
          message: 'BONO baixado e adicionado com sucesso',
          filename: this.config.filename
        };
      } else {
        return {
          success: false,
          message: 'Falha no download do BONO'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Erro: ${error}`
      };
    }
  }

  /**
   * Configurar URL personalizada
   */
  setBonoUrl(url: string): void {
    this.config.url = url;
    console.log(`🔗 URL do BONO atualizada: ${url}`);
  }

  /**
   * Status do sistema
   */
  getStatus(): {
    isRunning: boolean;
    isEnabled: boolean;
    currentUrl: string;
    nextScheduled: string;
  } {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(6, 0, 0, 0);

    return {
      isRunning: this.isRunning,
      isEnabled: this.isEnabled,
      currentUrl: this.config.url,
      nextScheduled: tomorrow.toISOString()
    };
  }
}

// Instância global
export const bonoAutomation = new BonoAutomation();