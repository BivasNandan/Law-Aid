# Quick Start Guide - Selenium Testing

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd tests
pip install -r requirements.txt
```

### Step 2: Start Servers

**Option A: Manual (Recommended for first time)**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

**Option B: Using Helper Script**
```bash
cd tests
python start_servers.py
```

### Step 3: Configure Test Credentials

Create `tests/.env` file:
```env
TEST_CLIENT_EMAIL=your_client@test.com
TEST_CLIENT_PASSWORD=YourPassword@123
TEST_LAWYER_EMAIL=your_lawyer@test.com
TEST_LAWYER_PASSWORD=YourPassword@123
TEST_ADMIN_EMAIL=your_admin@test.com
TEST_ADMIN_PASSWORD=YourPassword@123
```

Or set environment variables before running tests.

### Step 4: Run Tests

```bash
# Run all tests
python run_tests.py

# Run specific test suite
python run_tests.py auth
python run_tests.py client
python run_tests.py lawyer
python run_tests.py admin

# Run with verbose output
python run_tests.py all -v
```

## 📋 Test Structure

```
tests/
├── test_auth.py          # Login, Signup, Role Selection
├── test_client_flows.py   # Client features (laws, lawyers, appointments)
├── test_lawyer_flows.py  # Lawyer features (manage laws, appointments)
├── test_admin_flows.py   # Admin features (legal advice, chat)
├── config.py             # Configuration
├── conftest.py           # Pytest fixtures
├── utils/
│   └── helpers.py       # Helper functions
└── screenshots/          # Auto-generated on failures
```

## 🔧 Troubleshooting

### "Server not accessible" error
- Ensure both servers are running
- Check ports: Backend (5000), Frontend (5173)
- Verify URLs in `config.py`

### "Element not found" errors
- Update selectors in test files to match your HTML
- Increase `IMPLICIT_WAIT` in `config.py`
- Check browser console for JavaScript errors

### Browser driver issues
- `webdriver-manager` auto-downloads drivers
- Ensure Chrome/Firefox/Edge is installed
- For headless mode, set `HEADLESS=true` in `.env`

## 📊 Viewing Results

After tests complete:
- **HTML Report**: `tests/report.html` (open in browser)
- **Screenshots**: `tests/screenshots/failed/` (on test failures)
- **Console Output**: Detailed logs in terminal

## 🎯 Next Steps

1. **Customize Tests**: Update selectors in test files to match your UI
2. **Add More Tests**: Create new test files following existing patterns
3. **CI/CD Integration**: Use `run_tests.py` in your CI pipeline
4. **Parallel Execution**: Use `pytest-xdist` for faster test runs

## 💡 Tips

- Run tests in non-headless mode first to see what's happening
- Update test credentials to match your test accounts
- Check `tests/README.md` for detailed documentation
- Screenshots are automatically saved on failures

