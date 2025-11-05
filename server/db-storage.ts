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
import { logger } from "./utils/logger";

// Padrão que aceita APENAS patentes militares válidas seguidas de especialidade opcional
// Patentes: 1T, 2T, CT, CC, CF, CMG, CA (oficiais) | 1SG, 2SG, 3SG, CB, SO, MN, SD (praças)
// Formato: "1T (IM) NOME" ou "1T NOME"
const DUTY_PERSON_PATTERN = /^((?:1T|2T|CT|CC|CF|CMG|CA|1SG|2SG|3SG|CB|SO|MN|SD)(?:\s*\([A-Z0-9-]+\))?)\s+(.+)$/;

type ParsedDutyPerson = {
  name: string;
  rank?: string;
};

const normalizeRankSpacing = (value: string): string => {
  return value
    .replace(/\s+/g, " ")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
};

const parseDutyPerson = (value: string | null | undefined): ParsedDutyPerson => {
  if (!value) {
    return { name: "" };
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return { name: "" };
  }

  const upperValue = trimmed.toUpperCase();
  const match = upperValue.match(DUTY_PERSON_PATTERN);

  if (match) {
    return {
      rank: normalizeRankSpacing(match[1]),
      name: normalizeRankSpacing(match[2])
    };
  }

  return { name: normalizeRankSpacing(upperValue) };
};

const sanitizeDutyName = (value: string | null | undefined): string => {
  return parseDutyPerson(value).name;
};

