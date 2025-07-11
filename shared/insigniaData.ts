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
  { id: 1, descricao: "CMG (IM)", imagem: "uploads/insignias/cmg_im.png", rank: "cmg", specialty: "im" },
  { id: 15, descricao: "CMG (RM1-T)", imagem: "uploads/insignias/CMG_T_RM1.png", rank: "cmg", specialty: "rm1-t" },
  
  // Capitão de Fragata
  { id: 2, descricao: "CF (IM)", imagem: "uploads/insignias/cf_im.png", rank: "cf", specialty: "im" },
  { id: 3, descricao: "CF (T)", imagem: "uploads/insignias/cf_t.png", rank: "cf", specialty: "t" },
  { id: 16, descricao: "CF (RM1-T)", imagem: "uploads/insignias/CF_T_RM1.png", rank: "cf", specialty: "rm1-t" },
  
  // Capitão de Corveta
  { id: 4, descricao: "CC (T)", imagem: "uploads/insignias/cc_t.png", rank: "cc", specialty: "t" },
  { id: 5, descricao: "CC (IM)", imagem: "uploads/insignias/cc_im.png", rank: "cc", specialty: "im" },
  { id: 17, descricao: "CC (RM1-T)", imagem: "uploads/insignias/CC_T_RM1.png", rank: "cc", specialty: "rm1-t" },
  
  // Capitão-Tenente
  { id: 6, descricao: "CT (T)", imagem: "uploads/insignias/ct_t.png", rank: "ct", specialty: "t" },
  { id: 7, descricao: "CT (IM)", imagem: "uploads/insignias/ct_im.png", rank: "ct", specialty: "im" },
  { id: 8, descricao: "CT (QC-IM)", imagem: "uploads/insignias/ct_qc_im.png", rank: "ct", specialty: "qc-im" },
  { id: 9, descricao: "CT (RM2-T)", imagem: "uploads/insignias/ct_rm2_t.png", rank: "ct", specialty: "rm2-t" },
  
  // Primeiro-Tenente
  { id: 10, descricao: "1T (RM2-T)", imagem: "uploads/insignias/1t_c.png", rank: "1t", specialty: "rm2-t" },
  { id: 11, descricao: "1T (T)", imagem: "uploads/insignias/1t_t.png", rank: "1t", specialty: "t" },
  { id: 12, descricao: "1T (IM)", imagem: "uploads/insignias/1t_im.png", rank: "1t", specialty: "im" },
  { id: 18, descricao: "1T (QC-IM)", imagem: "uploads/insignias/1t_qc_im.png", rank: "1t", specialty: "qc-im" },
  { id: 19, descricao: "1T (AA)", imagem: "uploads/insignias/1t_aa.png", rank: "1t", specialty: "aa" },
  
  // Segundo-Tenente
  { id: 13, descricao: "2T (RM2-T)", imagem: "uploads/insignias/2t_c.png", rank: "2t", specialty: "rm2-t" },
  { id: 14, descricao: "2T (AA)", imagem: "uploads/insignias/2t_aa.png", rank: "2t", specialty: "aa" },
  { id: 20, descricao: "2T (IM)", imagem: "uploads/insignias/2t_im.png", rank: "2t", specialty: "im" },
  
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
export function getMilitaryInsigniaImage(rank: string, specialty: string | null): string | null {
  if (!rank) return null;
  
  const rankLower = rank.toLowerCase();
  
  // Se tem especialidade, usar: rank_specialty.png
  if (specialty) {
    const specialtyLower = specialty.toLowerCase();
    return `/uploads/insignias/${rankLower}_${specialtyLower}.png`;
  }
  
  // Se não tem especialidade, tentar só com rank
  // Pode usar uma especialidade padrão ou a primeira disponível
  const defaultSpecialties = {
    '1t': 'im',
    '2t': 'im', 
    'ct': 'im',
    '1sg': 'cl',
    '2sg': 'cl',
    '3sg': 'cl'
  };
  
  const defaultSpecialty = defaultSpecialties[rankLower as keyof typeof defaultSpecialties];
  if (defaultSpecialty) {
    return `/uploads/insignias/${rankLower}_${defaultSpecialty}.png`;
  }
  
  return null;
}

/**
 * Obtém a descrição da insígnia
 */
export function getMilitaryInsigniaDescription(rank: string, specialty: string | null): string | null {
  if (!rank) return null;
  
  const rankUpper = rank.toUpperCase();
  const specialtyUpper = specialty?.toUpperCase();
  
  if (specialtyUpper) {
    return `${rankUpper} (${specialtyUpper})`;
  }
  
  return rankUpper;
}

/**
 * Verifica se existe insígnia
 * Retorna true se conseguir gerar um caminho válido
 */
export function hasInsignia(rank: string, specialty: string | null): boolean {
  return getMilitaryInsigniaImage(rank, specialty) !== null;
}

// Opcional: Lista das imagens que você tem (para referência)
export const AVAILABLE_INSIGNIAS = [
  '1t_im.png',
  '1t_c.png',
  '1t_t.png',
  '1t_qc_im.png',
  'ct_im.png',
  'ct_t.png',
  'ct_qc_im.png',
  'ct_rm2_t.png',
  'cc_im.png',
  'cc_t.png',
  'cf_im.png',
  'cf_t.png',
  'cmg_im.png',
  '1sg_es.png',
  // Adicione outras conforme suas imagens
];

/**
 * Função para testar se uma imagem específica existe
 */
export function checkInsigniaExists(rank: string, specialty: string): boolean {
  const filename = `${rank.toLowerCase()}_${specialty.toLowerCase()}.png`;
  return AVAILABLE_INSIGNIAS.includes(filename);
}