# Test Commands - Individual Test Execution

## How to Run Individual Tests

### Authentication Tests
```bash
cd tests

# Run all auth tests
python -m pytest test_auth.py -v -s

# Run specific test
python -m pytest test_auth.py::TestAuthentication::test_client_login -v -s
python -m pytest test_auth.py::TestAuthentication::test_lawyer_login -v -s
python -m pytest test_auth.py::test_landing_page_loads -v -s
```

### Client Flow Tests
```bash
cd tests

# Run all client tests
python -m pytest test_client_flows.py -v -s

# Run specific test
python -m pytest test_client_flows.py::TestClientFlows::test_view_laws_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_find_lawyer_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_consultation_chat_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_book_appointment_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_my_appointments_page -v -s
python -m pytest test_client_flows.py::TestClientFlows::test_client_profile_page -v -s
```

### Lawyer Flow Tests
```bash
cd tests

# Run all lawyer tests
python -m pytest test_lawyer_flows.py -v -s

# Run specific test
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_lawyer_details_page -v -s
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_view_manage_law_page -v -s
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_law_form_create -v -s
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_manage_appointments_page -v -s
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_schedule_page -v -s
python -m pytest test_lawyer_flows.py::TestLawyerFlows::test_lawyer_profile_page -v -s
```

### Admin Flow Tests
```bash
cd tests

# Run all admin tests
python -m pytest test_admin_flows.py -v -s

# Run specific test
python -m pytest test_admin_flows.py::TestAdminFlows::test_admin_legal_advise_page -v -s
python -m pytest test_admin_flows.py::TestAdminFlows::test_admin_consultation_chat_page -v -s
python -m pytest test_admin_flows.py::TestAdminFlows::test_admin_profile_page -v -s
```

### Functional Tests
```bash
cd tests

# Run all functional tests
python -m pytest test_functional.py -v -s

# Run specific test
python -m pytest test_functional.py::TestFunctionalFlows::test_landing_page_loads -v -s
python -m pytest test_functional.py::TestFunctionalFlows::test_login_form_interaction -v -s
python -m pytest test_functional.py::TestFunctionalFlows::test_signup_form_interaction -v -s
```

### Debug Test
```bash
cd tests

# Run debug form fill test
python test_debug_form_fill.py
# OR
python -m pytest test_debug_form_fill.py -v -s
```

## Common Options

- `-v` : Verbose output (shows test names)
- `-s` : Show print statements (don't capture output)
- `-x` : Stop on first failure
- `--pdb` : Drop into debugger on failure
- `--html=report.html` : Generate HTML report

## Examples

```bash
# Run single test with verbose output
python -m pytest test_auth.py::TestAuthentication::test_client_login -v -s

# Run all tests in a file
python -m pytest test_client_flows.py -v -s

# Run with HTML report
python -m pytest test_auth.py --html=report.html -v

# Run and stop on first failure
python -m pytest test_auth.py -x -v -s
```

## Quick Reference

All tests now use improved form filling with:
- ✅ Multiple selector strategies
- ✅ Better wait times for React
- ✅ Element visibility checks
- ✅ Verification of entered values
- ✅ Screenshots on failure
- ✅ Detailed logging

