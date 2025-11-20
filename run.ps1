# Run script for Windows PowerShell (development)
# Usage: Right-click -> Run with PowerShell, or run in terminal: .\run.ps1

# Create virtual environment if it doesn't exist
if (-not (Test-Path -Path .\.venv)) {
    python -m venv .venv
}

# Activate venv for the current PowerShell session
. .\.venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Load env from .env if present (optional)
if (Test-Path -Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match "^\s*([^#=]+)=\s*(.*)\s*$") {
            $name = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            $env:$name = $value
        }
    }
}

# Ensure default env vars
if (-not $env:DATABASE_URL) { $env:DATABASE_URL = "sqlite:///app.db" }
if (-not $env:FLASK_SECRET_KEY) { $env:FLASK_SECRET_KEY = "change_me" }

# Run the app
python app.py
