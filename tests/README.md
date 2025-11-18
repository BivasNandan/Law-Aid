# Law-Aid Selenium Test Suite

Automated end-to-end testing for the Law-Aid web application using Python Selenium.

## Prerequisites

1. **Python 3.8+** installed
2. **Backend server** running on `http://localhost:5000`
3. **Frontend server** running on `http://localhost:5173`
4. **Chrome/Firefox/Edge** browser installed

## Setup

### 1. Install Python Dependencies

```bash
cd tests
pip install -r requirements.txt
```

### 2. Configure Test Credentials

Create a `.env` file in the `tests/` directory (or set environment variables):

```env
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Test account credentials
TEST_CLIENT_EMAIL=client@test.com
TEST_CLIENT_PASSWORD=Test@1234
TEST_LAWYER_EMAIL=lawyer@test.com
TEST_LAWYER_PASSWORD=Test@1234
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=Test@1234

# Browser configuration
BROWSER=chrome  # chrome, firefox, edge
HEADLESS=false  # true for headless mode
IMPLICIT_WAIT=10
PAGE_LOAD_TIMEOUT=30
```

### 3. Start Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Running Tests

### Run All Tests

```bash
python run_tests.py
```

### Run Specific Test Suites

```bash
# Authentication tests only
python run_tests.py auth

# Client flow tests only
python run_tests.py client

# Lawyer flow tests only
python run_tests.py lawyer

# Admin flow tests only
python run_tests.py admin
```

### Run with Verbose Output

```bash
python run_tests.py all -v
```

### Run Individual Test Files

```bash
# Using pytest directly
pytest test_auth.py -v
pytest test_client_flows.py -v
pytest test_lawyer_flows.py -v
pytest test_admin_flows.py -v
```

### Run with HTML Report

```bash
pytest --html=report.html --self-contained-html
```

## Test Structure

```
tests/
├── conftest.py              # Pytest configuration and fixtures
├── config.py                # Test configuration
├── requirements.txt         # Python dependencies
├── run_tests.py            # Test runner script
├── test_auth.py            # Authentication tests
├── test_client_flows.py    # Client functionality tests
├── test_lawyer_flows.py    # Lawyer functionality tests
├── test_admin_flows.py     # Admin functionality tests
├── utils/
│   └── helpers.py          # Test helper utilities
└── screenshots/
    └── failed/             # Screenshots of failed tests
```

## Test Coverage

### Authentication Tests (`test_auth.py`)
- Landing page load
- Role selection
- Client signup
- Lawyer signup
- Client login
- Lawyer login
- Logout

### Client Flow Tests (`test_client_flows.py`)
- View laws page
- Law details page
- Find lawyer page
- Lawyer profile view
- Consultation chat
- Book appointment
- My appointments
- Client profile

### Lawyer Flow Tests (`test_lawyer_flows.py`)
- Lawyer details/registration
- View and manage laws
- Create law via form
- Manage appointments
- Schedule page
- Lawyer profile
- View feedback

### Admin Flow Tests (`test_admin_flows.py`)
- Legal advise by expert page
- Admin consultation chat
- Admin profile

## Troubleshooting

### Tests Fail with "Server not accessible"
- Ensure both backend and frontend servers are running
- Check URLs in `config.py` match your server ports
- Verify firewall/network settings

### Element Not Found Errors
- Update selectors in test files to match your actual HTML structure
- Increase `IMPLICIT_WAIT` in `config.py`
- Check browser console for JavaScript errors

### Screenshot Issues
- Ensure `tests/screenshots/` directory exists
- Check file permissions

### Browser Driver Issues
- `webdriver-manager` should auto-download drivers
- For manual setup, ensure ChromeDriver/GeckoDriver is in PATH

## Customization

### Adding New Tests

1. Create a new test file or add to existing one
2. Import necessary modules:
   ```python
   from selenium.webdriver.common.by import By
   from utils.helpers import TestHelpers
   ```

3. Use the `driver` and `wait` fixtures:
   ```python
   def test_my_feature(self, driver, wait):
       helpers = TestHelpers(driver, wait)
       # Your test code
   ```

### Updating Selectors

If your HTML structure changes, update selectors in test files. The helper utilities provide flexible element finding methods.

## CI/CD Integration

To run tests in CI/CD:

```yaml
# Example GitHub Actions
- name: Run Selenium Tests
  run: |
    cd tests
    pip install -r requirements.txt
    python run_tests.py all
```

## Notes

- Tests use flexible selectors to handle minor UI changes
- Screenshots are automatically captured on test failures
- HTML reports are generated after each test run
- Tests are designed to be independent and can run in any order

