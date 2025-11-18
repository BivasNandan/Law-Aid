# Quick Test Commands Reference

## ✅ Important: Always Run from `tests/` Directory

```bash
cd tests
```

Then run your test commands.

---

## 🚀 Quick Test Commands

### Authentication Tests
```bash
cd tests
python -m pytest test_auth.py::TestAuthentication::test_client_login -v -s
python -m pytest test_auth.py::TestAuthentication::test_lawyer_login -v -s
python -m pytest test_auth.py::TestAuthentication::test_landing_page_loads -v -s
```

### Client Flow Tests
```bash
cd tests
python -m pytest test_client_flows.py::TestClientFlows::test_view_laws_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_find_lawyer_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_consultation_chat_page -v -s
```

### Lawyer Flow Tests
```bash
cd tests
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_lawyer_details_page -v -s
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_view_manage_law_page -v -s
```

### Admin Flow Tests
```bash
cd tests
python -m pytest test_admin_flows.py::TestAdminFlows::test_admin_legal_advise_page -v -s
```

### Run All Tests in a File
```bash
cd tests
python -m pytest test_auth.py -v -s
python -m pytest test_client_flows.py -v -s
python -m pytest test_lawyer_flows.py -v -s
python -m pytest test_admin_flows.py -v -s
```

### Run All Tests
```bash
cd tests
python run_tests.py
# OR
python -m pytest . -v -s
```

---

## ✅ Test Result Example

When test runs successfully, you'll see:
```
[INFO] Found email field with selector: //input[@type='email']
[INFO] Found password field with selector: //input[@type='password']
[VERIFY] Email entered: mrexecuter...
[VERIFY] Password entered: **********
[SUCCESS] Login button clicked
PASSED
```

---

## ⚠️ Common Issues

### Issue: "file or directory not found"
**Solution**: Make sure you're in the `tests/` directory:
```bash
cd D:\nafi\LawAid\Law-Aid\tests
```

### Issue: "collected 0 items"
**Solution**: Check you're in the right directory and file exists:
```bash
cd tests
ls test_auth.py  # Should show the file
```

### Issue: Tests run but form doesn't fill
**Solution**: 
- Make sure servers are running
- Check `.env` file has correct credentials
- Run debug test: `python test_debug_form_fill.py`

---

## 📝 Notes

- Always run from `tests/` directory
- Use `-v -s` flags for verbose output
- Tests automatically use `.env` file for credentials
- Form filling is now improved with better waits

