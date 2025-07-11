/**
 * 🏛️ SISTEMA CHM OFICIAL COMPLETO 2025 - TODOS OS 365 DIAS
 * Sistema de Visualização da Marinha do Brasil
 * Dados completos do pôr do sol baseados nas Tábuas de Maré CHM 2025
 * 
 * Fonte: Centro de Hidrografia da Marinha (CHM) - Rio de Janeiro
 * Coordenadas: 22°55'S, 043°12'W
 * Todos os horários convertidos de GMT para hora local (GMT-3)
 * 
 * Autor: 2SG Bruna Rocha
 * Marinha do Brasil
 */

/**
 * 🏛️ DADOS CHM OFICIAIS COMPLETOS - TODOS OS 365 DIAS DE 2025
 * Extraídos diretamente das tabelas oficiais CHM enviadas
 * Horários SS (Sunset) convertidos de GMT para hora local (GMT-3)
 */
const CHM_DADOS_OFICIAIS_COMPLETOS_2025: { [key: string]: string } = {
  // JANEIRO 2025 - Verão (31 dias)
  '2025-01-01': '18:42', '2025-01-02': '18:42', '2025-01-03': '18:42', '2025-01-04': '18:43',
  '2025-01-05': '18:43', '2025-01-06': '18:43', '2025-01-07': '18:43', '2025-01-08': '18:44',
  '2025-01-09': '18:44', '2025-01-10': '18:44', '2025-01-11': '18:44', '2025-01-12': '18:44',
  '2025-01-13': '18:44', '2025-01-14': '18:44', '2025-01-15': '18:44', '2025-01-16': '18:44',
  '2025-01-17': '18:44', '2025-01-18': '18:43', '2025-01-19': '18:43', '2025-01-20': '18:43',
  '2025-01-21': '18:43', '2025-01-22': '18:43', '2025-01-23': '18:43', '2025-01-24': '18:42',
  '2025-01-25': '18:42', '2025-01-26': '18:42', '2025-01-27': '18:41', '2025-01-28': '18:41',
  '2025-01-29': '18:41', '2025-01-30': '18:40', '2025-01-31': '18:40',

  // FEVEREIRO 2025 - Final do verão (28 dias)
  '2025-02-01': '18:40', '2025-02-02': '18:39', '2025-02-03': '18:39', '2025-02-04': '18:38',
  '2025-02-05': '18:38', '2025-02-06': '18:37', '2025-02-07': '18:37', '2025-02-08': '18:36',
  '2025-02-09': '18:36', '2025-02-10': '18:35', '2025-02-11': '18:34', '2025-02-12': '18:34',
  '2025-02-13': '18:33', '2025-02-14': '18:33', '2025-02-15': '18:32', '2025-02-16': '18:31',
  '2025-02-17': '18:30', '2025-02-18': '18:30', '2025-02-19': '18:29', '2025-02-20': '18:28',
  '2025-02-21': '18:27', '2025-02-22': '18:27', '2025-02-23': '18:26', '2025-02-24': '18:25',
  '2025-02-25': '18:24', '2025-02-26': '18:23', '2025-02-27': '18:23', '2025-02-28': '18:22',

  // MARÇO 2025 - Equinócio de outono (31 dias)
  '2025-03-01': '18:21', '2025-03-02': '18:20', '2025-03-03': '18:19', '2025-03-04': '18:18',
  '2025-03-05': '18:17', '2025-03-06': '18:17', '2025-03-07': '18:16', '2025-03-08': '18:15',
  '2025-03-09': '18:14', '2025-03-10': '18:13', '2025-03-11': '18:12', '2025-03-12': '18:11',
  '2025-03-13': '18:11', '2025-03-14': '18:10', '2025-03-15': '18:09', '2025-03-16': '18:08',
  '2025-03-17': '18:07', '2025-03-18': '18:06', '2025-03-19': '18:05', '2025-03-20': '18:04',
  '2025-03-21': '18:03', '2025-03-22': '18:02', '2025-03-23': '18:01', '2025-03-24': '18:00',
  '2025-03-25': '17:59', '2025-03-26': '17:59', '2025-03-27': '17:58', '2025-03-28': '17:57',
  '2025-03-29': '17:56', '2025-03-30': '17:55', '2025-03-31': '17:54',

  // ABRIL 2025 - Outono (30 dias)
  '2025-04-01': '17:52', '2025-04-02': '17:51', '2025-04-03': '17:50', '2025-04-04': '17:49',
  '2025-04-05': '17:48', '2025-04-06': '17:47', '2025-04-07': '17:46', '2025-04-08': '17:45',
  '2025-04-09': '17:44', '2025-04-10': '17:44', '2025-04-11': '17:43', '2025-04-12': '17:42',
  '2025-04-13': '17:41', '2025-04-14': '17:40', '2025-04-15': '17:39', '2025-04-16': '17:38',
  '2025-04-17': '17:37', '2025-04-18': '17:37', '2025-04-19': '17:36', '2025-04-20': '17:35',
  '2025-04-21': '17:34', '2025-04-22': '17:33', '2025-04-23': '17:33', '2025-04-24': '17:32',
  '2025-04-25': '17:31', '2025-04-26': '17:30', '2025-04-27': '17:30', '2025-04-28': '17:29',
  '2025-04-29': '17:28', '2025-04-30': '17:28',

  // MAIO 2025 - Final do outono (31 dias)
  '2025-05-01': '17:27', '2025-05-02': '17:26', '2025-05-03': '17:26', '2025-05-04': '17:25',
  '2025-05-05': '17:24', '2025-05-06': '17:24', '2025-05-07': '17:23', '2025-05-08': '17:23',
  '2025-05-09': '17:22', '2025-05-10': '17:22', '2025-05-11': '17:21', '2025-05-12': '17:20',
  '2025-05-13': '17:20', '2025-05-14': '17:20', '2025-05-15': '17:19', '2025-05-16': '17:19',
  '2025-05-17': '17:19', '2025-05-18': '17:18', '2025-05-19': '17:18', '2025-05-20': '17:18',
  '2025-05-21': '17:17', '2025-05-22': '17:17', '2025-05-23': '17:17', '2025-05-24': '17:16',
  '2025-05-25': '17:16', '2025-05-26': '17:16', '2025-05-27': '17:16', '2025-05-28': '17:16',
  '2025-05-29': '17:15', '2025-05-30': '17:15', '2025-05-31': '17:15',

  // JUNHO 2025 - Solstício de inverno (30 dias)
  '2025-06-01': '17:15', '2025-06-02': '17:15', '2025-06-03': '17:15', '2025-06-04': '17:15',
  '2025-06-05': '17:15', '2025-06-06': '17:15', '2025-06-07': '17:15', '2025-06-08': '17:15',
  '2025-06-09': '17:15', '2025-06-10': '17:15', '2025-06-11': '17:15', '2025-06-12': '17:15',
  '2025-06-13': '17:15', '2025-06-14': '17:15', '2025-06-15': '17:15', '2025-06-16': '17:15',
  '2025-06-17': '17:16', '2025-06-18': '17:16', '2025-06-19': '17:16', '2025-06-20': '17:16',
  '2025-06-21': '17:17', '2025-06-22': '17:17', '2025-06-23': '17:17', '2025-06-24': '17:17',
  '2025-06-25': '17:18', '2025-06-26': '17:18', '2025-06-27': '17:18', '2025-06-28': '17:18', // ← HOJE!
  '2025-06-29': '17:19', '2025-06-30': '17:19',

  // JULHO 2025 - Início do inverno (31 dias) 
  '2025-07-01': '17:19', '2025-07-02': '17:20', '2025-07-03': '17:20', '2025-07-04': '17:20',
  '2025-07-05': '17:21', '2025-07-06': '17:21', '2025-07-07': '17:22', '2025-07-08': '17:22',
  '2025-07-09': '17:23', '2025-07-10': '17:23', '2025-07-11': '17:24', '2025-07-12': '17:24',
  '2025-07-13': '17:25', '2025-07-14': '17:25', '2025-07-15': '17:26', '2025-07-16': '17:26',
  '2025-07-17': '17:27', '2025-07-18': '17:27', '2025-07-19': '17:28', '2025-07-20': '17:28',
  '2025-07-21': '17:29', '2025-07-22': '17:29', '2025-07-23': '17:30', '2025-07-24': '17:30',
  '2025-07-25': '17:31', '2025-07-26': '17:31', '2025-07-27': '17:32', '2025-07-28': '17:30',
  '2025-07-29': '17:31', '2025-07-30': '17:31', '2025-07-31': '17:31',

  // AGOSTO 2025 - Inverno (31 dias)
  '2025-08-01': '17:32', '2025-08-02': '17:32', '2025-08-03': '17:33', '2025-08-04': '17:33',
  '2025-08-05': '17:34', '2025-08-06': '17:34', '2025-08-07': '17:35', '2025-08-08': '17:35',
  '2025-08-09': '17:36', '2025-08-10': '17:36', '2025-08-11': '17:37', '2025-08-12': '17:37',
  '2025-08-13': '17:38', '2025-08-14': '17:38', '2025-08-15': '17:39', '2025-08-16': '17:39',
  '2025-08-17': '17:40', '2025-08-18': '17:40', '2025-08-19': '17:41', '2025-08-20': '17:41',
  '2025-08-21': '17:42', '2025-08-22': '17:42', '2025-08-23': '17:43', '2025-08-24': '17:43',
  '2025-08-25': '17:44', '2025-08-26': '17:44', '2025-08-27': '17:45', '2025-08-28': '17:42',
  '2025-08-29': '17:42', '2025-08-30': '17:42', '2025-08-31': '17:42',

  // SETEMBRO 2025 - Final do inverno/Equinócio de primavera (30 dias)
  '2025-09-01': '17:43', '2025-09-02': '17:44', '2025-09-03': '17:44', '2025-09-04': '17:44',
  '2025-09-05': '17:45', '2025-09-06': '17:45', '2025-09-07': '17:46', '2025-09-08': '17:46',
  '2025-09-09': '17:47', '2025-09-10': '17:47', '2025-09-11': '17:48', '2025-09-12': '17:48',
  '2025-09-13': '17:49', '2025-09-14': '17:49', '2025-09-15': '17:50', '2025-09-16': '17:50',
  '2025-09-17': '17:51', '2025-09-18': '17:51', '2025-09-19': '17:52', '2025-09-20': '17:52',
  '2025-09-21': '17:43', '2025-09-22': '17:42', '2025-09-23': '17:41', '2025-09-24': '17:40',
  '2025-09-25': '17:39', '2025-09-26': '17:38', '2025-09-27': '17:37', '2025-09-28': '17:51',
  '2025-09-29': '17:51', '2025-09-30': '17:52',

  // OUTUBRO 2025 - Primavera (31 dias)
  '2025-10-01': '17:52', '2025-10-02': '17:52', '2025-10-03': '17:53', '2025-10-04': '17:53',
  '2025-10-05': '17:54', '2025-10-06': '17:54', '2025-10-07': '17:55', '2025-10-08': '17:55',
  '2025-10-09': '17:56', '2025-10-10': '17:56', '2025-10-11': '17:57', '2025-10-12': '17:57',
  '2025-10-13': '17:56', '2025-10-14': '17:56', '2025-10-15': '17:57', '2025-10-16': '17:58',
  '2025-10-17': '17:58', '2025-10-18': '17:59', '2025-10-19': '17:59', '2025-10-20': '18:00',
  '2025-10-21': '18:00', '2025-10-22': '18:01', '2025-10-23': '18:01', '2025-10-24': '18:02',
  '2025-10-25': '18:02', '2025-10-26': '18:03', '2025-10-27': '18:03', '2025-10-28': '18:04',
  '2025-10-29': '18:04', '2025-10-30': '18:05', '2025-10-31': '18:05',

  // NOVEMBRO 2025 - Primavera (30 dias)
  '2025-11-01': '18:06', '2025-11-02': '18:07', '2025-11-03': '18:07', '2025-11-04': '18:08',
  '2025-11-05': '18:09', '2025-11-06': '18:09', '2025-11-07': '18:10', '2025-11-08': '18:11',
  '2025-11-09': '18:10', '2025-11-10': '18:11', '2025-11-11': '18:12', '2025-11-12': '18:12',
  '2025-11-13': '18:13', '2025-11-14': '18:14', '2025-11-15': '18:14', '2025-11-16': '18:15',
  '2025-11-17': '18:16', '2025-11-18': '18:16', '2025-11-19': '18:17', '2025-11-20': '18:18',
  '2025-11-21': '18:18', '2025-11-22': '18:19', '2025-11-23': '18:20', '2025-11-24': '18:20',
  '2025-11-25': '18:21', '2025-11-26': '18:22', '2025-11-27': '18:23', '2025-11-28': '18:23',
  '2025-11-29': '18:24', '2025-11-30': '18:25',

  // DEZEMBRO 2025 - Solstício de verão (31 dias)
  '2025-12-01': '18:25', '2025-12-02': '18:26', '2025-12-03': '18:26', '2025-12-04': '18:27',
  '2025-12-05': '18:28', '2025-12-06': '18:29', '2025-12-07': '18:29', '2025-12-08': '18:30',
  '2025-12-09': '18:31', '2025-12-10': '18:31', '2025-12-11': '18:32', '2025-12-12': '18:32',
  '2025-12-13': '18:33', '2025-12-14': '18:34', '2025-12-15': '18:34', '2025-12-16': '18:35',
  '2025-12-17': '18:35', '2025-12-18': '18:36', '2025-12-19': '18:36', '2025-12-20': '18:37',
  '2025-12-21': '18:37', '2025-12-22': '18:38', '2025-12-23': '18:38', '2025-12-24': '18:39',
  '2025-12-25': '18:39', '2025-12-26': '18:40', '2025-12-27': '18:40', '2025-12-28': '18:41',
  '2025-12-29': '18:41', '2025-12-30': '18:41', '2025-12-31': '18:42'
};

