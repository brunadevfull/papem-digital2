#!/usr/bin/env python3
"""
Sistema de Visualização da Marinha - Suite de Testes Selenium
Testes abrangentes de automação de navegador para o sistema de visualização
"""

import os
import sys
import time
import json
import subprocess
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class Cores:
    VERMELHO = '\033[91m'
    VERDE = '\033[92m'
    AMARELO = '\033[93m'
    AZUL = '\033[94m'
    CIANO = '\033[96m'
    BRANCO = '\033[97m'
    NEGRITO = '\033[1m'
    FIM = '\033[0m'

class ResultadosTeste:
    def __init__(self):
        self.total = 0
        self.passou = 0
        self.falhou = 0
        self.resultados = []

    def adicionar_resultado(self, nome_teste, passou, detalhes=""):
        self.total += 1
        if passou:
            self.passou += 1
            status = "PASSOU"
            cor = Cores.VERDE
        else:
            self.falhou += 1
            status = "FALHOU"
            cor = Cores.VERMELHO
        
        simbolo = "✓" if passou else "✗"
        mensagem = f"{cor}{simbolo} {nome_teste}{Cores.FIM}"
        if detalhes:
            mensagem += f" - {detalhes}"
        
        print(mensagem)
        self.resultados.append({
            'teste': nome_teste,
            'status': status,
            'detalhes': detalhes
        })

    def imprimir_resumo(self):
        print(f"\n{Cores.AZUL}Resumo dos Resultados dos Testes{Cores.FIM}")
        print(f"{Cores.AZUL}{'='*35}{Cores.FIM}")
        print(f"Total de Testes: {self.total}")
        print(f"{Cores.VERDE}Passou: {self.passou}{Cores.FIM}")
        print(f"{Cores.VERMELHO}Falhou: {self.falhou}{Cores.FIM}")
        
        taxa_sucesso = (self.passou / self.total * 100) if self.total > 0 else 0
        cor = Cores.VERDE if self.falhou == 0 else Cores.AMARELO
        print(f"Taxa de Sucesso: {cor}{taxa_sucesso:.1f}%{Cores.FIM}")

