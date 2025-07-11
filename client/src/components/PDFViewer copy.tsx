import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDisplay } from "@/context/DisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const IS_DEV_MODE = process.env.NODE_ENV === 'development';

// Configurar PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

interface PDFViewerProps {
  documentType: "plasa" | "escala";
  title: string;
  scrollSpeed?: "slow" | "normal" | "fast";
  autoRestartDelay?: number;
}

// Classe para controlar o scroll automático contínuo
class ContinuousAutoScroller {
  private isScrolling: boolean = false;
  private animationId: number | null = null;
  private currentPosition: number = 0;
  private speed: number = 1;
  private container: HTMLElement | null = null;
  private onCompleteCallback?: () => void;
  private fixedMaxScroll: number = 0;

  constructor(
    container: HTMLElement,
    speed: number = 1,
    onComplete?: () => void
  ) {
    this.container = container;
    this.speed = speed;
    this.onCompleteCallback = onComplete;
  }

  start() {
    if (!this.container || this.isScrolling) return;

    this.isScrolling = true;
    this.currentPosition = 0;
    
    this.fixedMaxScroll = this.container.scrollHeight - this.container.clientHeight;
    
    console.log(`📜 PLASA: Iniciando scroll - Total: ${this.container.scrollHeight}px, Visível: ${this.container.clientHeight}px, Para rolar: ${this.fixedMaxScroll}px`);
    
    if (this.fixedMaxScroll <= 0) {
      console.log("⚠️ PLASA: Não há conteúdo suficiente para scroll");
      this.stop();
      return;
    }

    this.container.scrollTop = 0;
    this.currentPosition = 0;
    this.scroll();
  }

  private scroll = () => {
    if (!this.isScrolling || !this.container) return;

    const maxScroll = this.fixedMaxScroll;
    
    if (this.currentPosition < maxScroll - 10) {
      this.currentPosition += this.speed;
      this.container.scrollTop = this.currentPosition;
      this.animationId = requestAnimationFrame(this.scroll);
    } else {
      this.container.scrollTop = maxScroll;
      console.log(`✅ PLASA: Scroll completo até o final do documento`);
      
      setTimeout(() => {
        this.stop();
        this.onCompleteCallback?.();
      }, 2000);
    }
  };

  stop() {
    this.isScrolling = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  reset() {
    this.stop();
    if (this.container) {
      this.container.scrollTop = 0;
      this.currentPosition = 0;
    }
  }

  setSpeed(newSpeed: number) {
    this.speed = newSpeed;
  }

  get isActive() {
    return this.isScrolling;
  }
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  documentType, 
  title, 
  scrollSpeed = "normal",
  autoRestartDelay = 3
}) => {
  // CORREÇÃO: Usar currentEscalaIndex do contexto
  const { activeEscalaDoc, activePlasaDoc, currentEscalaIndex, escalaDocuments } = useDisplay();
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAutomationPaused, setIsAutomationPaused] = useState(false);
  const [savedPageUrls, setSavedPageUrls] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [escalaImageUrl, setEscalaImageUrl] = useState<string | null>(null);

  const scrollerRef = useRef<ContinuousAutoScroller | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Configurações
  const getScrollSpeed = () => {
    switch (scrollSpeed) {
      case "slow": return 1;
      case "fast": return 5;
      default: return 3; // normal
    }
  };

  const SCROLL_SPEED = getScrollSpeed();
  const RESTART_DELAY = autoRestartDelay * 1000;
  const PDF_SCALE = 1.5;

  // Função para obter a URL completa do servidor backend - DETECTAR AMBIENTE
  const getBackendUrl = (path: string): string => {
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
      return path;
    }
    
    // Detectar se estamos no Replit ou desenvolvimento local
    const isReplit = window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.co');
    
    if (isReplit) {
      // No Replit, usar o mesmo domínio atual
      const currentOrigin = window.location.origin;
      
      if (path.startsWith('/')) {
        return `${currentOrigin}${path}`;
      }
      return `${currentOrigin}/${path}`;
    } else {
      // Desenvolvimento local - usar localhost:5000
      const backendPort = '5000';
      const backendHost = 'localhost';
      
      if (path.startsWith('/')) {
        return `http://${backendHost}:${backendPort}${path}`;
      }
      return `http://${backendHost}:${backendPort}/${path}`;
    }
  };

  // CORREÇÃO: Função para determinar a URL do documento com alternância
  const getDocumentUrl = () => {
    if (documentType === "plasa") {
      if (activePlasaDoc?.url) {
        console.log("📄 PLASA: Usando documento do admin:", activePlasaDoc.url);
        return getBackendUrl(activePlasaDoc.url);
      }
      console.log("📄 PLASA: Nenhum documento ativo");
      return null;
    } else if (documentType === "escala") {
      // CORREÇÃO: Usar a escala atual baseada no índice
      const activeEscalas = escalaDocuments.filter(doc => doc.active);
      
      if (activeEscalas.length === 0) {
        console.log("📋 ESCALA: Nenhuma escala ativa");
        return null;
      }
      
      const currentEscala = activeEscalas[currentEscalaIndex % activeEscalas.length];
      
      if (currentEscala?.url) {
        console.log(`📋 ESCALA: Usando escala ${currentEscalaIndex + 1}/${activeEscalas.length}:`, {
          title: currentEscala.title,
          category: currentEscala.category,
          url: currentEscala.url
        });
        return getBackendUrl(currentEscala.url);
      }
      
      console.log("📋 ESCALA: Escala atual sem URL válida");
      return null;
    }
    return null;
  };

  // CORREÇÃO: Obter documento da escala atual
  const getCurrentEscalaDoc = () => {
    const activeEscalas = escalaDocuments.filter(doc => doc.active);
    if (activeEscalas.length === 0) return null;
    return activeEscalas[currentEscalaIndex % activeEscalas.length] || null;
  };

  // Verificar se arquivo é imagem
  const isImageFile = (url: string) => {
    return (
      url.startsWith('data:image') ||
      url.startsWith('blob:') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    );
  };
   

