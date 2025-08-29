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

// Interface para debug info
interface DebugInfo {
  error?: string;
  suggestion?: string;
  details?: string;
  timestamp?: string;
  troubleshooting?: string[];
}

interface PDFViewerProps {
  documentType: "plasa" | "escala" | "bono" | "cardapio";
  title: string;
  scrollSpeed?: "slow" | "normal" | "fast";
  autoRestartDelay?: number;
  onScrollComplete?: () => void;
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
    
    if (this.fixedMaxScroll <= 0) {
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
  autoRestartDelay = 3,
  onScrollComplete
}) => {
  // CORREÇÃO: Usar currentEscalaIndex do contexto
  const { activeEscalaDoc, activePlasaDoc, activeBonoDoc, currentEscalaIndex, escalaDocuments } = useDisplay();
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAutomationPaused, setIsAutomationPaused] = useState(false);
  const [savedPageUrls, setSavedPageUrls] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
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

  // Função para gerar ID do documento
  const generateDocumentId = (url: string): string => {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    const cleanName = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    return cleanName;
  };
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) {
    return path;
  }
  
  // 🚨 CORREÇÃO: Usar IP real do servidor para acesso em rede
  const currentHost = window.location.hostname;
  const currentPort = window.location.port;
  
  // Se estamos acessando via IP da rede, usar o mesmo IP para backend
  if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
    console.log(`🌐 PDFViewer: Detectado acesso via rede: ${currentHost}`);
    
    if (path.startsWith('/')) {
      return `http://${currentHost}:5000${path}`;
    }
    return `http://${currentHost}:5000/${path}`;
  }
  
  // Detectar se estamos no Replit
  const isReplit = currentHost.includes('replit.dev') || currentHost.includes('replit.co');
  
  if (isReplit) {
    const currentOrigin = window.location.origin;
    if (path.startsWith('/')) {
      return `${currentOrigin}${path}`;
    }
    return `${currentOrigin}/${path}`;
  } else {
    // Desenvolvimento local
    if (path.startsWith('/')) {
      return `http://localhost:5000${path}`;
    }
    return `http://localhost:5000/${path}`;
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
    const activeEscalas = escalaDocuments.filter(doc => doc.active && doc.type === "escala");
    
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
  } else if (documentType === "cardapio") {
    // NOVO: Usar apenas cardápios
    const activeCardapios = escalaDocuments.filter(doc => doc.active && doc.type === "cardapio");
    
    if (activeCardapios.length === 0) {
      console.log("🍽️ CARDÁPIO: Nenhum cardápio ativo");
      return null;
    }
    
    const currentCardapio = activeCardapios[currentEscalaIndex % activeCardapios.length];
    
    if (currentCardapio?.url) {
      console.log(`🍽️ CARDÁPIO: Usando cardápio ${currentEscalaIndex + 1}/${activeCardapios.length}:`, {
        title: currentCardapio.title,
        url: currentCardapio.url
      });
      return getBackendUrl(currentCardapio.url);
    }
    
    console.log("🍽️ CARDÁPIO: Cardápio atual sem URL válida");
    return null;
  }
  
  return null; // ← Adicione esta linha no final
};

    
  

  // CORREÇÃO: Obter documento da escala atual
  const getCurrentEscalaDoc = () => {
  const activeEscalas = escalaDocuments.filter(doc => doc.active && doc.type === "escala");
    if (activeEscalas.length === 0) return null;
    return activeEscalas[currentEscalaIndex % activeEscalas.length] || null;
  };
