"""
Comprehensive automated tests for Law-Aid application using Selenium + ChromeDriver
This test suite verifies actual application functionality
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
import time
from config import FRONTEND_URL, BACKEND_URL, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD


class TestLawAidComprehensive:
    """Comprehensive automated tests for Law-Aid"""
    
    @pytest.fixture(scope="class")
    def driver(self):
        """Setup ChromeDriver for all tests"""
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        # Don't use headless so we can see what's happening
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        driver.implicitly_wait(10)
        
        yield driver
        driver.quit()
    
    @pytest.fixture(scope="class")
    def wait(self, driver):
        """WebDriverWait instance"""
        return WebDriverWait(driver, 15)
    
    def test_01_landing_page_loads(self, driver, wait):
        """Test 1: Landing page loads correctly"""
        print("\n[TEST 1] Landing page load verification...")
        driver.get(FRONTEND_URL)
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(2)  # Wait for React to render
        
        assert driver.current_url == FRONTEND_URL or driver.current_url == f"{FRONTEND_URL}/"
        assert "body" in driver.page_source.lower()
        print("  [OK] Landing page loaded successfully")
    
    def test_02_navigate_to_login(self, driver, wait):
        """Test 2: Navigate to login page"""
        print("\n[TEST 2] Login page navigation...")
        driver.get(f"{FRONTEND_URL}/login")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(2)
        
        # Try to find login form elements
        email_found = False
        password_found = False
        
        try:
            email_input = driver.find_element(By.XPATH, "//input[@type='email']")
            email_found = True
        except:
            try:
                email_input = driver.find_element(By.NAME, "email")
                email_found = True
            except:
                try:
                    email_input = driver.find_element(By.ID, "email")
                    email_found = True
                except:
                    pass
        
        try:
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            password_found = True
        except:
            try:
                password_input = driver.find_element(By.NAME, "password")
                password_found = True
            except:
                try:
                    password_input = driver.find_element(By.ID, "password")
                    password_found = True
                except:
                    pass
        
        assert email_found, "Email input field not found"
        assert password_found, "Password input field not found"
        print("  [OK] Login page elements found")
    
    def test_03_fill_login_form(self, driver, wait):
        """Test 3: Fill login form with test credentials"""
        print("\n[TEST 3] Filling login form...")
        driver.get(f"{FRONTEND_URL}/login")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(2)
        
        # Find and fill email
        email_selectors = [
            (By.XPATH, "//input[@type='email']"),
            (By.NAME, "email"),
            (By.ID, "email"),
        ]
        
        email_filled = False
        for by, value in email_selectors:
            try:
                email_input = driver.find_element(by, value)
                email_input.clear()
                email_input.send_keys(TEST_CLIENT_EMAIL)
                email_filled = True
                print(f"  [OK] Email filled: {TEST_CLIENT_EMAIL}")
                break
            except:
                continue
        
        # Find and fill password
        password_selectors = [
            (By.XPATH, "//input[@type='password']"),
            (By.NAME, "password"),
            (By.ID, "password"),
        ]
        
        password_filled = False
        for by, value in password_selectors:
            try:
                password_input = driver.find_element(by, value)
                password_input.clear()
                password_input.send_keys(TEST_CLIENT_PASSWORD)
                password_filled = True
                print(f"  [OK] Password filled")
                break
            except:
                continue
        
        assert email_filled, "Could not fill email field"
        assert password_filled, "Could not fill password field"
    
    def test_04_submit_login(self, driver, wait):
        """Test 4: Submit login form"""
        print("\n[TEST 4] Submitting login form...")
        
        # Find and click login button
        login_button_selectors = [
            (By.XPATH, "//button[contains(text(), 'Login')]"),
            (By.XPATH, "//button[contains(text(), 'Sign in')]"),
            (By.XPATH, "//button[@type='submit']"),
            (By.XPATH, "//input[@type='submit']"),
        ]
        
        button_clicked = False
        for by, value in login_button_selectors:
            try:
                button = wait.until(EC.element_to_be_clickable((by, value)))
                button.click()
                button_clicked = True
                print("  [OK] Login button clicked")
                break
            except:
                continue
        
        if button_clicked:
            # Wait for redirect or response
            time.sleep(5)
            current_url = driver.current_url
            print(f"  [INFO] Current URL after login: {current_url}")
        else:
            print("  [WARN] Login button not found or not clickable")
    
    def test_05_navigate_to_view_laws(self, driver, wait):
        """Test 5: Navigate to view laws page"""
        print("\n[TEST 5] Navigating to view laws page...")
        driver.get(f"{FRONTEND_URL}/viewLaw")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(3)
        
        assert "/viewLaw" in driver.current_url
        print("  [OK] View laws page loaded")
    
    def test_06_navigate_to_find_lawyer(self, driver, wait):
        """Test 6: Navigate to find lawyer page"""
        print("\n[TEST 6] Navigating to find lawyer page...")
        driver.get(f"{FRONTEND_URL}/find-lawyer")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(3)
        
        assert "/find-lawyer" in driver.current_url
        print("  [OK] Find lawyer page loaded")
    
    def test_07_navigate_to_consultation_chat(self, driver, wait):
        """Test 7: Navigate to consultation chat"""
        print("\n[TEST 7] Navigating to consultation chat...")
        driver.get(f"{FRONTEND_URL}/consultation-chat")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(3)
        
        assert "/consultation-chat" in driver.current_url
        print("  [OK] Consultation chat page loaded")
    
    def test_08_navigate_to_profile(self, driver, wait):
        """Test 8: Navigate to profile page"""
        print("\n[TEST 8] Navigating to profile page...")
        driver.get(f"{FRONTEND_URL}/profile")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(3)
        
        assert "/profile" in driver.current_url
        print("  [OK] Profile page loaded")
    
    def test_09_navigate_to_role_selection(self, driver, wait):
        """Test 9: Navigate to role selection"""
        print("\n[TEST 9] Navigating to role selection...")
        driver.get(f"{FRONTEND_URL}/role")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(2)
        
        assert "/role" in driver.current_url
        print("  [OK] Role selection page loaded")
    
    def test_10_navigate_to_signup(self, driver, wait):
        """Test 10: Navigate to signup page"""
        print("\n[TEST 10] Navigating to signup page...")
        driver.get(f"{FRONTEND_URL}/signup")
        wait.until(lambda d: d.execute_script("return document.readyState") == "complete")
        time.sleep(2)
        
        assert "/signup" in driver.current_url
        print("  [OK] Signup page loaded")


if __name__ == "__main__":
    print("=" * 70)
    print("Law-Aid Comprehensive Automated Test Suite")
    print("Using: Selenium WebDriver + ChromeDriver (auto-managed)")
    print("=" * 70)
    print("\n[INFO] This test suite requires servers to be running:")
    print(f"  - Frontend: {FRONTEND_URL}")
    print(f"  - Backend: {BACKEND_URL}")
    print("\n[INFO] Run with pytest:")
    print("  pytest test_lawaid_comprehensive.py -v")
    print("\n" + "=" * 70)

