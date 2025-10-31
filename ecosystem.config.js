// IMPORTANTE: Não commitar este arquivo com credenciais reais!
// Use variáveis de ambiente ou arquivo .env para produção
module.exports = {
  apps: [{
    name: 'papem-digital',
    script: 'dist/index.js',
    env: {
      // Use variáveis de ambiente do sistema ou arquivo .env
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:CHANGE_ME@localhost:5432/marinha_papem',
      PORT: process.env.PORT || 5000,
      NODE_ENV: 'production',
      VITE_OPENWEATHER_API_KEY: process.env.VITE_OPENWEATHER_API_KEY || '',
      http_proxy: process.env.HTTP_PROXY || '',
      https_proxy: process.env.HTTPS_PROXY || '',
      // NUNCA use NODE_TLS_REJECT_UNAUTHORIZED em produção
      // NODE_TLS_REJECT_UNAUTHORIZED: '0', // REMOVIDO - INSEGURO
      REQUEST_TIMEOUT: process.env.REQUEST_TIMEOUT || '30000',
      WEATHER_CACHE_DURATION: process.env.WEATHER_CACHE_DURATION || '30',
      DOCUMENT_CACHE_DURATION: process.env.DOCUMENT_CACHE_DURATION || '60'
    }
  }]
};