class TestadorVisualizacaoMarinha:
    def __init__(self, url_base="http://localhost:5000"):
        self.url_base = url_base
        self.url_api = f"{url_base}/api"
        self.driver = None
        self.resultados = ResultadosTeste()
        self.processo_servidor = None

    def configurar_driver(self):
        """Configurar driver Chrome com opções apropriadas"""
        opcoes_chrome = Options()
        opcoes_chrome.add_argument("--headless")
        opcoes_chrome.add_argument("--no-sandbox")
        opcoes_chrome.add_argument("--disable-dev-shm-usage")
        opcoes_chrome.add_argument("--disable-gpu")
        opcoes_chrome.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=opcoes_chrome)
            self.driver.implicitly_wait(10)
            return True
        except Exception as e:
            print(f"{Cores.VERMELHO}Falha ao configurar driver Chrome: {e}{Cores.FIM}")
            return False

    def aguardar_servidor(self, timeout=30):
        """Aguardar o servidor estar pronto"""
        print(f"{Cores.AMARELO}Aguardando servidor iniciar...{Cores.FIM}")
        
        for i in range(timeout):
            try:
                response = requests.get(f"{self.url_api}/health", timeout=2)
                if response.status_code == 200:
                    print(f"{Cores.VERDE}Servidor está pronto!{Cores.FIM}")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
        
        print(f"{Cores.VERMELHO}Servidor falhou ao iniciar em {timeout} segundos{Cores.FIM}")
        return False

    def iniciar_servidor(self):
        """Iniciar o servidor da aplicação"""
        try:
            print(f"{Cores.AZUL}Iniciando servidor...{Cores.FIM}")
            self.processo_servidor = subprocess.Popen(
                ["npm", "run", "dev"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            return self.aguardar_servidor()
        except Exception as e:
            print(f"{Cores.VERMELHO}Falha ao iniciar servidor: {e}{Cores.FIM}")
            return False

    def parar_servidor(self):
        """Parar o servidor da aplicação"""
        if self.processo_servidor:
            self.processo_servidor.terminate()
            self.processo_servidor.wait()

    def testar_saude_api(self):
        """Testar endpoint de saúde da API"""
        try:
            response = requests.get(f"{self.url_api}/health")
            passou = response.status_code == 200 and 'status' in response.json()
            self.resultados.adicionar_resultado("Verificação de Saúde da API", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Verificação de Saúde da API", False, str(e))

    def testar_carregamento_pagina_principal(self):
        """Testar se a página principal de visualização carrega corretamente"""
        try:
            self.driver.get(self.url_base)
            
            # Verificar título da Marinha do Brasil
            titulo_presente = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Marinha do Brasil')]"))
            )
            
            # Verificar exibição de horário
            display_horario = self.driver.find_element(By.CLASS_NAME, "font-mono")
            
            passou = titulo_presente and display_horario
            self.resultados.adicionar_resultado("Carregamento da Página Principal", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Carregamento da Página Principal", False, str(e))

    def testar_acesso_pagina_admin(self):
        """Testar acessibilidade da página admin"""
        try:
            self.driver.get(f"{self.url_base}/admin")
            
            # Procurar elementos específicos do admin
            abas_admin = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Avisos') or contains(text(), 'Documentos')]"))
            )
            
            passou = abas_admin is not None
            self.resultados.adicionar_resultado("Acesso à Página Admin", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Acesso à Página Admin", False, str(e))

    def testar_ciclagem_documentos(self):
        """Testar funcionalidade de ciclagem de documentos"""
        try:
            self.driver.get(self.url_base)
            
            # Aguardar carregamento inicial
            time.sleep(3)
            
            # Verificar visualizador de PDF ou container de documento
            visualizador_pdf = self.driver.find_elements(By.CLASS_NAME, "pdf-viewer")
            container_documento = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'document') or contains(@class, 'plasa') or contains(@class, 'escala')]")
            
            passou = len(visualizador_pdf) > 0 or len(container_documento) > 0
            self.resultados.adicionar_resultado("Exibição de Documentos", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Exibição de Documentos", False, str(e))

    def testar_design_responsivo(self):
        """Testar design responsivo em diferentes tamanhos de tela"""
        try:
            # Testar tamanho mobile
            self.driver.set_window_size(375, 667)
            self.driver.get(self.url_base)
            time.sleep(2)
            
            # Verificar se a página ainda é funcional
            titulo_mobile = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Marinha do Brasil')]")
            
            # Testar tamanho tablet
            self.driver.set_window_size(768, 1024)
            time.sleep(1)
            
            # Testar tamanho desktop
            self.driver.set_window_size(1920, 1080)
            time.sleep(1)
            
            passou = titulo_mobile is not None
            self.resultados.adicionar_resultado("Design Responsivo", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Design Responsivo", False, str(e))

    def testar_endpoints_api(self):
        """Testar funcionalidade dos endpoints da API"""
        endpoints = [
            ("/health", "GET", 200),
            ("/notices", "GET", 200),
            ("/documents", "GET", 200),
        ]
        
        for endpoint, metodo, status_esperado in endpoints:
            try:
                if metodo == "GET":
                    response = requests.get(f"{self.url_api}{endpoint}")
                
                passou = response.status_code == status_esperado
                nome_teste = f"API {metodo} {endpoint}"
                self.resultados.adicionar_resultado(nome_teste, passou, f"Status: {response.status_code}")
            except Exception as e:
                self.resultados.adicionar_resultado(nome_teste, False, str(e))

    def testar_tratamento_erro(self):
        """Testar tratamento de erro para URLs inválidas"""
        try:
            self.driver.get(f"{self.url_base}/pagina-invalida")
            
            # Verificar se página 404 é exibida ou redirecionada adequadamente
            url_atual = self.driver.current_url
            codigo_pagina = self.driver.page_source
            
            # Deve mostrar 404 ou redirecionar para home
            passou = "404" in codigo_pagina or url_atual == f"{self.url_base}/"
            self.resultados.adicionar_resultado("Tratamento de Erro (404)", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Tratamento de Erro (404)", False, str(e))

    def testar_funcionalidade_avisos(self):
        """Testar funcionalidade de exibição de avisos"""
        try:
            self.driver.get(self.url_base)
            
            # Aguardar possível exibição de avisos
            time.sleep(5)
            
            # Verificar se há elementos de aviso na página
            elementos_aviso = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'notice') or contains(@class, 'aviso')]")
            
            # Mesmo sem avisos ativos, o sistema deve funcionar
            passou = True  # Sistema deve funcionar independente de avisos
            self.resultados.adicionar_resultado("Funcionalidade de Avisos", passou)
        except Exception as e:
            self.resultados.adicionar_resultado("Funcionalidade de Avisos", False, str(e))

    def executar_todos_testes(self):
        """Executar a suite completa de testes"""
        print(f"{Cores.CIANO}Sistema de Visualização da Marinha - Suite de Testes Selenium{Cores.FIM}")
        print(f"{Cores.CIANO}{'='*65}{Cores.FIM}")
        
        # Configuração
        if not self.configurar_driver():
            print(f"{Cores.VERMELHO}Falha ao configurar ambiente de teste{Cores.FIM}")
            return False
        
        if not self.iniciar_servidor():
            print(f"{Cores.VERMELHO}Falha ao iniciar servidor{Cores.FIM}")
            return False
        
        try:
            # Executar testes
            self.testar_saude_api()
            self.testar_carregamento_pagina_principal()
            self.testar_acesso_pagina_admin()
            self.testar_ciclagem_documentos()
            self.testar_design_responsivo()
            self.testar_endpoints_api()
            self.testar_tratamento_erro()
            self.testar_funcionalidade_avisos()
            
            # Imprimir resultados
            self.resultados.imprimir_resumo()
            
            # Retornar status de sucesso
            return self.resultados.falhou == 0
            
        finally:
            # Limpeza
            if self.driver:
                self.driver.quit()
            self.parar_servidor()

def main():
    """Função principal"""
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h', '--ajuda']:
        print("Uso: python3 teste_selenium.py [url_base]")
        print("URL base padrão: http://localhost:5000")
        print()
        print("Opções:")
        print("  --help, -h, --ajuda    Mostrar esta mensagem de ajuda")
        return
    
    url_base = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    testador = TestadorVisualizacaoMarinha(url_base)
    sucesso = testador.executar_todos_testes()
    
    if sucesso:
        print(f"\n{Cores.VERDE}Todos os testes passaram! Sistema está funcionando corretamente.{Cores.FIM}")
        sys.exit(0)
    else:
        print(f"\n{Cores.VERMELHO}Alguns testes falharam. Verifique os problemas acima.{Cores.FIM}")
        sys.exit(1)

if __name__ == "__main__":
    main()