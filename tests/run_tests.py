#!/usr/bin/env python3
"""
Test runner script for Law-Aid Selenium tests
"""
import subprocess
import sys
import os
import time
from pathlib import Path

# Add tests directory to path
sys.path.insert(0, str(Path(__file__).parent))

def check_servers_running():
    """Check if backend and frontend servers are running"""
    import requests
    from config import FRONTEND_URL, BACKEND_URL
    
    print("[INFO] Checking if servers are running...")
    
    frontend_ok = False
    backend_ok = False
    
    try:
        response = requests.get(FRONTEND_URL, timeout=5)
        if response.status_code == 200:
            frontend_ok = True
            print(f"[OK] Frontend server is running at {FRONTEND_URL}")
    except Exception as e:
        print(f"[SKIP] Frontend server not accessible at {FRONTEND_URL}: {str(e)[:100]}")
    
    try:
        response = requests.get(f"{BACKEND_URL}/", timeout=5)
        if response.status_code == 200:
            backend_ok = True
            print(f"[OK] Backend server is running at {BACKEND_URL}")
    except Exception as e:
        print(f"[SKIP] Backend server not accessible at {BACKEND_URL}: {str(e)[:100]}")
    
    return frontend_ok and backend_ok


def run_tests(test_type="all", verbose=False):
    """Run Selenium tests"""
    test_dir = Path(__file__).parent
    
    # Build pytest command
    cmd = ["python", "-m", "pytest"]
    
    if test_type == "auth":
        cmd.append("test_auth.py")
    elif test_type == "client":
        cmd.append("test_client_flows.py")
    elif test_type == "lawyer":
        cmd.append("test_lawyer_flows.py")
    elif test_type == "admin":
        cmd.append("test_admin_flows.py")
    else:
        cmd.append(".")
    
    if verbose:
        cmd.append("-v")
    else:
        cmd.append("-q")
    
    # Add HTML report
    cmd.extend(["--html", "tests/report.html", "--self-contained-html"])
    
    # Add timeout
    cmd.extend(["--timeout", "300"])
    
    print(f"\n[RUNNING] Running tests: {test_type}")
    print(f"[COMMAND] Command: {' '.join(cmd)}\n")
    
    try:
        result = subprocess.run(cmd, cwd=test_dir)
        return result.returncode == 0
    except KeyboardInterrupt:
        print("\n[INTERRUPTED] Tests interrupted by user")
        return False
    except Exception as e:
        print(f"[ERROR] Error running tests: {e}")
        return False


def main():
    """Main entry point"""
    print("=" * 60)
    print("Law-Aid Selenium Test Runner")
    print("=" * 60)
    
    # Check if servers are running
    if not check_servers_running():
        print("\n[WARNING] Servers may not be running!")
        print("Please ensure:")
        print("  1. Backend server is running (npm run dev in backend/)")
        print("  2. Frontend server is running (npm run dev in frontend/)")
        response = input("\nContinue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Exiting...")
            sys.exit(1)
    
    # Parse command line arguments
    test_type = "all"
    verbose = False
    
    if len(sys.argv) > 1:
        test_type = sys.argv[1]
    
    if len(sys.argv) > 2 and sys.argv[2] == "-v":
        verbose = True
    
    # Run tests
    success = run_tests(test_type, verbose)
    
    if success:
        print("\n[SUCCESS] All tests completed successfully!")
        print(f"[REPORT] HTML report generated: tests/report.html")
    else:
        print("\n[FAILED] Some tests failed. Check the report for details.")
        print(f"[REPORT] HTML report: tests/report.html")
        sys.exit(1)


if __name__ == "__main__":
    main()

