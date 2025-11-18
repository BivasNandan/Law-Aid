"""
Test configuration for Law-Aid Selenium tests
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Application URLs
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")

# Test credentials (update these with actual test accounts)
TEST_CLIENT_EMAIL = os.getenv("TEST_CLIENT_EMAIL", "client@test.com")
TEST_CLIENT_PASSWORD = os.getenv("TEST_CLIENT_PASSWORD", "Test@1234")
TEST_LAWYER_EMAIL = os.getenv("TEST_LAWYER_EMAIL", "lawyer@test.com")
TEST_LAWYER_PASSWORD = os.getenv("TEST_LAWYER_PASSWORD", "Test@1234")
TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@test.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "Test@1234")

# Browser configuration
BROWSER = os.getenv("BROWSER", "chrome")  # chrome, firefox, edge
HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
IMPLICIT_WAIT = int(os.getenv("IMPLICIT_WAIT", "10"))
PAGE_LOAD_TIMEOUT = int(os.getenv("PAGE_LOAD_TIMEOUT", "30"))

# Screenshot settings
SCREENSHOT_DIR = os.getenv("SCREENSHOT_DIR", "tests/screenshots")
FAILED_SCREENSHOT_DIR = os.path.join(SCREENSHOT_DIR, "failed")

# Create directories if they don't exist
os.makedirs(SCREENSHOT_DIR, exist_ok=True)
os.makedirs(FAILED_SCREENSHOT_DIR, exist_ok=True)

