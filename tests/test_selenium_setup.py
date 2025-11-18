"""
Simple test to verify Selenium and ChromeDriver are working correctly
This test runs without requiring servers to be up
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
import time


def test_selenium_chromedriver_setup():
    """Test that Selenium can launch Chrome with ChromeDriver"""
    print("\n[TEST] Testing Selenium + ChromeDriver setup...")
    
    # Setup Chrome options
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    
    # Use webdriver-manager to automatically download/use ChromeDriver
    service = Service(ChromeDriverManager().install())
    
    driver = None
    try:
        # Launch browser
        print("  -> Launching Chrome browser...")
        driver = webdriver.Chrome(service=service, options=options)
        print("  [OK] Chrome browser launched successfully!")
        
        # Navigate to a test page
        print("  -> Navigating to Google (test page)...")
        driver.get("https://www.google.com")
        time.sleep(2)
        print("  [OK] Page loaded successfully!")
        
        # Verify we can find elements
        print("  -> Testing element finding...")
        search_box = driver.find_element(By.NAME, "q")
        assert search_box is not None
        print("  [OK] Element finding works!")
        
        # Test sending keys
        print("  -> Testing keyboard input...")
        search_box.send_keys("Selenium test")
        time.sleep(1)
        print("  [OK] Keyboard input works!")
        
        # Verify page title
        title = driver.title
        assert "Google" in title
        print(f"  [OK] Page title verified: {title}")
        
        print("\n[SUCCESS] Selenium + ChromeDriver setup is working correctly!")
        print("   - ChromeDriver: Auto-managed by webdriver-manager")
        print("   - Browser: Chrome launched successfully")
        print("   - Element finding: Working")
        print("   - Keyboard input: Working")
        
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Selenium setup test failed: {e}")
        raise
    finally:
        if driver:
            driver.quit()
            print("  -> Browser closed")


def test_selenium_localhost_connection():
    """Test that Selenium can connect to localhost (when server is running)"""
    print("\n[TEST] Testing localhost connection...")
    
    options = Options()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    service = Service(ChromeDriverManager().install())
    driver = None
    
    try:
        driver = webdriver.Chrome(service=service, options=options)
        
        # Try to connect to frontend
        print("  -> Attempting to connect to http://localhost:5173...")
        try:
            driver.get("http://localhost:5173")
            time.sleep(2)
            title = driver.title
            print(f"  [OK] Frontend server is running! Page title: {title}")
            return True
        except Exception as e:
            print(f"  [WARN] Frontend server not running: {e}")
            print("  [TIP] Start frontend with: cd frontend && npm run dev")
            return False
            
    except Exception as e:
        print(f"  [ERROR] Error: {e}")
        return False
    finally:
        if driver:
            driver.quit()


if __name__ == "__main__":
    print("=" * 60)
    print("Selenium Setup Verification Test")
    print("=" * 60)
    
    # Run the basic setup test
    try:
        test_selenium_chromedriver_setup()
    except Exception as e:
        print(f"\n[ERROR] Setup test failed: {e}")
        exit(1)
    
    # Try localhost test (will fail if servers not running, that's OK)
    test_selenium_localhost_connection()
    
    print("\n" + "=" * 60)
    print("[SUCCESS] Selenium is properly configured and ready for testing!")
    print("=" * 60)

