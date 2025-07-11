import React, { useState, useEffect } from "react";
import PDFViewer from "@/components/PDFViewer";
import NoticeDisplay from "@/components/NoticeDisplay";
import { WeatherAlertsActive } from "@/components/WeatherAlertsActive";
import { DutyOfficersDisplay } from "@/components/DutyOfficersDisplay";
import { useDisplay } from "@/context/DisplayContext";
import { getSunsetWithLabel } from "@/utils/sunsetUtils";
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 flex flex-col p-2 sm:p-3 lg:p-4">
      {/* Header Reorganizado */}
      <header className="relative mb-3 px-4 py-2 bg-gradient-to-r from-slate-800/80 to-blue-900/80 backdrop-blur-xl rounded-lg shadow-xl border border-blue-400/30">
        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Logo e título - 3 colunas */}
          <div className="col-span-12 lg:col-span-3 flex items-center justify-center lg:justify-start space-x-3">
            <div className="relative">
              <div className="w-16 h-16 bg-transparent rounded-lg flex items-center justify-center shadow-lg p-1">
                <img 
                  src={logoPAPEM} 
                  alt="Logo PAPEM" 
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            
            <div className="text-center lg:text-left">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-300 to-white bg-clip-text text-transparent">
                MARINHA DO BRASIL
              </h1>
              <p className="text-blue-200/80 text-sm">SisDocPAPEM</p>
            </div>
          </div>

          {/* Oficiais de Serviço - 3 colunas */}
          <div className="col-span-12 lg:col-span-3 flex justify-center">
            <DutyOfficersDisplay />
          </div>

          {/* Previsão de Chuva - 2 colunas */}
          <div className="col-span-12 lg:col-span-2 flex justify-center">
            <WeatherAlertsActive />
          </div>
          
          {/* Data e Hora Unificado - 4 colunas */}
          <div className="col-span-12 lg:col-span-4 flex justify-center lg:justify-end">
            <div className="bg-gradient-to-r from-blue-600/30 to-slate-900/60 backdrop-blur-sm rounded-lg px-4 py-2 border border-blue-400/30 shadow-lg">
              <div className="flex items-center justify-between space-x-6">
                {/* Lado esquerdo - Data */}
                <div className="text-center">
                  <div className="text-blue-100 text-xs uppercase font-medium mb-1">
                    Hoje
                  </div>
                  <div className="text-white text-lg font-bold tracking-wide">
                    {currentDate.weekday}
                  </div>
                  <div className="text-blue-200 text-xs font-medium">
                    {new Date().toLocaleDateString('pt-BR', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
                
                {/* Divisor */}
                <div className="w-px h-12 bg-blue-400/30"></div>
                
                {/* Lado direito - Hora */}
                <div className="text-center">
                  <div className="text-blue-200 text-xs uppercase font-medium mb-1">
                    Hora Oficial
                  </div>
                  <div className="text-white font-mono font-bold text-lg">
                    {currentTime}
                  </div>
                  <div className="text-amber-300 text-xs opacity-90">
                    🌅 {sunsetTime}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Responsivo */}
      <div className="flex-1 flex flex-col xl:flex-row gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
        {/* PLASA - Adaptativo por tamanho de tela */}
        <div className="xl:w-3/5 w-full h-[45vh] xl:h-[calc(100vh-8rem)] min-h-[300px] xl:min-h-[500px]">
          <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-blue-400/25 shadow-2xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
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
        <div className="xl:w-2/5 w-full h-[50vh] xl:h-[calc(100vh-8rem)] flex flex-col gap-2 sm:gap-3 lg:gap-4">
          {/* Escala de Serviço */}
          <div className="h-[65%] min-h-[200px] xl:min-h-[320px]">
            <div className="h-full bg-gradient-to-br from-white/5 via-blue-900/20 to-white/5 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-blue-400/25 shadow-2xl hover:border-blue-400/40 transition-all duration-500 overflow-hidden">
              <PDFViewer
                documentType="escala"
                title={activeEscalaDoc?.title || "Escala de Serviço Semanal"}
              />
            </div>
          </div>

          {/* Avisos Importantes */}
          <div className="h-[35%] min-h-[120px] xl:min-h-[180px]">
            <div className="h-full bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-amber-400/30 shadow-2xl hover:border-amber-400/50 transition-all duration-500 overflow-hidden">
              <NoticeDisplay />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Premium */}
      <footer className="mt-4 bg-gradient-to-r from-slate-800/70 to-blue-900/70 backdrop-blur-xl rounded-xl shadow-xl border border-blue-400/25 py-2 px-4 text-center">
        <p className="text-xs text-blue-200/80 font-medium">
          &copy; {new Date().getFullYear()} Marinha do Brasil - PAPEM 
        </p>
      </footer>
    </div>
  );
};

export default Index;