const normalizeDutyRank = (
  value: string | null | undefined,
  fallback?: string | null | undefined
): string | undefined => {
  const candidates = [value, fallback];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }

    const trimmed = candidate.trim();
    if (!trimmed) {
      continue;
    }

    return normalizeRankSpacing(trimmed.toUpperCase());
  }

  return undefined;
};

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

    logger.info('🔗 PostgreSQL DatabaseStorage initialized');
    logger.info('📊 Connected to:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
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
    logger.database('Buscando avisos');

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

      logger.database(`${notices.length} avisos encontrados`);
      return notices;

    } catch (error) {
      logger.error('Erro ao buscar avisos', error);
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
      logger.error(`Erro ao buscar aviso ${id}`, error);
      return undefined;
    }
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    logger.database(`Criando aviso: ${insertNotice.title}`);

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

      logger.success(`Aviso ${notice.id} criado`);
      return notice;

    } catch (error) {
      logger.error('Erro ao criar aviso', error);
      throw error;
    }
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    logger.database(`Atualizando aviso ${notice.id}`);

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

      logger.success(`Aviso ${notice.id} atualizado`);
      return updated;

    } catch (error) {
      logger.error(`Erro ao atualizar aviso ${notice.id}`, error);
      throw error;
    }
  }

  async deleteNotice(id: number): Promise<boolean> {
    logger.database(`Deletando aviso ${id}`);

    try {
      const result = await this.pool.query('DELETE FROM notices WHERE id = $1', [id]);
      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        logger.success(`Aviso ${id} deletado`);
      } else {
        logger.warn(`Aviso ${id} não encontrado`);
      }

      return deleted;

    } catch (error) {
      logger.error(`Erro ao deletar aviso ${id}`, error);
      return false;
    }
  }

  // ===== DOCUMENTS =====
  async getDocuments(): Promise<PDFDocument[]> {
    try {
      const result = await this.pool.query('SELECT * FROM documents ORDER BY upload_date DESC');

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        unit: typeof row.unit === 'string' ? (row.unit as "EAGM" | "1DN") : undefined,
        active: row.active,
        uploadDate: new Date(row.upload_date),
        tags: Array.isArray(row.tags) ? row.tags : []
      }));
    } catch (error) {
      logger.error('Erro ao buscar documentos', error);
      return [];
    }
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM documents WHERE id = $1', [id]);
      const row = result.rows[0];

      return row ? {
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        unit: typeof row.unit === 'string' ? (row.unit as "EAGM" | "1DN") : undefined,
        active: row.active,
        uploadDate: new Date(row.upload_date),
        tags: Array.isArray(row.tags) ? row.tags : []
      } : undefined;
    } catch (error) {
      logger.error(`Erro ao buscar documento ${id}`, error);
      return undefined;
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    try {
      const result = await this.pool.query(
        `INSERT INTO documents (title, url, type, category, unit, active, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          insertDocument.title,
          insertDocument.url,
          insertDocument.type,
          insertDocument.category ?? null,
          insertDocument.unit ?? null,
          insertDocument.active ?? true,
          Array.isArray(insertDocument.tags) ? insertDocument.tags : []
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        unit: typeof row.unit === 'string' ? (row.unit as "EAGM" | "1DN") : undefined,
        active: row.active,
        uploadDate: new Date(row.upload_date),
        tags: Array.isArray(row.tags) ? row.tags : []
      };
    } catch (error) {
      logger.error('Erro ao criar documento', error);
      throw error;
    }
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    try {
      const result = await this.pool.query(
        `UPDATE documents
         SET title = $1, url = $2, type = $3, category = $4, unit = $5, active = $6, tags = $7
         WHERE id = $8
         RETURNING *`,
        [
          document.title,
          document.url,
          document.type,
          document.category,
          document.unit ?? null,
          document.active,
          Array.isArray(document.tags) ? document.tags : [],
          document.id
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        unit: typeof row.unit === 'string' ? (row.unit as "EAGM" | "1DN") : undefined,
        active: row.active,
        uploadDate: new Date(row.upload_date),
        tags: Array.isArray(row.tags) ? row.tags : []
      };
    } catch (error) {
      logger.error(`Erro ao atualizar documento ${document.id}`, error);
      throw error;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM documents WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      logger.error(`Erro ao deletar documento ${id}`, error);
      return false;
    }
  }

  // ===== DUTY OFFICERS =====
  async getDutyOfficers(): Promise<DutyOfficers | null> {
    logger.database('Buscando oficiais de serviço');

    try {
      const result = await this.pool.query(
        `SELECT id, officer_name, officer_rank, master_name, master_rank, valid_from, updated_at
         FROM duty_assignments
         ORDER BY valid_from DESC, updated_at DESC
         LIMIT 1`
      );

      if (result.rows.length === 0) {
        logger.database('Nenhum registro de serviço encontrado');
        return null;
      }

      const row = result.rows[0];
      const officers: DutyOfficers = {
        id: row.id,
        officerName: sanitizeDutyName(row.officer_name),
        masterName: sanitizeDutyName(row.master_name),
        officerRank: normalizeDutyRank(row.officer_rank),
        masterRank: normalizeDutyRank(row.master_rank),
        validFrom: new Date(row.valid_from),
        updatedAt: new Date(row.updated_at),
      };

      logger.database('Registro atual de serviço localizado');
      return officers;
    } catch (error) {
      logger.error('Erro ao buscar oficiais de serviço', error);
      return null;
    }
  }

  async updateDutyOfficers(officers: InsertDutyOfficers): Promise<DutyOfficers> {
    logger.database('Registrando oficial/contramestre do dia');

    try {
      const validFromDate = officers.validFrom ?? new Date();
      const parsedOfficer = parseDutyPerson(officers.officerName);
      const parsedMaster = parseDutyPerson(officers.masterName);
      const sanitizedOfficerName = parsedOfficer.name;
      const sanitizedMasterName = parsedMaster.name;
      const normalizedOfficerRank = normalizeDutyRank(
        officers.officerRank,
        parsedOfficer.rank
      ) ?? null;
      const normalizedMasterRank = normalizeDutyRank(
        officers.masterRank,
        parsedMaster.rank
      ) ?? null;

      const result = await this.pool.query(
        `INSERT INTO duty_assignments (officer_name, officer_rank, master_name, master_rank, valid_from, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id, officer_name, officer_rank, master_name, master_rank, valid_from, updated_at`,
        [
          sanitizedOfficerName,
          normalizedOfficerRank,
          sanitizedMasterName,
          normalizedMasterRank,
          validFromDate,
        ]
      );

      const row = result.rows[0];
      const updatedOfficers: DutyOfficers = {
        id: row.id,
        officerName: sanitizeDutyName(row.officer_name),
        masterName: sanitizeDutyName(row.master_name),
        officerRank: normalizeDutyRank(row.officer_rank),
        masterRank: normalizeDutyRank(row.master_rank),
        validFrom: new Date(row.valid_from),
        updatedAt: new Date(row.updated_at),
      };

      logger.success('Registro de serviço criado');
      return updatedOfficers;
    } catch (error) {
      logger.error('Erro ao atualizar oficiais de serviço', error);
      throw error;
    }
  }

  // ===== MILITARY PERSONNEL (implementação básica) =====
async getMilitaryPersonnel(): Promise<MilitaryPersonnel[]> {
    try {
      logger.database('Buscando pessoal militar');
      const result = await this.pool.query('SELECT * FROM military_personnel WHERE active = true ORDER BY type, rank, name');

      const personnel = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      logger.database(`${personnel.length} militares encontrados`);
      return personnel;
    } catch (error) {
      logger.error('Erro ao buscar militares', error);
      return [];
    }
  }



  async getMilitaryPersonnelByType(type: "officer" | "master"): Promise<MilitaryPersonnel[]> {
    try {
      logger.database(`Buscando ${type}s`);
      const result = await this.pool.query(
        'SELECT * FROM military_personnel WHERE type = $1 AND active = true ORDER BY rank, name',
        [type]
      );

      const personnel = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      logger.database(`${personnel.length} ${type}s encontrados`);
      return personnel;
    } catch (error) {
      logger.error(`Erro ao buscar ${type}s`, error);
      return [];
    }
  }

 async createMilitaryPersonnel(personnel: InsertMilitaryPersonnel): Promise<MilitaryPersonnel> {
    try {
      logger.database(`Criando ${personnel.type}: ${personnel.name}`);

      const result = await this.pool.query(
        `INSERT INTO military_personnel (name, type, rank, specialty, full_rank_name, active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          personnel.name,
          personnel.type,
          personnel.rank,
          personnel.specialty,
          personnel.fullRankName,
          personnel.active !== false
        ]
      );

      const row = result.rows[0];
      const created = {
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      logger.success(`${personnel.type} ${created.id} criado`);
      return created;
    } catch (error) {
      logger.error('Erro ao criar militar', error);
      throw error;
    }
  }

 async updateMilitaryPersonnel(personnel: MilitaryPersonnel): Promise<MilitaryPersonnel> {
    try {
      logger.database(`Atualizando ${personnel.type} ${personnel.id}`);

      const result = await this.pool.query(
        `UPDATE military_personnel
         SET name = $1, type = $2, rank = $3, specialty = $4, full_rank_name = $5, active = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
          personnel.name,
          personnel.type,
          personnel.rank,
          personnel.specialty,
          personnel.fullRankName,
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
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      logger.success(`${personnel.type} ${personnel.id} atualizado`);
      return updated;
    } catch (error) {
      logger.error(`Erro ao atualizar militar ${personnel.id}`, error);
      throw error;
    }
  }

   async deleteMilitaryPersonnel(id: number): Promise<boolean> {
    try {
      logger.database(`Removendo militar ${id}`);

      // Soft delete - marcar como inativo em vez de deletar
      const result = await this.pool.query(
        'UPDATE military_personnel SET active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );

      const deleted = (result.rowCount || 0) > 0;

      if (deleted) {
        logger.success(`Militar ${id} removido (soft delete)`);
      } else {
        logger.warn(`Militar ${id} não encontrado`);
      }

      return deleted;
    } catch (error) {
      logger.error(`Erro ao remover militar ${id}`, error);
      return false;
    }
  }
}