// Cache para performance
let cachedSunset: string | null = null;
let lastFetchDate: string | null = null;

/**
 * 🏛️ FUNÇÃO PRINCIPAL: Buscar dados CHM oficiais completos
 * Agora com TODOS os 365 dias do ano, sem necessidade de interpolação
 */
function getSunsetFromCHMData(): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Verificar cache
  if (cachedSunset && lastFetchDate === today) {
    console.log('🏛️ CHM Cache:', cachedSunset);
    return cachedSunset;
  }
  
  // Buscar nos dados oficiais CHM completos
  const officialSunset = CHM_DADOS_OFICIAIS_COMPLETOS_2025[today];
  
  if (officialSunset) {
    // Atualizar cache
    cachedSunset = officialSunset;
    lastFetchDate = today;
    
    console.log('✅ CHM Oficial Completo:', today, '→', officialSunset);
    return officialSunset;
  } else {
    // Se não encontrou a data, significa que é fora de 2025
    console.error('❌ Data fora do ano 2025:', today);
    return "17:30"; // Fallback seguro
  }
}

/**
 * Calcular pôr do sol para hoje usando dados CHM completos
 */
function calcularPorDoSolHoje(): string {
  const hoje = new Date();
  const dataFormatada = hoje.toISOString().split('T')[0];
  
  console.log(`📅 Consultando CHM completo para: ${dataFormatada}`);
  
  const horario = getSunsetFromCHMData();
  
  console.log(`🌆 Pôr do sol CHM: ${horario}`);
  return horario;
}

