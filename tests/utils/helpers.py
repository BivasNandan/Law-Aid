"""
Helper utilities for Selenium tests
"""
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import time


class TestHelpers:
    """Utility class for common test operations"""
    
    def __init__(self, driver, wait):
        self.driver = driver
        self.wait = wait
    
    def click_element(self, by, value, timeout=10):
        """Click an element with explicit wait"""
        try:
            element = self.wait.until(EC.element_to_be_clickable((by, value)))
            element.click()
            return True
        except TimeoutException:
            print(f"Element not clickable: {by}={value}")
            return False
    
    def send_keys(self, by, value, text, clear_first=True):
        """Send keys to an input element with better wait strategy"""
        try:
            # Wait for element to be visible and interactable
            element = self.wait.until(EC.visibility_of_element_located((by, value)))
            # Scroll element into view
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            time.sleep(0.3)  # Small wait after scroll
            
            # Click to focus the element
            element.click()
            time.sleep(0.2)
            
            if clear_first:
                element.clear()
                time.sleep(0.1)
            
            # Send keys character by character for better reliability
            element.send_keys(text)
            time.sleep(0.2)  # Wait after typing
            
            # Verify text was entered
            entered_value = element.get_attribute("value")
            if entered_value != text:
                # Try again if value didn't match
                element.clear()
                element.send_keys(text)
                time.sleep(0.2)
            
            return True
        except TimeoutException:
            print(f"[ERROR] Element not found or not visible: {by}={value}")
            # Try to find all input elements for debugging
            try:
                all_inputs = self.driver.find_elements(By.TAG_NAME, "input")
                print(f"[DEBUG] Found {len(all_inputs)} input elements on page")
                for i, inp in enumerate(all_inputs[:5]):  # Show first 5
                    print(f"  Input {i}: type={inp.get_attribute('type')}, placeholder={inp.get_attribute('placeholder')}")
            except:
                pass
            return False
        except Exception as e:
            print(f"[ERROR] Failed to send keys: {e}")
            return False
    
    def get_text(self, by, value, timeout=10):
        """Get text from an element"""
        try:
            element = self.wait.until(EC.presence_of_element_located((by, value)))
            return element.text
        except TimeoutException:
            return None
    
    def is_element_present(self, by, value, timeout=5):
        """Check if element is present"""
        try:
            self.wait.until(EC.presence_of_element_located((by, value)))
            return True
        except TimeoutException:
            return False
    
    def is_element_visible(self, by, value, timeout=5):
        """Check if element is visible"""
        try:
            self.wait.until(EC.visibility_of_element_located((by, value)))
            return True
        except TimeoutException:
            return False
    
    def wait_for_url_contains(self, text, timeout=10):
        """Wait for URL to contain specific text"""
        try:
            self.wait.until(lambda d: text in d.current_url)
            return True
        except TimeoutException:
            return False
    
    def wait_for_text_in_element(self, by, value, text, timeout=10):
        """Wait for specific text to appear in element"""
        try:
            self.wait.until(EC.text_to_be_present_in_element((by, value), text))
            return True
        except TimeoutException:
            return False
    
    def scroll_to_element(self, by, value):
        """Scroll to an element"""
        try:
            element = self.driver.find_element(by, value)
            self.driver.execute_script("arguments[0].scrollIntoView(true);", element)
            time.sleep(0.5)
            return True
        except NoSuchElementException:
            return False
    
    def wait_for_page_load(self, timeout=30):
        """Wait for page to load completely and React to render"""
        try:
            # Wait for document ready state
            self.wait.until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            # Wait for React to render (check for React root)
            try:
                self.wait.until(
                    lambda d: d.execute_script("return document.querySelector('[data-reactroot]') !== null || document.getElementById('root') !== null || window.React !== undefined")
                )
            except:
                pass  # React might not be available, continue anyway
            
            # Additional wait for React components to render
            time.sleep(3)  # Increased wait time for React
            
            # Wait for any loading spinners to disappear
            try:
                self.wait.until(
                    lambda d: len(d.find_elements(By.CSS_SELECTOR, "[class*='loading'], [class*='spinner'], [class*='animate-spin']")) == 0
                )
            except:
                pass  # No loading spinner, that's fine
            
            return True
        except TimeoutException:
            print("[WARNING] Page load timeout, but continuing...")
            time.sleep(2)  # Still wait a bit
            return False
    
    def get_current_url(self):
        """Get current page URL"""
        return self.driver.current_url
    
    def navigate_to(self, path):
        """Navigate to a specific path"""
        from config import FRONTEND_URL
        url = f"{FRONTEND_URL}{path}"
        self.driver.get(url)
        self.wait_for_page_load()
    
    def take_screenshot(self, filename):
        """Take a screenshot"""
        try:
            self.driver.save_screenshot(filename)
            return True
        except Exception as e:
            print(f"Screenshot failed: {e}")
            return False
    
    def login(self, email, password, role="client"):
        """Helper method to login with email and password"""
        from selenium.webdriver.common.by import By
        import time
        
        print(f"[INFO] Attempting to login as {role} with email: {email[:10]}...")
        
        # Navigate to login
        self.navigate_to("/login")
        time.sleep(2)  # Wait for React
        
        # Try multiple selectors for email field
        email_selectors = [
            (By.XPATH, "//input[@type='email']"),
            (By.CSS_SELECTOR, "input[type='email']"),
            (By.XPATH, "//input[@placeholder='Enter your email']"),
        ]
        
        email_filled = False
        for by, selector in email_selectors:
            if self.is_element_visible(by, selector, timeout=5):
                email_filled = self.send_keys(by, selector, email)
                if email_filled:
                    break
        
        if not email_filled:
            self.take_screenshot("tests/screenshots/login_email_failed.png")
            print("[ERROR] Failed to fill email field")
            return False
        
        # Try multiple selectors for password field
        password_selectors = [
            (By.XPATH, "//input[@type='password']"),
            (By.CSS_SELECTOR, "input[type='password']"),
            (By.XPATH, "//input[@placeholder='Enter your password']"),
        ]
        
        password_filled = False
        for by, selector in password_selectors:
            if self.is_element_visible(by, selector, timeout=5):
                password_filled = self.send_keys(by, selector, password)
                if password_filled:
                    break
        
        if not password_filled:
            self.take_screenshot("tests/screenshots/login_password_failed.png")
            print("[ERROR] Failed to fill password field")
            return False
        
        # Find and click login button
        login_selectors = [
            (By.XPATH, "//button[@type='submit']"),
            (By.XPATH, "//button[contains(text(), 'Log In')]"),
            (By.XPATH, "//button[contains(text(), 'Login')]"),
            (By.CSS_SELECTOR, "button[type='submit']"),
        ]
        
        login_clicked = False
        for by, selector in login_selectors:
            if self.is_element_visible(by, selector, timeout=5):
                login_clicked = self.click_element(by, selector)
                if login_clicked:
                    break
        
        if login_clicked:
            print("[SUCCESS] Login button clicked")
            self.wait_for_page_load()
            time.sleep(3)  # Wait for redirect
            print(f"[INFO] Current URL after login: {self.driver.current_url}")
            return True
        else:
            self.take_screenshot("tests/screenshots/login_button_failed.png")
            print("[ERROR] Login button not found")
            return False

