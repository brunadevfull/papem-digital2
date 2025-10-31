import React, { useState, useEffect, useRef, useCallback } from "react";
import { useDisplay } from "@/context/DisplayContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveBackendUrl } from "@/utils/backend";

const IS_DEV_MODE = process.env.NODE_ENV === 'development';
const MAX_RENDER_DIMENSION = 8192;
const IMAGE_EXPORT_FORMAT = 'image/png';

// Configurações de timeout e qualidade para renderização
const RENDER_TIMEOUTS = {
  HIGH_QUALITY: 300000,    // 5 minutos para alta qualidade
  MEDIUM_QUALITY: 180000,  // 3 minutos para qualidade média
  LOW_QUALITY: 120000      // 2 minutos para qualidade baixa
};

const QUALITY_SCALES = {
  HIGH: 1.0,      // 100% da escala calculada
  MEDIUM: 0.6,    // 60% da escala calculada
  LOW: 0.35       // 35% da escala calculada
};

const getViewportWidth = () => {
  if (typeof window === "undefined") {
    return 1920;
  }

  const { innerWidth, screen } = window;
  return Math.max(
    innerWidth || 0,
    screen?.width || 0,
    screen?.availWidth || 0,
    1920
  );
};

const getDevicePixelRatio = () => {
  if (typeof window === 'undefined') {
    return 1;
  }

  const ratio = window.devicePixelRatio || 1;
  return Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
};

const ensureImageHasMinimumResolution = (url: string, minDimension: number): Promise<boolean> => {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;
      const largestSide = Math.max(width, height);
      resolve(largestSide >= minDimension);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
};

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
  documentType: "plasa" | "escala" | "cardapio";
  title: string;
  scrollSpeed?: "slow" | "normal" | "fast";
  autoRestartDelay?: number;
  onScrollComplete?: () => void;
}

