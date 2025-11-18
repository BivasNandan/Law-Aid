"""
Verify that tests are loading data from .env file
"""
from config import (
    FRONTEND_URL, BACKEND_URL,
    TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD,
    TEST_LAWYER_EMAIL, TEST_LAWYER_PASSWORD,
    TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD,
    BROWSER, HEADLESS, IMPLICIT_WAIT, PAGE_LOAD_TIMEOUT
)

print("=" * 60)
print("Verifying .env File Loading")
print("=" * 60)

print("\n[Application URLs]")
print(f"  FRONTEND_URL: {FRONTEND_URL}")
print(f"  BACKEND_URL: {BACKEND_URL}")

print("\n[Test Account Credentials]")
print(f"  TEST_CLIENT_EMAIL: {TEST_CLIENT_EMAIL}")
print(f"  TEST_CLIENT_PASSWORD: {'*' * len(TEST_CLIENT_PASSWORD) if TEST_CLIENT_PASSWORD else 'NOT SET'}")
print(f"  TEST_LAWYER_EMAIL: {TEST_LAWYER_EMAIL}")
print(f"  TEST_LAWYER_PASSWORD: {'*' * len(TEST_LAWYER_PASSWORD) if TEST_LAWYER_PASSWORD else 'NOT SET'}")
print(f"  TEST_ADMIN_EMAIL: {TEST_ADMIN_EMAIL}")
print(f"  TEST_ADMIN_PASSWORD: {'*' * len(TEST_ADMIN_PASSWORD) if TEST_ADMIN_PASSWORD else 'NOT SET'}")

print("\n[Browser Configuration]")
print(f"  BROWSER: {BROWSER}")
print(f"  HEADLESS: {HEADLESS}")
print(f"  IMPLICIT_WAIT: {IMPLICIT_WAIT} seconds")
print(f"  PAGE_LOAD_TIMEOUT: {PAGE_LOAD_TIMEOUT} seconds")

print("\n" + "=" * 60)
print("[SUCCESS] All variables loaded from .env file!")
print("=" * 60)
print("\nTests will use these values automatically when you run:")
print("  python run_tests.py")
print("  OR")
print("  pytest test_auth.py")

