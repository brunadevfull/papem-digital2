import React, { useState, useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { WeatherAlertsActive } from "@/components/WeatherAlertsActive";
import { DutyOfficersDisplay } from "@/components/DutyOfficersDisplay";
import { useDisplay } from "@/context/DisplayContext";
import { getSunsetWithLabel } from "@/utils/sunsetUtils";
import { getCurrentTemperature } from "@/utils/temperatureUtils";
import logoPAPEM from "@assets/logoPAPEM_1751352314977.png";

const Index = () => {
  const {
    activePlasaDoc,
    activeBonoDoc,
    activeEscalaDoc,
    currentMainDocType,
    scrollSpeed = "normal",
    autoRestartDelay = 3,
    handleScrollComplete
  } = useDisplay();

  const [sunsetTime, setSunsetTime] = useState<string>("--:--");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState({
    day: "",
    month: "",
    weekday: ""
  });

  // Estados para dados inline
  const [officers, setOfficers] = useState<{officerName?: string, masterName?: string} | null>(null);
  const [temperature, setTemperature] = useState<{temp?: number, humidity?: number, description?: string, rainChance?: number} | null>(null);

  // Buscar horário do pôr do sol
  useEffect(() => {
    const fetchSunset = async () => {
      try {
        const sunset = await getSunsetWithLabel();
        setSunsetTime(sunset);
      } catch (error) {
        console.error('Erro ao buscar pôr do sol:', error);
        setSunsetTime("Pôr do sol: --:--");
      }
    };

    fetchSunset();
    
    // Atualizar a cada hora
    const interval = setInterval(fetchSunset, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar dados dos oficiais
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const getBackendUrl = (): string => {
          const currentHost = window.location.hostname;
          const currentOrigin = window.location.origin;
          const isReplit = currentHost.includes('replit.dev');
          if (isReplit) {
            return `${currentOrigin}/api/duty-officers`;
          }
          if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
            return `http://localhost:5000/api/duty-officers`;
          }
          return `${currentOrigin}/api/duty-officers`;
        };

        const response = await fetch(getBackendUrl());
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setOfficers(data.officers);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar oficiais:', error);
      }
    };

    fetchOfficers();
    const interval = setInterval(fetchOfficers, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  // Buscar dados da temperatura
  useEffect(() => {
    const fetchTemperature = async () => {
      try {
        const data = await getCurrentTemperature();
        if (data) {
          setTemperature(data);
        }
      } catch (error) {
        console.error('Erro ao buscar temperatura:', error);
      }
    };

    fetchTemperature();
    const interval = setInterval(fetchTemperature, 30 * 60 * 1000); // 30 minutos
    return () => clearInterval(interval);
  }, []);

  // Atualizar horário e data em tempo real
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      // Atualizar horário
      const timeString = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
      setCurrentTime(timeString);

      // Atualizar data
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const weekday = now.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
      
      setCurrentDate({ day, month, weekday });
    };

    // Atualizar imediatamente
    updateDateTime();
    
    // Configurar timer para atualizar a cada segundo
    const clockInterval = setInterval(updateDateTime, 1000);
    
    // Cleanup do timer
    return () => clearInterval(clockInterval);
  }, []);

  // Determinar qual documento principal mostrar
  const currentMainDoc = currentMainDocType === "plasa" ? activePlasaDoc : activeBonoDoc;
  const mainDocTitle = currentMainDoc?.title || 
    (currentMainDocType === "plasa" ? "PLASA - Plano de Serviço Semanal" : "BONO - Boletim de Ocorrências");

  console.log("🏠 Index: Renderizando página principal", {
    activePlasa: activePlasaDoc?.title || 'nenhum',
    activeBono: activeBonoDoc?.title || 'nenhum',
    activeEscala: activeEscalaDoc?.title || 'nenhum',
    currentMainDocType,
    currentMainDoc: currentMainDoc?.title || 'nenhum',
    scrollSpeed,
    autoRestartDelay
  });

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 flex flex-col overflow-hidden">
      {/* Header Principal - Painel com contorno restaurado */}
      <header className="flex-shrink-0 mb-2 px-6 py-4 bg-gradient-to-r from-slate-800/80 to-blue-900/80 backdrop-blur-xl rounded-lg shadow-xl border border-blue-400/30 mx-2">
        <div className="flex items-center justify-center space-x-4">
          <div className="relative">
            <div className="w-16 h-16 bg-transparent rounded-lg flex items-center justify-center shadow-lg p-1">
              <img 
                src={logoPAPEM} 
                alt="Logo PAPEM" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent">
              MARINHA DO BRASIL
            </h1>
            <p className="text-blue-200/90 text-base font-medium">
              Pagadoria de Pessoal da Marinha
            </p>
          </div>
        </div>
      </header>

      {/* Barra de Informações Operacionais - Com bordas arredondadas */}
      <div className="flex-shrink-0 mb-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-slate-700/50 to-blue-800/50 backdrop-blur-lg rounded-lg shadow-lg border border-blue-400/20 mx-2">
        
        {/* Layout Desktop - Uma linha */}
        <div className="hidden lg:flex items-center justify-center space-x-6 text-sm overflow-hidden">
          
          {/* Oficial - Dinâmico e Estilizado */}
          {officers?.officerName && (
            <>
              <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-400/30">
                <span className="text-blue-300 font-medium text-xs">👮‍♂️ Oficial:</span>
                <span className="text-white font-bold text-sm">{officers.officerName}</span>
              </div>
              <div className="w-px h-4 bg-blue-400/30"></div>
            </>
          )}
          
          {/* Contramestre - Dinâmico e Estilizado */}
          {officers?.masterName && (
            <>
              <div className="flex items-center space-x-2 bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-400/30">
                <span className="text-blue-300 font-medium text-xs">⚓ Contramestre:</span>
                <span className="text-white font-bold text-sm">{officers.masterName}</span>
              </div>
              <div className="w-px h-4 bg-blue-400/30"></div>
            </>
          )}

          {/* Temperatura - Dinâmica com Probabilidade de Chuva */}
          {temperature && (
            <>
              <div className="flex items-center space-x-2 bg-slate-600/20 px-3 py-1 rounded-lg border border-slate-400/30">
                <span className="text-slate-300 font-medium text-xs">🌡️ Temp:</span>
                <span className="text-white font-bold text-sm">{temperature.temp}°C</span>
                
                {/* Probabilidade de chuva com emoji dinâmico */}
                {temperature.rainChance !== undefined && (
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">
                      {temperature.rainChance >= 80 ? '🌧️' : 
                       temperature.rainChance >= 60 ? '⛈️' : 
                       temperature.rainChance >= 40 ? '🌦️' : 
                       temperature.rainChance >= 20 ? '🌤️' : '☀️'}
                    </span>
                    <span className="text-blue-300 font-semibold text-xs">{temperature.rainChance}%</span>
                  </div>
                )}
                
                {/* Emoji baseado na temperatura */}
                {temperature.temp && (
                  <span className="text-base opacity-70">
                    {temperature.temp >= 30 ? '🔥' : 
                     temperature.temp >= 25 ? '🌞' : 
                     temperature.temp >= 20 ? '🌤️' : 
                     temperature.temp >= 15 ? '⛅' : '❄️'}
                  </span>
                )}
                
                {/* Descrição do clima */}
                {temperature.description && (
                  <span className="text-slate-300 text-xs capitalize italic">
                    {temperature.description}
                  </span>
                )}
              </div>
              <div className="w-px h-4 bg-blue-400/30"></div>
            </>
          )}
          
          {/* Data - Estilizada */}
          <div className="flex items-center space-x-2 bg-green-600/20 px-3 py-1 rounded-lg border border-green-400/30">
            <span className="text-green-300 font-medium text-xs">📅 Hoje:</span>
            <span className="text-white font-bold text-sm">
              {currentDate.weekday}, {new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'short' 
              })}
            </span>
          </div>
          
          {/* Divisor */}
          <div className="w-px h-4 bg-blue-400/30"></div>
          
          {/* Hora - Estilizada */}
          <div className="flex items-center space-x-2 bg-purple-600/20 px-3 py-1 rounded-lg border border-purple-400/30">
            <span className="text-purple-300 font-medium text-xs">⏰ Hora:</span>
            <span className="text-white font-mono font-bold text-sm tracking-wider">
              {currentTime}
            </span>
          </div>
          
          {/* Divisor */}
          <div className="w-px h-4 bg-blue-400/30"></div>
          
          {/* Pôr do Sol - Estilizado */}
          <div className="flex items-center space-x-2 bg-orange-600/20 px-3 py-1 rounded-lg border border-orange-400/30">
            <span className="text-amber-300 font-bold text-sm">
              🌅 {sunsetTime}
            </span>
          </div>
          
        </div>

        {/* Layout Mobile/Tablet - Grid Responsivo */}
        <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          
          {/* Primeira Linha Mobile */}
          <div className="col-span-1 sm:col-span-2 flex flex-wrap items-center justify-center gap-2">
            {/* Oficiais */}
            {officers?.officerName && (
              <div className="flex items-center space-x-1 bg-blue-600/20 px-2 py-1 rounded border border-blue-400/30">
                <span className="text-blue-300 font-medium text-xs">👮‍♂️</span>
                <span className="text-white font-bold text-xs">{officers.officerName}</span>
              </div>
            )}
            {officers?.masterName && (
              <div className="flex items-center space-x-1 bg-blue-600/20 px-2 py-1 rounded border border-blue-400/30">
                <span className="text-blue-300 font-medium text-xs">⚓</span>
                <span className="text-white font-bold text-xs">{officers.masterName}</span>
              </div>
            )}
          </div>

          {/* Segunda Linha Mobile */}
          <div className="flex items-center justify-center">
            {temperature && (
              <div className="flex items-center space-x-2 bg-slate-600/20 px-2 py-1 rounded border border-slate-400/30">
                <span className="text-slate-300 text-xs">🌡️ {temperature.temp}°C</span>
                {temperature.rainChance !== undefined && (
                  <div className="flex items-center space-x-1">
                    <span className="text-sm">
                      {temperature.rainChance >= 80 ? '🌧️' : 
                       temperature.rainChance >= 60 ? '⛈️' : 
                       temperature.rainChance >= 40 ? '🌦️' : 
                       temperature.rainChance >= 20 ? '🌤️' : '☀️'}
                    </span>
                    <span className="text-blue-300 text-xs">{temperature.rainChance}%</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Terceira Linha Mobile */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3 bg-green-600/20 px-2 py-1 rounded border border-green-400/30">
              <span className="text-green-300 text-xs">📅 {currentDate.weekday}, {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
              <span className="text-purple-300 text-xs">⏰ {currentTime}</span>
              <span className="text-amber-300 text-xs">🌅 {sunsetTime}</span>
            </div>
          </div>
          
        </div>
        
      </div>

      {/* Main Content - Espaço calculado descontando header + status + footer */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2 p-2 overflow-hidden">
        
        {/* PLASA - Ocupa espaço disponível */}
        <div className="w-full lg:w-3/5 flex-1 lg:flex-none lg:h-full">
          <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-lg border border-blue-400/25 shadow-xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
            <PDFViewer
              documentType={currentMainDocType}
              title={mainDocTitle}
              scrollSpeed={scrollSpeed}
              autoRestartDelay={autoRestartDelay}
              onScrollComplete={handleScrollComplete}
            />
          </div>
        </div>

        {/* Lado direito - Escala e Avisos */}
        <div className="w-full lg:w-2/5 flex flex-col gap-2 flex-1 lg:flex-none lg:h-full">
          
          {/* Escala de Serviço - 65% da altura disponível */}
          <div className="flex-1 lg:h-[65%]">
            <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-lg border border-blue-400/25 shadow-xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
              <PDFViewer
                documentType="escala"
                title={activeEscalaDoc?.title || "Escala de Serviço Semanal"}
              />
            </div>
          </div>

          {/* Avisos Importantes - 35% da altura disponível */}
          <div className="flex-1 lg:h-[35%]">
            <div className="h-full bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-lg border border-amber-400/30 shadow-xl hover:border-amber-400/50 transition-all duration-500 overflow-hidden">
              <NoticeDisplay />
            </div>
          </div>
          
        </div>
      </div>

      {/* Footer - Rodapé fixo */}
      <footer className="flex-shrink-0 bg-gradient-to-r from-slate-800/70 to-blue-900/70 backdrop-blur-xl shadow-xl border-t border-blue-400/25 py-2 px-4 text-center">
        <p className="text-xs text-blue-200/80 font-medium">
          &copy; {new Date().getFullYear()} Marinha do Brasil - PAPEM 
        </p>
      </footer>
    </div>
  );
};

export default Index;