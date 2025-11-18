"""
Helper script to create .env file from .env.example
"""
import os
import shutil
from pathlib import Path

def create_env_file():
    """Create .env file from .env.example"""
    script_dir = Path(__file__).parent
    env_example = script_dir / ".env.example"
    env_file = script_dir / ".env"
    
    print("=" * 60)
    print("Creating .env file for Law-Aid Testing")
    print("=" * 60)
    
    # Check if .env.example exists
    if not env_example.exists():
        print("\n[ERROR] .env.example file not found!")
        print(f"Expected location: {env_example}")
        return False
    
    # Check if .env already exists
    if env_file.exists():
        response = input(f"\n.env file already exists at:\n{env_file}\n\nOverwrite? (y/n): ")
        if response.lower() != 'y':
            print("[INFO] Keeping existing .env file")
            return True
    
    try:
        # Copy .env.example to .env
        shutil.copy(env_example, env_file)
        print(f"\n[SUCCESS] .env file created successfully!")
        print(f"Location: {env_file}")
        print("\n[IMPORTANT] Next steps:")
        print("1. Open tests/.env file")
        print("2. Update TEST_CLIENT_EMAIL, TEST_CLIENT_PASSWORD with your actual test account")
        print("3. Update TEST_LAWYER_EMAIL, TEST_LAWYER_PASSWORD with your actual test account")
        print("4. Update TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD with your actual test account")
        print("\n[NOTE] Make sure these test accounts exist in your database!")
        return True
    except Exception as e:
        print(f"\n[ERROR] Failed to create .env file: {e}")
        return False

if __name__ == "__main__":
    create_env_file()

