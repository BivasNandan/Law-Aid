"""
Pytest configuration and fixtures for Selenium tests
"""
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.firefox.service import Service as FirefoxService
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.edge.options import Options as EdgeOptions
from webdriver_manager.chrome import ChromeDriverManager
from webdriver_manager.firefox import GeckoDriverManager
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import os
from datetime import datetime
from config import (
    FRONTEND_URL, BROWSER, HEADLESS, IMPLICIT_WAIT, 
    PAGE_LOAD_TIMEOUT, SCREENSHOT_DIR, FAILED_SCREENSHOT_DIR
)


@pytest.fixture(scope="function")
def driver():
    """Create and configure WebDriver instance"""
    if BROWSER.lower() == "chrome":
        options = Options()
        if HEADLESS:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--start-maximized")
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    elif BROWSER.lower() == "firefox":
        options = FirefoxOptions()
        if HEADLESS:
            options.add_argument("--headless")
        service = FirefoxService(GeckoDriverManager().install())
        driver = webdriver.Firefox(service=service, options=options)
    elif BROWSER.lower() == "edge":
        options = EdgeOptions()
        if HEADLESS:
            options.add_argument("--headless")
        service = EdgeService(EdgeChromiumDriverManager().install())
        driver = webdriver.Edge(service=service, options=options)
    else:
        raise ValueError(f"Unsupported browser: {BROWSER}")
    
    driver.implicitly_wait(IMPLICIT_WAIT)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)
    driver.get(FRONTEND_URL)
    
    yield driver
    
    # Cleanup
    driver.quit()


@pytest.fixture(scope="function")
def wait(driver):
    """WebDriverWait instance"""
    return WebDriverWait(driver, IMPLICIT_WAIT)


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Capture screenshot on test failure"""
    outcome = yield
    rep = outcome.get_result()
    
    if rep.when == "call" and rep.failed:
        driver = item.funcargs.get("driver")
        if driver:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            screenshot_path = os.path.join(
                FAILED_SCREENSHOT_DIR, 
                f"{item.name}_{timestamp}.png"
            )
            try:
                driver.save_screenshot(screenshot_path)
                print(f"\nScreenshot saved: {screenshot_path}")
            except Exception as e:
                print(f"Failed to save screenshot: {e}")

