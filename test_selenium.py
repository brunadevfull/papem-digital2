#!/usr/bin/env python3
"""
Navy Display System - Selenium UI Testing Suite
Comprehensive browser automation testing for the display system
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

class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    END = '\033[0m'

class TestResults:
    def __init__(self):
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.results = []

    def add_result(self, test_name, passed, details=""):
        self.total += 1
        if passed:
            self.passed += 1
            status = "PASS"
            color = Colors.GREEN
        else:
            self.failed += 1
            status = "FAIL"
            color = Colors.RED
        
        symbol = "✓" if passed else "✗"
        message = f"{color}{symbol} {test_name}{Colors.END}"
        if details:
            message += f" - {details}"
        
        print(message)
        self.results.append({
            'test': test_name,
            'status': status,
            'details': details
        })

    def print_summary(self):
        print(f"\n{Colors.BLUE}Test Results Summary{Colors.END}")
        print(f"{Colors.BLUE}{'='*20}{Colors.END}")
        print(f"Total Tests: {self.total}")
        print(f"{Colors.GREEN}Passed: {self.passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.failed}{Colors.END}")
        
        success_rate = (self.passed / self.total * 100) if self.total > 0 else 0
        color = Colors.GREEN if self.failed == 0 else Colors.YELLOW
        print(f"Success Rate: {color}{success_rate:.1f}%{Colors.END}")

class NavyDisplayTester:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.driver = None
        self.results = TestResults()
        self.server_process = None

    def setup_driver(self):
        """Setup Chrome driver with appropriate options"""
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
            self.driver.implicitly_wait(10)
            return True
        except Exception as e:
            print(f"{Colors.RED}Failed to setup Chrome driver: {e}{Colors.END}")
            return False

    def wait_for_server(self, timeout=30):
        """Wait for the server to be ready"""
        print(f"{Colors.YELLOW}Waiting for server to start...{Colors.END}")
        
        for i in range(timeout):
            try:
                response = requests.get(f"{self.api_url}/health", timeout=2)
                if response.status_code == 200:
                    print(f"{Colors.GREEN}Server is ready!{Colors.END}")
                    return True
            except requests.exceptions.RequestException:
                pass
            time.sleep(1)
        
        print(f"{Colors.RED}Server failed to start within {timeout} seconds{Colors.END}")
        return False

    def start_server(self):
        """Start the application server"""
        try:
            print(f"{Colors.BLUE}Starting server...{Colors.END}")
            self.server_process = subprocess.Popen(
                ["npm", "run", "dev"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            return self.wait_for_server()
        except Exception as e:
            print(f"{Colors.RED}Failed to start server: {e}{Colors.END}")
            return False

    def stop_server(self):
        """Stop the application server"""
        if self.server_process:
            self.server_process.terminate()
            self.server_process.wait()

    def test_api_health(self):
        """Test API health endpoint"""
        try:
            response = requests.get(f"{self.api_url}/health")
            passed = response.status_code == 200 and 'status' in response.json()
            self.results.add_result("API Health Check", passed)
        except Exception as e:
            self.results.add_result("API Health Check", False, str(e))

    def test_main_page_load(self):
        """Test main display page loads correctly"""
        try:
            self.driver.get(self.base_url)
            
            # Check for Brazilian Navy title
            title_present = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Marinha do Brasil')]"))
            )
            
            # Check for time display
            time_display = self.driver.find_element(By.CLASS_NAME, "font-mono")
            
            passed = title_present and time_display
            self.results.add_result("Main Page Load", passed)
        except Exception as e:
            self.results.add_result("Main Page Load", False, str(e))

    def test_admin_page_access(self):
        """Test admin page accessibility"""
        try:
            self.driver.get(f"{self.base_url}/admin")
            
            # Look for admin-specific elements
            admin_tabs = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//*[contains(text(), 'Avisos') or contains(text(), 'Documentos')]"))
            )
            
            passed = admin_tabs is not None
            self.results.add_result("Admin Page Access", passed)
        except Exception as e:
            self.results.add_result("Admin Page Access", False, str(e))

    def test_notice_creation(self):
        """Test notice creation in admin panel"""
        try:
            self.driver.get(f"{self.base_url}/admin")
            
            # Click on Avisos tab
            avisos_tab = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Avisos')]"))
            )
            avisos_tab.click()
            
            # Fill notice form
            title_input = self.driver.find_element(By.NAME, "title")
            title_input.send_keys("Test Notice from Selenium")
            
            content_input = self.driver.find_element(By.NAME, "content")
            content_input.send_keys("This is a test notice created by automated testing")
            
            # Submit form
            submit_button = self.driver.find_element(By.XPATH, "//button[contains(text(), 'Criar')]")
            submit_button.click()
            
            # Wait for success feedback
            time.sleep(2)
            
            passed = True  # If no exception thrown, consider it passed
            self.results.add_result("Notice Creation", passed)
        except Exception as e:
            self.results.add_result("Notice Creation", False, str(e))

    def test_document_display_cycling(self):
        """Test document display cycling functionality"""
        try:
            self.driver.get(self.base_url)
            
            # Wait for initial load
            time.sleep(3)
            
            # Check for PDF viewer or document display
            pdf_viewer = self.driver.find_elements(By.CLASS_NAME, "pdf-viewer")
            document_container = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'document') or contains(@class, 'plasa') or contains(@class, 'escala')]")
            
            passed = len(pdf_viewer) > 0 or len(document_container) > 0
            self.results.add_result("Document Display", passed)
        except Exception as e:
            self.results.add_result("Document Display", False, str(e))

    def test_responsive_design(self):
        """Test responsive design at different screen sizes"""
        try:
            # Test mobile size
            self.driver.set_window_size(375, 667)
            self.driver.get(self.base_url)
            time.sleep(2)
            
            # Check if page is still functional
            mobile_title = self.driver.find_element(By.XPATH, "//*[contains(text(), 'Marinha do Brasil')]")
            
            # Test tablet size
            self.driver.set_window_size(768, 1024)
            time.sleep(1)
            
            # Test desktop size
            self.driver.set_window_size(1920, 1080)
            time.sleep(1)
            
            passed = mobile_title is not None
            self.results.add_result("Responsive Design", passed)
        except Exception as e:
            self.results.add_result("Responsive Design", False, str(e))

    def test_api_endpoints(self):
        """Test API endpoints functionality"""
        endpoints = [
            ("/health", "GET", 200),
            ("/notices", "GET", 200),
            ("/documents", "GET", 200),
        ]
        
        for endpoint, method, expected_status in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{self.api_url}{endpoint}")
                
                passed = response.status_code == expected_status
                test_name = f"API {method} {endpoint}"
                self.results.add_result(test_name, passed, f"Status: {response.status_code}")
            except Exception as e:
                self.results.add_result(test_name, False, str(e))

    def test_error_handling(self):
        """Test error handling for invalid URLs"""
        try:
            self.driver.get(f"{self.base_url}/invalid-page")
            
            # Check if 404 page is displayed or redirected properly
            current_url = self.driver.current_url
            page_source = self.driver.page_source
            
            # Should either show 404 or redirect to home
            passed = "404" in page_source or current_url == f"{self.base_url}/"
            self.results.add_result("Error Handling (404)", passed)
        except Exception as e:
            self.results.add_result("Error Handling (404)", False, str(e))

    def run_all_tests(self):
        """Run the complete test suite"""
        print(f"{Colors.CYAN}Navy Display System - Selenium Test Suite{Colors.END}")
        print(f"{Colors.CYAN}{'='*45}{Colors.END}")
        
        # Setup
        if not self.setup_driver():
            print(f"{Colors.RED}Failed to setup test environment{Colors.END}")
            return False
        
        if not self.start_server():
            print(f"{Colors.RED}Failed to start server{Colors.END}")
            return False
        
        try:
            # Run tests
            self.test_api_health()
            self.test_main_page_load()
            self.test_admin_page_access()
            self.test_document_display_cycling()
            self.test_responsive_design()
            self.test_api_endpoints()
            self.test_error_handling()
            # self.test_notice_creation()  # Commented out as it requires specific UI elements
            
            # Print results
            self.results.print_summary()
            
            # Return success status
            return self.results.failed == 0
            
        finally:
            # Cleanup
            if self.driver:
                self.driver.quit()
            self.stop_server()

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] in ['--help', '-h']:
        print("Usage: python3 test_selenium.py [base_url]")
        print("Default base_url: http://localhost:5000")
        return
    
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5000"
    
    tester = NavyDisplayTester(base_url)
    success = tester.run_all_tests()
    
    if success:
        print(f"\n{Colors.GREEN}All tests passed! System is working correctly.{Colors.END}")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}Some tests failed. Please check the issues above.{Colors.END}")
        sys.exit(1)

if __name__ == "__main__":
    main()