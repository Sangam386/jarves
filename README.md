# JARVIS AI Assistant 🤖

A modern, versatile AI assistant with voice interaction, file processing, and multi-model support. Built with FastAPI, React, and Electron for cross-platform desktop and web deployment.

## ✨ Features

- **🎤 Voice Interaction**: Natural speech-to-text and text-to-speech capabilities
- **🧠 Multi-Model Support**: Works with Ollama (local), Claude, OpenAI, and DeepSeek
- **📁 File Processing**: Handle PDFs, Word documents, Excel files, images, and more
- **💻 Cross-Platform**: Available as web app and desktop application
- **🎨 Modern UI**: Sleek interface with animated orb visualization
- **🔒 Privacy-First**: Local processing options with Ollama integration
- **⚡ Real-time**: WebSocket-based communication for instant responses

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- Ollama (optional, for local models)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jarvis-ai-assistant
   ```

2. **Run the installation script**

   **Linux/macOS:**
   ```bash
   chmod +x scripts/install.sh
   ./scripts/install.sh
   ```

   **Windows:**
   ```batch
   scripts\install.bat
   ```

3. **Start the application**

   **Linux/macOS:**
   ```bash
   ./scripts/start.sh
   ```

   **Windows:**
   ```batch
   scripts\start.bat
   ```

4. **Access the application**
   - Web interface: http://localhost:8000
   - Desktop app: Will launch automatically

## 🛠️ Manual Installation

If you prefer to install manually:

1. **Set up Python environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Set up frontend**
   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. **Install Ollama (optional)**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ollama pull llama3.2
   ollama pull codellama
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and preferences
   ```

## 📖 Usage

### Web Interface

1. Open http://localhost:8000 in your browser
2. Click the central orb to start voice interaction
3. Or type your questions in the chat interface
4. Upload files for analysis and processing

### Desktop Application

The Electron app provides the same functionality with additional features:
- System tray integration
- Desktop notifications
- Offline capabilities
- File system access

### Voice Commands

- "Hey JARVIS" - Wake word activation
- "Analyze this document" - File analysis
- "Switch to [model name]" - Change AI model
- "Save conversation" - Export chat history

## ⚙️ Configuration

### Models Configuration (`config/models.json`)

```json
{
  "ollama_models": {
    "recommended": [
      {
        "name": "llama3.2",
        "description": "Fast and efficient model for general tasks",
        "size": "3.2B",
        "use_case": ["general", "coding", "conversation"]
      }
    ]
  }
}
```

### Application Settings (`config/settings.json`)

```json
{
  "app": {
    "name": "JARVIS AI Assistant",
    "version": "1.0.0",
    "theme": "dark"
  },
  "ui": {
    "orb_color": "#00d4ff",
    "orb_pulse": true
  }
}
```

### Environment Variables (`.env`)

```env
# Server Configuration
HOST=127.0.0.1
PORT=8000
DEBUG=False

# Ollama Configuration
OLLAMA_HOST=http://localhost:11434

# API Keys (Optional)
CLAUDE_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
DEEPSEEK_API_KEY=your_deepseek_key
```

## 🏗️ Project Structure

```
jarvis-ai-assistant/
├── backend/               # FastAPI backend
├── frontend/             # React frontend
├── electron/             # Electron desktop app
├── config/               # Configuration files
├── docs/                 # Documentation
├── scripts/              # Installation and startup scripts
├── logs/                 # Application logs
└── uploads/              # User uploaded files
```

## 🔧 Development

### Backend Development

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

```bash
cd frontend
npm run dev
```

### Electron Development

```bash
cd electron
npm run dev
```

## 📚 API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Troubleshooting

### Common Issues

1. **Ollama not starting**
   - Ensure Ollama is installed: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Check if service is running: `ollama serve`

2. **Python dependencies not installing**
   - Update pip: `pip install --upgrade pip`
   - Use Python 3.8+: `python --version`

3. **Frontend build fails**
   - Clear Node cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules && npm install`

4. **Voice features not working**
   - Check microphone permissions
   - Ensure browser supports Web Speech API

For more detailed troubleshooting, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## 🌟 Acknowledgments

- [Ollama](https://ollama.ai) for local AI model serving
- [FastAPI](https://fastapi.tiangolo.com) for the robust backend framework
- [React](https://reactjs.org) for the modern frontend
- [Electron](https://electronjs.org) for cross-platform desktop support

---

**Made with ❤️ for the AI community**