0  // Carregar PDF.js APENAS quando necessário
  const loadPDFJS = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;

    console.log("📚 Carregando PDF.js...");
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        window.pdfjsLib.GlobalWorkerOptions.verbosity = 0;
        console.log("✅ PDF.js carregado com sucesso");
        resolve(window.pdfjsLib);
      };
      script.onerror = () => {
        console.error("❌ Erro ao carregar PDF.js");
        reject(new Error('Falha ao carregar PDF.js'));
      };
      document.head.appendChild(script);
    });
  };

  // Função melhorada para obter dados do PDF
// Função melhorada para obter dados do PDF com tratamento de CORS
  const getPDFData = async (url: string): Promise<ArrayBuffer | Uint8Array> => {
    console.log("📥 Obtendo dados do PDF:", url);
    
    try {
      if (url.startsWith('blob:')) {
        console.log("🔗 URL blob detectada");
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Erro blob: ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        console.log(`✅ Blob convertido: ${arrayBuffer.byteLength} bytes`);
        return arrayBuffer;
      }
      
      // Primeira tentativa com headers melhorados
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf,*/*'
          },
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'omit'
        });
        
        if (!response.ok) throw new Error(`HTTP: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        console.log(`✅ PDF carregado: ${arrayBuffer.byteLength} bytes`);
        return arrayBuffer;
        
      } catch (corsError) {
        console.warn("⚠️ Erro CORS, tentando proxy:", corsError);
        
        // Fallback: usar proxy
        const proxyUrl = getBackendUrl(`/api/proxy-pdf?url=${encodeURIComponent(url)}`);
        console.log("🔄 Usando proxy:", proxyUrl);
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy: ${response.status}`);
        
        const arrayBuffer = await response.arrayBuffer();
        console.log(`✅ PDF via proxy: ${arrayBuffer.byteLength} bytes`);
        return arrayBuffer;
      }
      
    } catch (error) {
      console.error("❌ Erro ao obter PDF:", error);
      throw error;
    }
  };

  // Função para salvar página como imagem no servidor
  const savePageAsImage = async (canvas: HTMLCanvasElement, pageNum: number): Promise<string> => {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error(`❌ Erro ao converter página ${pageNum} para blob`);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }

        try {
          const formData = new FormData();
          formData.append('file', blob, `plasa-page-${pageNum}.jpg`);
          formData.append('pageNumber', String(pageNum));
          
          const uploadUrl = getBackendUrl('/api/upload-plasa-page');
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            const savedUrl = result.data?.url || result.url || `/plasa-pages/plasa-page-${pageNum}.jpg`;
            const fullSavedUrl = getBackendUrl(savedUrl);
            console.log(`💾 Página ${pageNum} salva no servidor: ${fullSavedUrl}`);
            resolve(fullSavedUrl);
          } else {
            throw new Error(`Erro no servidor: ${response.status}`);
          }
          
        } catch (error) {
          console.warn(`⚠️ Falha ao salvar página ${pageNum} no servidor, usando data URL:`, error);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        }
      }, 'image/jpeg', 0.85);
    });
  };

  // Verificar se páginas já existem no servidor
  const checkExistingPages = async (totalPages: number): Promise<string[]> => {
    try {
      const checkUrl = getBackendUrl('/api/check-plasa-pages');
      
      const response = await fetch(checkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalPages }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.allPagesExist) {
          console.log(`💾 Usando ${totalPages} páginas já salvas no servidor`);
          return result.pageUrls.map((url: string) => getBackendUrl(url));
        }
      }
      
      console.log("🆕 Páginas não encontradas, gerando novas...");
      return [];
      
    } catch (error) {
      console.log(`⚠️ Erro ao verificar páginas existentes:`, error);
      return [];
    }
  };

  // FUNÇÃO PRINCIPAL: Converter PDF para imagens
  const convertPDFToImages = async (pdfUrl: string) => {
    try {
      console.log(`🎯 INICIANDO CONVERSÃO PDF: ${pdfUrl}`);
      setLoading(true);
      setLoadingProgress(0);
      setDebugInfo({});

      if (!pdfUrl || pdfUrl === "null" || pdfUrl === "undefined") {
        throw new Error("URL do PDF está vazia ou inválida");
      }

      const pdfjsLib = await loadPDFJS();
      const pdfData = await getPDFData(pdfUrl);
      
      const uint8Array = new Uint8Array(pdfData);
      const header = new TextDecoder().decode(uint8Array.slice(0, 8));
      
      if (!header.startsWith('%PDF')) {
        console.log("⚠️ Arquivo não é PDF válido, tentando como imagem");
        setSavedPageUrls([pdfUrl]);
        setTotalPages(1);
        setLoading(false);
        return;
      }
      
      console.log("✅ PDF válido detectado, iniciando processamento...");
      
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true,
        disableRange: true,
        stopAtErrors: false,
        maxImageSize: 1024 * 1024 * 10,
        isEvalSupported: false,
        fontExtraProperties: false,
        useSystemFonts: false,
        standardFontDataUrl: null
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📄 PDF carregado com sucesso: ${pdf.numPages} páginas`);
      setTotalPages(pdf.numPages);
      
      const existingPages = await checkExistingPages(pdf.numPages);
      if (existingPages.length === pdf.numPages) {
        console.log(`💾 Usando ${pdf.numPages} páginas já convertidas`);
        setSavedPageUrls(existingPages);
        setLoading(false);
        pdf.destroy();
        return;
      }

      console.log("🖼️ Convertendo páginas para imagens...");
      const imageUrls: string[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          console.log(`📄 Processando página ${pageNum}/${pdf.numPages}`);
          
          const page = await pdf.getPage(pageNum);
          
          const originalViewport = page.getViewport({ scale: 1.0 });
          const scale = Math.min(PDF_SCALE, 2048 / Math.max(originalViewport.width, originalViewport.height));
          const viewport = page.getViewport({ scale: scale });

          console.log(`📐 Página ${pageNum} - Original: ${originalViewport.width}x${originalViewport.height}, Escala: ${scale}, Final: ${viewport.width}x${viewport.height}`);

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { 
            alpha: false,
            willReadFrequently: false
          })!;
          
          canvas.height = Math.floor(viewport.height);
          canvas.width = Math.floor(viewport.width);
          
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
            background: '#FFFFFF',
            intent: 'display'
          };

          console.log(`🎨 Renderizando página ${pageNum}...`);
          
          const renderPromise = page.render(renderContext).promise;
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na renderização')), 30000)
          );
          
          await Promise.race([renderPromise, timeoutPromise]);
          
          console.log(`✅ Página ${pageNum} renderizada com sucesso`);
          
          const imageUrl = await savePageAsImage(canvas, pageNum);
          imageUrls.push(imageUrl);
          
          console.log(`💾 Página ${pageNum} salva: ${imageUrl}`);
          
          setLoadingProgress(Math.round((pageNum / pdf.numPages) * 100));
          
          page.cleanup();
          
          if (pageNum < pdf.numPages) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
        } catch (pageError) {
          console.error(`❌ Erro na página ${pageNum}:`, pageError);
          
          const errorCanvas = document.createElement('canvas');
          errorCanvas.width = 800;
          errorCanvas.height = 1100;
          const ctx = errorCanvas.getContext('2d')!;
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
          
          ctx.fillStyle = '#dc2626';
          ctx.font = 'bold 32px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Erro na Página ${pageNum}`, errorCanvas.width/2, 200);
          
          ctx.font = '24px Arial, sans-serif';
          ctx.fillStyle = '#666666';
          ctx.fillText('Falha ao processar esta página', errorCanvas.width/2, 250);
          
          ctx.font = '18px Arial, sans-serif';
          ctx.fillStyle = '#999999';
          ctx.fillText('O resto do documento será exibido normalmente', errorCanvas.width/2, 300);
          
          ctx.fillStyle = '#dc2626';
          ctx.font = '120px Arial, sans-serif';
          ctx.fillText('⚠️', errorCanvas.width/2, 450);
          
          const errorUrl = await savePageAsImage(errorCanvas, pageNum);
          imageUrls.push(errorUrl);
        }
      }

      console.log(`🎉 CONVERSÃO CONCLUÍDA: ${imageUrls.length}/${pdf.numPages} páginas processadas!`);
      
      if (imageUrls.length > 0) {
        setSavedPageUrls(imageUrls);
        setLoading(false);
      } else {
        throw new Error('Nenhuma página foi convertida com sucesso');
      }

      pdf.destroy();
      
    } catch (error) {
      console.error('❌ ERRO CRÍTICO NA CONVERSÃO:', error);
      setLoading(false);
      
      let errorMessage = "Erro ao processar o documento";
      let suggestion = "Tente as seguintes soluções:";
      let details = error.message;
      
      if (error.message?.includes("Invalid PDF")) {
        errorMessage = "Arquivo PDF inválido ou corrompido";
        suggestion = "• Verifique se o arquivo não está corrompido\n• Tente salvar o PDF novamente\n• Use uma imagem (JPG/PNG) como alternativa";
      } else if (error.message?.includes("fetch") || error.message?.includes("HTTP") || error.message?.includes("NetworkError")) {
        errorMessage = "Erro de conexão ou arquivo não encontrado";
        suggestion = "• Verifique se o servidor backend está rodando\n• Confirme se o arquivo foi enviado corretamente\n• Tente fazer upload novamente";
      } else if (error.message?.includes("Timeout")) {
        errorMessage = "Tempo limite excedido na conversão";
        suggestion = "• O PDF pode ser muito complexo\n• Tente um PDF mais simples\n• Use uma imagem como alternativa";
      } else if (error.message?.includes("ArrayBuffer")) {
        errorMessage = "Erro ao ler o arquivo";
        suggestion = "• O arquivo pode estar corrompido\n• Verifique se é um PDF válido\n• Tente outro arquivo";
      }
      
      setDebugInfo({ 
        error: errorMessage,
        suggestion: suggestion,
        details: details,
        timestamp: new Date().toLocaleTimeString(),
        troubleshooting: [
          "1. Verifique se o servidor backend está funcionando",
          "2. Confirme se o arquivo foi enviado corretamente",
          "3. Tente usar uma imagem (JPG/PNG) ao invés de PDF",
          "4. Verifique o console do navegador (F12) para mais detalhes"
        ]
      });
    }
  };

  // Limpar timers
  const clearAllTimers = useCallback(() => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    
    if (scrollerRef.current) {
      scrollerRef.current.stop();
      scrollerRef.current = null;
    }
    
    setIsScrolling(false);
  }, []);

  // Callback quando scroll completa
  const handleScrollComplete = useCallback(() => {
    console.log(`✅ PLASA: Documento visualizado completamente`);
    setIsScrolling(false);
    
    if (!isAutomationPaused) {
      restartTimerRef.current = setTimeout(() => {
        if (!isAutomationPaused) {
          startContinuousScroll();
        }
      }, RESTART_DELAY);
    }
  }, [isAutomationPaused, RESTART_DELAY]);

  // Iniciar scroll contínuo
  const startContinuousScroll = useCallback(() => {
    if (documentType !== "plasa" || !containerRef.current || savedPageUrls.length === 0 || isAutomationPaused) {
      return;
    }

    if (scrollerRef.current && scrollerRef.current.isActive) {
      scrollerRef.current.stop();
      scrollerRef.current = null;
    }

    const container = containerRef.current;
    const maxScroll = container.scrollHeight - container.clientHeight;
    
    if (maxScroll <= 0) {
      setTimeout(() => {
        if (!isAutomationPaused) {
          startContinuousScroll();
        }
      }, 2000);
      return;
    }

    container.scrollTop = 0;
    setIsScrolling(true);

    scrollerRef.current = new ContinuousAutoScroller(
      container,
      SCROLL_SPEED,
      handleScrollComplete
    );

    setTimeout(() => {
      if (scrollerRef.current && !isAutomationPaused) {
        scrollerRef.current.start();
      }
    }, 1000);
  }, [documentType, savedPageUrls.length, isAutomationPaused, handleScrollComplete, SCROLL_SPEED]);

  // Controles
  const toggleAutomation = () => {
    setIsAutomationPaused(!isAutomationPaused);
    if (!isAutomationPaused) {
      clearAllTimers();
    } else {
      setTimeout(startContinuousScroll, 500);
    }
  };

  const restartScroll = () => {
    clearAllTimers();
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    setTimeout(startContinuousScroll, 1000);
  };

  // CORREÇÃO: INICIALIZAR PLASA com melhor verificação
  useEffect(() => {
    if (documentType === "plasa") {
      console.log("🔄 PLASA Effect triggered:", {
        isScrolling,
        activePlasaDoc: activePlasaDoc?.id,
        url: activePlasaDoc?.url
      });

      if (isScrolling) return;
      
      if (!activePlasaDoc || !activePlasaDoc.url) {
        console.log("❌ PLASA: Nenhum documento PLASA ativo encontrado");
        setLoading(false);
        setSavedPageUrls([]);
        setDebugInfo({
          error: "Nenhum documento PLASA ativo",
          suggestion: "Adicione um PLASA no painel administrativo."
        });
        return;
      }
      
      setSavedPageUrls([]);
      setIsAutomationPaused(false);
      clearAllTimers();
      setDebugInfo({});

      const docUrl = getBackendUrl(activePlasaDoc.url);
      console.log("🎯 PLASA: Processando documento:", docUrl);
      
      if (isImageFile(docUrl) || (docUrl.startsWith('blob:') && activePlasaDoc.title.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {
        console.log("🖼️ PLASA: Documento é uma imagem, usando diretamente");
        setSavedPageUrls([docUrl]);
        setTotalPages(1);
        setLoading(false);
      } else {
        console.log("📄 PLASA: Documento é um PDF, convertendo para imagens");
        convertPDFToImages(docUrl);
      }
    }

    return () => {
      if (documentType === "plasa") {
        clearAllTimers();
      }
    };
  }, [documentType, activePlasaDoc?.id, activePlasaDoc?.url]);

  // CORREÇÃO: Inicializar ESCALA com monitoramento do índice de alternância
  useEffect(() => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      
      console.log("🔄 ESCALA Effect triggered:", {
        currentEscalaIndex,
        totalActiveEscalas: escalaDocuments.filter(d => d.active).length,
        currentEscala: currentEscala?.title,
        category: currentEscala?.category,
        url: currentEscala?.url,
        id: currentEscala?.id 
      });
      
      setEscalaImageUrl(null);
      setLoading(false);
      setTotalPages(1);
      
      if (currentEscala?.url) {
        const docUrl = getBackendUrl(currentEscala.url);
        console.log("🖼️ ESCALA: Processando URL:", docUrl);
        
        const isPDF = docUrl.toLowerCase().includes('.pdf') || currentEscala.title.toLowerCase().includes('.pdf');
        
        if (isPDF) {
          console.log("📄 ESCALA: É um PDF, convertendo para imagem...");
          convertEscalaPDFToImage(docUrl);
        } else {
          console.log("🖼️ ESCALA: É uma imagem, usando diretamente");
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [documentType, currentEscalaIndex, escalaDocuments]);

// ✅ FUNÇÃO: Verificar se URL é imagem (só adicione se não existir)
const checkIfImageFile = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return contentType?.startsWith('image/') || false;
  } catch {
    return false;
  }
};
  // NOVA FUNÇÃO: Converter PDF da escala para imagem
  const convertEscalaPDFToImage = async (pdfUrl: string) => {
    try {
      // ✅ NOVO: Obter documentId para o cache
      const currentEscala = getCurrentEscalaDoc();
      if (!currentEscala) {
        console.log("❌ ESCALA: Nenhuma escala atual encontrada");
        setLoading(false);
        return;
      }
      
      const documentId = currentEscala.id;
      
      console.log(`🎯 ESCALA: Convertendo PDF: ${pdfUrl} (ID: ${documentId})`);
      setLoading(true);
      setLoadingProgress(0);
  
      // ✅ NOVO: VERIFICAR CACHE PRIMEIRO
      console.log(`🔍 Verificando cache para escala: ${documentId}`);
      
      try {
        const cacheResponse = await fetch(getBackendUrl(`/api/check-escala-image/${documentId}`));
        const cacheResult = await cacheResponse.json();
        
        if (cacheResult.success && cacheResult.exists) {
          console.log(`💾 ESCALA: Usando imagem já convertida do cache`);
          const cachedUrl = getBackendUrl(cacheResult.url);
          setEscalaImageUrl(cachedUrl);
          setLoading(false);
          return; // ✅ SAIR AQUI - USA CACHE
        }
      } catch (cacheError) {
        console.log(`⚠️ Erro ao verificar cache, continuando com conversão...`, cacheError);
      }
      
      console.log(`🆕 ESCALA: Cache não encontrado, convertendo...`);
  
      // Verificar se não é imagem primeiro
      if (await checkIfImageFile(pdfUrl)) {
        console.log("🖼️ ESCALA: URL é uma imagem, não um PDF");
        setLoading(false);
        return;
      }
  
      const pdfjsLib = await loadPDFJS();
      const pdfData = await getPDFData(pdfUrl);
      
      const uint8Array = new Uint8Array(pdfData);
      const header = new TextDecoder().decode(uint8Array.slice(0, 8));
      
      if (!header.startsWith('%PDF')) {
        console.log("⚠️ ESCALA: Não é PDF válido, usando como imagem");
        setEscalaImageUrl(pdfUrl);
        setLoading(false);
        console.log("✅ Escala carregada com sucesso:", pdfUrl);
        return;
      }
      
      console.log("✅ ESCALA: PDF válido, convertendo...");
      
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        verbosity: 0,
        disableAutoFetch: true,
        disableStream: true,
        disableRange: true,
        stopAtErrors: false,
        maxImageSize: 1024 * 1024 * 10,
        isEvalSupported: false,
        fontExtraProperties: false,
        useSystemFonts: false,
        standardFontDataUrl: null
      });
      
      const pdf = await loadingTask.promise;
      console.log(`📄 ESCALA: PDF carregado: ${pdf.numPages} páginas`);
      
      const page = await pdf.getPage(1);
      
      const originalViewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(1.5, 1024 / Math.max(originalViewport.width, originalViewport.height));
      const viewport = page.getViewport({ scale: scale });
  
      console.log(`📐 ESCALA: Página 1 - Escala: ${scale}, Final: ${viewport.width}x${viewport.height}`);
  
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { 
        alpha: false,
        willReadFrequently: false
      })!;
      
      canvas.height = Math.floor(viewport.height);
      canvas.width = Math.floor(viewport.width);
      
      context.fillStyle = '#FFFFFF';
      context.fillRect(0, 0, canvas.width, canvas.height);
  
      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        background: '#FFFFFF',
        intent: 'display'
      };
  
      console.log(`🎨 ESCALA: Renderizando...`);
      
      const renderPromise = page.render(renderContext).promise;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na renderização')), 60000)
      );
      
      await Promise.race([renderPromise, timeoutPromise]);
      
      console.log(`✅ ESCALA: Renderizada com sucesso`);
      
      // ✅ NOVO: SALVAR NO CACHE APÓS CONVERSÃO
      try {
        console.log(`💾 Salvando escala ${documentId} no cache...`);
        
        // CORREÇÃO: Tipagem correta para o Blob
        const imageBlob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/jpeg', 0.85);
        });
        
        if (!imageBlob) {
          throw new Error('Falha ao converter canvas para blob');
        }
        
        const formData = new FormData();
        formData.append('file', imageBlob, `escala-${documentId}.jpg`);
        formData.append('documentId', documentId);
        
        const saveResponse = await fetch(getBackendUrl('/api/upload-escala-image'), {
          method: 'POST',
          body: formData
        });
        
        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          console.log(`💾 ESCALA: Imagem salva no cache: ${saveResult.url}`);
          
          // ✅ Usar URL do servidor ao invés de dataURL
          const cachedUrl = getBackendUrl(saveResult.url);
          setEscalaImageUrl(cachedUrl);
        } else {
          throw new Error('Falha ao salvar no servidor');
        }
      } catch (saveError) {
        console.log(`⚠️ ESCALA: Falha ao salvar cache, usando dataURL:`, saveError);
        // ✅ Fallback: usar dataURL se não conseguir salvar no servidor
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setEscalaImageUrl(imageDataUrl);
      }
      
      page.cleanup();
      pdf.destroy();
      
      setLoading(false);
      console.log(`🎉 ESCALA: Conversão concluída!`);
      
    } catch (error) {
      console.error('❌ ESCALA: Erro na conversão:', error);
      setLoading(false);
    }
  };

  // Iniciar scroll quando páginas estiverem prontas
  useEffect(() => {
    if (!loading && savedPageUrls.length > 0 && !isAutomationPaused && !isScrolling) {
      const timer = setTimeout(() => {
        if (!isAutomationPaused && savedPageUrls.length > 0 && !isScrolling) {
          startContinuousScroll();
        }
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [loading, savedPageUrls.length, isAutomationPaused, isScrolling, startContinuousScroll]);

  // CORREÇÃO: Renderizar conteúdo com melhor tratamento de erros
  const renderContent = () => {
    if (documentType === "plasa" && savedPageUrls.length > 0) {
      return (
        <div className="w-full">
          {savedPageUrls.map((pageUrl, index) => (
            <div key={index} className="w-full mb-4">
              <img
                src={pageUrl}
                alt={`PLASA - Página ${index + 1}`}
                className="w-full h-auto block shadow-sm"
                style={{ maxWidth: '100%' }}
                onError={(e) => {
                  console.error(`❌ Erro ao carregar página ${index + 1}:`, pageUrl);
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y4ZjhmOCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm8gYW8gY2FycmVnYXIgcMOhZ2luYSAke2luZGV4ICsgMX08L3RleHQ+PC9zdmc+';
                }}
                onLoad={() => {
                  console.log(`✅ Página ${index + 1} carregada com sucesso`);
                }}
              />
              {index < savedPageUrls.length - 1 && (
                <div className="w-full h-4 bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center my-2">
                  <div className="text-xs text-blue-600 font-medium">
                    ••• Página {index + 2} •••
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="w-full h-20 bg-gradient-to-r from-navy/10 to-navy/20 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="text-navy font-bold text-lg">📄 FIM DO PLASA</div>
              <div className="text-navy/70 text-sm">Reiniciando em {autoRestartDelay}s...</div>
            </div>
          </div>
        </div>
      );
    } else if (documentType === "escala") {
      const docUrl = getDocumentUrl();
      const currentEscala = getCurrentEscalaDoc();
      
      console.log("🖼️ ESCALA: Renderizando", {
        docUrl,
        escalaImageUrl: escalaImageUrl,
        loading,
        currentEscala: currentEscala?.title
      });
      
      // ✅ DEBUG: Verificar valor real
console.log('🎯 ESCALA renderContent DEBUG:', {
  escalaImageUrl,
  typeof: typeof escalaImageUrl,
  length: escalaImageUrl?.length,
  isValid: !!escalaImageUrl && escalaImageUrl !== 'convertida' && escalaImageUrl !== 'nenhuma'
});

return (
  <div className="w-full h-full flex items-center justify-center p-4">
    {escalaImageUrl && escalaImageUrl !== 'convertida' && escalaImageUrl !== 'nenhuma' ? (
            <img
              src={escalaImageUrl}
              
              className="max-w-full max-h-full object-contain shadow-lg"
              onLoad={() => {
                console.log(`✅ Escala convertida carregada com sucesso`);
              }}
            />
          ) : docUrl ? (
            <img
              src={docUrl}
              alt="Escala de Serviço"
              className="max-w-full max-h-full object-contain shadow-lg"
              onError={(e) => {
                console.error("❌ Erro ao carregar escala:", docUrl);
                (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjhmOCIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm8gYW8gY2FycmVnYXIgZXNjYWxhPC90ZXh0Pjwvc3ZnPg==';
              }}
              onLoad={() => {
                console.log(`✅ Escala carregada com sucesso: ${docUrl}`);
              }}
            />
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <div>Nenhuma escala ativa</div>
              <div className="text-sm mt-2">Adicione uma escala no painel administrativo</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center p-6 max-w-lg">
          {debugInfo.error ? (
            <>
              <div className="text-6xl mb-4">⚠️</div>
              <div className="text-red-600 font-bold text-lg mb-3">{debugInfo.error}</div>
              <div className="text-sm text-gray-600 mb-4 whitespace-pre-line">{debugInfo.suggestion}</div>
              {debugInfo.details && (
                <details className="text-xs text-gray-400 mb-4">
                  <summary className="cursor-pointer hover:text-gray-600">Detalhes técnicos</summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded font-mono text-left">
                    {debugInfo.details}
                  </div>
                </details>
              )}
              {debugInfo.troubleshooting && (
                <details className="text-xs text-blue-600 mb-4">
                  <summary className="cursor-pointer hover:text-blue-800">Guia de solução</summary>
                  <div className="mt-2 text-left">
                    {debugInfo.troubleshooting.map((step, index) => (
                      <div key={index} className="mb-1">{step}</div>
                    ))}
                  </div>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => {
                    setDebugInfo({});
                    if (activePlasaDoc && activePlasaDoc.url) {
                      const fullUrl = getBackendUrl(activePlasaDoc.url);
                      if (isImageFile(fullUrl)) {
                        setSavedPageUrls([fullUrl]);
                        setLoading(false);
                      } else {
                        convertPDFToImages(fullUrl);
                      }
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  🔄 Tentar Novamente
                </button>
                <button 
                  onClick={() => {
                    setDebugInfo({});
                    setSavedPageUrls([]);
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  ❌ Cancelar
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">📄</div>
              <div className="text-gray-600 text-lg">
                {documentType === "plasa" && !activePlasaDoc 
                  ? "Nenhum documento PLASA ativo" 
                  : loading
                  ? "Processando documento..."
                  : "Preparando visualização..."}
              </div>
              {documentType === "plasa" && !activePlasaDoc && (
                <div className="mt-4 text-sm text-gray-500">
                  Vá para o painel administrativo e faça upload de um documento PLASA
                </div>
              )}
              {activePlasaDoc && (
                <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded">
                  <div className="font-medium">Documento ativo:</div>
                  <div className="truncate">{activePlasaDoc.title}</div>
                  <div className="truncate font-mono">{activePlasaDoc.url}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // CORREÇÃO: Título dinâmico baseado na escala atual
  const getCurrentTitle = () => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      const activeEscalas = escalaDocuments.filter(doc => doc.active);
      
      if (currentEscala) {
        const categorySubtitle = currentEscala.category
          ? `(${currentEscala.category === "oficial" ? "Oficiais" : "Praças"})`
          : "";
        
        if (activeEscalas.length > 1) {
          return `${title} ${categorySubtitle} - ${currentEscalaIndex + 1}/${activeEscalas.length}`;
        } else {
          return `${title} ${categorySubtitle}`;
        }
      }
    }
    
    return title;
  };

  const currentTitle = getCurrentTitle();
  const currentEscala = getCurrentEscalaDoc();

  return (
    <Card className="h-full overflow-hidden border-0 shadow-none bg-transparent">
      {/* Header Estilizado com Gradiente */}
      <CardHeader className="relative bg-gradient-to-r from-slate-700 via-blue-800 to-slate-700 text-white py-3 px-4 border-b border-blue-400/30">
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"></div>
        
        <CardTitle className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Ícone do tipo de documento */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              {documentType === "plasa" ? (
                <span className="text-white text-sm font-bold">📋</span>
              ) : (
                <span className="text-white text-sm font-bold">📅</span>
              )}
            </div>
            
            {/* Título principal */}
            <div className="flex flex-col">
              <span className="font-bold text-sm bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                {documentType === "plasa" ? (
                  activePlasaDoc?.title || "PLASA - Plano de Serviço Semanal"
                ) : (
                  currentEscala?.title || "Escala de Serviço Semanal"
                )}
              </span>
              
              {/* Subtítulo com categoria (apenas para escala) */}
              {documentType === "escala" && currentEscala?.category && (
                <span className="text-xs text-blue-200/80 font-medium">
                  {currentEscala.category === "oficial" ? "Oficiais" : "Praças"}
                </span>
              )}
            </div>
          </div>
          
          {/* Indicadores à direita */}
          <div className="flex items-center space-x-3">
            {/* Status de múltiplas escalas */}
            {documentType === "escala" && escalaDocuments.filter(d => d.active).length > 1 && (
              <div className="bg-blue-600/50 backdrop-blur-sm rounded-full px-3 py-1 border border-blue-400/30">
                <span className="text-xs font-medium text-blue-100">
                  {currentEscalaIndex + 1} de {escalaDocuments.filter(d => d.active).length}
                </span>
              </div>
            )}
            
            {/* Indicador de status do PLASA */}
            {documentType === "plasa" && savedPageUrls.length > 0 && (
              <div className="bg-green-600/50 backdrop-blur-sm rounded-full px-3 py-1 border border-green-400/30">
                <span className="text-xs font-medium text-green-100">
                  {savedPageUrls.length} páginas
                </span>
              </div>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-2.5rem)] bg-white">
  {loading ? (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="w-16 h-16 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-navy text-sm font-medium">
        {documentType === "plasa" ? "Processando documento..." : "Carregando..."}
      </p>
    </div>
  ) : (
    <div
      className="relative w-full h-full overflow-y-auto"
      ref={containerRef}
      style={{ scrollBehavior: "auto" }}
    >
      {renderContent()}
    </div>
  )}
</CardContent>
  </Card>
);
// ❌ REMOVER/CONDICIONAR estes logs:
const log = (message: string, ...args: any[]) => {
  if (IS_DEV_MODE) {
    console.log(message, ...args);
  
}
};
};
export default PDFViewer;