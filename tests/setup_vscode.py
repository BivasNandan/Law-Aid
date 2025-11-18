"""
Helper script to verify VS Code Python environment setup
Run this to check if all imports are available
"""
import sys

def check_imports():
    """Check if all required packages can be imported"""
    print("=" * 60)
    print("VS Code Python Environment Check")
    print("=" * 60)
    print(f"\nPython Version: {sys.version}")
    print(f"Python Executable: {sys.executable}")
    print(f"Python Path: {sys.path[:3]}...")
    
    print("\n" + "-" * 60)
    print("Checking Required Packages:")
    print("-" * 60)
    
    packages = {
        "pytest": "pytest",
        "selenium": "selenium",
        "webdriver_manager": "webdriver_manager",
        "requests": "requests",
        "dotenv": "python-dotenv"
    }
    
    all_ok = True
    for package_name, import_name in packages.items():
        try:
            module = __import__(import_name)
            version = getattr(module, "__version__", "unknown")
            location = getattr(module, "__file__", "unknown")
            print(f"[OK] {package_name:20} - Version: {version:15}")
            print(f"     Location: {location}")
        except ImportError as e:
            print(f"[FAIL] {package_name:20} - NOT FOUND")
            print(f"       Error: {e}")
            all_ok = False
    
    print("\n" + "-" * 60)
    if all_ok:
        print("[SUCCESS] All packages are installed correctly!")
        print("\nIf VS Code still shows import errors:")
        print("1. Press Ctrl+Shift+P")
        print("2. Type 'Python: Select Interpreter'")
        print("3. Select: " + sys.executable)
        print("4. Reload VS Code window (Ctrl+Shift+P -> 'Reload Window')")
    else:
        print("[ERROR] Some packages are missing!")
        print("Run: pip install -r requirements.txt")
    print("=" * 60)
    
    return all_ok

if __name__ == "__main__":
    check_imports()

