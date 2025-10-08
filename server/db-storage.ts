// server/db-storage.ts - VERSÃO CORRIGIDA PARA TIPOS
import { Pool } from 'pg';
import { IStorage } from "./storage";
import { 
  type User, type InsertUser, 
  type Notice, type InsertNotice,
  type PDFDocument, type InsertDocument,
  type DutyOfficers, type InsertDutyOfficers,
  type MilitaryPersonnel, type InsertMilitaryPersonnel
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set in environment variables');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false, // Para desenvolvimento local
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('🔗 PostgreSQL DatabaseStorage initialized');
    console.log('📊 Connected to:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
  }

  private coerceDocumentType(value: unknown): PDFDocument['type'] {
    return value === 'plasa' || value === 'cardapio' || value === 'escala' ? value : 'escala';
  }

  private coerceDocumentCategory(value: unknown): PDFDocument['category'] {
    return value === 'oficial' || value === 'praca' ? value : null;
  }

  private coerceDocumentUnit(value: unknown): PDFDocument['unit'] | undefined {
    return value === 'EAGM' || value === '1DN' ? value : undefined;
  }

  private coerceTags(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((tag): tag is string => typeof tag === 'string');
  }

  private mapDocumentRow(row: Record<string, unknown>): PDFDocument {
    const document: PDFDocument = {
      id: Number(row.id),
      title: typeof row.title === 'string' ? row.title : String(row.title ?? ''),
      url: typeof row.url === 'string' ? row.url : String(row.url ?? ''),
      type: this.coerceDocumentType(row.type),
      category: this.coerceDocumentCategory(row.category),
      active: typeof row.active === 'boolean' ? row.active : true,
      uploadDate: row.upload_date ? new Date(row.upload_date as string | number | Date) : new Date(),
      tags: this.coerceTags(row.tags)
    };

    const unit = this.coerceDocumentUnit(row.unit);
    if (unit) {
      document.unit = unit;
    }

    return document;
  }

  // ===== USERS =====
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? {
      id: row.id,
      username: row.username,
      password: row.password
    } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const row = result.rows[0];
    return row ? {
      id: row.id,
      username: row.username,
      password: row.password
    } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [insertUser.username, insertUser.password]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      password: row.password
    };
  }

  // ===== NOTICES =====
  async getNotices(): Promise<Notice[]> {
    console.log('📢 PostgreSQL: Buscando avisos...');
    
    try {
      const result = await this.pool.query('SELECT * FROM notices ORDER BY created_at DESC');
      
      const notices: Notice[] = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      }));

      console.log(`📢 PostgreSQL: ${notices.length} avisos encontrados`);
      return notices;
      
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar avisos:', error);
      throw error;
    }
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM notices WHERE id = $1', [id]);
      const row = result.rows[0];
      
      return row ? {
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      } : undefined;
      
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao buscar aviso ${id}:`, error);
      return undefined;
    }
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    console.log('📢 PostgreSQL: Criando aviso:', insertNotice.title);
    
    try {
      const result = await this.pool.query(
        `INSERT INTO notices (title, content, priority, start_date, end_date, active) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          insertNotice.title,
          insertNotice.content,
          insertNotice.priority,
          insertNotice.startDate,
          insertNotice.endDate,
          insertNotice.active
        ]
      );

      const row = result.rows[0];
      const notice: Notice = {
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      };

      console.log(`✅ PostgreSQL: Aviso ${notice.id} criado com sucesso`);
      return notice;
      
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao criar aviso:', error);
      throw error;
    }
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    console.log(`📝 PostgreSQL: Atualizando aviso ${notice.id}`);
    
    try {
      const result = await this.pool.query(
        `UPDATE notices 
         SET title = $1, content = $2, priority = $3, start_date = $4, end_date = $5, active = $6, updated_at = NOW()
         WHERE id = $7 
         RETURNING *`,
        [
          notice.title,
          notice.content,
          notice.priority,
          notice.startDate,
          notice.endDate,
          notice.active,
          notice.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Notice with id ${notice.id} not found`);
      }

      const row = result.rows[0];
      const updated: Notice = {
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      };

      console.log(`✅ PostgreSQL: Aviso ${notice.id} atualizado`);
      return updated;
      
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao atualizar aviso ${notice.id}:`, error);
      throw error;
    }
  }

  async deleteNotice(id: number): Promise<boolean> {
    console.log(`🗑️ PostgreSQL: Deletando aviso ${id}`);
    
    try {
      const result = await this.pool.query('DELETE FROM notices WHERE id = $1', [id]);
      const deleted = (result.rowCount || 0) > 0;
      
      if (deleted) {
        console.log(`✅ PostgreSQL: Aviso ${id} deletado`);
      } else {
        console.log(`⚠️ PostgreSQL: Aviso ${id} não encontrado`);
      }
      
      return deleted;
      
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao deletar aviso ${id}:`, error);
      return false;
    }
  }

  // ===== DOCUMENTS =====
  async getDocuments(): Promise<PDFDocument[]> {
    try {
      const result = await this.pool.query('SELECT * FROM documents ORDER BY upload_date DESC');

      return result.rows.map(row => this.mapDocumentRow(row));
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar documentos:', error);
      return [];
    }
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM documents WHERE id = $1', [id]);
      const row = result.rows[0];
      
      return row ? this.mapDocumentRow(row) : undefined;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao buscar documento ${id}:`, error);
      return undefined;
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    try {
      const result = await this.pool.query(
        `INSERT INTO documents (title, url, type, category, active, tags)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          insertDocument.title,
          insertDocument.url,
          insertDocument.type,
          insertDocument.category ?? null,
          insertDocument.active ?? true,
          Array.isArray(insertDocument.tags) ? insertDocument.tags : []
        ]
      );

      const row = result.rows[0];
      return this.mapDocumentRow(row);
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao criar documento:', error);
      throw error;
    }
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    try {
      const result = await this.pool.query(
        `UPDATE documents
         SET title = $1, url = $2, type = $3, category = $4, active = $5, tags = $6
         WHERE id = $7
         RETURNING *`,
        [
          document.title,
          document.url,
          document.type,
          document.category,
          document.active,
          Array.isArray(document.tags) ? document.tags : [],
          document.id
        ]
      );

      const row = result.rows[0];
      return this.mapDocumentRow(row);
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao atualizar documento ${document.id}:`, error);
      throw error;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM documents WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao deletar documento ${id}:`, error);
      return false;
    }
  }

  // ===== DUTY OFFICERS =====
  async getDutyOfficers(): Promise<DutyOfficers | null> {
    console.log('👮 PostgreSQL: Buscando oficiais de serviço (sistema unificado)...');
    
    try {
      // 🔥 NOVO SISTEMA: Buscar militares marcados como duty_role
      const result = await this.pool.query(`
        SELECT 
          id,
          name,
          rank,
          specialty,
          type,
          duty_role,
          updated_at
        FROM military_personnel 
        WHERE duty_role IS NOT NULL
        ORDER BY type DESC, rank ASC
      `);
      
      if (result.rows.length === 0) {
        console.log('👮 PostgreSQL: Nenhum oficial de serviço encontrado');
        return null;
      }

      const officer = result.rows.find(row => row.duty_role === 'officer');
      const master = result.rows.find(row => row.duty_role === 'master');
      
      // Formatar nomes no padrão: "1T (RM2-T) KARINE"
      const officerName = officer ? 
        `${officer.rank.toUpperCase()}${officer.specialty ? ` (${officer.specialty.toUpperCase()})` : ''} ${officer.name}` : '';
      
      const masterName = master ?
        `${master.rank.toUpperCase()}${master.specialty ? ` (${master.specialty.toUpperCase()})` : ''} ${master.name}` : '';

      console.log('👮 PostgreSQL: Oficiais encontrados (sistema unificado):', {
        officerName,
        masterName
      });
      
      return {
        id: 1, // ID fixo para compatibilidade
        officerId: typeof officer?.id === 'number' ? officer.id : null,
        masterId: typeof master?.id === 'number' ? master.id : null,
        officerName,
        masterName,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar oficiais de serviço:', error);
      return null;
    }
  }

  async updateDutyOfficers(officers: InsertDutyOfficers): Promise<DutyOfficers> {
    console.log('📝 PostgreSQL: Atualizando oficiais de serviço (sistema unificado):', officers);
    
    try {
      // 🔥 NOVO SISTEMA: Limpar duty_role de todos os militares
      await this.pool.query('UPDATE military_personnel SET duty_role = NULL');
      
      // Extrair informações dos nomes formatados (ex: "1T (RM2-T) KARINE")
      const parseOfficerName = (formattedName: string) => {
        if (!formattedName) return null;
        
        // Regex para extrair: "1T (RM2-T) KARINE" -> rank: "1T", specialty: "RM2-T", name: "KARINE"
        const match = formattedName.match(/^(\w+)(?:\s*\(([^)]+)\))?\s+(.+)$/);
        if (!match) return null;
        
        return {
          rank: match[1].toLowerCase(),
          specialty: match[2] || null,
          name: match[3]
        };
      };
      
      let updatedOfficer: Record<string, unknown> | null = null;
      let updatedMaster: Record<string, unknown> | null = null;
      
      // Processar oficial
      if (officers.officerName) {
        const officerInfo = parseOfficerName(officers.officerName);
        if (officerInfo) {
          // 🔥 MELHORADO: Buscar por nome parcial se não encontrar exato
          let result = await this.pool.query(
            `UPDATE military_personnel 
             SET duty_role = 'officer' 
             WHERE UPPER(name) = UPPER($1) AND rank = $2 
             RETURNING *`,
            [officerInfo.name, officerInfo.rank]
          );
          
          if (result.rows.length === 0) {
            // Tentar busca por nome parcial (ex: "ALEXANDRIA" encontra "ALEXANDRIA TESTE")
            console.log(`🔍 Buscando oficial por nome parcial: ${officerInfo.name}`);
            result = await this.pool.query(
              `UPDATE military_personnel 
               SET duty_role = 'officer' 
               WHERE UPPER(name) LIKE '%' || UPPER($1) || '%' AND rank = $2 
               RETURNING *`,
              [officerInfo.name, officerInfo.rank]
            );
          }
          
          if (result.rows.length > 0) {
            updatedOfficer = result.rows[0] as Record<string, unknown>;
            console.log(`✅ Oficial definido: ${officerInfo.rank.toUpperCase()} ${officerInfo.name}`);
          } else {
            console.log(`❌ Oficial não encontrado: ${officerInfo.rank.toUpperCase()} ${officerInfo.name}`);
          }
        }
      }
      
      // Processar contramestre
      if (officers.masterName) {
        const masterInfo = parseOfficerName(officers.masterName);
        if (masterInfo) {
          // 🔥 MELHORADO: Buscar por nome parcial se não encontrar exato
          let result = await this.pool.query(
            `UPDATE military_personnel 
             SET duty_role = 'master' 
             WHERE UPPER(name) = UPPER($1) AND rank = $2 
             RETURNING *`,
            [masterInfo.name, masterInfo.rank]
          );
          
          if (result.rows.length === 0) {
            // Tentar busca por nome parcial
            console.log(`🔍 Buscando contramestre por nome parcial: ${masterInfo.name}`);
            result = await this.pool.query(
              `UPDATE military_personnel 
               SET duty_role = 'master' 
               WHERE UPPER(name) LIKE '%' || UPPER($1) || '%' AND rank = $2 
               RETURNING *`,
              [masterInfo.name, masterInfo.rank]
            );
          }
          
          if (result.rows.length > 0) {
            updatedMaster = result.rows[0] as Record<string, unknown>;
            console.log(`✅ Contramestre definido: ${masterInfo.rank.toUpperCase()} ${masterInfo.name}`);
          } else {
            console.log(`❌ Contramestre não encontrado: ${masterInfo.rank.toUpperCase()} ${masterInfo.name}`);
          }
        }
      }
      
      console.log('✅ PostgreSQL: Sistema unificado atualizado com sucesso');
      
      const officerId = updatedOfficer && typeof updatedOfficer.id === 'number' ? updatedOfficer.id : null;
      const masterId = updatedMaster && typeof updatedMaster.id === 'number' ? updatedMaster.id : null;

      return {
        id: 1,
        officerId,
        masterId,
        officerName: officers.officerName ?? '',
        masterName: officers.masterName ?? '',
        updatedAt: new Date()
      };
      
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao atualizar oficiais de serviço:', error);
      throw error;
    }
  }

  // ===== MILITARY PERSONNEL (implementação básica) =====
async getMilitaryPersonnel(): Promise<MilitaryPersonnel[]> {
    try {
      console.log('🎖️ PostgreSQL: Buscando pessoal militar...');
      const result = await this.pool.query('SELECT * FROM military_personnel WHERE active = true ORDER BY type, rank, name');

      const personnel = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as MilitaryPersonnel['rank'],
        specialty: typeof row.specialty === 'string' ? row.specialty : null,
        fullRankName: row.full_rank_name,
        dutyRole: row.duty_role === 'officer' || row.duty_role === 'master' ? row.duty_role : null,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      console.log(`🎖️ PostgreSQL: ${personnel.length} militares encontrados`);
      return personnel;
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar militares:', error);
      return [];
    }
  }


 
  async getMilitaryPersonnelByType(type: "officer" | "master"): Promise<MilitaryPersonnel[]> {
    try {
      console.log(`🎖️ PostgreSQL: Buscando ${type}s...`);
      const result = await this.pool.query(
        'SELECT * FROM military_personnel WHERE type = $1 AND active = true ORDER BY rank, name',
        [type]
      );

      const personnel = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as MilitaryPersonnel['rank'],
        specialty: typeof row.specialty === 'string' ? row.specialty : null,
        fullRankName: row.full_rank_name,
        dutyRole: row.duty_role === 'officer' || row.duty_role === 'master' ? row.duty_role : null,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      console.log(`🎖️ PostgreSQL: ${personnel.length} ${type}s encontrados`);
      return personnel;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao buscar ${type}s:`, error);
      return [];
    }
  }

 async createMilitaryPersonnel(personnel: InsertMilitaryPersonnel): Promise<MilitaryPersonnel> {
    try {
      console.log(`🎖️ PostgreSQL: Criando ${personnel.type}:`, personnel.name);
      
      const result = await this.pool.query(
        `INSERT INTO military_personnel (name, type, rank, specialty, full_rank_name, duty_role, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          personnel.name,
          personnel.type,
          personnel.rank,
          personnel.specialty ?? null,
          personnel.fullRankName,
          personnel.dutyRole ?? null,
          personnel.active !== false
        ]
      );

      const row = result.rows[0];
      const created = {
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as MilitaryPersonnel['rank'],
        specialty: typeof row.specialty === 'string' ? row.specialty : null,
        fullRankName: row.full_rank_name,
        dutyRole: row.duty_role === 'officer' || row.duty_role === 'master' ? row.duty_role : null,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      console.log(`✅ PostgreSQL: ${personnel.type} ${created.id} criado`);
      return created;
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao criar militar:', error);
      throw error;
    }
  }

 async updateMilitaryPersonnel(personnel: MilitaryPersonnel): Promise<MilitaryPersonnel> {
    try {
      console.log(`🎖️ PostgreSQL: Atualizando ${personnel.type} ${personnel.id}`);
      
      const result = await this.pool.query(
        `UPDATE military_personnel
         SET name = $1, type = $2, rank = $3, specialty = $4, full_rank_name = $5, duty_role = $6, active = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [
          personnel.name,
          personnel.type,
          personnel.rank,
          personnel.specialty ?? null,
          personnel.fullRankName,
          personnel.dutyRole ?? null,
          personnel.active,
          personnel.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Military personnel with id ${personnel.id} not found`);
      }

      const row = result.rows[0];
      const updated = {
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as MilitaryPersonnel['rank'],
        specialty: typeof row.specialty === 'string' ? row.specialty : null,
        fullRankName: row.full_rank_name,
        dutyRole: row.duty_role === 'officer' || row.duty_role === 'master' ? row.duty_role : null,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      console.log(`✅ PostgreSQL: ${personnel.type} ${personnel.id} atualizado`);
      return updated;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao atualizar militar ${personnel.id}:`, error);
      throw error;
    }
  }

   async deleteMilitaryPersonnel(id: number): Promise<boolean> {
    try {
      console.log(`🎖️ PostgreSQL: Removendo militar ${id}`);
      
      // Soft delete - marcar como inativo em vez de deletar
      const result = await this.pool.query(
        'UPDATE military_personnel SET active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
      
      const deleted = (result.rowCount || 0) > 0;
      
      if (deleted) {
        console.log(`✅ PostgreSQL: Militar ${id} removido (soft delete)`);
      } else {
        console.log(`⚠️ PostgreSQL: Militar ${id} não encontrado`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao remover militar ${id}:`, error);
      return false;
    }
  }
}