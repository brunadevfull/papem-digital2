import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from "react";
import { resolveBackendUrl } from "@/utils/backend";

export interface Notice {
  id: string;
  title: string;
  content: string;
  priority: "high" | "medium" | "low";
  startDate: Date;
  endDate: Date;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PDFDocument {
  id: string;
  title: string;
  url: string;
  type: "plasa" | "escala" | "cardapio";
  category?: "oficial" | "praca";
  unit?: "EAGM" | "1DN";
  tags?: string[]; // 🏷️ Tags de classificação automática
  active: boolean;
  uploadDate: Date;
}

type AddDocumentOptions = {
  persist?: boolean;
};
interface DisplayContextType {
  notices: Notice[];
  plasaDocuments: PDFDocument[];
  escalaDocuments: PDFDocument[];
  cardapioDocuments: PDFDocument[];
  activePlasaDoc: PDFDocument | null;
  activeEscalaDoc: PDFDocument | null;
  activeCardapioDoc: PDFDocument | null;
  currentEscalaIndex: number;
  currentCardapioIndex: number; // ✅ Adicionar
  escalaAlternateInterval: number;
  cardapioAlternateInterval: number;
  scrollSpeed: "slow" | "normal" | "fast";
  autoRestartDelay: number;
  isLoading: boolean;
  addNotice: (notice: Omit<Notice, "id" | "createdAt" | "updatedAt">) => Promise<boolean>;
  updateNotice: (notice: Notice) => Promise<boolean>;
  deleteNotice: (id: string) => Promise<boolean>;
  addDocument: (document: Omit<PDFDocument, "id" | "uploadDate">, options?: AddDocumentOptions) => void;
  updateDocument: (document: PDFDocument) => void;
  deleteDocument: (id: string) => void;
  setEscalaAlternateInterval: (interval: number) => void;
  setCardapioAlternateInterval: (interval: number) => void;
  setScrollSpeed: (speed: "slow" | "normal" | "fast") => void;
  setAutoRestartDelay: (delay: number) => void;
  refreshNotices: () => Promise<void>;
  handleScrollComplete: () => void;
}

const DisplayContext = createContext<DisplayContextType | undefined>(undefined);

export const useDisplay = () => {
  const context = useContext(DisplayContext);
  if (!context) {
    throw new Error("useDisplay must be used within a DisplayProvider");
  }
  return context;
};

interface DisplayProviderProps {
  children: ReactNode;
}

export const DisplayProvider: React.FC<DisplayProviderProps> = ({ children }) => {
  // Estados
  const [notices, setNotices] = useState<Notice[]>([]);
  const [plasaDocuments, setPlasaDocuments] = useState<PDFDocument[]>([]);
  const [escalaDocuments, setEscalaDocuments] = useState<PDFDocument[]>([]);
  const [cardapioDocuments, setCardapioDocuments] = useState<PDFDocument[]>([]);
  const [currentEscalaIndex, setCurrentEscalaIndex] = useState(0);
  const [currentCardapioIndex, setCurrentCardapioIndex] = useState(0); // ✅ ADICIONAR
  const cardapioTimerRef = useRef<NodeJS.Timeout | null>(null); // ✅ ADICIONAR
  const [escalaAlternateInterval, setEscalaAlternateInterval] = useState(30000);
  const [cardapioAlternateInterval, setCardapioAlternateInterval] = useState(30000);
  const [scrollSpeed, setScrollSpeed] = useState<"slow" | "normal" | "fast">("normal");
  const [autoRestartDelay, setAutoRestartDelay] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  // Ref para o timer de alternância
  const escalaTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mainDocTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(true);
  
  // Callback para após completar scroll (apenas PLASA agora)
  const handleScrollComplete = () => {
    // Função simplificada - apenas PLASA
    console.log("✅ Scroll completo");
  };

  // CORREÇÃO: Função para obter URL completa do backend - DETECTAR AMBIENTE
  const getBackendUrl = (path: string): string => resolveBackendUrl(path);

  // Função utilitária para tratar tags dos documentos
  const normalizeDocumentTags = (input: {
    tags?: string[];
    type: PDFDocument["type"];
    category?: PDFDocument["category"];
    unit?: PDFDocument["unit"];
  }): string[] => {
    const baseTags = Array.isArray(input.tags)
      ? input.tags
          .map(tag => (typeof tag === "string" ? tag.trim() : ""))
          .filter(tag => tag.length > 0)
      : [];

    const ensureTag = (tag: string) => {
      const normalized = tag.trim();
      if (!normalized) return;
      const alreadyExists = baseTags.some(
        existing => existing.toUpperCase() === normalized.toUpperCase()
      );
      if (!alreadyExists) {
        baseTags.push(normalized);
      }
    };

    if (input.type === "plasa") {
      ensureTag("PLASA");
    }

    if (input.type === "escala") {
      ensureTag("ESCALA");
      if (input.category === "oficial") {
        ensureTag("OFICIAIS");
      } else if (input.category === "praca") {
        ensureTag("PRAÇAS");
      }
    }

    if (input.type === "cardapio") {
      ensureTag("CARDÁPIO");
      if (input.unit === "EAGM") {
        ensureTag("EAGM");
      } else if (input.unit === "1DN") {
        ensureTag("1DN");
      }
    }

    return baseTags;
  };

  const persistDocumentMetadata = async (
    document: Omit<PDFDocument, "id" | "uploadDate"> & { url: string }
  ) => {
    const resolveServerPath = (url: string): string | null => {
      if (!url) return null;
      if (url.startsWith('/uploads/')) return url;
      if (url.startsWith('uploads/')) return `/${url}`;
      if (url.startsWith('http')) {
        try {
          const parsed = new URL(url);
          return parsed.pathname.startsWith('/uploads/')
            ? `${parsed.pathname}${parsed.search}`
            : null;
        } catch (error) {
          console.warn('⚠️ URL inválida ao persistir documento:', error);
          return null;
        }
      }
      return null;
    };

    const serverPath = resolveServerPath(document.url);
    if (!serverPath) {
      return;
    }

    const payload: Record<string, unknown> = {
      title: document.title,
      url: serverPath,
      type: document.type,
      category: document.category ?? null,
      active: document.active,
      tags: normalizeDocumentTags(document),
    };

    if (document.unit) {
      payload.unit = document.unit;
    }

    try {
      const response = await fetch(getBackendUrl('/api/documents'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn('⚠️ Falha ao persistir metadados do documento:', await response.text().catch(() => response.statusText));
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível persistir documento no servidor:', error);
    }
  };

  const getComparableUrl = (url: string): string => {
    if (!url) return "";

    try {
      const isAbsolute = /^https?:/i.test(url);
      if (isAbsolute) {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}`;
      }
    } catch {
      // Ignorar erros de URL inválida e continuar normalização
    }

    const normalized = url.startsWith("/") ? url : `/${url}`;
    return normalized.replace(/\\+/g, "/");
  };

  const generateDocumentIdFromUrl = (url: string): string => {
    const comparable = getComparableUrl(url).toLowerCase();
    if (!comparable) {
      return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    }

    let hash = 0;
    for (let i = 0; i < comparable.length; i++) {
      hash = (hash * 31 + comparable.charCodeAt(i)) >>> 0;
    }

    return `doc-${hash.toString(16)}`;
  };

  const generateUniqueId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  };

  // Função para normalizar URLs existentes para o ambiente atual
  const normalizeDocumentUrl = (url: string): string => {
    if (!url) return url;
    
    // Se é uma URL local incorreta (localhost), corrigir para o ambiente atual
    if (url.includes('localhost:')) {
      const pathMatch = url.match(/\/uploads\/.*$/);
      if (pathMatch) {
        return getBackendUrl(pathMatch[0]);
      }
    }
    
    return url;
  };

  // CORREÇÃO: Conversão de aviso do servidor para local
  const convertServerNoticeToLocal = (serverNotice: any): Notice => {
    return {
      id: String(serverNotice.id), 
      title: serverNotice.title,
      content: serverNotice.content,
      priority: serverNotice.priority,
      startDate: new Date(serverNotice.startDate),
      endDate: new Date(serverNotice.endDate),
      active: serverNotice.active,
      createdAt: serverNotice.createdAt ? new Date(serverNotice.createdAt) : undefined,
      updatedAt: serverNotice.updatedAt ? new Date(serverNotice.updatedAt) : undefined
    };
  };

// ✅ DEPOIS (completo):
const convertLocalNoticeToServer = (localNotice: Omit<Notice, "id" | "createdAt" | "updatedAt">): any => {

  
  return {
    title: localNotice.title.trim(),
    content: localNotice.content.trim(),
    priority: localNotice.priority,
    startDate: localNotice.startDate.toISOString(),
    endDate: localNotice.endDate.toISOString(),
    active: localNotice.active !== false // Garantir que seja boolean
  };
};



  // CORREÇÃO: Carregar avisos do servidor com melhor tratamento de erro
  const loadNoticesFromServer = async (): Promise<void> => {
    try {

      setIsLoading(true);
      
      const backendUrl = getBackendUrl('/api/notices');

      
      const response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log("📢 Resposta do servidor:", response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log("📢 Dados recebidos:", result);
        
        if (result.success && Array.isArray(result.notices)) {
          const serverNotices = result.notices.map(convertServerNoticeToLocal);
          
          console.log(`📢 ${serverNotices.length} avisos carregados do servidor`);
          setNotices(serverNotices);
        } else {
          console.warn("⚠️ Resposta inválida do servidor:", result);
          setNotices([]);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro ao carregar avisos: ${response.status} - ${errorText}`);
        // Manter avisos locais se servidor falhar
      }
    } catch (error) {
      // Silenciar erro de conexão - sistema funciona normalmente
      console.log("🔄 Sistema funcionando em modo offline para avisos");
      // Manter avisos locais se servidor falhar
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh avisos (função pública)
  const refreshNotices = async (): Promise<void> => {
    await loadNoticesFromServer();
  };

  // CORREÇÃO: Criar aviso no servidor com melhor tratamento de erro
  const addNotice = async (noticeData: Omit<Notice, "id" | "createdAt" | "updatedAt">): Promise<boolean> => {
    try {
      console.log("📢 Criando aviso no servidor:", noticeData.title);
      setIsLoading(true);
      
      const serverData = convertLocalNoticeToServer(noticeData);
      console.log("📢 Dados para enviar:", serverData);
  // ✅ ADICIONAR ESTE DEBUG TEMPORÁRIO:
    console.log("🔍 DEBUG - Dados originais:", {
      title: noticeData.title,
      content: noticeData.content,
      priority: noticeData.priority,
      startDate: noticeData.startDate,
      startDateType: typeof noticeData.startDate,
      startDateValid: noticeData.startDate instanceof Date,
      endDate: noticeData.endDate,
      endDateType: typeof noticeData.endDate,
      endDateValid: noticeData.endDate instanceof Date,
      active: noticeData.active
    });
    
    console.log("🔍 DEBUG - Dados convertidos:", {
      ...serverData,
      startDateLength: serverData.startDate?.length,
      endDateLength: serverData.endDate?.length
    });
    
      const backendUrl = getBackendUrl('/api/notices');
      console.log("📢 Enviando para:", backendUrl);

      
      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(serverData)
      });
      
      console.log("📢 Resposta:", response.status, response.statusText);

      // ✅ ADICIONAR ESTE DEBUG PARA VER O ERRO:
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      console.error("❌ Erro HTTP detalhado:", {
        status: response.status,
        statusText: response.statusText,
        errorData: errorData
      });
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
      
      if (response.ok) {
        const result = await response.json();
        console.log("📢 Resultado:", result);
        
        if (result.success && result.notice) {
          const newNotice = convertServerNoticeToLocal(result.notice);
          setNotices(prev => [...prev, newNotice]);
          
          console.log(`✅ Aviso criado no servidor: ${newNotice.id}`);
          return true;
        } else {
          throw new Error(result.error || 'Resposta inválida do servidor');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error("❌ Erro HTTP:", response.status, errorData);
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }
    } catch (error) {
      console.error("❌ Erro ao criar aviso:", error);
      
      // Fallback: adicionar localmente se servidor falhar
      const localNotice: Notice = {
        ...noticeData,
        id: `local-${generateUniqueId()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setNotices(prev => [...prev, localNotice]);
      console.log("⚠️ Aviso adicionado apenas localmente devido a erro no servidor");
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // CORREÇÃO: Atualizar aviso no servidor
 // CORREÇÃO: Atualizar aviso no servidor
const updateNotice = async (updatedNotice: Notice): Promise<boolean> => {
  try {
    console.log("📝 Atualizando aviso no servidor:", updatedNotice.id);
    setIsLoading(true);
    
    // 🔥 CORREÇÃO: Garantir que ID seja string antes de usar .startsWith()
    const stringId = String(updatedNotice.id);
    
    // Se é um aviso local, não tentar atualizar no servidor
    if (stringId.startsWith('local-')) {
      setNotices(prev => prev.map(notice => 
        notice.id === updatedNotice.id ? updatedNotice : notice
      ));
      console.log("📝 Aviso local atualizado");
      return true;
    }
    
    const serverData = convertLocalNoticeToServer(updatedNotice);
    
    const response = await fetch(getBackendUrl(`/api/notices/${updatedNotice.id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(serverData)
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success && result.notice) {
        const updated = convertServerNoticeToLocal(result.notice);
        setNotices(prev => prev.map(notice => 
          notice.id === updated.id ? updated : notice
        ));
        
        console.log(`✅ Aviso atualizado no servidor: ${updated.id}`);
        return true;
      } else {
        throw new Error(result.error || 'Resposta inválida do servidor');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Erro ao atualizar aviso:", error);
    
    // Fallback: atualizar localmente se servidor falhar
    setNotices(prev => prev.map(notice => 
      notice.id === updatedNotice.id ? updatedNotice : notice
    ));
    console.log("⚠️ Aviso atualizado apenas localmente devido a erro no servidor");
    
    return false;
  } finally {
    setIsLoading(false);
  }
};

  // CORREÇÃO: Deletar aviso do servidor
 // CORREÇÃO: Deletar aviso do servidor
const deleteNotice = async (id: string): Promise<boolean> => {
  try {
    console.log("🗑️ Deletando aviso do servidor:", id);
    setIsLoading(true);
    
    // 🔥 CORREÇÃO: Garantir que ID seja string antes de usar .startsWith()
    const stringId = String(id);
    
    // Se é um aviso local, apenas remover localmente
    if (stringId.startsWith('local-')) {
      setNotices(prev => prev.filter(notice => String(notice.id) !== stringId));
      console.log("🗑️ Aviso local removido");
      return true;
    }
    
    const response = await fetch(getBackendUrl(`/api/notices/${id}`), {
      method: 'DELETE'
    });
    
    if (response.ok) {
      const result = await response.json();
      
      if (result.success) {
        setNotices(prev => prev.filter(notice => String(notice.id) !== stringId));
        
        console.log(`✅ Aviso deletado do servidor: ${id}`);
        return true;
      } else {
        throw new Error(result.error || 'Resposta inválida do servidor');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Erro ao deletar aviso:", error);
    
    // Fallback: remover localmente se servidor falhar
    const stringId = String(id);
    setNotices(prev => prev.filter(notice => String(notice.id) !== stringId));
    console.log("⚠️ Aviso removido apenas localmente devido a erro no servidor");
    
    return false;
  } finally {
    setIsLoading(false);
  }
};

  // Função addDocument com persistência opcional
  const addDocument = (
    docData: Omit<PDFDocument, "id" | "uploadDate">,
    options: AddDocumentOptions = {}
  ) => {
    const serverUrl = docData.url;
    const normalizedDocData = {
      ...docData,
      tags: normalizeDocumentTags(docData)
    };

    const comparableUrl = getComparableUrl(serverUrl);

    const upsertDocument = (prev: PDFDocument[], typeLabel: string): PDFDocument[] => {
      const existingIndex = prev.findIndex(doc => getComparableUrl(doc.url) === comparableUrl);
      const existingDoc = existingIndex >= 0 ? prev[existingIndex] : undefined;

      const nextDoc: PDFDocument = {
        ...normalizedDocData,
        id: existingDoc?.id ?? generateDocumentIdFromUrl(comparableUrl || serverUrl),
        url: getBackendUrl(serverUrl),
        uploadDate: new Date()
      };

      console.log(`📄 Atualizando lista ${typeLabel}:`, {
        id: nextDoc.id,
        title: nextDoc.title,
        url: nextDoc.url
      });

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = nextDoc;
        return updated;
      }

      return [...prev, nextDoc];
    };

    if (docData.type === "plasa") {
      setPlasaDocuments(prev => upsertDocument(prev, "PLASA"));
    } else if (docData.type === "cardapio") {
      setCardapioDocuments(prev => upsertDocument(prev, "CARDÁPIO"));
    } else {
      setEscalaDocuments(prev => {
        const updated = upsertDocument(prev, "ESCALA");
        const activeEscalas = updated.filter(doc => doc.active);
        if (activeEscalas.length === 1) {
          setCurrentEscalaIndex(0);
        } else if (activeEscalas.length > 0 && currentEscalaIndex >= activeEscalas.length) {
          setCurrentEscalaIndex(0);
        }
        return updated;
      });
    }

    if (options.persist ?? true) {
      void persistDocumentMetadata({ ...normalizedDocData, url: serverUrl });
    }
  };

  const updateDocument = (updatedDoc: PDFDocument) => {
    console.log("📝 Atualizando documento:", updatedDoc.title);
    const normalizedDoc = {
      ...updatedDoc,
      tags: normalizeDocumentTags(updatedDoc)
    };

    if (updatedDoc.type === "plasa") {
      setPlasaDocuments(prev => prev.map(doc =>
        doc.id === updatedDoc.id ? normalizedDoc : doc
      ));
    } else if (updatedDoc.type === "escala") {
      setEscalaDocuments(prev => prev.map(doc =>
        doc.id === updatedDoc.id ? normalizedDoc : doc
      ));
    } else if (updatedDoc.type === "cardapio") {
      setCardapioDocuments(prev => prev.map(doc =>
        doc.id === updatedDoc.id ? normalizedDoc : doc
      ));
    }
  };

const deleteDocument = async (id: string) => {
    console.log("🗑️ Removendo documento:", id);
    
    // Encontrar o documento para obter o filename
    const allDocs = [...plasaDocuments, ...escalaDocuments, ...cardapioDocuments];
    const docToDelete = allDocs.find(doc => doc.id === id);
    
    if (docToDelete && docToDelete.url.includes('/uploads/')) {
      try {
        // Extrair o caminho completo após /uploads/ (inclui subpasta + arquivo)
        let filepath = '';
        
        // Tratar diferentes formatos de URL
        if (docToDelete.url.includes('/uploads/')) {
          const parts = docToDelete.url.split('/uploads/');
          filepath = parts[1]; // Pega tudo após /uploads/, ex: "plasa/documento.pdf"
        }
        
        // Remover query strings se houver
        filepath = filepath.split('?')[0];
        
        console.log("🗑️ Deletando arquivo do servidor:", filepath);
        console.log("🗑️ URL original:", docToDelete.url);
        
        // Enviar o caminho completo para o backend
        const response = await fetch(getBackendUrl(`/api/delete-pdf/${encodeURIComponent(filepath)}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log("✅ Arquivo deletado do servidor com sucesso");
        } else {
          console.warn("⚠️ Falha ao deletar arquivo do servidor:", result.error);
        }
      } catch (error) {
        console.error("❌ Erro ao deletar arquivo do servidor:", error);
      }
    }
    
    // Remover da lista local independentemente do resultado do servidor
    setPlasaDocuments(prev => prev.filter(doc => doc.id !== id));
    setCardapioDocuments(prev => prev.filter(doc => doc.id !== id));
    setEscalaDocuments(prev => {
      const newList = prev.filter(doc => doc.id !== id);
      const activeEscalas = newList.filter(doc => doc.active);
      if (activeEscalas.length === 0) {
        setCurrentEscalaIndex(0);
      } else if (currentEscalaIndex >= activeEscalas.length) {
        setCurrentEscalaIndex(0);
      }
      return newList;
    });
  };

  // Computed values com alternância automática para escalas  
  const activePlasaDoc = plasaDocuments.find(doc => doc.active) || null;

  
  const activeEscalaDocuments = escalaDocuments.filter(doc => doc.active);
  const activeEscalaDoc = activeEscalaDocuments.length > 0 
    ? activeEscalaDocuments[currentEscalaIndex % activeEscalaDocuments.length] 
    : null;

const activeCardapioDocuments = cardapioDocuments.filter((doc: PDFDocument) => doc.active);
const activeCardapioDoc = activeCardapioDocuments.length > 0
  ? activeCardapioDocuments[currentCardapioIndex % activeCardapioDocuments.length]
  : null;
  

  // Effect para alternar escalas automaticamente
  useEffect(() => {
    if (escalaTimerRef.current) {
      clearInterval(escalaTimerRef.current);
      escalaTimerRef.current = null;
    }

    if (activeEscalaDocuments.length > 1) {

      
      escalaTimerRef.current = setInterval(() => {
        setCurrentEscalaIndex(prevIndex => {
          const nextIndex = (prevIndex + 1) % activeEscalaDocuments.length;

          return nextIndex;
        });
      }, escalaAlternateInterval);
    } else if (activeEscalaDocuments.length === 1) {
      setCurrentEscalaIndex(0);

    } else {

    }

    return () => {
      if (escalaTimerRef.current) {
        clearInterval(escalaTimerRef.current);
        escalaTimerRef.current = null;
      }
    };
  }, [activeEscalaDocuments.length, escalaAlternateInterval, escalaDocuments]);
// ✅ ADICIONAR: Effect para alternar cardápios automaticamente
useEffect(() => {
  if (cardapioTimerRef.current) {
    clearInterval(cardapioTimerRef.current);
    cardapioTimerRef.current = null;
  }

  if (activeCardapioDocuments.length > 1) {
    console.log(`🍽️ Iniciando alternância de ${activeCardapioDocuments.length} cardápios`);
    
    cardapioTimerRef.current = setInterval(() => {
      setCurrentCardapioIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % activeCardapioDocuments.length;
        const nextCardapio = activeCardapioDocuments[nextIndex];
        console.log(`🍽️ Alternando para cardápio ${nextIndex + 1}/${activeCardapioDocuments.length}: ${nextCardapio?.unit || 'N/A'}`);
        return nextIndex;
      });
    }, cardapioAlternateInterval);
  } else if (activeCardapioDocuments.length === 1) {
    console.log(`🍽️ Apenas 1 cardápio ativo, mantendo fixo`);
    setCurrentCardapioIndex(0);
  } else {
    console.log(`⚠️ Nenhum cardápio ativo`);
  }

  return () => {
    if (cardapioTimerRef.current) {
      clearInterval(cardapioTimerRef.current);
      cardapioTimerRef.current = null;
    }
  };
}, [activeCardapioDocuments.length, cardapioAlternateInterval, cardapioDocuments]);

// ✅ ADICIONAR: Effect para resetar índice de cardápios
useEffect(() => {
  if (activeCardapioDocuments.length === 0) {
    setCurrentCardapioIndex(0);
  } else if (currentCardapioIndex >= activeCardapioDocuments.length) {
    setCurrentCardapioIndex(0);
  }
}, [activeCardapioDocuments.length, currentCardapioIndex]);
  // Log das mudanças importantes
  useEffect(() => {
    if (!isInitializingRef.current) {

    }
  }, [plasaDocuments, escalaDocuments, activePlasaDoc, activeEscalaDoc, currentEscalaIndex, notices]);

  // CORREÇÃO: Persistir apenas documentos no localStorage (não avisos)
  useEffect(() => {
    if (isInitializingRef.current) {
      return;
    }

    try {
      const contextData = {
        plasaDocuments: plasaDocuments.map(doc => ({
          ...doc,
          tags: normalizeDocumentTags(doc),
          uploadDate: doc.uploadDate.toISOString()
        })),
        escalaDocuments: escalaDocuments.map(doc => ({
          ...doc,
          tags: normalizeDocumentTags(doc),
          uploadDate: doc.uploadDate.toISOString()
        })),
        cardapioDocuments: cardapioDocuments.map(doc => ({
          ...doc,
          tags: normalizeDocumentTags(doc),
          uploadDate: doc.uploadDate.toISOString()
        })),
        currentEscalaIndex,
        currentCardapioIndex,
        escalaAlternateInterval,
        cardapioAlternateInterval,
        documentAlternateInterval: escalaAlternateInterval, // 🔙 Compatibilidade com versões anteriores
        scrollSpeed,
        autoRestartDelay,
        lastUpdate: new Date().toISOString(),
        version: '3.1' // Avisos agora no servidor
      };
      
      localStorage.setItem('display-context', JSON.stringify(contextData, null, 2));
      

      
    } catch (error) {
      console.error("❌ Erro ao salvar contexto:", error);
    }
  }, [
    plasaDocuments,
    escalaDocuments,
    cardapioDocuments,
    currentEscalaIndex,
    currentCardapioIndex,
    escalaAlternateInterval,
    cardapioAlternateInterval,
    scrollSpeed,
    autoRestartDelay
  ]);

  // Função auxiliar para determinar categoria
  const determineCategory = (filename: string): "oficial" | "praca" | undefined => {
    const lowerFilename = filename.toLowerCase();
    const normalizedFilename = lowerFilename
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    if (normalizedFilename.includes('oficial')) return 'oficial';
    if (normalizedFilename.includes('praca')) return 'praca';
    return undefined;
  };

  const normalizeUnitValue = (value: unknown): PDFDocument["unit"] | undefined => {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalized = value.trim().toUpperCase();
    if (!normalized) {
      return undefined;
    }

    if (normalized === "EAGM") {
      return "EAGM";
    }

    if (normalized === "1DN") {
      return "1DN";
    }

    const compact = normalized.replace(/[^A-Z0-9]/g, "");
    if (compact === "EAGM") {
      return "EAGM";
    }

    if (compact === "1DN" || compact === "DN1") {
      return "1DN";
    }

    return undefined;
  };

  const detectUnitFromText = (text?: string | null): PDFDocument["unit"] | undefined => {
    if (!text) {
      return undefined;
    }

    const normalized = text
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const compact = normalized.replace(/[^A-Z0-9]/g, "");

    if (compact.includes("EAGM")) {
      return "EAGM";
    }

    if (compact.includes("1DN") || compact.includes("DN1")) {
      return "1DN";
    }

    return undefined;
  };

  const deriveUnitFromTags = (tags: unknown): PDFDocument["unit"] | undefined => {
    if (!Array.isArray(tags)) {
      return undefined;
    }

    for (const rawTag of tags) {
      const tagUnit = normalizeUnitValue(rawTag);
      if (tagUnit) {
        return tagUnit;
      }
    }

    return undefined;
  };

  // Função para carregar documentos do servidor
  const loadDocumentsFromServer = async () => {
    const existingDocsMap = new Map<string, PDFDocument>();
    [...plasaDocuments, ...escalaDocuments, ...cardapioDocuments].forEach(doc => {
      existingDocsMap.set(getComparableUrl(doc.url), doc);
    });

    const sortDocuments = (docs: PDFDocument[]) =>
      [...docs].sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime());

    const dedupeDocuments = (docs: PDFDocument[]) => {
      const deduped = new Map<string, PDFDocument>();

      docs.forEach(doc => {
        const key = getComparableUrl(doc.url);
        if (!key) {
          return;
        }

        const existing = deduped.get(key);
        if (!existing || doc.uploadDate.getTime() >= existing.uploadDate.getTime()) {
          deduped.set(key, doc);
        }
      });

      return Array.from(deduped.values());
    };

    const applyDocumentsFromSource = (docs: PDFDocument[], source: 'database' | 'fallback') => {
      const dedupedDocs = dedupeDocuments(docs);

      const plasa = dedupedDocs.filter(doc => doc.type === 'plasa');
      const escala = dedupedDocs.filter(doc => doc.type === 'escala');
      const cardapio = dedupedDocs.filter(doc => doc.type === 'cardapio');

      setPlasaDocuments(sortDocuments(plasa));
      setEscalaDocuments(sortDocuments(escala));
      setCardapioDocuments(sortDocuments(cardapio));

      console.info(
        `📥 Carregados ${dedupedDocs.length} documentos (${plasa.length} PLASA, ${escala.length} Escala, ${cardapio.length} Cardápio) via ${source === 'database' ? '/api/documents' : '/api/list-pdfs'}`
      );

      return dedupedDocs.length > 0;
    };

    const processServerDocument = (serverDoc: any): PDFDocument | null => {
      if (!serverDoc) return null;

      const rawUrl = typeof serverDoc.url === 'string' ? serverDoc.url : '';
      if (!rawUrl) return null;

      const fullUrl = getBackendUrl(rawUrl);
      const comparableUrl = getComparableUrl(rawUrl) || getComparableUrl(fullUrl);
      if (!comparableUrl) return null;

      const allowedTypes: PDFDocument["type"][] = ['plasa', 'escala', 'cardapio'];
      const docType = typeof serverDoc.type === 'string' ? serverDoc.type.toLowerCase() : 'escala';
      const safeType = allowedTypes.includes(docType as PDFDocument["type"])
        ? (docType as PDFDocument["type"])
        : 'escala';

      const existingDoc = existingDocsMap.get(comparableUrl);
      const normalizedCategory = typeof serverDoc.category === 'string'
        ? determineCategory(serverDoc.category)
        : undefined;

      const rawCategory = normalizedCategory
        ?? (safeType === 'escala'
          ? determineCategory(String(serverDoc.filename || serverDoc.title || ''))
          : undefined)
        ?? (existingDoc?.category as PDFDocument['category'] | undefined);

      let unit: PDFDocument["unit"] | undefined;
      if (safeType === 'cardapio') {
        const classificationUnit = serverDoc.classification && typeof serverDoc.classification === 'object'
          ? normalizeUnitValue((serverDoc.classification as Record<string, unknown>)['unit'])
          : undefined;

        const tagsUnit = deriveUnitFromTags(serverDoc.tags)
          ?? (serverDoc.classification && typeof serverDoc.classification === 'object'
            ? deriveUnitFromTags((serverDoc.classification as Record<string, unknown>)['tags'])
            : undefined);

        const textUnit = detectUnitFromText(typeof serverDoc.title === 'string' ? serverDoc.title : undefined)
          ?? detectUnitFromText(typeof serverDoc.filename === 'string' ? serverDoc.filename : undefined)
          ?? detectUnitFromText(typeof serverDoc.originalname === 'string' ? serverDoc.originalname : undefined)
          ?? detectUnitFromText(rawUrl)
          ?? detectUnitFromText(comparableUrl);

        unit = normalizeUnitValue(serverDoc.unit)
          ?? classificationUnit
          ?? tagsUnit
          ?? textUnit
          ?? (existingDoc?.unit);
      }

      const docTags = normalizeDocumentTags({
        tags: Array.isArray(serverDoc.tags)
          ? [...serverDoc.tags]
          : serverDoc.tags
            ? [String(serverDoc.tags)]
            : [],
        type: safeType,
        category: rawCategory as PDFDocument['category'],
        unit
      });

      const timestampSource = serverDoc.uploadDate || serverDoc.created || serverDoc.createdAt;
      const parsedDate = timestampSource ? new Date(timestampSource) : new Date();
      const typeNames = {
        plasa: 'PLASA',
        escala: 'Escala',
        cardapio: 'Cardápio'
      } satisfies Record<PDFDocument['type'], string>;

      const generatedTitle = `${typeNames[safeType]} - ${parsedDate.toLocaleDateString('pt-BR')}`;
      const finalTitle = typeof serverDoc.title === 'string' && serverDoc.title.trim().length > 0
        ? serverDoc.title
        : generatedTitle;

      const activeState = typeof serverDoc.active === 'boolean'
        ? serverDoc.active
        : existingDoc?.active ?? true;

      const doc: PDFDocument = {
        id: existingDoc?.id ?? generateDocumentIdFromUrl(comparableUrl),
        title: finalTitle,
        url: fullUrl,
        type: safeType,
        category: safeType === 'escala' ? (rawCategory as PDFDocument['category']) : undefined,
        tags: docTags,
        unit,
        active: activeState,
        uploadDate: parsedDate
      };

      return doc;
    };

    try {
      const response = await fetch(getBackendUrl('/api/documents'));
      if (response.ok) {
        const documents = await response.json();
        if (Array.isArray(documents)) {
          const parsedDocs = documents
            .map(processServerDocument)
            .filter((doc): doc is PDFDocument => doc !== null);

          if (applyDocumentsFromSource(parsedDocs, 'database')) {
            return;
          }

          console.info('ℹ️ Nenhum documento válido retornado do banco, utilizando fallback /api/list-pdfs');
        }
      }
    } catch (error) {
      console.warn('⚠️ Falha ao carregar documentos do banco:', error);
    }

    try {
      const response = await fetch(getBackendUrl('/api/list-pdfs'));
      if (response.ok) {
        const result = await response.json();
        if (result.documents && Array.isArray(result.documents)) {
          const parsedDocs = result.documents
            .map(processServerDocument)
            .filter((doc: PDFDocument | null): doc is PDFDocument => doc !== null);

          if (!applyDocumentsFromSource(parsedDocs, 'fallback')) {
            setPlasaDocuments([]);
            setEscalaDocuments([]);
            setCardapioDocuments([]);
          }
        } else {
          setPlasaDocuments([]);
          setEscalaDocuments([]);
          setCardapioDocuments([]);
        }
      }
    } catch {
      // Silenciar erros de documentos - sistema funciona em modo offline
    }
  };

  // CORREÇÃO: Inicialização robusta com fallback para erros de documento
  useEffect(() => {
    const initializeContext = async () => {

      
      try {
        // Carregar configurações do localStorage
        const saved = localStorage.getItem('display-context');
        if (saved) {
          try {
            const data = JSON.parse(saved);


            // Carregar documentos PLASA com correção de URL
            if (data.plasaDocuments && Array.isArray(data.plasaDocuments)) {
              const validPlasaDocs = data.plasaDocuments
                .filter((doc: any) => doc && doc.id && doc.title && doc.url)
                .map((doc: any) => {
                  return {
                    ...doc,
                    url: normalizeDocumentUrl(doc.url),
                    tags: normalizeDocumentTags(doc),
                    uploadDate: new Date(doc.uploadDate),
                    active: doc.active !== false
                  };
                });

              if (validPlasaDocs.length > 0) {
                setPlasaDocuments(validPlasaDocs);

              }
            }


            // Carregar documentos Escala com correção de URL
            if (data.escalaDocuments && Array.isArray(data.escalaDocuments)) {
              const validEscalaDocs = data.escalaDocuments
                .filter((doc: any) => doc && doc.id && doc.title && doc.url)
                .map((doc: any) => {
                  return {
                    ...doc,
                    url: normalizeDocumentUrl(doc.url),
                    tags: normalizeDocumentTags(doc),
                    uploadDate: new Date(doc.uploadDate),
                    active: doc.active !== false
                  };
                });

              if (validEscalaDocs.length > 0) {
                setEscalaDocuments(validEscalaDocs);

              }
            }

            // Carregar documentos de Cardápio com correção de URL
            if (data.cardapioDocuments && Array.isArray(data.cardapioDocuments)) {
              const validCardapioDocs = data.cardapioDocuments
                .filter((doc: any) => doc && doc.id && doc.title && doc.url)
                .map((doc: any) => {
                  return {
                    ...doc,
                    url: normalizeDocumentUrl(doc.url),
                    tags: normalizeDocumentTags(doc),
                    uploadDate: new Date(doc.uploadDate),
                    active: doc.active !== false
                  };
                });

              if (validCardapioDocs.length > 0) {
                setCardapioDocuments(validCardapioDocs);

              }
            }

            // Carregar configurações
            if (typeof data.currentEscalaIndex === 'number') {
              setCurrentEscalaIndex(data.currentEscalaIndex);
            }
            if (typeof data.currentCardapioIndex === 'number') {
              setCurrentCardapioIndex(data.currentCardapioIndex);
            }
            if (data.escalaAlternateInterval) {
              setEscalaAlternateInterval(data.escalaAlternateInterval);
            }
            if (data.cardapioAlternateInterval) {
              setCardapioAlternateInterval(data.cardapioAlternateInterval);
            }
            if (data.documentAlternateInterval && !data.escalaAlternateInterval && !data.cardapioAlternateInterval) {
              setEscalaAlternateInterval(data.documentAlternateInterval);
              setCardapioAlternateInterval(data.documentAlternateInterval);
            }
            if (data.scrollSpeed) setScrollSpeed(data.scrollSpeed);
            if (data.autoRestartDelay) setAutoRestartDelay(data.autoRestartDelay);
          } catch (parseError) {
            console.warn("⚠️ Erro ao processar localStorage:", parseError);
            localStorage.removeItem('display-context');
          }
        }

        // Carregar avisos do servidor
        try {
          await loadNoticesFromServer();
        } catch (noticeError) {
          console.warn("⚠️ Falha ao carregar avisos do servidor:", noticeError);
        }
        
        // Carregar documentos do servidor (não bloqueante)
        setTimeout(() => {
          loadDocumentsFromServer().catch(() => {
            // Silenciar erro - sistema funciona normalmente
          });
        }, 1000);
        
      } catch (error) {
        console.error("❌ Erro na inicialização:", error);
        
        // Fallback: tentar carregar apenas avisos
        try {
          await loadNoticesFromServer();
        } catch (fallbackError) {
          console.error("❌ Falha total na inicialização:", fallbackError);
        }
      } finally {
        setTimeout(() => {
          isInitializingRef.current = false;
    
        }, 2000);
      }
    };
    
    initializeContext();
  }, []);

  // Effect para resetar índice quando não há escalas ativas
  useEffect(() => {
    if (activeEscalaDocuments.length === 0) {
      setCurrentEscalaIndex(0);
    } else if (currentEscalaIndex >= activeEscalaDocuments.length) {
      setCurrentEscalaIndex(0);
    }
  }, [activeEscalaDocuments.length, currentEscalaIndex]);


const value: DisplayContextType = {
  notices,
  plasaDocuments,
  escalaDocuments,
  cardapioDocuments,
  activePlasaDoc,
  activeEscalaDoc,
  activeCardapioDoc, // ✅ Agora está definido acima
  currentEscalaIndex,
  currentCardapioIndex, // ✅ Adicionar esta propriedade
  escalaAlternateInterval,
  cardapioAlternateInterval,
  scrollSpeed,
  autoRestartDelay,
  isLoading,
  addNotice,
  updateNotice,
  deleteNotice,
  addDocument,
  updateDocument,
  deleteDocument,
  setEscalaAlternateInterval,
  setCardapioAlternateInterval,
  setScrollSpeed,
  setAutoRestartDelay,
  refreshNotices,
  handleScrollComplete,
};

  

  return (
    <DisplayContext.Provider value={value}>
      {children}
    </DisplayContext.Provider>
  );
};