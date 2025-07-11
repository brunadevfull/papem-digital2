import { users, notices, documents, dutyOfficers, militaryPersonnel, type User, type InsertUser, type Notice, type InsertNotice, type PDFDocument, type InsertDocument, type DutyOfficers, type InsertDutyOfficers, type MilitaryPersonnel, type InsertMilitaryPersonnel } from "@shared/schema";
import { DatabaseStorage } from "./db-storage";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Notice methods
  getNotices(): Promise<Notice[]>;
  getNotice(id: number): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(notice: Notice): Promise<Notice>;
  deleteNotice(id: number): Promise<boolean>;
  
  // Document methods
  getDocuments(): Promise<PDFDocument[]>;
  getDocument(id: number): Promise<PDFDocument | undefined>;
  createDocument(document: InsertDocument): Promise<PDFDocument>;
  updateDocument(document: PDFDocument): Promise<PDFDocument>;
  deleteDocument(id: number): Promise<boolean>;
  
  // Duty Officers methods
  getDutyOfficers(): Promise<DutyOfficers | null>;
  updateDutyOfficers(officers: InsertDutyOfficers): Promise<DutyOfficers>;
  
  // Military Personnel methods
  getMilitaryPersonnel(): Promise<MilitaryPersonnel[]>;
  getMilitaryPersonnelByType(type: "officer" | "master"): Promise<MilitaryPersonnel[]>;
  createMilitaryPersonnel(personnel: InsertMilitaryPersonnel): Promise<MilitaryPersonnel>;
  updateMilitaryPersonnel(personnel: MilitaryPersonnel): Promise<MilitaryPersonnel>;
  deleteMilitaryPersonnel(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notices: Map<number, Notice>;
  private documents: Map<number, PDFDocument>;
  private dutyOfficers: DutyOfficers | null;
  private militaryPersonnel: Map<number, MilitaryPersonnel>;
  private currentUserId: number;
  private currentNoticeId: number;
  private currentDocumentId: number;
  private currentMilitaryPersonnelId: number;

  constructor() {
    this.users = new Map();
    this.notices = new Map();
    this.documents = new Map();
    this.dutyOfficers = null; // Inicializar como null, será criado quando necessário
    this.militaryPersonnel = new Map();
    this.currentUserId = 1;
    this.currentNoticeId = 1;
    this.currentDocumentId = 1;
    this.currentMilitaryPersonnelId = 1;
      console.log('💾 MemStorage initialized'); 
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }




/*
  // Notice methods
  async getNotices(): Promise<Notice[]> {
    return Array.from(this.notices.values());
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    return this.notices.get(id);
  }

  // ✅ CORREÇÃO: CreateNotice com validação melhorada
  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    try {
      const id = this.currentNoticeId++;
      const now = new Date();
      
      console.log('📢 Storage: Criando aviso:', {
        id,
        title: insertNotice.title,
        priority: insertNotice.priority,
        startDate: insertNotice.startDate,
        endDate: insertNotice.endDate,
        active: insertNotice.active
      });
      
      // ✅ Validação adicional de dados
      if (!insertNotice.title || insertNotice.title.trim() === '') {
        throw new Error('Title is required and cannot be empty');
      }
      
      if (!insertNotice.content || insertNotice.content.trim() === '') {
        throw new Error('Content is required and cannot be empty');
      }
      
      if (!['high', 'medium', 'low'].includes(insertNotice.priority)) {
        throw new Error('Priority must be high, medium, or low');
      }
      
      // ✅ Validação de datas
      let startDate: Date;
      let endDate: Date;
      
      if (insertNotice.startDate instanceof Date) {
        startDate = insertNotice.startDate;
      } else if (typeof insertNotice.startDate === 'string') {
        startDate = new Date(insertNotice.startDate);
      } else {
        throw new Error('Invalid startDate format');
      }
      
      if (insertNotice.endDate instanceof Date) {
        endDate = insertNotice.endDate;
      } else if (typeof insertNotice.endDate === 'string') {
        endDate = new Date(insertNotice.endDate);
      } else {
        throw new Error('Invalid endDate format');
      }
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }
      
      const notice: Notice = { 
        id,
        title: insertNotice.title.trim(),
        content: insertNotice.content.trim(),
        priority: insertNotice.priority as "high" | "medium" | "low",
        startDate: startDate,
        endDate: endDate,
        active: insertNotice.active !== false, // Default para true
        createdAt: now, 
        updatedAt: now
      };
      
      this.notices.set(id, notice);
      
      console.log(`✅ Storage: Aviso ${id} criado com sucesso:`, {
        id: notice.id,
        title: notice.title,
        priority: notice.priority,
        active: notice.active,
        startDate: notice.startDate.toISOString(),
        endDate: notice.endDate.toISOString()
      });
      
      return notice;
    } catch (error) {
      console.error('❌ Storage: Erro ao criar aviso:', error);
      throw error;
    }
  }

// ✅ CORREÇÃO: UpdateNotice com validação
  async updateNotice(notice: Notice): Promise<Notice> {
    try {
      console.log(`📝 Storage: Atualizando aviso ${notice.id}`);
      
      if (!this.notices.has(notice.id)) {
        throw new Error(`Notice with id ${notice.id} not found`);
      }
      
      // ✅ Validar dados básicos
      if (!notice.title || notice.title.trim() === '') {
        throw new Error('Title is required and cannot be empty');
      }
      
      if (!notice.content || notice.content.trim() === '') {
        throw new Error('Content is required and cannot be empty');
      }
      
      const updatedNotice = { 
        ...notice, 
        title: notice.title.trim(),
        content: notice.content.trim(),
        updatedAt: new Date() 
      };
      
      this.notices.set(notice.id, updatedNotice);
      
      console.log(`✅ Storage: Aviso ${notice.id} atualizado com sucesso`);
      return updatedNotice;
    } catch (error) {
      console.error(`❌ Storage: Erro ao atualizar aviso ${notice.id}:`, error);
      throw error;
    }
  }


   // ✅ CORREÇÃO: DeleteNotice com logging
  async deleteNotice(id: number): Promise<boolean> {
    try {
      console.log(`🗑️ Storage: Deletando aviso ${id}`);
      
      const existed = this.notices.has(id);
      const deleted = this.notices.delete(id);
      
      if (deleted) {
        console.log(`✅ Storage: Aviso ${id} deletado com sucesso`);
      } else {
        console.log(`⚠️ Storage: Aviso ${id} não encontrado para deletar`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ Storage: Erro ao deletar aviso ${id}:`, error);
      return false;
    }
  }
*/
// ✅ Notice methods - VERSÃO CORRIGIDA COMPLETA
  async getNotices(): Promise<Notice[]> {
    const noticesList = Array.from(this.notices.values());
    console.log(`📢 Storage: Retornando ${noticesList.length} avisos`);
    return noticesList;
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    const notice = this.notices.get(id);
    console.log(`📢 Storage: Buscando aviso ${id} - ${notice ? 'encontrado' : 'não encontrado'}`);
    return notice;
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    try {
      const id = this.currentNoticeId++;
      const now = new Date();
      
      console.log('📢 Storage: Criando aviso:', {
        id,
        title: insertNotice.title,
        priority: insertNotice.priority,
        startDate: insertNotice.startDate,
        endDate: insertNotice.endDate,
        active: insertNotice.active
      });
      
      // ✅ Validação adicional de dados
      if (!insertNotice.title || insertNotice.title.trim() === '') {
        throw new Error('Title is required and cannot be empty');
      }
      
      if (!insertNotice.content || insertNotice.content.trim() === '') {
        throw new Error('Content is required and cannot be empty');
      }
      
      if (!['high', 'medium', 'low'].includes(insertNotice.priority)) {
        throw new Error('Priority must be high, medium, or low');
      }
      
      // ✅ Validação de datas
      let startDate: Date;
      let endDate: Date;
      
      if (insertNotice.startDate instanceof Date) {
        startDate = insertNotice.startDate;
      } else if (typeof insertNotice.startDate === 'string') {
        startDate = new Date(insertNotice.startDate);
      } else {
        throw new Error('Invalid startDate format');
      }
      
      if (insertNotice.endDate instanceof Date) {
        endDate = insertNotice.endDate;
      } else if (typeof insertNotice.endDate === 'string') {
        endDate = new Date(insertNotice.endDate);
      } else {
        throw new Error('Invalid endDate format');
      }
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      if (startDate >= endDate) {
        throw new Error('Start date must be before end date');
      }
      
      const notice: Notice = { 
        id,
        title: insertNotice.title.trim(),
        content: insertNotice.content.trim(),
        priority: insertNotice.priority as "high" | "medium" | "low",
        startDate: startDate,
        endDate: endDate,
        active: insertNotice.active !== false, // Default para true
        createdAt: now, 
        updatedAt: now
      };
      
      this.notices.set(id, notice);
      
      console.log(`✅ Storage: Aviso ${id} criado com sucesso:`, {
        id: notice.id,
        title: notice.title,
        priority: notice.priority,
        active: notice.active,
        startDate: notice.startDate.toISOString(),
        endDate: notice.endDate.toISOString()
      });
      
      return notice;
    } catch (error) {
      console.error('❌ Storage: Erro ao criar aviso:', error);
      throw error;
    }
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    try {
      console.log(`📝 Storage: Atualizando aviso ${notice.id}`);
      
      if (!this.notices.has(notice.id)) {
        throw new Error(`Notice with id ${notice.id} not found`);
      }
      
      // ✅ Validar dados básicos
      if (!notice.title || notice.title.trim() === '') {
        throw new Error('Title is required and cannot be empty');
      }
      
      if (!notice.content || notice.content.trim() === '') {
        throw new Error('Content is required and cannot be empty');
      }
      
      const updatedNotice = { 
        ...notice, 
        title: notice.title.trim(),
        content: notice.content.trim(),
        updatedAt: new Date() 
      };
      
      this.notices.set(notice.id, updatedNotice);
      
      console.log(`✅ Storage: Aviso ${notice.id} atualizado com sucesso`);
      return updatedNotice;
    } catch (error) {
      console.error(`❌ Storage: Erro ao atualizar aviso ${notice.id}:`, error);
      throw error;
    }
  }

  async deleteNotice(id: number): Promise<boolean> {
    try {
      console.log(`🗑️ Storage: Deletando aviso ${id}`);
      
      const existed = this.notices.has(id);
      const deleted = this.notices.delete(id);
      
      if (deleted) {
        console.log(`✅ Storage: Aviso ${id} deletado com sucesso`);
      } else {
        console.log(`⚠️ Storage: Aviso ${id} não encontrado para deletar`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ Storage: Erro ao deletar aviso ${id}:`, error);
      return false;
    }
  }
  // Document methods
  async getDocuments(): Promise<PDFDocument[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    const id = this.currentDocumentId++;
    const document: PDFDocument = { 
      id,
      title: insertDocument.title,
      url: insertDocument.url,
      type: insertDocument.type as "plasa" | "bono" | "escala" | "cardapio",
      category: (insertDocument.category as "oficial" | "praca") ?? null,
      active: insertDocument.active ?? true,
      uploadDate: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    this.documents.set(document.id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Duty Officers methods
  async getDutyOfficers(): Promise<DutyOfficers | null> {
    return this.dutyOfficers;
  }

  async updateDutyOfficers(officers: InsertDutyOfficers): Promise<DutyOfficers> {
    const updatedOfficers: DutyOfficers = {
      id: 1, // Sempre ID 1 pois só temos um registro
      officerName: officers.officerName || "",
      masterName: officers.masterName || "",
      updatedAt: new Date()
    };

    this.dutyOfficers = updatedOfficers;
    console.log('👮 Oficiais de serviço atualizados:', {
      oficial: updatedOfficers.officerName,
      contramestre: updatedOfficers.masterName
    });
    
    return updatedOfficers;
  }

  // Military Personnel methods
  async getMilitaryPersonnel(): Promise<MilitaryPersonnel[]> {
    return Array.from(this.militaryPersonnel.values());
  }

  async getMilitaryPersonnelByType(type: "officer" | "master"): Promise<MilitaryPersonnel[]> {
    return Array.from(this.militaryPersonnel.values()).filter(p => p.type === type);
  }

  async createMilitaryPersonnel(personnel: InsertMilitaryPersonnel): Promise<MilitaryPersonnel> {
    const id = this.currentMilitaryPersonnelId++;
    const newPersonnel: MilitaryPersonnel = {
      id,
      name: personnel.name,
      type: personnel.type as "officer" | "master",
      rank: personnel.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
      specialty: personnel.specialty || null,
      fullRankName: personnel.fullRankName,
      active: personnel.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.militaryPersonnel.set(id, newPersonnel);
    return newPersonnel;
  }

  async updateMilitaryPersonnel(personnel: MilitaryPersonnel): Promise<MilitaryPersonnel> {
    const updatedPersonnel = { ...personnel, updatedAt: new Date() };
    this.militaryPersonnel.set(personnel.id, updatedPersonnel);
    return updatedPersonnel;
  }

  async deleteMilitaryPersonnel(id: number): Promise<boolean> {
    return this.militaryPersonnel.delete(id);
  }
}

function createStorage(): IStorage {
  console.log('🔍 Verificando configuração de storage...');
  
  // Verificar variável de ambiente
  const dbUrl = process.env.DATABASE_URL;
  console.log('📊 DATABASE_URL:', dbUrl ? 'ENCONTRADA' : 'NÃO ENCONTRADA');
  
  if (dbUrl) {
    try {
      console.log('🔗 DATABASE_URL detectada - usando PostgreSQL');
      console.log('📊 URL:', dbUrl.replace(/:[^:]*@/, ':***@'));
      return new DatabaseStorage();
    } catch (error) {
      console.error('❌ Erro ao conectar PostgreSQL:', error);
      console.log('🔄 Voltando para MemStorage');
    }
  } else {
    console.log('⚠️ DATABASE_URL não encontrada');
    console.log('💾 Usando MemStorage (dados serão perdidos ao reiniciar)');
  }
  
  return new MemStorage();
}

// FORÇAR PostgreSQL (para teste)
export const storage = new DatabaseStorage();