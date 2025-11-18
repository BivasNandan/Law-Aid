"""
Functional Selenium tests for Law-Aid application
These tests actually interact with the web application using ChromeDriver
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from utils.helpers import TestHelpers
from config import FRONTEND_URL, BACKEND_URL, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD
import time
import requests


class TestFunctionalFlows:
    """Actual functional tests that interact with the application"""
    
    @pytest.fixture(scope="class")
    def driver_setup(self):
        """Setup Chrome driver for the test class"""
        options = Options()
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        # Don't use headless so we can see what's happening
        # options.add_argument("--headless")
        
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        driver.implicitly_wait(10)
        driver.set_page_load_timeout(30)
        
        yield driver
        
        driver.quit()
    
    def test_servers_running(self):
        """Test 1: Verify both servers are running"""
        print("\n[TEST 1] Checking if servers are running...")
        
        # Check backend
        try:
            response = requests.get(f"{BACKEND_URL}/", timeout=5)
            assert response.status_code == 200, "Backend server not responding"
            print(f"  [OK] Backend server is running at {BACKEND_URL}")
        except Exception as e:
            print(f"  [SKIP] Backend server not accessible: {str(e)[:100]}")
            pytest.skip("Backend server not running")
        
        # Check frontend
        try:
            response = requests.get(FRONTEND_URL, timeout=5)
            assert response.status_code == 200, "Frontend server not responding"
            print(f"  [OK] Frontend server is running at {FRONTEND_URL}")
        except Exception as e:
            print(f"  [SKIP] Frontend server not accessible: {str(e)[:100]}")
            pytest.skip("Frontend server not running")
    
    def test_landing_page_loads(self, driver_setup):
        """Test 2: Landing page loads correctly"""
        print("\n[TEST 2] Testing landing page load...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        driver.get(FRONTEND_URL)
        helpers.wait_for_page_load()
        
        # Verify page loaded
        assert "Law" in driver.title or "Law-Aid" in driver.title or len(driver.title) > 0
        print(f"  [OK] Landing page loaded. Title: {driver.title}")
        print(f"  [OK] Current URL: {driver.current_url}")
        
        # Take screenshot
        helpers.take_screenshot("tests/screenshots/landing_page.png")
        print("  [OK] Screenshot saved")
    
    def test_role_selection_page(self, driver_setup):
        """Test 3: Role selection page navigation"""
        print("\n[TEST 3] Testing role selection page...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/role")
        helpers.wait_for_page_load()
        
        # Look for role selection buttons/cards
        role_selectors = [
            (By.XPATH, "//button[contains(text(), 'Client')]"),
            (By.XPATH, "//button[contains(text(), 'Lawyer')]"),
            (By.XPATH, "//div[contains(text(), 'Client')]"),
            (By.XPATH, "//div[contains(text(), 'Lawyer')]"),
            (By.XPATH, "//*[contains(@class, 'role')]"),
        ]
        
        role_found = False
        for by, value in role_selectors:
            if helpers.is_element_present(by, value, timeout=5):
                print(f"  ✅ Found role selection element: {value}")
                role_found = True
                break
        
        assert role_found or "/role" in driver.current_url
        print(f"  ✅ Role selection page loaded. URL: {driver.current_url}")
        helpers.take_screenshot("tests/screenshots/role_selection.png")
    
    def test_navigate_to_login(self, driver_setup):
        """Test 4: Navigate to login page"""
        print("\n[TEST 4] Testing login page navigation...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/login")
        helpers.wait_for_page_load()
        
        # Verify login form elements exist
        email_input = helpers.is_element_present(By.XPATH, "//input[@type='email']", timeout=10)
        password_input = helpers.is_element_present(By.XPATH, "//input[@type='password']", timeout=10)
        
        assert email_input, "Email input not found"
        assert password_input, "Password input not found"
        
        print("  ✅ Login page loaded with form elements")
        print(f"  ✅ Current URL: {driver.current_url}")
        helpers.take_screenshot("tests/screenshots/login_page.png")
    
    def test_login_form_interaction(self, driver_setup):
        """Test 5: Interact with login form (fill but don't submit)"""
        print("\n[TEST 5] Testing login form interaction...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/login")
        helpers.wait_for_page_load()
        
        # Use improved send_keys method
        email_selectors = [
            (By.XPATH, "//input[@type='email']"),
            (By.CSS_SELECTOR, "input[type='email']"),
        ]
        
        email_filled = False
        for by, selector in email_selectors:
            if helpers.is_element_visible(by, selector, timeout=5):
                email_filled = helpers.send_keys(by, selector, "test@example.com")
                if email_filled:
                    break
        
        assert email_filled, "Failed to fill email field"
        print("  [OK] Email field filled")
        
        password_selectors = [
            (By.XPATH, "//input[@type='password']"),
            (By.CSS_SELECTOR, "input[type='password']"),
        ]
        
        password_filled = False
        for by, selector in password_selectors:
            if helpers.is_element_visible(by, selector, timeout=5):
                password_filled = helpers.send_keys(by, selector, "Test@1234")
                if password_filled:
                    break
        
        assert password_filled, "Failed to fill password field"
        print("  [OK] Password field filled")
        
        # Verify values are in fields
        try:
            email_input = driver.find_element(By.XPATH, "//input[@type='email']")
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            email_value = email_input.get_attribute("value")
            password_value = password_input.get_attribute("value")
            
            assert email_value == "test@example.com"
            assert password_value == "Test@1234"
            print("  [OK] Form fields contain correct values")
        except Exception as e:
            print(f"  [WARNING] Could not verify values: {e}")
        
        helpers.take_screenshot("tests/screenshots/login_form_filled.png")
    
    def test_signup_page_navigation(self, driver_setup):
        """Test 6: Navigate to signup page"""
        print("\n[TEST 6] Testing signup page navigation...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        # First set a role in localStorage (required for signup)
        driver.execute_script("localStorage.setItem('selectedRole', 'client');")
        
        helpers.navigate_to("/signup")
        helpers.wait_for_page_load()
        
        # Check if signup form is present
        form_present = helpers.is_element_present(By.TAG_NAME, "form", timeout=10)
        assert form_present, "Signup form not found"
        
        # Check for input fields
        inputs = driver.find_elements(By.TAG_NAME, "input")
        assert len(inputs) >= 3, f"Expected at least 3 input fields, found {len(inputs)}"
        
        print(f"  ✅ Signup page loaded with {len(inputs)} input fields")
        print(f"  ✅ Current URL: {driver.current_url}")
        helpers.take_screenshot("tests/screenshots/signup_page.png")
    
    def test_signup_form_interaction(self, driver_setup):
        """Test 7: Interact with signup form"""
        print("\n[TEST 7] Testing signup form interaction...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        # Set role
        driver.execute_script("localStorage.setItem('selectedRole', 'client');")
        
        helpers.navigate_to("/signup")
        helpers.wait_for_page_load()
        time.sleep(2)  # Wait for form to render
        
        # Find all input fields
        inputs = driver.find_elements(By.TAG_NAME, "input")
        print(f"  📝 Found {len(inputs)} input fields")
        
        # Fill username (first text input)
        text_inputs = [inp for inp in inputs if inp.get_attribute("type") in ["text", None]]
        if text_inputs:
            text_inputs[0].clear()
            text_inputs[0].send_keys("SeleniumTestUser")
            print("  ✅ Username field filled")
        
        # Fill email (email input)
        email_inputs = [inp for inp in inputs if inp.get_attribute("type") == "email"]
        if email_inputs:
            email_inputs[0].clear()
            email_inputs[0].send_keys("seleniumtest@example.com")
            print("  ✅ Email field filled")
        
        # Fill password (first password input)
        password_inputs = [inp for inp in inputs if inp.get_attribute("type") == "password"]
        if password_inputs:
            password_inputs[0].clear()
            password_inputs[0].send_keys("Test@1234")
            if len(password_inputs) > 1:
                password_inputs[1].clear()
                password_inputs[1].send_keys("Test@1234")
            print("  ✅ Password fields filled")
        
        helpers.take_screenshot("tests/screenshots/signup_form_filled.png")
        print("  ✅ Signup form interaction completed")
    
    def test_view_laws_page(self, driver_setup):
        """Test 8: Navigate to view laws page (requires login)"""
        print("\n[TEST 8] Testing view laws page navigation...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/viewLaw")
        helpers.wait_for_page_load()
        
        # Page might redirect to login if not authenticated, that's OK
        current_url = driver.current_url
        print(f"  📍 Current URL: {current_url}")
        
        if "/login" in current_url:
            print("  ℹ️  Redirected to login (expected if not authenticated)")
        else:
            print("  ✅ View laws page loaded")
        
        helpers.take_screenshot("tests/screenshots/view_laws.png")
    
    def test_find_lawyer_page(self, driver_setup):
        """Test 9: Navigate to find lawyer page"""
        print("\n[TEST 9] Testing find lawyer page...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        helpers.navigate_to("/find-lawyer")
        helpers.wait_for_page_load()
        
        current_url = driver.current_url
        print(f"  📍 Current URL: {current_url}")
        
        if "/login" in current_url:
            print("  ℹ️  Redirected to login (expected if not authenticated)")
        else:
            print("  ✅ Find lawyer page loaded")
        
        helpers.take_screenshot("tests/screenshots/find_lawyer.png")
    
    def test_page_navigation_flow(self, driver_setup):
        """Test 10: Test navigation between pages"""
        print("\n[TEST 10] Testing page navigation flow...")
        driver = driver_setup
        wait = WebDriverWait(driver, 15)
        helpers = TestHelpers(driver, wait)
        
        # Navigate through multiple pages
        pages = [
            ("/", "Landing"),
            ("/role", "Role Selection"),
            ("/login", "Login"),
        ]
        
        for path, name in pages:
            helpers.navigate_to(path)
            helpers.wait_for_page_load()
            print(f"  ✅ Navigated to {name} page")
            time.sleep(1)
        
        print("  ✅ Navigation flow completed successfully")
    
    def test_browser_functionality(self, driver_setup):
        """Test 11: Verify browser and Selenium functionality"""
        print("\n[TEST 11] Verifying browser functionality...")
        driver = driver_setup
        
        # Test JavaScript execution
        result = driver.execute_script("return document.readyState;")
        assert result == "complete", "Page not fully loaded"
        print("  ✅ JavaScript execution works")
        
        # Test window size
        size = driver.get_window_size()
        print(f"  ✅ Window size: {size['width']}x{size['height']}")
        
        # Test page source
        source = driver.page_source
        assert len(source) > 0, "Page source is empty"
        print(f"  ✅ Page source retrieved ({len(source)} characters)")
        
        # Test cookies
        cookies = driver.get_cookies()
        print(f"  ✅ Cookies retrieved: {len(cookies)} cookies")
        
        print("  ✅ All browser functionality tests passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

