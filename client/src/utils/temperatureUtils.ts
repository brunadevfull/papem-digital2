/**
 * Utilitários para obter temperatura do Rio de Janeiro
 * Usa API gratuita do OpenWeatherMap
 */

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  humidity: number;
  feelsLike: number;
}

interface TemperatureCache {
  data: WeatherData | null;
  timestamp: number;
  error?: string;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutos em millisegundos
const RIO_COORDS = { lat: -22.8975, lon: -43.1641 }; // Ilha Fiscal

// Cache local para evitar muitas requisições
let temperatureCache: TemperatureCache = {
  data: null,
  timestamp: 0
};

/**
 * Traduz descrições do clima do inglês para português
 */
const translateWeatherDescription = (description: string): string => {
  const translations: { [key: string]: string } = {
    // Condições básicas
    'clear': 'ensolarado',
    'sunny': 'ensolarado', 
    'clear sky': 'céu limpo',
    'few clouds': 'poucas nuvens',
    'scattered clouds': 'nuvens dispersas',
    'broken clouds': 'nuvens fragmentadas',
    'overcast clouds': 'nublado',
    'overcast': 'nublado',
    'cloudy': 'nublado',
    'partly cloudy': 'parcialmente nublado',
    
    // Chuva
    'light rain': 'chuva fraca',
    'moderate rain': 'chuva moderada',
    'heavy rain': 'chuva forte',
    'shower rain': 'chuva rápida',
    'rain': 'chuva',
    'drizzle': 'garoa',
    'light intensity drizzle': 'garoa fraca',
    'heavy intensity drizzle': 'garoa forte',
    
    // Tempestades
    'thunderstorm': 'tempestade',
    'thunderstorm with light rain': 'tempestade com chuva fraca',
    'thunderstorm with rain': 'tempestade com chuva',
    'thunderstorm with heavy rain': 'tempestade com chuva forte',
    
    // Neve (raro no Rio, mas pode aparecer)
    'snow': 'neve',
    'light snow': 'neve fraca',
    
    // Outras condições  
    'mist': 'neblina',
    'fog': 'nevoeiro',
    'haze': 'névoa seca',
    'dust': 'poeira',
    'smoke': 'fumaça',
    'mostly cloudy': 'muito nublado',
    
    // Fallbacks comuns da API
    'temperature not available': 'temperatura não disponível',
    'weather data unavailable': 'dados meteorológicos indisponíveis'
  };

  const lowerDescription = description.toLowerCase().trim();
  return translations[lowerDescription] || lowerDescription;
};

/**
 * Obtém temperatura atual do Rio de Janeiro
 * Retorna dados do cache se ainda válidos (menos de 30 min)
 */
export const getCurrentTemperature = async (): Promise<WeatherData | null> => {
  const now = Date.now();
  
  // Verificar se cache ainda é válido
  if (temperatureCache.data && (now - temperatureCache.timestamp) < CACHE_DURATION) {
    console.log("🌡️ Usando temperatura do cache");
    return temperatureCache.data;
  }

  try {
    console.log("🌡️ Buscando temperatura atualizada...");
    
    // Usar API gratuita do OpenWeatherMap
    const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
    
    if (!API_KEY || API_KEY === 'demo') {
      console.log("🌡️ Chave da API não configurada, usando API alternativa...");
      return await getTemperatureFromAlternativeAPI();
    }
    
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${RIO_COORDS.lat}&lon=${RIO_COORDS.lon}&appid=${API_KEY}&units=metric&lang=pt_br`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Erro na API OpenWeatherMap:", errorData);
      
      if (response.status === 401) {
        console.error("🔑 Chave de API inválida ou expirada");
        temperatureCache.error = "Chave de API inválida. Verifique sua configuração no OpenWeatherMap.";
      }
      
      // Fallback para API alternativa gratuita (sem chave)
      return await getTemperatureFromAlternativeAPI();
    }

    const data = await response.json();
    
    const weatherData: WeatherData = {
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      feelsLike: Math.round(data.main.feels_like)
    };

    // Atualizar cache
    temperatureCache = {
      data: weatherData,
      timestamp: now
    };

    console.log(`🌡️ Temperatura atualizada: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.error("❌ Erro ao obter temperatura:", error);
    
    // Tentar API alternativa
    return await getTemperatureFromAlternativeAPI();
  }
};

/**
 * APIs alternativas gratuitas em português - não requerem chave
 */
const getTemperatureFromAlternativeAPI = async (): Promise<WeatherData | null> => {
  // Tentar múltiplas APIs em sequência - prioridade para APIs funcionais
  const apis = [
    () => getTemperatureFromWttr(), // API internacional - mais confiável
    () => getTemperatureFromOpenMeteo(), // API europeia gratuita
    () => getTemperatureFromClimaTempo() // API brasileira alternativa
  ];

  for (const api of apis) {
    try {
      const result = await api();
      if (result) return result;
    } catch (error) {
      console.log("🌡️ Tentando próxima API...");
    }
  }

  // Último recurso - dados de fallback
  console.log("⚠️ Todas as APIs falharam, usando dados de fallback");
  const fallbackData: WeatherData = {
    temp: 24, // Temperatura típica do Rio
    description: "temperatura não disponível",
    icon: '01d',
    humidity: 65,
    feelsLike: 26
  };

  temperatureCache = {
    data: fallbackData,
    timestamp: Date.now(),
    error: "APIs indisponíveis"
  };

  return fallbackData;
};

/**
 * INMET - Instituto Nacional de Meteorologia (Brasil)
 * API oficial brasileira em português
 */
const getTemperatureFromINMET = async (): Promise<WeatherData | null> => {
  try {
    console.log("🌡️ Tentando API do INMET (Brasil)...");
    
    // INMET endpoint correto para dados meteorológicos
    const today = new Date().toISOString().split('T')[0];
    const response = await fetch(`https://apitempo.inmet.gov.br/estacao/${today}/${today}/A602`);
    
    if (!response.ok) {
      throw new Error(`INMET HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.length === 0) {
      throw new Error('Dados INMET vazios');
    }

    // Pegar dado mais recente
    const latest = data[data.length - 1];
    
    const weatherData: WeatherData = {
      temp: Math.round(parseFloat(latest.TEM_INS) || 24),
      description: 'condições atuais', // INMET não fornece descrição
      icon: '01d',
      humidity: Math.round(parseFloat(latest.UMD_INS) || 65),
      feelsLike: Math.round(parseFloat(latest.TEM_INS) || 24)
    };

    temperatureCache = {
      data: weatherData,
      timestamp: Date.now()
    };

    console.log(`🌡️ Temperatura obtida via INMET: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.log("❌ Erro na API INMET:", error);
    throw error;
  }
};

/**
 * wttr.in - API internacional gratuita
 */
const getTemperatureFromWttr = async (): Promise<WeatherData | null> => {
  try {
    console.log("🌡️ Tentando wttr.in...");
    
    const response = await fetch('https://wttr.in/Rio+de+Janeiro?format=j1');
    
    if (!response.ok) {
      throw new Error(`wttr.in HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current_condition[0];
    
    const weatherData: WeatherData = {
      temp: parseInt(current.temp_C),
      description: translateWeatherDescription(current.weatherDesc[0].value),
      icon: '01d',
      humidity: parseInt(current.humidity),
      feelsLike: parseInt(current.FeelsLikeC)
    };

    temperatureCache = {
      data: weatherData,
      timestamp: Date.now()
    };

    console.log(`🌡️ Temperatura obtida via wttr.in: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.log("❌ Erro na API wttr.in:", error);
    throw error;
  }
};

/**
 * Open-Meteo - API europeia gratuita sem chave
 */
const getTemperatureFromOpenMeteo = async (): Promise<WeatherData | null> => {
  try {
    console.log("🌡️ Tentando Open-Meteo...");
    
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${RIO_COORDS.lat}&longitude=${RIO_COORDS.lon}&current_weather=true&hourly=relativehumidity_2m&timezone=America/Sao_Paulo`);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const data = await response.json();
    const current = data.current_weather;
    
    // Determinar descrição baseada no código do tempo
    const getWeatherDescription = (code: number): string => {
      if (code === 0) return 'céu limpo';
      if (code <= 2) return 'parcialmente nublado';
      if (code === 3) return 'nublado';
      if (code <= 67) return 'chuva';
      if (code <= 77) return 'neve';
      if (code <= 82) return 'chuva';
      if (code <= 99) return 'tempestade';
      return 'condições variáveis';
    };
    
    const weatherData: WeatherData = {
      temp: Math.round(current.temperature),
      description: getWeatherDescription(current.weathercode),
      icon: '01d',
      humidity: Math.round(data.hourly?.relativehumidity_2m?.[0] || 65),
      feelsLike: Math.round(current.temperature)
    };

    temperatureCache = {
      data: weatherData,
      timestamp: Date.now()
    };

    console.log(`🌡️ Temperatura obtida via Open-Meteo: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.log("❌ Erro na API Open-Meteo:", error);
    throw error;
  }
};

/**
 * API brasileira simples baseada em localização
 */
const getTemperatureFromClimaTempo = async (): Promise<WeatherData | null> => {
  try {
    console.log("🌡️ Tentando API brasileira alternativa...");
    
    // Usar API meteorológica gratuita focada no Brasil
    const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=demo&q=Rio de Janeiro&lang=pt`);
    
    if (!response.ok) {
      throw new Error(`ClimateTempo HTTP ${response.status}`);
    }

    const data = await response.json();
    
    const weatherData: WeatherData = {
      temp: Math.round(data.current.temp_c),
      description: data.current.condition.text.toLowerCase(),
      icon: '01d',
      humidity: data.current.humidity,
      feelsLike: Math.round(data.current.feelslike_c)
    };

    temperatureCache = {
      data: weatherData,
      timestamp: Date.now()
    };

    console.log(`🌡️ Temperatura obtida via API brasileira: ${weatherData.temp}°C`);
    return weatherData;

  } catch (error) {
    console.log("❌ Erro na API brasileira:", error);
    throw error;
  }
};

/**
 * Força atualização da temperatura (ignora cache)
 */
export const refreshTemperature = async (): Promise<WeatherData | null> => {
  temperatureCache.timestamp = 0; // Invalida cache
  return await getCurrentTemperature();
};

/**
 * Verifica se os dados de temperatura estão atualizados
 */
export const isTemperatureCacheValid = (): boolean => {
  const now = Date.now();
  return temperatureCache.data !== null && (now - temperatureCache.timestamp) < CACHE_DURATION;
};

/**
 * Obtém tempo restante até próxima atualização (em minutos)
 */
export const getMinutesUntilNextUpdate = (): number => {
  if (!temperatureCache.data) return 0;
  
  const now = Date.now();
  const elapsed = now - temperatureCache.timestamp;
  const remaining = CACHE_DURATION - elapsed;
  
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
};