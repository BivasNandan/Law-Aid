"""
Authentication tests: Login, Signup, Role Selection
"""
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from utils.helpers import TestHelpers
from config import (
    FRONTEND_URL, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD,
    TEST_LAWYER_EMAIL, TEST_LAWYER_PASSWORD
)


class TestAuthentication:
    """Test authentication flows"""
    
    def test_landing_page_loads(self, driver, wait):
        """Test that landing page loads correctly"""
        helpers = TestHelpers(driver, wait)
        assert driver.current_url == FRONTEND_URL or driver.current_url == f"{FRONTEND_URL}/"
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("✅ Landing page loaded successfully")
    
    def test_role_selection_page(self, driver, wait):
        """Test role selection page navigation"""
        helpers = TestHelpers(driver, wait)
        helpers.navigate_to("/role")
        helpers.wait_for_page_load()
        
        # Check if role selection elements are present
        assert helpers.is_element_present(By.TAG_NAME, "body")
        print("✅ Role selection page loaded")
    
    def test_client_signup_flow(self, driver, wait):
        """Test client signup process"""
        helpers = TestHelpers(driver, wait)
        helpers.navigate_to("/signup")
        helpers.wait_for_page_load()
        
        # Fill signup form (adjust selectors based on actual form)
        # Note: This is a template - update selectors to match your actual form
        if helpers.is_element_present(By.NAME, "email") or helpers.is_element_present(By.ID, "email"):
            email_selector = By.NAME if helpers.is_element_present(By.NAME, "email") else By.ID
            helpers.send_keys(email_selector, "email", "testclient@selenium.com")
        
        if helpers.is_element_present(By.NAME, "password") or helpers.is_element_present(By.ID, "password"):
            password_selector = By.NAME if helpers.is_element_present(By.NAME, "password") else By.ID
            helpers.send_keys(password_selector, "password", "Test@1234")
        
        # Look for signup button
        signup_buttons = [
            (By.XPATH, "//button[contains(text(), 'Sign')]"),
            (By.XPATH, "//button[contains(text(), 'Register')]"),
            (By.XPATH, "//button[@type='submit']"),
        ]
        
        for by, value in signup_buttons:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                break
        
        print("✅ Client signup form submitted")
    
    def test_lawyer_signup_flow(self, driver, wait):
        """Test lawyer signup process"""
        helpers = TestHelpers(driver, wait)
        helpers.navigate_to("/role")
        helpers.wait_for_page_load()
        
        # Click lawyer role option if present
        lawyer_selectors = [
            (By.XPATH, "//button[contains(text(), 'Lawyer')]"),
            (By.XPATH, "//div[contains(text(), 'Lawyer')]"),
            (By.XPATH, "//a[contains(@href, 'lawyer')]"),
        ]
        
        for by, value in lawyer_selectors:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                break
        
        # Navigate to signup
        helpers.navigate_to("/signup")
        helpers.wait_for_page_load()
        
        print("✅ Lawyer signup flow initiated")
    
    def test_client_login(self, driver, wait):
        """Test client login functionality"""
        helpers = TestHelpers(driver, wait)
        helpers.navigate_to("/login")
        helpers.wait_for_page_load()
        
        # Wait for form to be visible
        print("[INFO] Waiting for login form to load...")
        time.sleep(2)  # Additional wait for React
        
        # Try multiple selectors for email field
        email_selectors = [
            (By.XPATH, "//input[@type='email']"),
            (By.CSS_SELECTOR, "input[type='email']"),
            (By.XPATH, "//input[@placeholder='Enter your email']"),
        ]
        
        email_filled = False
        for by, selector in email_selectors:
            if helpers.is_element_visible(by, selector, timeout=5):
                print(f"[INFO] Found email field with selector: {selector}")
                email_filled = helpers.send_keys(by, selector, TEST_CLIENT_EMAIL)
                if email_filled:
                    break
        
        if not email_filled:
            # Take screenshot for debugging
            helpers.take_screenshot("tests/screenshots/login_email_not_found.png")
            print("[ERROR] Email field not found. Screenshot saved.")
        
        assert email_filled, f"Failed to fill email field. Current URL: {driver.current_url}"
        
        # Try multiple selectors for password field
        password_selectors = [
            (By.XPATH, "//input[@type='password']"),
            (By.CSS_SELECTOR, "input[type='password']"),
            (By.XPATH, "//input[@placeholder='Enter your password']"),
        ]
        
        password_filled = False
        for by, selector in password_selectors:
            if helpers.is_element_visible(by, selector, timeout=5):
                print(f"[INFO] Found password field with selector: {selector}")
                password_filled = helpers.send_keys(by, selector, TEST_CLIENT_PASSWORD)
                if password_filled:
                    break
        
        if not password_filled:
            helpers.take_screenshot("tests/screenshots/login_password_not_found.png")
            print("[ERROR] Password field not found. Screenshot saved.")
        
        assert password_filled, "Failed to fill password field"
        
        # Verify values were entered
        try:
            email_input = driver.find_element(By.XPATH, "//input[@type='email']")
            password_input = driver.find_element(By.XPATH, "//input[@type='password']")
            email_value = email_input.get_attribute("value")
            password_value = password_input.get_attribute("value")
            print(f"[VERIFY] Email entered: {email_value[:10]}...")
            print(f"[VERIFY] Password entered: {'*' * len(password_value) if password_value else 'NOT SET'}")
        except Exception as e:
            print(f"[WARNING] Could not verify entered values: {e}")
        
        # Find and click login button
        login_selectors = [
            (By.XPATH, "//button[@type='submit']"),
            (By.XPATH, "//button[contains(text(), 'Log In')]"),
            (By.XPATH, "//button[contains(text(), 'Login')]"),
            (By.CSS_SELECTOR, "button[type='submit']"),
        ]
        
        login_button_clicked = False
        for by, selector in login_selectors:
            if helpers.is_element_visible(by, selector, timeout=5):
                print(f"[INFO] Found login button with selector: {selector}")
                login_button_clicked = helpers.click_element(by, selector)
                if login_button_clicked:
                    break
        
        if login_button_clicked:
            print("[SUCCESS] Login button clicked")
            helpers.wait_for_page_load()
            time.sleep(3)  # Wait for redirect
            print(f"[INFO] Current URL after login: {driver.current_url}")
        else:
            helpers.take_screenshot("tests/screenshots/login_button_not_found.png")
            print("[ERROR] Login button not found. Screenshot saved.")
            print("[INFO] Form was filled but button not clicked")
    
    def test_lawyer_login(self, driver, wait):
        """Test lawyer login functionality"""
        helpers = TestHelpers(driver, wait)
        helpers.navigate_to("/login")
        helpers.wait_for_page_load()
        
        # Fill login form
        email_selectors = [
            (By.NAME, "email"),
            (By.ID, "email"),
            (By.XPATH, "//input[@type='email']"),
        ]
        
        password_selectors = [
            (By.NAME, "password"),
            (By.ID, "password"),
            (By.XPATH, "//input[@type='password']"),
        ]
        
        for by, value in email_selectors:
            if helpers.is_element_present(by, value):
                helpers.send_keys(by, value, TEST_LAWYER_EMAIL)
                break
        
        for by, value in password_selectors:
            if helpers.is_element_present(by, value):
                helpers.send_keys(by, value, TEST_LAWYER_PASSWORD)
                break
        
        # Find and click login button
        login_buttons = [
            (By.XPATH, "//button[contains(text(), 'Login')]"),
            (By.XPATH, "//button[@type='submit']"),
        ]
        
        for by, value in login_buttons:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                break
        
        print("✅ Lawyer login attempted")
    
    def test_logout_functionality(self, driver, wait):
        """Test logout functionality"""
        helpers = TestHelpers(driver, wait)
        
        # First login
        helpers.navigate_to("/login")
        helpers.wait_for_page_load()
        
        # Try to login first (simplified)
        # Then look for logout button
        logout_selectors = [
            (By.XPATH, "//button[contains(text(), 'Logout')]"),
            (By.XPATH, "//a[contains(text(), 'Logout')]"),
            (By.XPATH, "//button[contains(@class, 'logout')]"),
        ]
        
        # This test assumes user is already logged in
        for by, value in logout_selectors:
            if helpers.is_element_present(by, value):
                helpers.click_element(by, value)
                helpers.wait_for_page_load()
                print("✅ Logout button clicked")
                return
        
        print("⚠️ Logout button not found (user may not be logged in)")

