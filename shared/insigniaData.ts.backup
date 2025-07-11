/**
 * Sistema de Insígnias Militares
 * Mapeia graduações e especialidades para suas respectivas imagens de insígnias
 */

export interface Insignia {
  id: number;
  descricao: string;
  imagem: string;
  rank: string;
  specialty: string;
}

// Base de dados das insígnias disponíveis
export const INSIGNIA_DATABASE: Insignia[] = [
  // Capitão de Mar e Guerra
  { id: 1, descricao: "CMG (IM)", imagem: "insignias/cmg_im.png", rank: "cmg", specialty: "im" },
  { id: 15, descricao: "CMG (RM1-T)", imagem: "insignias/CMG_T_RM1.png", rank: "cmg", specialty: "rm1-t" },
  
  // Capitão de Fragata
  { id: 2, descricao: "CF (IM)", imagem: "insignias/cf_im.png", rank: "cf", specialty: "im" },
  { id: 3, descricao: "CF (T)", imagem: "insignias/cf_t.png", rank: "cf", specialty: "t" },
  { id: 16, descricao: "CF (RM1-T)", imagem: "insignias/CF_T_RM1.png", rank: "cf", specialty: "rm1-t" },
  
  // Capitão de Corveta
  { id: 4, descricao: "CC (T)", imagem: "insignias/cc_t.png", rank: "cc", specialty: "t" },
  { id: 5, descricao: "CC (IM)", imagem: "insignias/cc_im.png", rank: "cc", specialty: "im" },
  { id: 17, descricao: "CC (RM1-T)", imagem: "insignias/CC_T_RM1.png", rank: "cc", specialty: "rm1-t" },
  
  // Capitão-Tenente
  { id: 6, descricao: "CT (T)", imagem: "insignias/ct_t.png", rank: "ct", specialty: "t" },
  { id: 7, descricao: "CT (IM)", imagem: "insignias/ct_im.png", rank: "ct", specialty: "im" },
  { id: 8, descricao: "CT (QC-IM)", imagem: "insignias/ct_qc_im.png", rank: "ct", specialty: "qc-im" },
  { id: 9, descricao: "CT (RM2-T)", imagem: "insignias/ct_rm2_t.png", rank: "ct", specialty: "rm2-t" },
  
  // Primeiro-Tenente
  { id: 10, descricao: "1T (RM2-T)", imagem: "insignias/1t_c.png", rank: "1t", specialty: "rm2-t" },
  { id: 11, descricao: "1T (T)", imagem: "insignias/1t_t.png", rank: "1t", specialty: "t" },
  { id: 12, descricao: "1T (IM)", imagem: "insignias/1t_im.png", rank: "1t", specialty: "im" },
  { id: 18, descricao: "1T (QC-IM)", imagem: "insignias/1t_qc_im.png", rank: "1t", specialty: "qc-im" },
  { id: 19, descricao: "1T (AA)", imagem: "insignias/1t_aa.png", rank: "1t", specialty: "aa" },
  
  // Segundo-Tenente
  { id: 13, descricao: "2T (RM2-T)", imagem: "insignias/2t_c.png", rank: "2t", specialty: "rm2-t" },
  { id: 14, descricao: "2T (AA)", imagem: "insignias/2t_aa.png", rank: "2t", specialty: "aa" },
  { id: 20, descricao: "2T (IM)", imagem: "insignias/2t_im.png", rank: "2t", specialty: "im" },
  
  // Sargentos
  { id: 21, descricao: "1SG (PD)", imagem: "insignias/1sg_pd.png", rank: "1sg", specialty: "pd" },
  { id: 22, descricao: "1SG (CL)", imagem: "insignias/1sg_cl.png", rank: "1sg", specialty: "cl" },
  { id: 23, descricao: "1SG (ES)", imagem: "insignias/1sg_es.png", rank: "1sg", specialty: "es" },
  { id: 24, descricao: "1SG (EP)", imagem: "insignias/1sg_ep.png", rank: "1sg", specialty: "ep" },
  { id: 25, descricao: "1SG (PL)", imagem: "insignias/1sg_pl.png", rank: "1sg", specialty: "pl" },
  { id: 26, descricao: "1SG (QI)", imagem: "insignias/1sg_qi.png", rank: "1sg", specialty: "qi" },
  
  { id: 27, descricao: "2SG (PD)", imagem: "insignias/2sg_pd.png", rank: "2sg", specialty: "pd" },
  { id: 28, descricao: "2SG (CL)", imagem: "insignias/2sg_cl.png", rank: "2sg", specialty: "cl" },
  { id: 29, descricao: "2SG (ES)", imagem: "insignias/2sg_es.png", rank: "2sg", specialty: "es" },
  
  { id: 30, descricao: "3SG (PD)", imagem: "insignias/3sg_pd.png", rank: "3sg", specialty: "pd" },
  { id: 31, descricao: "3SG (CL)", imagem: "insignias/3sg_cl.png", rank: "3sg", specialty: "cl" },
  { id: 32, descricao: "3SG (ES)", imagem: "insignias/3sg_es.png", rank: "3sg", specialty: "es" }
];

/**
 * Busca insígnia por graduação e especialidade
 */
export function getInsigniaByRankAndSpecialty(rank: string, specialty: string | null): Insignia | undefined {
  if (!specialty) return undefined;
  
  return INSIGNIA_DATABASE.find(insignia => 
    insignia.rank === rank && insignia.specialty === specialty
  );
}

/**
 * Busca insígnia apenas por graduação (fallback quando não há especialidade)
 */
export function getInsigniaByRank(rank: string): Insignia | undefined {
  return INSIGNIA_DATABASE.find(insignia => insignia.rank === rank);
}

/**
 * Obtém caminho da imagem da insígnia para um militar
 */
export function getMilitaryInsigniaImage(rank: string, specialty: string | null): string | null {
  const insignia = getInsigniaByRankAndSpecialty(rank, specialty) || getInsigniaByRank(rank);
  return insignia ? insignia.imagem : null;
}

/**
 * Obtém descrição completa da insígnia
 */
export function getMilitaryInsigniaDescription(rank: string, specialty: string | null): string | null {
  const insignia = getInsigniaByRankAndSpecialty(rank, specialty) || getInsigniaByRank(rank);
  return insignia ? insignia.descricao : null;
}

/**
 * Verifica se existe insígnia para determinada combinação
 */
export function hasInsignia(rank: string, specialty: string | null): boolean {
  return getMilitaryInsigniaImage(rank, specialty) !== null;
}

// Mapeamento de especialidades para descrições legíveis
export const SPECIALTY_NAMES = {
  'im': 'Intendência da Marinha',
  't': 'Técnico',
  'qc-im': 'Quadro Complementar - Intendência',
  'rm2-t': 'Reserva da Marinha 2ª Classe - Técnico',
  'rm1-t': 'Reserva da Marinha 1ª Classe - Técnico',
  'aa': 'Administração e Apoio',
  'pd': 'Praticante de Depósito',
  'cl': 'Calafate',
  'es': 'Especialista',
  'ep': 'Especialista de Proa',
  'pl': 'Especialista de Popa',
  'qi': 'Quadro de Informações'
} as const;

export type SpecialtyCode = keyof typeof SPECIALTY_NAMES;