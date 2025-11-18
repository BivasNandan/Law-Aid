"""
Debug test to check why form filling is not working
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
from config import FRONTEND_URL, TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD
import time


def test_debug_login_form():
    """Debug test to see what's happening with form filling"""
    print("\n" + "=" * 60)
    print("DEBUG: Login Form Fill Test")
    print("=" * 60)
    
    # Setup browser
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    # Don't use headless so we can see what's happening
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    wait = WebDriverWait(driver, 20)
    helpers = TestHelpers(driver, wait)
    
    try:
        # Navigate to login
        print("\n[STEP 1] Navigating to login page...")
        driver.get(f"{FRONTEND_URL}/login")
        helpers.wait_for_page_load()
        time.sleep(3)  # Wait for React
        
        print(f"[INFO] Current URL: {driver.current_url}")
        print(f"[INFO] Page title: {driver.title}")
        
        # Find all input elements
        print("\n[STEP 2] Finding all input elements...")
        all_inputs = driver.find_elements(By.TAG_NAME, "input")
        print(f"[INFO] Found {len(all_inputs)} input elements")
        
        for i, inp in enumerate(all_inputs):
            inp_type = inp.get_attribute("type")
            inp_placeholder = inp.get_attribute("placeholder")
            inp_value = inp.get_attribute("value")
            inp_visible = inp.is_displayed()
            print(f"  Input {i+1}: type={inp_type}, placeholder={inp_placeholder}, visible={inp_visible}, value={inp_value}")
        
        # Try to find email field
        print("\n[STEP 3] Looking for email field...")
        email_selectors = [
            (By.XPATH, "//input[@type='email']"),
            (By.CSS_SELECTOR, "input[type='email']"),
        ]
        
        email_element = None
        for by, selector in email_selectors:
            try:
                elements = driver.find_elements(by, selector)
                if elements:
                    email_element = elements[0]
                    print(f"[SUCCESS] Found email field using: {selector}")
                    print(f"  - Visible: {email_element.is_displayed()}")
                    print(f"  - Enabled: {email_element.is_enabled()}")
                    break
            except Exception as e:
                print(f"[ERROR] Selector {selector} failed: {e}")
        
        if email_element:
            print("\n[STEP 4] Filling email field...")
            try:
                # Scroll to element
                driver.execute_script("arguments[0].scrollIntoView(true);", email_element)
                time.sleep(0.5)
                
                # Click to focus
                email_element.click()
                time.sleep(0.3)
                
                # Clear and type
                email_element.clear()
                time.sleep(0.2)
                email_element.send_keys(TEST_CLIENT_EMAIL)
                time.sleep(0.5)
                
                # Verify
                entered_email = email_element.get_attribute("value")
                print(f"[VERIFY] Email entered: {entered_email}")
                assert entered_email == TEST_CLIENT_EMAIL, f"Email mismatch: {entered_email} != {TEST_CLIENT_EMAIL}"
                print("[SUCCESS] Email field filled successfully!")
            except Exception as e:
                print(f"[ERROR] Failed to fill email: {e}")
                driver.save_screenshot("tests/screenshots/debug_email_error.png")
        else:
            print("[ERROR] Email field not found!")
            driver.save_screenshot("tests/screenshots/debug_email_not_found.png")
        
        # Try to find password field
        print("\n[STEP 5] Looking for password field...")
        password_element = None
        try:
            password_element = driver.find_element(By.XPATH, "//input[@type='password']")
            print("[SUCCESS] Found password field")
            print(f"  - Visible: {password_element.is_displayed()}")
            print(f"  - Enabled: {password_element.is_enabled()}")
        except Exception as e:
            print(f"[ERROR] Password field not found: {e}")
        
        if password_element:
            print("\n[STEP 6] Filling password field...")
            try:
                driver.execute_script("arguments[0].scrollIntoView(true);", password_element)
                time.sleep(0.5)
                password_element.click()
                time.sleep(0.3)
                password_element.clear()
                time.sleep(0.2)
                password_element.send_keys(TEST_CLIENT_PASSWORD)
                time.sleep(0.5)
                
                entered_password = password_element.get_attribute("value")
                print(f"[VERIFY] Password entered: {'*' * len(entered_password) if entered_password else 'NOT SET'}")
                assert len(entered_password) > 0, "Password not entered"
                print("[SUCCESS] Password field filled successfully!")
            except Exception as e:
                print(f"[ERROR] Failed to fill password: {e}")
                driver.save_screenshot("tests/screenshots/debug_password_error.png")
        
        # Take final screenshot
        print("\n[STEP 7] Taking screenshot...")
        driver.save_screenshot("tests/screenshots/debug_form_filled.png")
        print("[SUCCESS] Screenshot saved: tests/screenshots/debug_form_filled.png")
        
        # Wait so user can see
        print("\n[INFO] Keeping browser open for 5 seconds so you can see the result...")
        time.sleep(5)
        
    except Exception as e:
        print(f"\n[ERROR] Test failed: {e}")
        driver.save_screenshot("tests/screenshots/debug_error.png")
        raise
    finally:
        driver.quit()
        print("\n[INFO] Browser closed")


if __name__ == "__main__":
    test_debug_login_form()

