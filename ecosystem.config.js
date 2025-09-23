module.exports = {
  apps: [{
    name: 'papem-digital',
    script: 'dist/index.js',
    env: {
      DATABASE_URL: 'postgresql://postgres:suasenha123@localhost:5432/marinha_papem',
      PORT: 5000,
      NODE_ENV: 'production',
      VITE_OPENWEATHER_API_KEY: 'f8f44e0ebe16dbd77aad8ba878ea97e9',
      http_proxy: 'http://11111062:BruN%402025GlowUp@proxy-1dn.mb:6060',
      https_proxy: 'http://11111062:BruN%402025GlowUp@proxy-1dn.mb:6060',
      NODE_TLS_REJECT_UNAUTHORIZED: '0',
      REQUEST_TIMEOUT: '30000',
      WEATHER_CACHE_DURATION: '30',
      DOCUMENT_CACHE_DURATION: '60'
    }
  }]
};