const normalizeCategoryText = (value?: string | null) => {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

type EscalaClassificationLike = {
  category?: "oficial" | "praca";
  tags?: string[];
  title?: string;
  url?: string;
};

const detectEscalaCategory = (
  doc?: EscalaClassificationLike | null
): "oficial" | "praca" | null => {
  if (!doc) {
    return null;
  }

  if (doc.category === "oficial" || doc.category === "praca") {
    return doc.category;
  }

  const normalizedTags = Array.isArray(doc.tags)
    ? doc.tags
        .map(tag => normalizeCategoryText(tag))
        .filter(Boolean)
    : [];

  if (normalizedTags.some(tag => tag.includes("oficia"))) {
    return "oficial";
  }

  if (normalizedTags.some(tag => tag.includes("praca"))) {
    return "praca";
  }

  const combinedText = `${normalizeCategoryText(doc.title)} ${normalizeCategoryText(doc.url)}`.trim();

  if (combinedText.includes("oficial") || combinedText.includes("oficiais") || combinedText.includes("oficia")) {
    return "oficial";
  }

  if (combinedText.includes("praca") || combinedText.includes("pracas") || combinedText.includes("prac")) {
    return "praca";
  }

  return null;
};

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
  // CORREÇÃO: Usar currentEscalaIndex do contexto + ✏️ Estados de modo editor
  const {
    activeEscalaDoc,
    activePlasaDoc,
    activeCardapioDoc,
    currentEscalaIndex,
    escalaDocuments,
    setIsEscalaEditMode,
    setIsCardapioEditMode
  } = useDisplay();
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isAutomationPaused, setIsAutomationPaused] = useState(false);
  const [savedPageUrls, setSavedPageUrls] = useState<string[]>([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [escalaImageUrl, setEscalaImageUrl] = useState<string | null>(null);
  const [cardapioImageUrl, setCardapioImageUrl] = useState<string | null>(null);
  const [escalaError, setEscalaError] = useState<string | null>(null);

  const scrollerRef = useRef<ContinuousAutoScroller | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollableContentRef = useRef<HTMLDivElement>(null); // ✅ Novo ref para container interno real
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Estados para controle de zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const [zoomInputValue, setZoomInputValue] = useState("100");

  // 🔒 REF para armazenar o ID do documento anterior
  const previousDocIdRef = useRef<string | null>(null);

  // CORREÇÃO: Obter documento da escala atual
  const getCurrentEscalaDoc = useCallback(() => {
    const activeEscalas = escalaDocuments.filter(doc => doc.active && doc.type === "escala");
    if (activeEscalas.length === 0) return null;
    return activeEscalas[currentEscalaIndex % activeEscalas.length] || null;
  }, [escalaDocuments, currentEscalaIndex]);

  // CORREÇÃO: Obter documento do cardápio atual do contexto
  const getCurrentCardapioDoc = useCallback(() => {
    return activeCardapioDoc;
  }, [activeCardapioDoc]);

  // Função para obter ID único do documento atual (somente escala e cardápio)
  const getCurrentDocumentId = useCallback((): string | null => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      return currentEscala?.id ? `escala-${currentEscala.id}` : null;
    } else if (documentType === "cardapio") {
      const currentCardapio = getCurrentCardapioDoc();
      return currentCardapio?.id ? `cardapio-${currentCardapio.id}` : null;
    }
    return null;
  }, [documentType, getCurrentEscalaDoc, getCurrentCardapioDoc]);

  const sanitizeStorageKeySegment = (value: string): string =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .trim();

  const getPersistentStorageKey = useCallback((): string | null => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      if (!currentEscala) {
        return null;
      }

      const detectedCategory = detectEscalaCategory(currentEscala);
      if (detectedCategory) {
        return `escala-${detectedCategory}`;
      }

      if (currentEscala.title) {
        const titleKey = sanitizeStorageKeySegment(currentEscala.title);
        if (titleKey) {
          return `escala-${titleKey}`;
        }
      }

      return `escala-${currentEscala.id}`;
    }

    if (documentType === "cardapio") {
      const currentCardapio = getCurrentCardapioDoc();
      if (!currentCardapio) {
        return null;
      }

      if (currentCardapio.unit) {
        const unitKey = sanitizeStorageKeySegment(currentCardapio.unit);
        if (unitKey) {
          return `cardapio-${unitKey}`;
        }
      }

      if (currentCardapio.title) {
        const titleKey = sanitizeStorageKeySegment(currentCardapio.title);
        if (titleKey) {
          return `cardapio-${titleKey}`;
        }
      }

      return `cardapio-${currentCardapio.id}`;
    }

    return null;
  }, [documentType, getCurrentEscalaDoc, getCurrentCardapioDoc]);

  // Função para salvar zoom no localStorage (apenas escala e cardápio)
  const saveZoomToLocalStorage = useCallback((docId: string, zoom: number) => {
    try {
      localStorage.setItem(`document-zoom-${docId}`, zoom.toString());
      console.log(`💾 Zoom salvo para documento ${docId}: ${zoom}`);
    } catch (error) {
      console.warn("⚠️ Erro ao salvar zoom no localStorage:", error);
    }
  }, []);

  // Função para carregar zoom do localStorage (apenas escala e cardápio)
  const loadZoomFromLocalStorage = useCallback((docId: string): number => {
    try {
      const saved = localStorage.getItem(`document-zoom-${docId}`);
      if (saved) {
        const zoom = parseFloat(saved);
        if (!isNaN(zoom) && zoom >= 0.5 && zoom <= 3) {
          console.log(`📖 Zoom carregado para documento ${docId}: ${zoom}`);
          return zoom;
        }
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar zoom do localStorage:", error);
    }
    return 1; // Valor padrão
  }, []);

  // Função para salvar posição do scroll no localStorage (apenas escala e cardápio)
  const saveScrollToLocalStorage = useCallback((docId: string, scrollTop: number, scrollLeft: number) => {
    try {
      localStorage.setItem(`document-scroll-${docId}`, JSON.stringify({ scrollTop, scrollLeft }));
      console.log(`💾 Scroll salvo para documento ${docId}: top=${scrollTop}, left=${scrollLeft}`);
    } catch (error) {
      console.warn("⚠️ Erro ao salvar scroll no localStorage:", error);
    }
  }, []);

  // Função para carregar posição do scroll do localStorage (apenas escala e cardápio)
  const loadScrollFromLocalStorage = useCallback((docId: string): { scrollTop: number; scrollLeft: number } => {
    try {
      const saved = localStorage.getItem(`document-scroll-${docId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.scrollTop === 'number' && typeof parsed.scrollLeft === 'number') {
          console.log(`📖 Scroll carregado para documento ${docId}: top=${parsed.scrollTop}, left=${parsed.scrollLeft}`);
          return { scrollTop: parsed.scrollTop, scrollLeft: parsed.scrollLeft };
        }
      }
    } catch (error) {
      console.warn("⚠️ Erro ao carregar scroll do localStorage:", error);
    }
    return { scrollTop: 0, scrollLeft: 0 }; // Valor padrão
  }, []);

  // Funções de controle de zoom
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 3); // Máximo 3x
    setZoomLevel(newZoom);
    setZoomInputValue(Math.round(newZoom * 100).toString());
    // ⚠️ Não salvar automaticamente - só salva ao sair do modo editor
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.5); // Mínimo 0.5x
    setZoomLevel(newZoom);
    setZoomInputValue(Math.round(newZoom * 100).toString());
    // ⚠️ Não salvar automaticamente - só salva ao sair do modo editor
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setZoomInputValue("100");
    // ⚠️ Não salvar automaticamente - só salva ao sair do modo editor
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Permitir apenas números
    if (value === '' || /^\d+$/.test(value)) {
      setZoomInputValue(value);
    }
  };

  const handleZoomInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyZoomFromInput();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      // Cancelar e restaurar valor atual
      setZoomInputValue(Math.round(zoomLevel * 100).toString());
      (e.target as HTMLInputElement).blur();
    }
  };

  const applyZoomFromInput = () => {
    let numericValue = parseInt(zoomInputValue);

    // Validação: se vazio ou inválido, restaurar valor atual
    if (isNaN(numericValue) || zoomInputValue === '') {
      setZoomInputValue(Math.round(zoomLevel * 100).toString());
      return;
    }

    // Limitar entre 50% e 300%
    numericValue = Math.max(50, Math.min(300, numericValue));

    const newZoom = numericValue / 100;
    setZoomLevel(newZoom);
    setZoomInputValue(numericValue.toString());
    // ⚠️ Não salvar automaticamente - só salva ao sair do modo editor
  };

  const handleZoomInputBlur = () => {
    applyZoomFromInput();
  };

  // Estado para feedback visual ao salvar posição
  const [scrollSavedFeedback, setScrollSavedFeedback] = useState(false);

  // ✏️ Estado para controlar modo editor local
  const [isEditMode, setIsEditMode] = useState(false);

  // ✏️ Função para alternar modo editor (pausa/retoma troca automática + salva)
  const handleToggleEditMode = useCallback(() => {
    const docId = getCurrentDocumentId();
    const storageKey = getPersistentStorageKey();
    console.log(
      `\n🔧 [MODO EDITOR] Estado atual: ${isEditMode ? 'ATIVO' : 'INATIVO'}, Documento: ${docId}, StorageKey: ${storageKey}`
    );

    if (!isEditMode) {
      // ENTRANDO em modo editor
      if (documentType === "escala") {
        setIsEscalaEditMode(true); // Pausar alternância de escalas
        console.log("✏️ [MODO EDITOR] ESCALA: Pausando alternância automática");
      } else if (documentType === "cardapio") {
        setIsCardapioEditMode(true); // Pausar alternância de cardápios
        console.log("✏️ [MODO EDITOR] CARDÁPIO: Pausando alternância automática");
      }
      setIsEditMode(true);
      console.log("✅ [MODO EDITOR] ATIVADO - Scroll não será salvo automaticamente");
    } else {
      // SAINDO do modo editor - SALVAR TUDO
      const scrollContainer = scrollableContentRef.current || containerRef.current;

      if (storageKey && scrollContainer) {
        const scrollTop = scrollContainer.scrollTop;
        const scrollLeft = scrollContainer.scrollLeft;

        console.log(`💾 [MODO EDITOR] SALVANDO posição final:`);
        console.log(`  - Documento: ${docId}`);
        console.log(`  - Storage Key: ${storageKey}`);
        console.log(`  - Scroll Top: ${scrollTop}`);
        console.log(`  - Scroll Left: ${scrollLeft}`);

        // Salvar scroll
        saveScrollToLocalStorage(storageKey, scrollTop, scrollLeft);

        // Salvar zoom também
        saveZoomToLocalStorage(storageKey, zoomLevel);
        console.log(`  - Zoom: ${zoomLevel} (${Math.round(zoomLevel * 100)}%)`);

        // Verificar se salvou corretamente
        const savedScroll = localStorage.getItem(`document-scroll-${storageKey}`);
        const savedZoom = localStorage.getItem(`document-zoom-${storageKey}`);
        console.log(`✅ [MODO EDITOR] Verificação do salvamento:`);
        console.log(`  - Scroll salvo: ${savedScroll}`);
        console.log(`  - Zoom salvo: ${savedZoom}`);
      } else {
        console.warn(`⚠️ [MODO EDITOR] Não foi possível salvar:`);
        console.warn(`  - docId: ${docId}`);
        console.warn(`  - storageKey: ${storageKey}`);
        console.warn(`  - scrollContainer: ${!!scrollContainer}`);
      }

      // Retomar alternância automática
      if (documentType === "escala") {
        setIsEscalaEditMode(false);
        console.log("▶️ [MODO EDITOR] ESCALA: Retomando alternância automática");
      } else if (documentType === "cardapio") {
        setIsCardapioEditMode(false);
        console.log("▶️ [MODO EDITOR] CARDÁPIO: Retomando alternância automática");
      }

      setIsEditMode(false);

      // Mostrar feedback visual de salvamento
      setScrollSavedFeedback(true);
      setTimeout(() => setScrollSavedFeedback(false), 2000);

      console.log("✅ [MODO EDITOR] DESATIVADO - Posição salva!");
    }
  }, [
    isEditMode,
    documentType,
    getCurrentDocumentId,
    getPersistentStorageKey,
    saveScrollToLocalStorage,
    saveZoomToLocalStorage,
    zoomLevel,
    setIsEscalaEditMode,
    setIsCardapioEditMode
  ]);

  // Função para salvar manualmente a posição atual do scroll
  const handleSaveScrollPosition = useCallback(() => {
    if (documentType === "plasa") return; // Não salvar scroll para PLASA

    const storageKey = getPersistentStorageKey();
    const scrollContainer = scrollableContentRef.current || containerRef.current;
    if (storageKey && scrollContainer) {
      saveScrollToLocalStorage(storageKey, scrollContainer.scrollTop, scrollContainer.scrollLeft);

      // Mostrar feedback visual
      setScrollSavedFeedback(true);
      setTimeout(() => setScrollSavedFeedback(false), 2000);
    }
  }, [documentType, getPersistentStorageKey, saveScrollToLocalStorage]);

  // 🔄 REMOVIDO: Restauração de zoom agora acontece no onLoad das imagens
  // para garantir que o zoom seja aplicado ANTES do scroll ser restaurado

  // useEffect para salvar o zoom sempre que ele mudar (apenas escala e cardápio)
  // ⚠️ REMOVIDO: Auto-save de zoom foi desabilitado
  // O zoom agora só é salvo quando:
  // 1. Usuário sai do modo editor
  // 2. Documento muda (nos useEffects de troca de documento)

  // Função para restaurar scroll após imagem carregar (APÓS zoom ser aplicado)
  const restoreScrollPosition = useCallback((storageKey: string) => {
    if (documentType === "plasa") return; // Não restaurar scroll para PLASA

    const scrollContainer = scrollableContentRef.current || containerRef.current;
    if (storageKey && scrollContainer) {
      // ⏰ ESPERAR múltiplos frames para garantir que o DOM foi atualizado com o zoom
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const savedScroll = loadScrollFromLocalStorage(storageKey);
          scrollContainer.scrollTop = savedScroll.scrollTop;
          scrollContainer.scrollLeft = savedScroll.scrollLeft;
          console.log(
            `🔄 Scroll restaurado para documento ${storageKey}: top=${savedScroll.scrollTop}, left=${savedScroll.scrollLeft}`
          );
        });
      });
    }
  }, [documentType, loadScrollFromLocalStorage]);

  // 💾 REMOVIDO: Auto-save de scroll foi DESABILITADO
  // O scroll agora só é salvo quando o usuário SAI do modo editor
  // ou clica manualmente em "Salvar Posição"

  // 🔄 REMOVIDO: Restauração de scroll agora acontece no onLoad das imagens
  // após o zoom ser aplicado corretamente

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
  const devicePixelRatio = getDevicePixelRatio();
  const getTargetRenderWidth = useCallback(() => {
    const containerWidth = containerRef.current?.clientWidth ?? 0;
    const fallbackWidth = getViewportWidth();
    const baseWidth = containerWidth > 0 ? containerWidth : fallbackWidth;
    const targetWidth = baseWidth * devicePixelRatio;
    const safeTargetWidth = Number.isFinite(targetWidth) && targetWidth > 0
      ? targetWidth
      : fallbackWidth;

    return Math.min(Math.max(safeTargetWidth, baseWidth), MAX_RENDER_DIMENSION);
  }, [devicePixelRatio]);

  const calculateRenderScale = useCallback((viewportDimensions: { width: number; height: number }) => {
    const { width, height } = viewportDimensions;
    const originalWidth = Math.max(width, 1);
    const originalHeight = Math.max(height, 1);
    const targetRenderWidth = getTargetRenderWidth();

    let desiredScale = targetRenderWidth / originalWidth;
    if (!Number.isFinite(desiredScale) || desiredScale <= 0) {
      desiredScale = 1;
    }

    const maxScale = MAX_RENDER_DIMENSION / Math.max(originalWidth, originalHeight);
    if (Number.isFinite(maxScale) && maxScale > 0) {
      desiredScale = Math.min(desiredScale, maxScale);
    }

    return Math.max(desiredScale, 1);
  }, [getTargetRenderWidth]);

  // Função para obter a URL completa do servidor backend - DETECTAR AMBIENTE
  const getBackendUrl = (path: string): string => resolveBackendUrl(path);

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
    if (!activeCardapioDoc) {
      console.log("🍽️ CARDÁPIO: Nenhum cardápio ativo");
      return null;
    }

    console.log("🍽️ CARDÁPIO: Usando cardápio ativo:", {
      title: activeCardapioDoc.title,
      url: activeCardapioDoc.url
    });
    return getBackendUrl(activeCardapioDoc.url);
  }

  return null;
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

    try {
      const pdfjsModule = await import("pdfjs-dist/build/pdf");
      const { default: pdfWorker } = await import("pdfjs-dist/build/pdf.worker?url");

      pdfjsModule.GlobalWorkerOptions.workerSrc = pdfWorker;
      pdfjsModule.GlobalWorkerOptions.verbosity = 0;

      window.pdfjsLib = pdfjsModule;
      console.log("✅ PDF.js carregado com sucesso");
      return pdfjsModule;
    } catch (error) {
      console.error("❌ Erro ao carregar PDF.js", error);
      throw error;
    }
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
          resolve(canvas.toDataURL(IMAGE_EXPORT_FORMAT));
          return;
        }

        try {
          const formData = new FormData();
          const extension = blob.type === 'image/png' ? 'png' : 'jpg';
          formData.append('file', blob, `plasa-page-${pageNum}.${extension}`);
          formData.append('pageNumber', String(pageNum));
          formData.append('documentId', documentId);

          const uploadUrl = getBackendUrl('/api/upload-plasa-page');

          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            const fallbackFilename = `${documentId}-page-${pageNum}.${extension}`;
            const savedUrl = result.data?.url || result.url || `/plasa-pages/${fallbackFilename}`;
            const fullSavedUrl = getBackendUrl(savedUrl);
            resolve(fullSavedUrl);
          } else {
            throw new Error(`Erro no servidor: ${response.status}`);
          }

        } catch (error) {
          console.warn(`⚠️ Falha ao salvar página ${pageNum} no servidor, usando data URL:`, error);
          resolve(canvas.toDataURL(IMAGE_EXPORT_FORMAT));
        }
      }, IMAGE_EXPORT_FORMAT);
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
        useSystemFonts: true
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
          // Log progress every 10 pages to avoid console spam
          if (pageNum % 10 === 0 || pageNum === pdf.numPages) {
            console.log(`📄 Processando página ${pageNum}/${pdf.numPages}`);
          }

          const page = await pdf.getPage(pageNum);

          const originalViewport = page.getViewport({ scale: 1.0 });
          const appliedScale = calculateRenderScale({
            width: originalViewport.width,
            height: originalViewport.height,
          });
          const viewport = page.getViewport({ scale: appliedScale });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', {
            alpha: false,
            willReadFrequently: false
          })!;

          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';

          const renderWidth = Math.min(MAX_RENDER_DIMENSION, Math.ceil(viewport.width));
          const renderHeight = Math.min(MAX_RENDER_DIMENSION, Math.ceil(viewport.height));

          canvas.height = renderHeight;
          canvas.width = renderWidth;

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
            setTimeout(() => reject(new Error('Timeout na renderização')), RENDER_TIMEOUTS.HIGH_QUALITY)
          );

          await Promise.race([renderPromise, timeoutPromise]);

          const imageUrl = await savePageAsImage(canvas, pageNum, docId);
          imageUrls.push(imageUrl);

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
    if (onScrollComplete && (documentType === "plasa")) {
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
    if ((documentType !== "plasa") || !containerRef.current || savedPageUrls.length === 0 || isAutomationPaused) {
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
    if (documentType === "plasa") {
      const activeMainDoc = activePlasaDoc;
      


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
      if (documentType === "plasa" ) {
        clearAllTimers();
      }
    };
  }, [documentType, activePlasaDoc?.id, activePlasaDoc?.url]);

  // CORREÇÃO: Inicializar ESCALA com monitoramento do índice de alternância
  useEffect(() => {
    if (documentType === "escala") {
      const currentEscala = getCurrentEscalaDoc();
      const currentDocId = currentEscala?.id ? `escala-${currentEscala.id}` : null;

      console.log("🔄 ESCALA Effect triggered:", {
        currentEscalaIndex,
        currentEscala: currentEscala?.title,
        currentDocId,
        previousDocId: previousDocIdRef.current,
        isEditMode,
        loading,
        hasImage: !!escalaImageUrl
      });

      // 🔒 PROTEÇÃO: Não recarregar se estiver em modo editor
      if (isEditMode) {
        console.log("🔒 ESCALA: Modo editor ativo, ignorando recarregamento");
        return;
      }

      // 🔒 PROTEÇÃO: Não reprocessar se já está carregando
      if (loading) {
        console.log("🔒 ESCALA: Já está carregando, ignorando recarregamento");
        return;
      }

      // 🔍 VERIFICAR se realmente mudou de documento
      if (currentDocId === previousDocIdRef.current && escalaImageUrl) {
        console.log("✅ ESCALA: Mesmo documento, não recarregar");
        return;
      }

      // ⚠️ NÃO salvar scroll/zoom automaticamente ao trocar documento
      // O salvamento só deve ocorrer quando o usuário sai do modo editor manualmente

      // Atualizar referência do documento anterior
      previousDocIdRef.current = currentDocId;

      setEscalaImageUrl(null);
      setLoading(false);
      setTotalPages(1);
      setEscalaError(null);

      if (currentEscala?.url) {
        const docUrl = getBackendUrl(currentEscala.url);
        console.log("🖼️ ESCALA: Processando URL:", docUrl);

        const isPDF = docUrl.toLowerCase().includes('.pdf') || currentEscala.title.toLowerCase().includes('.pdf');

        if (isPDF) {
          console.log("📄 ESCALA: É um PDF, convertendo para imagem...");
          convertEscalaPDFToImage(docUrl);
        } else {
          console.log("🖼️ ESCALA: É uma imagem, usando diretamente");
          setEscalaImageUrl(docUrl);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, [documentType, currentEscalaIndex, isEditMode]);

  // NOVO: Inicializar CARDÁPIO
useEffect(() => {
  if (documentType === "cardapio") {
    const currentCardapio = getCurrentCardapioDoc();
    const currentDocId = currentCardapio?.id ? `cardapio-${currentCardapio.id}` : null;

    console.log("🔄 CARDÁPIO Effect triggered:", {
      currentCardapio: currentCardapio?.title,
      currentDocId,
      previousDocId: previousDocIdRef.current,
      isEditMode,
      loading,
      hasImage: !!cardapioImageUrl
    });

    // 🔒 PROTEÇÃO: Não recarregar se estiver em modo editor
    if (isEditMode) {
      console.log("🔒 CARDÁPIO: Modo editor ativo, ignorando recarregamento");
      return;
    }

    // 🔒 PROTEÇÃO: Não reprocessar se já está carregando
    if (loading) {
      console.log("🔒 CARDÁPIO: Já está carregando, ignorando recarregamento");
      return;
    }

    // 🔍 VERIFICAR se realmente mudou de documento
    if (currentDocId === previousDocIdRef.current && cardapioImageUrl) {
      console.log("✅ CARDÁPIO: Mesmo documento, não recarregar");
      return;
    }

    // ⚠️ NÃO salvar scroll/zoom automaticamente ao trocar documento
    // O salvamento só deve ocorrer quando o usuário sai do modo editor manualmente

    // Atualizar referência do documento anterior
    previousDocIdRef.current = currentDocId;

    setCardapioImageUrl(null);
    setLoading(false);
    setTotalPages(1);

    if (currentCardapio?.url) {
      const docUrl = getBackendUrl(currentCardapio.url);
      console.log("🖼️ CARDÁPIO: Processando URL:", docUrl);

      const isPDF = docUrl.toLowerCase().includes('.pdf') ||
                    currentCardapio.title.toLowerCase().includes('.pdf');

      if (isPDF) {
        console.log("📄 CARDÁPIO: É um PDF, convertendo...");
        convertEscalaPDFToImage(docUrl, { target: "cardapio" });
      } else {
        console.log("🖼️ CARDÁPIO: É uma imagem");
        setCardapioImageUrl(docUrl);
        setLoading(false);
      }
    }
  }
}, [documentType, activeCardapioDoc?.id, isEditMode]);

  // ✅ FUNÇÃO: Verificar se URL é imagem
  const checkIfImageFile = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
    } catch (error) {
      console.warn("⚠️ Erro ao verificar tipo de arquivo:", url, error);
      return false;
    }
  };

  // NOVA FUNÇÃO: Tentar renderizar PDF com fallback de qualidade
  const tryRenderWithFallback = async (
    page: any,
    canvas: HTMLCanvasElement,
    baseScale: number,
    target: string
  ): Promise<boolean> => {
    const qualities = [
      { name: 'ALTA', scale: QUALITY_SCALES.HIGH, timeout: RENDER_TIMEOUTS.HIGH_QUALITY },
      { name: 'MÉDIA', scale: QUALITY_SCALES.MEDIUM, timeout: RENDER_TIMEOUTS.MEDIUM_QUALITY },
      { name: 'BAIXA', scale: QUALITY_SCALES.LOW, timeout: RENDER_TIMEOUTS.LOW_QUALITY }
    ];

    for (const quality of qualities) {
      try {
        console.log(`🎨 ${target.toUpperCase()}: Tentando renderização em qualidade ${quality.name} (escala: ${(baseScale * quality.scale).toFixed(2)}, timeout: ${quality.timeout / 1000}s)...`);

        const viewport = page.getViewport({ scale: baseScale * quality.scale });
        const context = canvas.getContext('2d', {
          alpha: false,
          willReadFrequently: false
        });

        if (!context) {
          throw new Error('Falha ao criar contexto do canvas');
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        const renderWidth = Math.min(MAX_RENDER_DIMENSION, Math.ceil(viewport.width));
        const renderHeight = Math.min(MAX_RENDER_DIMENSION, Math.ceil(viewport.height));

        canvas.width = renderWidth;
        canvas.height = renderHeight;

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
          setTimeout(() => reject(new Error(`Timeout na renderização (${quality.name})`)), quality.timeout)
        );

        await Promise.race([renderPromise, timeoutPromise]);

        console.log(`✅ ${target.toUpperCase()}: Renderização em qualidade ${quality.name} bem-sucedida! (${renderWidth}x${renderHeight})`);
        return true;

      } catch (error) {
        console.warn(`⚠️ ${target.toUpperCase()}: Falha na qualidade ${quality.name}:`, error);

        // Se não for a última tentativa, continue para a próxima qualidade
        if (quality !== qualities[qualities.length - 1]) {
          console.log(`🔄 ${target.toUpperCase()}: Tentando próxima qualidade...`);
          continue;
        }

        // Se foi a última tentativa, retorne false
        return false;
      }
    }

    return false;
  };
  
  // NOVA FUNÇÃO: Converter PDF da escala para imagem
  const convertEscalaPDFToImage = async (pdfUrl: string, options?: { target?: "escala" | "cardapio" }) => {
    const target = options?.target ?? "escala";
    const setImageUrl = target === "cardapio" ? setCardapioImageUrl : setEscalaImageUrl;

    try {
      if (target === "escala") {
        setEscalaError(null);
      }

      const currentDoc = target === "cardapio" ? getCurrentCardapioDoc() : getCurrentEscalaDoc();
      if (!currentDoc) {
        console.log(`⚠️ ${target.toUpperCase()}: Nenhum documento encontrado`);
        setLoading(false);
        if (target === "escala") {
          setEscalaError("Nenhuma escala ativa");
        }
        return;
      }

      const documentId = currentDoc.id;
      console.log(`🔄 ${target.toUpperCase()}: Iniciando conversão para ID: ${documentId}`);

      setLoading(true);
      setLoadingProgress(0);

      if (target === "escala") {
        try {
          const cacheResponse = await fetch(getBackendUrl(`/api/check-escala-cache/${documentId}`));
          const cacheResult = await cacheResponse.json();

          if (cacheResult.success && cacheResult.cached) {
            console.log(`💾 ESCALA: Cache encontrado: ${cacheResult.url}`);
            const cachedUrl = getBackendUrl(cacheResult.url);

            // ✅ USAR CACHE SEMPRE (não verificar resolução)
            setImageUrl(cachedUrl);
            setLoading(false);
            console.log('✅ ESCALA: Usando cache existente (pulando reprocessamento)');
            return;
          }
        } catch (cacheError) {
          console.warn("⚠️ ESCALA: Erro ao verificar cache:", cacheError);
        }
      }

      if (await checkIfImageFile(pdfUrl)) {
        console.log(`🖼️ ${target.toUpperCase()}: Arquivo é imagem, usando diretamente`);
        setImageUrl(pdfUrl);
        setLoading(false);
        return;
      }

      console.log(`📄 ${target.toUpperCase()}: Carregando PDF.js...`);
      const pdfjsLib = await loadPDFJS();

      console.log(`📥 ${target.toUpperCase()}: Obtendo dados do PDF...`);
      const pdfData = await getPDFData(pdfUrl);

      const uint8Array = new Uint8Array(pdfData);
      const header = new TextDecoder().decode(uint8Array.slice(0, 8));

      if (!header.startsWith('%PDF')) {
        console.log(`⚠️ ${target.toUpperCase()}: Não é um PDF válido, tentando como imagem`);
        setImageUrl(pdfUrl);
        setLoading(false);
        return;
      }

      console.log(`✅ ${target.toUpperCase()}: PDF válido detectado`);

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
        useSystemFonts: true
      });

      const pdf = await loadingTask.promise;
      console.log(`📄 ${target.toUpperCase()}: PDF carregado - ${pdf.numPages} página(s)`);

      const page = await pdf.getPage(1);

      const originalViewport = page.getViewport({ scale: 1.0 });
      const baseScale = calculateRenderScale({
        width: originalViewport.width,
        height: originalViewport.height,
      });

      console.log(`📐 ${target.toUpperCase()}: Escala base calculada: ${baseScale.toFixed(2)}`);

      const canvas = document.createElement('canvas');

      // Tentar renderizar com fallback de qualidade
      const renderSuccess = await tryRenderWithFallback(page, canvas, baseScale, target);

      if (!renderSuccess) {
        throw new Error('Falha em todas as tentativas de renderização');
      }

      console.log(`✅ ${target.toUpperCase()}: Página renderizada com sucesso`);

      if (target === "escala") {
        try {
          const imageDataUrl = canvas.toDataURL(IMAGE_EXPORT_FORMAT);

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
            const cachedPath = saveResult?.data?.url ?? saveResult?.url;

            if (cachedPath) {
              const resolvedCachedUrl = getBackendUrl(cachedPath);
              console.log(`✅ ESCALA: Salvo no servidor. Caminho resolvido: ${resolvedCachedUrl}`);
              setImageUrl(resolvedCachedUrl);
            } else {
              console.warn('⚠️ ESCALA: Resposta do servidor sem URL, usando dataURL.');
              setImageUrl(imageDataUrl);
            }
          } else {
            throw new Error(`Servidor retornou ${saveResponse.status}`);
          }
        } catch (saveError) {
          console.warn(`⚠️ ESCALA: Falha ao salvar cache, usando dataURL:`, saveError);
          const imageDataUrl = canvas.toDataURL(IMAGE_EXPORT_FORMAT);
          setImageUrl(imageDataUrl);
        }
      } else {
        const imageDataUrl = canvas.toDataURL(IMAGE_EXPORT_FORMAT);
        setImageUrl(imageDataUrl);
      }

      page.cleanup();
      pdf.destroy();

      setLoading(false);
      console.log(`🎉 ${target.toUpperCase()}: Conversão concluída com sucesso!`);

    } catch (error) {
      console.error(`❌ ${target.toUpperCase()}: Erro crítico na conversão:`, error);

      const errorMsg = error instanceof Error ? error.message : String(error);
      if (target === "escala") {
        setEscalaError(errorMsg);
      }

      const currentDoc = target === "cardapio" ? getCurrentCardapioDoc() : getCurrentEscalaDoc();
      if (currentDoc?.url) {
        console.log(`⚠️ ${target.toUpperCase()}: Tentando usar arquivo original como fallback`);
        const directUrl = getBackendUrl(currentDoc.url);
        setImageUrl(directUrl);
      }

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
        escalaImageUrl,
        escalaError,
        loading,
        currentEscala: currentEscala?.title
      });

      if (escalaError && !loading) {
        return (
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">⚠️</div>
              <div className="text-red-600 font-bold text-lg mb-2">Erro ao carregar escala</div>
              <div className="text-gray-600 text-sm mb-4">{escalaError}</div>

              {docUrl && (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setEscalaError(null);
                      setEscalaImageUrl(null);
                      convertEscalaPDFToImage(docUrl);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    🔄 Tentar Novamente
                  </button>

                  <div className="text-xs text-gray-500 mt-2">
                    Ou tente fazer upload de uma imagem (JPG/PNG) ao invés de PDF
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          {escalaImageUrl ? (
            <div className="w-full h-full overflow-auto" ref={scrollableContentRef}>
              <div style={{
                minHeight: `${100 * zoomLevel}%`,
                minWidth: `${100 * zoomLevel}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px'
              }}>
                <img
                  src={escalaImageUrl}
                  alt="Escala de Serviço"
                  className="shadow-lg"
                  style={{
                    width: `${100 * zoomLevel}%`,
                    height: 'auto',
                    objectFit: 'contain',
                    transition: 'width 0.2s'
                  }}
                  onError={(e) => {
                    console.error("❌ ESCALA: Erro ao carregar imagem:", escalaImageUrl);
                    setEscalaError("Falha ao exibir a imagem da escala");
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log(`✅ ESCALA: Imagem carregada com sucesso`);
                    // 🔄 Restaurar ZOOM primeiro, depois SCROLL
                    const storageKey = getPersistentStorageKey();
                    const docId = getCurrentDocumentId();
                    if (storageKey) {
                      const savedZoom = loadZoomFromLocalStorage(storageKey);
                      console.log(
                        `🔍 ESCALA: Restaurando zoom ${savedZoom} antes do scroll (doc=${docId}, key=${storageKey})`
                      );

                      // Só atualizar zoom se for diferente do atual
                      if (Math.abs(zoomLevel - savedZoom) > 0.01) {
                        setZoomLevel(savedZoom);
                        setZoomInputValue(Math.round(savedZoom * 100).toString());
                      }

                      // Restaurar scroll (internamente usa requestAnimationFrame)
                      restoreScrollPosition(storageKey);
                    }
                  }}
                />
              </div>
            </div>
          ) : docUrl ? (
            <div className="w-full h-full overflow-auto" ref={scrollableContentRef}>
              <div style={{
                minHeight: `${100 * zoomLevel}%`,
                minWidth: `${100 * zoomLevel}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px'
              }}>
                <img
                  src={docUrl}
                  alt="Escala de Serviço (Original)"
                  className="shadow-lg"
                  style={{
                    width: `${100 * zoomLevel}%`,
                    height: 'auto',
                    objectFit: 'contain',
                    transition: 'width 0.2s'
                  }}
                  onError={(e) => {
                    console.error("❌ ESCALA: Erro ao carregar arquivo original:", docUrl);
                    setEscalaError("Falha ao carregar o arquivo da escala");
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log(`✅ ESCALA: Arquivo original carregado`);
                    // 🔄 Restaurar ZOOM primeiro, depois SCROLL
                    const storageKey = getPersistentStorageKey();
                    const docId = getCurrentDocumentId();
                    if (storageKey) {
                      const savedZoom = loadZoomFromLocalStorage(storageKey);
                      console.log(
                        `🔍 ESCALA: Restaurando zoom ${savedZoom} antes do scroll (doc=${docId}, key=${storageKey})`
                      );

                      // Só atualizar zoom se for diferente do atual
                      if (Math.abs(zoomLevel - savedZoom) > 0.01) {
                        setZoomLevel(savedZoom);
                        setZoomInputValue(Math.round(savedZoom * 100).toString());
                      }

                      // Restaurar scroll (internamente usa requestAnimationFrame)
                      restoreScrollPosition(storageKey);
                    }
                  }}
                />
              </div>
            </div>
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

      console.log("🖼️ CARDÁPIO: Renderizando", {
        docUrl,
        cardapioImageUrl,
        loading,
        currentCardapio: currentCardapio?.title
      });

      return (
        <div className="w-full h-full flex items-center justify-center p-4">
          {cardapioImageUrl ? (
            <div className="w-full h-full overflow-auto" ref={scrollableContentRef}>
              <div style={{
                minHeight: `${100 * zoomLevel}%`,
                minWidth: `${100 * zoomLevel}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px'
              }}>
                <img
                  src={cardapioImageUrl}
                  alt="Cardápio Semanal"
                  className="shadow-lg"
                  style={{
                    width: `${100 * zoomLevel}%`,
                    height: 'auto',
                    objectFit: 'contain',
                    transition: 'width 0.2s'
                  }}
                  onError={(e) => {
                    console.error("❌ CARDÁPIO: Erro ao carregar imagem:", cardapioImageUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log(`✅ CARDÁPIO: Imagem carregada com sucesso`);
                    // 🔄 Restaurar ZOOM primeiro, depois SCROLL
                    const storageKey = getPersistentStorageKey();
                    const docId = getCurrentDocumentId();
                    if (storageKey) {
                      const savedZoom = loadZoomFromLocalStorage(storageKey);
                      console.log(
                        `🔍 CARDÁPIO: Restaurando zoom ${savedZoom} antes do scroll (doc=${docId}, key=${storageKey})`
                      );

                      // Só atualizar zoom se for diferente do atual
                      if (Math.abs(zoomLevel - savedZoom) > 0.01) {
                        setZoomLevel(savedZoom);
                        setZoomInputValue(Math.round(savedZoom * 100).toString());
                      }

                      // Restaurar scroll (internamente usa requestAnimationFrame)
                      restoreScrollPosition(storageKey);
                    }
                  }}
                />
              </div>
            </div>
          ) : docUrl ? (
            <div className="w-full h-full overflow-auto" ref={scrollableContentRef}>
              <div style={{
                minHeight: `${100 * zoomLevel}%`,
                minWidth: `${100 * zoomLevel}%`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px'
              }}>
                <img
                  src={docUrl}
                  alt="Cardápio Semanal (Original)"
                  className="shadow-lg"
                  style={{
                    width: `${100 * zoomLevel}%`,
                    height: 'auto',
                    objectFit: 'contain',
                    transition: 'width 0.2s'
                  }}
                  onError={(e) => {
                    console.error("❌ CARDÁPIO: Erro ao carregar arquivo original:", docUrl);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={() => {
                    console.log(`✅ CARDÁPIO: Arquivo original carregado`);
                    // 🔄 Restaurar ZOOM primeiro, depois SCROLL
                    const storageKey = getPersistentStorageKey();
                    const docId = getCurrentDocumentId();
                    if (storageKey) {
                      const savedZoom = loadZoomFromLocalStorage(storageKey);
                      console.log(
                        `🔍 CARDÁPIO: Restaurando zoom ${savedZoom} antes do scroll (doc=${docId}, key=${storageKey})`
                      );

                      // Só atualizar zoom se for diferente do atual
                      if (Math.abs(zoomLevel - savedZoom) > 0.01) {
                        setZoomLevel(savedZoom);
                        setZoomInputValue(Math.round(savedZoom * 100).toString());
                      }

                      // Restaurar scroll (internamente usa requestAnimationFrame)
                      restoreScrollPosition(storageKey);
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">🍽️</div>
              <div>Nenhum cardápio ativo</div>
              <div className="text-sm mt-2">Adicione um cardápio no painel administrativo</div>
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
                    const activeMainDoc = activePlasaDoc;
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
                {(documentType === "plasa" && !activePlasaDoc)
                  ? `Nenhum documento ${documentType.toUpperCase()} ativo` 
                  : loading
                  ? "Processando documento..."
                  : "Preparando visualização..."}
              </div>
              {(documentType === "plasa" && !activePlasaDoc) && (
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

 const getCurrentTitle = () => {
  if (documentType === "escala") {
    return title; // ou "ESCALA DE SERVIÇO"
  } else if (documentType === "cardapio") {
    return "CARDÁPIO";
  }

  return title;
};

  const currentEscala = getCurrentEscalaDoc();

  return (

    <Card className="h-full overflow-hidden border-0 shadow-none bg-transparent">
      {/* Header Estilizado com Gradiente */}




<CardHeader
  className="relative text-white border-b space-y-0 py-1 px-3 bg-gradient-to-r from-slate-700 via-blue-800 to-slate-700 border-blue-400/30"
  onMouseEnter={() => (documentType === "escala" || documentType === "cardapio") && setShowZoomControls(true)}
  onMouseLeave={() => setShowZoomControls(false)}
>
  {/* Efeito de brilho uniforme */}
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent"></div>

<CardTitle className="relative z-10 flex items-center justify-between">
  <div className="flex items-center space-x-2">
    {/* Ícone estilizado uniforme */}
    <div className="relative w-5 h-5">
      <div className="w-full h-full rounded-lg flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-blue-600">
        {documentType === "plasa" ? (
          <span className="text-white text-sm leading-none">📋</span>
        )  : documentType === "escala" ? (
          <span className="text-white text-sm leading-none">📅</span>
        ) : documentType === "cardapio" ? (
          <span className="text-white text-sm leading-none">🍽️</span>
        ) : (
          <span className="text-white text-sm leading-none">📄</span>
        )}
      </div>
    </div>

    <div className="flex flex-col">
      <span className="font-bold text-xs sm:text-sm bg-clip-text text-transparent uppercase tracking-wide bg-gradient-to-r from-white to-blue-100">
        {documentType === "plasa" ? (
          activePlasaDoc?.title || "PLANO SEMANAL DE ATIVIDADES"
        ) : documentType === "cardapio" ? (
          "CARDÁPIO"
        ) : (
          getCurrentTitle() || "ESCALA DE SERVIÇO"
        )}
      </span>

      {/* REMOVIDO: Subtítulo do cardápio */}
    </div>
  </div>
  
  <div className="flex items-center space-x-2">
    {/* Controles de zoom que aparecem no hover */}
    {(documentType === "escala" || documentType === "cardapio") && (
      <div
        className={`flex items-center gap-1 transition-all duration-300 ${
          showZoomControls ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
        } bg-slate-600/70 backdrop-blur-sm border-slate-400/40 rounded-lg px-2 py-1 border shadow-lg`}
      >
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          className="p-1 rounded transition-colors hover:bg-slate-500/80 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Diminuir zoom"
        >
          <span className="text-white text-sm font-bold">−</span>
        </button>

        <div className="flex items-center gap-0.5">
          <input
            type="text"
            value={zoomInputValue}
            onChange={handleZoomInputChange}
            onKeyDown={handleZoomInputKeyDown}
            onBlur={handleZoomInputBlur}
            className="w-10 px-1 py-0.5 rounded text-[10px] font-bold text-center transition-colors bg-slate-600/90 hover:bg-slate-500/80 text-slate-100 focus:bg-slate-500/90 border-none outline-none focus:ring-1 focus:ring-white/30"
            title="Digite o zoom e pressione Enter (50-300%)"
          />
          <span className="text-[10px] font-bold text-slate-100">%</span>
        </div>

        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="p-1 rounded transition-colors hover:bg-slate-500/80 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Aumentar zoom"
        >
          <span className="text-white text-sm font-bold">+</span>
        </button>

        {/* Separador */}
        <div className="w-px h-5 bg-slate-400/40"></div>

        {/* ✏️ Botão de modo editor (toggle pausar/salvar) */}
        <button
          onClick={handleToggleEditMode}
          className={`p-1 rounded transition-all relative ${
            isEditMode
              ? "bg-blue-500 animate-pulse shadow-lg"
              : "hover:bg-slate-500/80"
          }`}
          title={isEditMode ? "Clique para salvar e retomar alternância" : "Clique para pausar alternância e editar"}
        >
          <span className="text-white text-sm">
            {isEditMode ? "✏️" : "📍"}
          </span>

          {/* Feedback visual de salvamento */}
          {scrollSavedFeedback && (
            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-2 py-1 rounded shadow-lg bg-green-600 text-white">
              ✅ Salvo!
            </span>
          )}

          {/* ✏️ Indicador de modo editor */}
          {isEditMode && (
            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] font-bold whitespace-nowrap px-2 py-1 rounded shadow-lg bg-blue-500 text-white animate-pulse">
              🔒 Modo Editor
            </span>
          )}
        </button>
      </div>
    )}

    {/* Indicador OFICIAIS | PRAÇAS fixo com ícones para ESCALA */}
    {documentType === "escala" && (() => {
      const currentEscala = getCurrentEscalaDoc() ?? activeEscalaDoc;
      const escalaCategory = detectEscalaCategory(currentEscala);
      const isOficial = escalaCategory === "oficial";
      const isPraca = escalaCategory === "praca";
      const isUnclassified = escalaCategory === null;
      const inactiveOpacityClass = isUnclassified ? "opacity-60" : "opacity-40";
      const inactiveTextClass = isUnclassified ? "text-slate-300" : "text-slate-400";

      return (
        <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-2 py-0.5 border border-slate-400/30 flex items-center">
          <div className="flex items-center gap-1.5">
            {/* OFICIAIS */}
            <div className="flex items-center gap-1">
              <span
                className={`text-xs transition-all duration-300 ${
                  isOficial ? "opacity-100 drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" : inactiveOpacityClass
                }`}
              >
                ⭐
              </span>
              <span
                className={`text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                  isOficial ? "text-yellow-50 drop-shadow-[0_0_8px_rgba(255,215,0,0.9)] brightness-125" : inactiveTextClass
                }`}
              >
                OFICIAIS
              </span>
            </div>

            {/* Separador */}
            <span className="text-slate-300 text-[10px] sm:text-xs mx-1">|</span>

            {/* PRAÇAS */}
            <div className="flex items-center gap-1">
              <span
                className={`text-xs transition-all duration-300 ${
                  isPraca ? "opacity-100 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]" : inactiveOpacityClass
                }`}
              >
                🛡️
              </span>
              <span
                className={`text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                  isPraca ? "text-emerald-50 drop-shadow-[0_0_8px_rgba(16,185,129,0.9)] brightness-125" : inactiveTextClass
                }`}
              >
                PRAÇAS
              </span>
            </div>
          </div>
        </div>
      );
    })()}


   {/* Indicador EAGM | 1DN para CARDÁPIO */}
    {documentType === "cardapio" && (() => {
      const currentCardapio = getCurrentCardapioDoc();
      const isEAGM = currentCardapio?.unit === "EAGM";

      return (
        <div className="bg-slate-600/50 backdrop-blur-sm rounded-lg px-2 py-0.5 border border-slate-400/30 flex items-center">
          <div className="flex items-center gap-1.5">
            {/* EAGM */}
            <div className="flex items-center gap-1">
              <span className={`text-xs transition-all duration-300 ${
                isEAGM ? "opacity-100 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" : "opacity-40"
              }`}>🏢</span>
              <span className={`text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                isEAGM
                  ? "text-cyan-50 drop-shadow-[0_0_8px_rgba(59,130,246,0.9)] brightness-125"
                  : "text-slate-400"
              }`}>
                EAGM
              </span>
            </div>

            {/* Separador */}
            <span className="text-slate-300 text-[10px] sm:text-xs mx-1">|</span>

            {/* 1DN */}
            <div className="flex items-center gap-1">
              <span className={`text-xs transition-all duration-300 ${
                !isEAGM ? "opacity-100 drop-shadow-[0_0_6px_rgba(59,130,246,0.8)]" : "opacity-40"
              }`}>⚓</span>
              <span className={`text-[10px] sm:text-xs font-bold transition-all duration-300 ${
                !isEAGM
                  ? "text-cyan-50 drop-shadow-[0_0_8px_rgba(59,130,246,0.9)] brightness-125"
                  : "text-slate-400"
              }`}>
                1DN
              </span>
            </div>
          </div>
        </div>
      );
    })()}
  </div>
    

</CardTitle>
</CardHeader>

      <CardContent className="p-0 h-[calc(100%-2.25rem)] bg-white">
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