// NOVO: Obter documento do cardápio atual
const getCurrentCardapioDoc = () => {
  const activeCardapios = escalaDocuments.filter(doc => doc.active && doc.type === "cardapio");
  if (activeCardapios.length === 0) return null;
  return activeCardapios[currentEscalaIndex % activeCardapios.length] || null;
};

  // Verificar se arquivo é imagem
  const isImageFile = (url: string) => {
    return (
      url.startsWith('data:image') ||
      url.startsWith('blob:') ||
      /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
    );
  };

  // Carregar PDF.js APENAS quando necessário
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
  const savePageAsImage = async (canvas: HTMLCanvasElement, pageNum: number, documentId: string): Promise<string> => {
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
          formData.append('documentId', documentId);
          
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

  // Função para gerar ID único do documento baseado na URL
  const generateDocumentId = (url: string): string => {
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = filename
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .substring(0, 20);
    return `${timestamp}-${cleanName}-${random}`;
  };

  // Verificar se páginas já existem no servidor
  const checkExistingPages = async (totalPages: number, documentId: string): Promise<string[]> => {
    try {
      const checkUrl = getBackendUrl('/api/check-plasa-pages');
      
      const response = await fetch(checkUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ totalPages, documentId }),
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
      
      const docId = generateDocumentId(pdfUrl);
      const existingPages = await checkExistingPages(pdf.numPages, docId);
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
          
          const imageUrl = await savePageAsImage(canvas, pageNum, docId);
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
          
          const errorUrl = await savePageAsImage(errorCanvas, pageNum, docId);
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
      
    } catch (error: unknown) {
      console.error('❌ ERRO CRÍTICO NA CONVERSÃO:', error);
      setLoading(false);
      
      // FIX: Properly declare variables with explicit types
      let errorMessage: string = "Erro ao processar o documento";
      let suggestion: string = "Tente as seguintes soluções:";
      let details: string = error instanceof Error ? error.message : String(error);
      
      if (error instanceof Error) {
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

    setIsScrolling(false);
    
    // Chamar callback externo se fornecido (para alternância PLASA/BONO)
    if (onScrollComplete && (documentType === "plasa" || documentType === "bono")) {
      onScrollComplete();
      return; // Não reiniciar automaticamente, deixar o contexto controlar
    }
    
    if (!isAutomationPaused) {
      restartTimerRef.current = setTimeout(() => {
        if (!isAutomationPaused) {
          startContinuousScroll();
        }
      }, RESTART_DELAY);
    }
  }, [isAutomationPaused, RESTART_DELAY, documentType, onScrollComplete]);

  // Iniciar scroll contínuo
  const startContinuousScroll = useCallback(() => {
    if ((documentType !== "plasa" && documentType !== "bono") || !containerRef.current || savedPageUrls.length === 0 || isAutomationPaused) {
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

  // CORREÇÃO: INICIALIZAR PLASA/BONO com melhor verificação
  useEffect(() => {
    if (documentType === "plasa" || documentType === "bono") {
      const activeMainDoc = documentType === "plasa" ? activePlasaDoc : activeBonoDoc;
      


      if (isScrolling) return;
      
      if (!activeMainDoc || !activeMainDoc.url) {

        setLoading(false);
        setSavedPageUrls([]);
        setDebugInfo({
          error: `Nenhum documento ${documentType.toUpperCase()} ativo`,
          suggestion: `Adicione um ${documentType.toUpperCase()} no painel administrativo.`
        });
        return;
      }
      
      setSavedPageUrls([]);
      setIsAutomationPaused(false);
      clearAllTimers();
      setDebugInfo({});

      const docUrl = getBackendUrl(activeMainDoc.url);

      
      if (isImageFile(docUrl) || (docUrl.startsWith('blob:') && activeMainDoc.title.match(/\.(jpg|jpeg|png|gif|webp)$/i))) {

        setSavedPageUrls([docUrl]);
        setTotalPages(1);
        setLoading(false);
      } else {

        convertPDFToImages(docUrl);
      }
    }

    return () => {
      if (documentType === "plasa" || documentType === "bono") {
        clearAllTimers();
      }
    };
  }, [documentType, activePlasaDoc?.id, activePlasaDoc?.url, activeBonoDoc?.id, activeBonoDoc?.url]);

  // CORREÇÃO: Inicializar ESCALA com monitoramento do índice de alternância
  useEffect(() => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      
      console.log("🔄 ESCALA Effect triggered:", {
        currentEscalaIndex,
        totalActiveEscalas: escalaDocuments.filter(d => d.active && d.type === "escala").length,
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

  // NOVO: Inicializar CARDÁPIO
useEffect(() => {
  if (documentType === "cardapio") {
    const currentCardapio = getCurrentCardapioDoc();
    
    console.log("🔄 CARDÁPIO Effect triggered:", {
      currentEscalaIndex,
      totalActiveCardapios: escalaDocuments.filter(d => d.active && d.type === "cardapio").length,
      currentCardapio: currentCardapio?.title,
      url: currentCardapio?.url,
      id: currentCardapio?.id 
    });
    
    // Resetar estados
    setEscalaImageUrl(null); // Pode reutilizar ou criar setCardapioImageUrl
    setLoading(false);
    setTotalPages(1);
    
    if (currentCardapio?.url) {
      const docUrl = getBackendUrl(currentCardapio.url);
      console.log("🖼️ CARDÁPIO: Processando URL:", docUrl);
      
      const isPDF = docUrl.toLowerCase().includes('.pdf') || currentCardapio.title.toLowerCase().includes('.pdf');
      
      if (isPDF) {
        console.log("📄 CARDÁPIO: É um PDF, convertendo para imagem...");
        convertEscalaPDFToImage(docUrl); // Pode reutilizar a função ou criar uma nova
      } else {
        console.log("🖼️ CARDÁPIO: É uma imagem, usando diretamente");
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }
}, [documentType, currentEscalaIndex, escalaDocuments]);
  // ✅ FUNÇÃO: Verificar se URL é imagem
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

        setLoading(false);
        return;
      }
      
      const documentId = currentEscala.id;
      

      setLoading(true);
      setLoadingProgress(0);
  
      // ✅ NOVO: VERIFICAR CACHE PRIMEIRO

      
      try {
        const cacheResponse = await fetch(getBackendUrl(`/api/check-escala-cache/${documentId}`));
        const cacheResult = await cacheResponse.json();
        
        if (cacheResult.success && cacheResult.exists) {

          const cachedUrl = getBackendUrl(cacheResult.url);
          setEscalaImageUrl(cachedUrl);
          setLoading(false);
          return; // ✅ SAIR AQUI - USA CACHE
        }
      } catch (cacheError) {

      }
      

  
      // Verificar se não é imagem primeiro
      if (await checkIfImageFile(pdfUrl)) {

        setLoading(false);
        return;
      }
  
      const pdfjsLib = await loadPDFJS();
      const pdfData = await getPDFData(pdfUrl);
      
      const uint8Array = new Uint8Array(pdfData);
      const header = new TextDecoder().decode(uint8Array.slice(0, 8));
      
      if (!header.startsWith('%PDF')) {

        setEscalaImageUrl(pdfUrl);
        setLoading(false);

        return;
      }
      

      
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

      
      const page = await pdf.getPage(1);
      
      const originalViewport = page.getViewport({ scale: 1.0 });
      const scale = Math.min(1.5, 1024 / Math.max(originalViewport.width, originalViewport.height));
      const viewport = page.getViewport({ scale: scale });
  

  
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
  

      
      const renderPromise = page.render(renderContext).promise;
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout na renderização')), 60000)
      );
      
      await Promise.race([renderPromise, timeoutPromise]);
      

      
      // ✅ NOVO: SALVAR NO CACHE APÓS CONVERSÃO
      try {

        
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
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        
        const saveResponse = await fetch(getBackendUrl('/api/save-escala-cache'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            escalId: documentId,
            imageData: imageDataUrl
          })
        });
        
        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();

          
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
      
      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          {escalaImageUrl && escalaImageUrl !== 'convertida' && escalaImageUrl !== 'nenhuma' ? (
            <img
              src={escalaImageUrl}
              alt="Escala de Serviço Convertida"
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
    } else if (documentType === "cardapio") {
  const docUrl = getDocumentUrl();
  const currentCardapio = getCurrentCardapioDoc();
  
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      {escalaImageUrl && escalaImageUrl !== 'convertida' && escalaImageUrl !== 'nenhuma' ? (
        <img
          src={escalaImageUrl}
          alt="Cardápio Semanal Convertido"
          className="max-w-full max-h-full object-contain shadow-lg"
          onLoad={() => {
            console.log(`✅ Cardápio convertido carregado com sucesso`);
          }}
        />
      ) : docUrl ? (
        <img
          src={docUrl}
          alt="Cardápio Semanal"
          className="max-w-full max-h-full object-contain shadow-lg"
          onError={(e) => {
            console.error("❌ Erro ao carregar cardápio:", docUrl);
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjhmOCIvPjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkVycm8gYW8gY2FycmVnYXIgY2FyZMOhcGlvPC90ZXh0Pjwvc3ZnPg==';
          }}
          onLoad={() => {
            console.log(`✅ Cardápio carregado com sucesso: ${docUrl}`);
          }}
        />
      ) : (
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">🍽️</div>
          <div>Nenhum cardápio ativo</div>
          <div className="text-sm mt-2">Adicione um cardápio no painel administrativo</div>
        </div>
      )}
    </div>
  );}
    

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
                    {debugInfo.troubleshooting.map((step: string, index: number) => (
                      <div key={index} className="mb-1">{step}</div>
                    ))}
                  </div>
                </details>
              )}
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => {
                    setDebugInfo({});
                    const activeMainDoc = documentType === "plasa" ? activePlasaDoc : activeBonoDoc;
                    if (activeMainDoc && activeMainDoc.url) {
                      const fullUrl = getBackendUrl(activeMainDoc.url);
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
                {((documentType === "plasa" && !activePlasaDoc) || (documentType === "bono" && !activeBonoDoc))
                  ? `Nenhum documento ${documentType.toUpperCase()} ativo` 
                  : loading
                  ? "Processando documento..."
                  : "Preparando visualização..."}
              </div>
              {((documentType === "plasa" && !activePlasaDoc) || (documentType === "bono" && !activeBonoDoc)) && (
                <div className="mt-4 text-sm text-gray-500">
                  Vá para o painel administrativo e faça upload de um documento {documentType.toUpperCase()}
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

  // CORREÇÃO: Título dinâmico baseado na escala atual com detecção de cardápio
  const getCurrentTitle = () => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
          const activeEscalas = escalaDocuments.filter(doc => doc.active && doc.type === "escala"); // ← ADICIONAR && doc.type === "escala"
      
      if (currentEscala) {
        // Detectar se é cardápio baseado no nome do arquivo/título
        const isCardapio = currentEscala.title.toLowerCase().includes('cardápio') || 
                          currentEscala.title.toLowerCase().includes('cardapio') ||
                          currentEscala.url.toLowerCase().includes('cardápio') ||
                          currentEscala.url.toLowerCase().includes('cardapio');
        
        const categorySubtitle = currentEscala.category
          ? `(${currentEscala.category === "oficial" ? "Oficiais" : "Praças"})`
          : "";
        
        // Emoji especial para cardápio
        const emojiPrefix = isCardapio ? "🍽️ " : "";
        
        if (activeEscalas.length > 1) {
          return `${emojiPrefix}${title} ${categorySubtitle} - ${currentEscalaIndex + 1}/${activeEscalas.length}`;
        } else {
          return `${emojiPrefix}${title} ${categorySubtitle}`;
        }
      }
    }
    
    return title;
  };

  const currentEscala = getCurrentEscalaDoc();

  return (
    <Card className="h-full overflow-hidden border-0 shadow-none bg-transparent">
      {/* Header Estilizado com Gradiente */}
<CardHeader className={`relative text-white border-b ${
  documentType === "cardapio" 
    ? "bg-gradient-to-r from-orange-700 via-amber-700 to-orange-700 py-0.5 px-2 border-orange-400/30" 
    : "bg-gradient-to-r from-slate-700 via-blue-800 to-slate-700 py-0.5 px-2 border-blue-400/30"
}`}>
        {/* Efeito de brilho */}
<div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent ${
  documentType === "cardapio" 
    ? "via-orange-400/10" 
    : "via-blue-400/10"
}`}></div>

        <CardTitle className="relative z-10 flex items-center justify-between">
  <div className="flex items-center space-x-3">
<div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center shadow-lg">    
  
      
  {documentType === "plasa" ? (
  <span className="text-white text-lg leading-none">📋</span>
) : documentType === "bono" ? (
  <span className="text-white text-lg leading-none">📋</span>
) : documentType === "escala" ? (
  <span className="text-white text-lg leading-none">📅</span>
) : documentType === "cardapio" ? (
  <span className="text-white text-lg leading-none">🍽️</span>
) : (
  <span className="text-white text-lg leading-none">📄</span>
)}
    </div>
    
    <div className="flex flex-col">
      <span className="font-bold text-sm bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent uppercase tracking-wide">
        {documentType === "plasa" ? (
          activePlasaDoc?.title || "📋 PLASA - PLANO DE SERVIÇO SEMANAL"
        ) : (
          getCurrentTitle() || "📅 ESCALA DE SERVIÇO SEMANAL"
        )}
      </span>
    </div>
  </div>
  
  {/* ✅ CONTADOR DE PÁGINAS ALINHADO */}
  <div className="flex items-center space-x-3">
    {documentType === "plasa" && savedPageUrls.length > 0 && (
<div className="bg-blue-600/50 backdrop-blur-sm rounded-lg px-4 h-7 border border-blue-400/30 flex items-center justify-center">
<div className="flex items-center gap-2">
          <span className="text-blue-100 text-xs font-medium">📄</span>
          <span className="text-white font-bold text-sm">
            {savedPageUrls.length} páginas
          </span>
        </div>
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
};

export default PDFViewer;