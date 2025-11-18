# Environment Variables Setup Guide

## Quick Setup

### Step 1: Copy Example File
```bash
cd tests
copy .env.example .env
```

Or manually create `.env` file in the `tests/` directory.

### Step 2: Update Test Credentials

Edit `tests/.env` and update these values with your actual test accounts:

```env
TEST_CLIENT_EMAIL=your_actual_client@email.com
TEST_CLIENT_PASSWORD=YourActualPassword@123

TEST_LAWYER_EMAIL=your_actual_lawyer@email.com
TEST_LAWYER_PASSWORD=YourActualPassword@123

TEST_ADMIN_EMAIL=your_actual_admin@email.com
TEST_ADMIN_PASSWORD=YourActualPassword@123
```

### Step 3: Verify Configuration

Run this to check if environment variables are loaded:
```bash
cd tests
python -c "from config import *; print('FRONTEND_URL:', FRONTEND_URL); print('TEST_CLIENT_EMAIL:', TEST_CLIENT_EMAIL)"
```

---

## Required Environment Variables

### Application URLs
- `FRONTEND_URL` - Frontend server URL (default: http://localhost:5173)
- `BACKEND_URL` - Backend server URL (default: http://localhost:5000)

### Test Account Credentials
These accounts must exist in your database:

- `TEST_CLIENT_EMAIL` - Client test account email
- `TEST_CLIENT_PASSWORD` - Client test account password
- `TEST_LAWYER_EMAIL` - Lawyer test account email
- `TEST_LAWYER_PASSWORD` - Lawyer test account password
- `TEST_ADMIN_EMAIL` - Admin test account email
- `TEST_ADMIN_PASSWORD` - Admin test account password

**Password Requirements** (based on your app):
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

### Browser Configuration
- `BROWSER` - Browser to use: `chrome`, `firefox`, or `edge` (default: chrome)
- `HEADLESS` - Run in headless mode: `true` or `false` (default: false)
- `IMPLICIT_WAIT` - Implicit wait time in seconds (default: 10)
- `PAGE_LOAD_TIMEOUT` - Page load timeout in seconds (default: 30)

### Screenshot Settings
- `SCREENSHOT_DIR` - Directory for screenshots (default: tests/screenshots)

---

## Creating Test Accounts

Before running tests, you need to create test accounts in your database.

### Option 1: Create via Signup Flow
1. Start your servers
2. Navigate to http://localhost:5173/role
3. Create accounts for each role (client, lawyer, admin)
4. Use the credentials in your `.env` file

### Option 2: Create via Database
Insert test users directly into your MongoDB database.

### Option 3: Use Existing Accounts
If you already have test accounts, just update the `.env` file with those credentials.

---

## Example .env File

```env
# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Test Account Credentials
TEST_CLIENT_EMAIL=testclient@lawaid.com
TEST_CLIENT_PASSWORD=TestClient@123
TEST_LAWYER_EMAIL=testlawyer@lawaid.com
TEST_LAWYER_PASSWORD=TestLawyer@123
TEST_ADMIN_EMAIL=testadmin@lawaid.com
TEST_ADMIN_PASSWORD=TestAdmin@123

# Browser Configuration
BROWSER=chrome
HEADLESS=false
IMPLICIT_WAIT=10
PAGE_LOAD_TIMEOUT=30

# Screenshot Settings
SCREENSHOT_DIR=tests/screenshots
```

---

## Verification

After setting up `.env`, verify it's working:

```bash
cd tests
python setup_vscode.py
```

This will show if all packages are installed and environment is configured correctly.

---

## Troubleshooting

### "Module not found" errors
- Make sure you're in the `tests/` directory
- Check that `python-dotenv` is installed: `pip install python-dotenv`

### "Test account not found" errors
- Verify test accounts exist in your database
- Check that email/password in `.env` match your database
- Ensure passwords meet your app's requirements

### "Server not accessible" errors
- Make sure backend is running: `cd backend && npm run dev`
- Make sure frontend is running: `cd frontend && npm run dev`
- Check URLs in `.env` match your server ports

---

## Security Notes

- ✅ `.env` is in `.gitignore` - won't be committed to git
- ✅ `.env.example` is safe to commit (no real credentials)
- ⚠️ Never commit `.env` file with real credentials
- ⚠️ Use test accounts, not production accounts

---

## Next Steps

1. ✅ Create `.env` file from `.env.example`
2. ✅ Update with your test account credentials
3. ✅ Create test accounts in database
4. ✅ Verify configuration
5. ✅ Run tests: `python run_tests.py`

