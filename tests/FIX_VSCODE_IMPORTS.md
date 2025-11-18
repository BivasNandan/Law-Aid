# Fix VS Code Import Resolution Issues

## Problem
VS Code shows import errors like:
- `Import "pytest" could not be resolved`
- `Import "selenium" could not be resolved`
- etc.

## Solution Steps

### Step 1: Select Correct Python Interpreter

1. **Press `Ctrl+Shift+P`** (or `Cmd+Shift+P` on Mac)
2. Type: **`Python: Select Interpreter`**
3. Select: **`C:\Program Files\Python310\python.exe`** (or the Python where packages are installed)
4. If not listed, click **"Enter interpreter path..."** and browse to your Python executable

### Step 2: Reload VS Code Window

1. **Press `Ctrl+Shift+P`**
2. Type: **`Developer: Reload Window`**
3. Press Enter

### Step 3: Verify Setup

Run this command in terminal:
```bash
cd tests
python setup_vscode.py
```

This will show if all packages are installed correctly.

### Step 4: If Still Not Working

#### Option A: Install in Current Environment
```bash
cd tests
python -m pip install -r requirements.txt
```

#### Option B: Create Virtual Environment (Recommended)
```bash
cd tests
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

Then select the virtual environment interpreter in VS Code:
- `Ctrl+Shift+P` → `Python: Select Interpreter`
- Choose: `.\tests\venv\Scripts\python.exe`

## Files Created to Help

1. **`.vscode/settings.json`** - VS Code Python configuration
2. **`tests/pyrightconfig.json`** - Type checking configuration
3. **`tests/setup_vscode.py`** - Verification script

## Quick Fix Command

```bash
# Verify packages are installed
python -m pip list | findstr -i "selenium pytest"

# If missing, install
python -m pip install -r tests/requirements.txt
```

## After Fixing

The import errors should disappear. If they persist:
1. Close and reopen VS Code
2. Make sure you selected the correct Python interpreter
3. Check that packages are installed in that Python environment