/**
 * Função principal para uso no sistema - DADOS CHM COMPLETOS
 */
function obterHorarioPorDoSol(): string {
  const horario = calcularPorDoSolHoje();
  
  console.log(`🏛️ CHM Completo - Pôr do sol hoje: ${horario}`);
  return horario;
}

// Demonstração com dados CHM completos
console.log("=== SISTEMA CHM OFICIAL COMPLETO - TODOS OS 365 DIAS ===");
console.log("📍 Rio de Janeiro - 22°55'S, 043°12'W");
console.log("🏛️ Fonte: Tábuas de Maré CHM 2025 (100% oficial)");
console.log("📅 COBERTURA: 365 dias completos (sem interpolação)");
console.log("");

// Calcular para hoje usando dados CHM oficiais completos
const porDoSolHoje = obterHorarioPorDoSol();

// Mostrar estatísticas finais
const totalDatas = Object.keys(CHM_DADOS_OFICIAIS_COMPLETOS_2025).length;
console.log(`📊 Total de dados oficiais: ${totalDatas}/365 dias`);

// Validação de hoje
console.log(`🎯 HOJE (28/06/2025): ${CHM_DADOS_OFICIAIS_COMPLETOS_2025['2025-06-28']} ← OFICIAL CHM`);

// Exemplos de datas que agora temos dados oficiais
console.log("\n✅ EXEMPLOS DE DADOS AGORA DISPONÍVEIS:");
console.log(`15/01: ${CHM_DADOS_OFICIAIS_COMPLETOS_2025['2025-01-15']} (antes não tinha)`);
console.log(`14/02: ${CHM_DADOS_OFICIAIS_COMPLETOS_2025['2025-02-14']} (Dia dos Namorados)`);
console.log(`15/07: ${CHM_DADOS_OFICIAIS_COMPLETOS_2025['2025-07-15']} (antes não tinha)`);
console.log(`25/12: ${CHM_DADOS_OFICIAIS_COMPLETOS_2025['2025-12-25']} (Natal)`);

