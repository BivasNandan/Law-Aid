#!/usr/bin/env python3
"""
Helper script to start backend and frontend servers for testing
"""
import subprocess
import sys
import os
import time
import signal
from pathlib import Path

# Get project root (parent of tests directory)
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"

processes = []

def signal_handler(sig, frame):
    """Handle Ctrl+C to stop all processes"""
    print("\n\n[STOPPING] Stopping all servers...")
    for proc in processes:
        try:
            proc.terminate()
            proc.wait(timeout=5)
        except:
            proc.kill()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def start_backend():
    """Start backend server"""
    print("[STARTING] Starting backend server...")
    try:
        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(BACKEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        processes.append(proc)
        print(f"[OK] Backend server started (PID: {proc.pid})")
        return proc
    except Exception as e:
        print(f"[ERROR] Failed to start backend: {e}")
        return None

def start_frontend():
    """Start frontend server"""
    print("[STARTING] Starting frontend server...")
    try:
        proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=str(FRONTEND_DIR),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        processes.append(proc)
        print(f"[OK] Frontend server started (PID: {proc.pid})")
        return proc
    except Exception as e:
        print(f"[ERROR] Failed to start frontend: {e}")
        return None

def main():
    """Main entry point"""
    print("=" * 60)
    print("Law-Aid Server Starter")
    print("=" * 60)
    print(f"Project root: {PROJECT_ROOT}")
    print(f"Backend dir: {BACKEND_DIR}")
    print(f"Frontend dir: {FRONTEND_DIR}\n")
    
    # Check if directories exist
    if not BACKEND_DIR.exists():
        print(f"[ERROR] Backend directory not found: {BACKEND_DIR}")
        sys.exit(1)
    
    if not FRONTEND_DIR.exists():
        print(f"[ERROR] Frontend directory not found: {FRONTEND_DIR}")
        sys.exit(1)
    
    # Start servers
    backend_proc = start_backend()
    time.sleep(2)  # Give backend time to start
    
    frontend_proc = start_frontend()
    time.sleep(2)  # Give frontend time to start
    
    if backend_proc and frontend_proc:
        print("\n[SUCCESS] Both servers are running!")
        print("Press Ctrl+C to stop all servers\n")
        
        # Keep script running
        try:
            while True:
                time.sleep(1)
                # Check if processes are still running
                if backend_proc.poll() is not None:
                    print("[WARNING] Backend server stopped")
                if frontend_proc.poll() is not None:
                    print("[WARNING] Frontend server stopped")
        except KeyboardInterrupt:
            signal_handler(None, None)
    else:
        print("\n[ERROR] Failed to start one or more servers")
        signal_handler(None, None)
        sys.exit(1)

if __name__ == "__main__":
    main()

