# start.bat (Windows)
@echo off
echo Starting JARVIS AI Assistant...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if Ollama is installed
ollama --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Ollama is not installed
    echo Please install Ollama from https://ollama.ai
    echo The application will run in online-only mode
    timeout /t 3
)

REM Start Ollama service if available
echo Starting Ollama service...
start /B ollama serve >nul 2>&1

REM Wait for Ollama to start
timeout /t 5

REM Install Python dependencies if needed
if not exist "venv\" (
    echo Creating virtual environment...
    python -m venv venv
)

call venv\Scripts\activate.bat

if not exist "venv\Lib\site-packages\fastapi\" (
    echo Installing Python dependencies...
    pip install -r requirements.txt
)

REM Install Node.js dependencies if needed
cd frontend
if not exist "node_modules\" (
    echo Installing Node.js dependencies...
    npm install
)

REM Build frontend if needed
if not exist "dist\index.html" (
    echo Building frontend...
    npm run build
)

cd ..

REM Start the backend server
echo Starting JARVIS AI Assistant...
echo Backend will be available at http://localhost:8000
echo.
python backend/main.py

pause

---

# start.sh (Linux/Mac)
#!/bin/bash

echo "Starting JARVIS AI Assistant..."
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ from your package manager or https://python.org"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    echo "Please install Node.js from your package manager or https://nodejs.org"
    exit 1
fi

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo -e "${YELLOW}WARNING: Ollama is not installed${NC}"
    echo "Please install Ollama from https://ollama.ai"
    echo "The application will run in online-only mode"
    sleep 3
else
    echo -e "${GREEN}Starting Ollama service...${NC}"
    # Start Ollama service in background
    ollama serve &> /dev/null &
    sleep 5
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${BLUE}Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/fastapi/__init__.py" ]; then
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    pip install -r requirements.txt
fi

# Install Node.js dependencies if needed
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing Node.js dependencies...${NC}"
    npm install
fi

# Build frontend if needed
if [ ! -f "dist/index.html" ]; then
    echo -e "${BLUE}Building frontend...${NC}"
    npm run build
fi

cd ..

# Create necessary directories
mkdir -p logs uploads config

# Start the backend server
echo -e "${GREEN}Starting JARVIS AI Assistant...${NC}"
echo -e "${BLUE}Backend will be available at http://localhost:8000${NC}"
echo

python3 backend/main.py

---

# install.sh (Installation Script)
#!/bin/bash

echo "=========================================="
echo "  JARVIS AI Assistant Installation"
echo "=========================================="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install system dependencies on different OS
install_system_deps() {
    echo -e "${BLUE}Installing system dependencies...${NC}"
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command_exists apt-get; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y python3 python3-pip python3-venv nodejs npm curl wget
        elif command_exists yum; then
            # RedHat/CentOS
            sudo yum install -y python3 python3-pip nodejs npm curl wget
        elif command_exists pacman; then
            # Arch Linux
            sudo pacman -S python python-pip nodejs npm curl wget
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command_exists brew; then
            brew install python3 node curl wget
        else
            echo -e "${YELLOW}Homebrew not found. Please install it first:${NC}"
            echo "/bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    fi
}

# Check and install Python
if ! command_exists python3; then
    echo -e "${YELLOW}Python 3 not found. Installing...${NC}"
    install_system_deps
else
    echo -e "${GREEN}✓ Python 3 found${NC}"
fi

# Check and install Node.js
if ! command_exists node; then
    echo -e "${YELLOW}Node.js not found. Installing...${NC}"
    install_system_deps
else
    echo -e "${GREEN}✓ Node.js found${NC}"
fi

# Install Ollama
if ! command_exists ollama; then
    echo -e "${YELLOW}Installing Ollama...${NC}"
    curl -fsSL https://ollama.ai/install.sh | sh
    echo -e "${GREEN}✓ Ollama installed${NC}"
else
    echo -e "${GREEN}✓ Ollama found${NC}"
fi

# Create project directories
echo -e "${BLUE}Setting up project structure...${NC}"
mkdir -p logs uploads config

# Create virtual environment
echo -e "${BLUE}Creating Python virtual environment...${NC}"
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo -e "${BLUE}Installing Python dependencies...${NC}"
pip install --upgrade pip
pip install -r requirements.txt

# Install Node.js dependencies
echo -e "${BLUE}Installing Node.js dependencies...${NC}"
cd frontend
npm install
npm run build
cd ..

# Create default configuration files
echo -e "${BLUE}Creating configuration files...${NC}"

# Create models.json if it doesn't exist
if [ ! -f "config/models.json" ]; then
    cat > config/models.json << 'EOF'
{
  "ollama_models": {
    "recommended": [
      {
        "name": "llama3.2",
        "description": "Fast and efficient model for general tasks",
        "size": "3.2B",
        "use_case": ["general", "coding", "conversation"]
      },
      {
        "name": "codellama",
        "description": "Specialized for coding tasks",
        "size": "7B",
        "use_case": ["coding", "programming", "debugging"]
      }
    ]
  }
}
EOF
fi