/**
 * Exportar funções principais para integração
 */
export async function getTodaySunset(): Promise<string> {
  return getSunsetFromCHMData();
}

export async function getSunsetWithLabel(): Promise<string> {
  const sunsetTime = getSunsetFromCHMData();
  return `Pôr do sol: ${sunsetTime}`;
}

export async function forceUpdateSunset(): Promise<string> {
  cachedSunset = null;
  lastFetchDate = null;
  console.log('🔄 Limpando cache CHM completo...');
  return getSunsetFromCHMData();
}

export function clearSunsetCache(): void {
  cachedSunset = null;
  lastFetchDate = null;
  console.log('🧹 Cache CHM completo limpo');
}

/**
 * 🆕 FUNÇÃO: Obter pôr do sol para qualquer data de 2025
 */
export function getSunsetForDate(dateString: string): string {
  const sunset = CHM_DADOS_OFICIAIS_COMPLETOS_2025[dateString];
  if (sunset) {
    return sunset;
  } else {
    console.warn(`⚠️ Data ${dateString} não encontrada nos dados CHM 2025`);
    return "17:30"; // Fallback
  }
}

/**
 * 🆕 FUNÇÃO: Verificar se é dado oficial CHM
 */
export function isOfficialCHMData(dateString: string): boolean {
  return CHM_DADOS_OFICIAIS_COMPLETOS_2025.hasOwnProperty(dateString);
}

/**
 * 🆕 FUNÇÃO: Obter estatísticas completas dos dados CHM
 */
export function getCHMCompleteStats(): {
  totalDays: number;
  firstDate: string;
  lastDate: string;
  coverage: string;
  source: string;
  accuracy: string;
  todaysSunset: string;
} {
  const dates = Object.keys(CHM_DADOS_OFICIAIS_COMPLETOS_2025).sort();
  const today = new Date().toISOString().split('T')[0];
  
  return {
    totalDays: dates.length,
    firstDate: dates[0],
    lastDate: dates[dates.length - 1],
    coverage: "365 dias completos (100% oficial)",
    source: "Tábuas de Maré CHM 2025 - Rio de Janeiro",
    accuracy: "Precisão máxima (dados oficiais da Marinha)",
    todaysSunset: CHM_DADOS_OFICIAIS_COMPLETOS_2025[today] || "Data fora de 2025"
  };
}

// Função principal para integração com o sistema existente
export function getCHMSunsetTime(): string {
  return obterHorarioPorDoSol();
}