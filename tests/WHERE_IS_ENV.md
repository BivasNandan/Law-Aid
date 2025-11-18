# .env ফাইল কোথায়?

## ✅ .env ফাইল অবস্থান

**ফাইল পাথ**: `D:\nafi\LawAid\Law-Aid\tests\.env`

অথবা relative path: `tests/.env`

---

## 📁 ফাইল স্ট্রাকচার

```
Law-Aid/
├── backend/
├── frontend/
└── tests/
    ├── .env          ← এখানে .env ফাইল আছে
    ├── config.py     ← এই ফাইল .env থেকে variables load করে
    ├── conftest.py
    ├── test_*.py
    └── ...
```

---

## ✅ .env ফাইল তৈরি হয়েছে

`.env` ফাইল **tests/** ডিরেক্টরিতে তৈরি করা হয়েছে।

### ফাইলের Content:

```env
# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Test Account Credentials
TEST_CLIENT_EMAIL=client@test.com
TEST_CLIENT_PASSWORD=Test@1234

TEST_LAWYER_EMAIL=lawyer@test.com
TEST_LAWYER_PASSWORD=Test@1234

TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=Test@1234

# Browser Configuration
BROWSER=chrome
HEADLESS=false
IMPLICIT_WAIT=10
PAGE_LOAD_TIMEOUT=30

# Screenshot Settings
SCREENSHOT_DIR=tests/screenshots
```

---

## 🔧 এখন কী করতে হবে?

### 1. .env ফাইল খুলুন
VS Code-তে `tests/.env` ফাইলটি খুলুন।

### 2. Test Account Credentials Update করুন
আপনার actual test account credentials দিয়ে update করুন:

```env
TEST_CLIENT_EMAIL=your_actual_client@email.com
TEST_CLIENT_PASSWORD=YourActualPassword@123

TEST_LAWYER_EMAIL=your_actual_lawyer@email.com
TEST_LAWYER_PASSWORD=YourActualPassword@123

TEST_ADMIN_EMAIL=your_actual_admin@email.com
TEST_ADMIN_PASSWORD=YourActualPassword@123
```

### 3. Verify করুন
```bash
cd tests
python -c "from config import *; print('FRONTEND_URL:', FRONTEND_URL)"
```

---

## 📝 Important Notes

- ✅ `.env` ফাইল `tests/` ডিরেক্টরিতে আছে
- ✅ `.env` ফাইল `.gitignore`-এ আছে (git-এ commit হবে না)
- ⚠️ Test accounts database-এ create করতে হবে
- ⚠️ Passwords আপনার app-এর requirements মেনে হতে হবে

---

## 🎯 Quick Access

VS Code-তে:
1. File Explorer-এ `tests/` folder খুলুন
2. `.env` file খুঁজুন (hidden file হতে পারে)
3. Double-click করে edit করুন

---

**Location**: `D:\nafi\LawAid\Law-Aid\tests\.env`