# Create settings.json if it doesn't exist
if [ ! -f "config/settings.json" ]; then
    cat > config/settings.json << 'EOF'
{
  "app": {
    "name": "JARVIS AI Assistant",
    "version": "1.0.0",
    "theme": "dark"
  },
  "ui": {
    "orb_color": "#00d4ff",
    "orb_pulse": true
  },
  "behavior": {
    "default_model": "llama3.2",
    "temperature": 0.7
  }
}
EOF
fi

# Create .env file template
if [ ! -f ".env" ]; then
    cat > .env << 'EOF'
# JARVIS AI Assistant Environment Variables

# Server Configuration
HOST=127.0.0.1
PORT=8000
DEBUG=False

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434
OLLAMA_TIMEOUT=300

# API Keys (Optional - for online models)
CLAUDE_API_KEY=
OPENAI_API_KEY=
DEEPSEEK_API_KEY=

# Security (Optional)
SECRET_KEY=your-secret-key-here
EOF
fi

# Make scripts executable
chmod +x scripts/start.sh
chmod +x scripts/install.sh

# Download recommended models
echo -e "${BLUE}Downloading recommended Ollama models...${NC}"
echo "This may take a while depending on your internet connection."

# Start Ollama service
ollama serve &> /dev/null &
sleep 5

# Pull basic models
echo -e "${YELLOW}Pulling llama3.2...${NC}"
ollama pull llama3.2

echo -e "${YELLOW}Pulling codellama...${NC}"
ollama pull codellama

echo
echo -e "${GREEN}=========================================="
echo -e "  Installation Complete!"
echo -e "==========================================${NC}"
echo
echo -e "${BLUE}To start JARVIS AI Assistant:${NC}"
echo -e "  ${YELLOW}./scripts/start.sh${NC}"
echo
echo -e "${BLUE}Or use the individual commands:${NC}"
echo -e "  ${YELLOW}source venv/bin/activate${NC}"
echo -e "  ${YELLOW}python3 backend/main.py${NC}"
echo
echo -e "${BLUE}Access the application at:${NC}"
echo -e "  ${YELLOW}http://localhost:8000${NC}"
echo
echo -e "${BLUE}Configuration files:${NC}"
echo -e "  ${YELLOW}config/models.json${NC} - Model configurations"
echo -e "  ${YELLOW}config/settings.json${NC} - Application settings"
echo -e "  ${YELLOW}.env${NC} - Environment variables"
echo

---

# install.bat (Windows Installation)
@echo off
echo ==========================================
echo   JARVIS AI Assistant Installation
echo ==========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed
    echo Please install Python 3.8+ from https://python.org
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
) else (
    echo ✓ Python found
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
) else (
    echo ✓ Node.js found
)

REM Check if Ollama is installed
ollama --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Ollama is not installed
    echo Please install Ollama from https://ollama.ai
    echo The application will work in online-only mode without it
    timeout /t 5
) else (
    echo ✓ Ollama found
)

echo.
echo Setting up project structure...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "config" mkdir config

echo Creating Python virtual environment...
python -m venv venv
call venv\Scripts\activate.bat

echo Installing Python dependencies...
pip install --upgrade pip
pip install -r requirements.txt

echo Installing Node.js dependencies...
cd frontend
npm install
npm run build
cd ..

echo Creating configuration files...

REM Create models.json if it doesn't exist
if not exist "config\models.json" (
    echo { > config\models.json
    echo   "ollama_models": { >> config\models.json
    echo     "recommended": [ >> config\models.json
    echo       { >> config\models.json
    echo         "name": "llama3.2", >> config\models.json
    echo         "description": "Fast and efficient model for general tasks" >> config\models.json
    echo       } >> config\models.json
    echo     ] >> config\models.json
    echo   } >> config\models.json
    echo } >> config\models.json
)

REM Create .env file template
if not exist ".env" (
    echo # JARVIS AI Assistant Environment Variables > .env
    echo. >> .env
    echo HOST=127.0.0.1 >> .env
    echo PORT=8000 >> .env
    echo DEBUG=False >> .env
    echo. >> .env
    echo OLLAMA_HOST=http://localhost:11434 >> .env
    echo. >> .env
    echo # API Keys for online models >> .env
    echo CLAUDE_API_KEY= >> .env
    echo OPENAI_API_KEY= >> .env
    echo DEEPSEEK_API_KEY= >> .env
)

echo.
echo Downloading recommended Ollama models...
echo This may take a while...

REM Start Ollama service
start /B ollama serve >nul 2>&1
timeout /t 5

REM Pull basic models
echo Pulling llama3.2...
ollama pull llama3.2

echo Pulling codellama...
ollama pull codellama

echo.
echo ==========================================
echo   Installation Complete!
echo ==========================================
echo.
echo To start JARVIS AI Assistant:
echo   scripts\start.bat
echo.
echo Access the application at:
echo   http://localhost:8000
echo.
pause