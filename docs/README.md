# JARVIS AI Assistant

![JARVIS Logo](https://img.shields.io/badge/JARVIS-AI%20Assistant-00d4ff?style=for-the-badge&logo=robot)

An advanced AI assistant with voice interaction, file processing, and multiple AI model support. Built with React frontend, FastAPI backend, and Electron desktop app.

## 🚀 Features

### Core Capabilities
- **Multi-Model AI Support**: Ollama local models, OpenAI, Claude, DeepSeek
- **Voice Interaction**: Speech-to-text and text-to-speech with wake word detection
- **File Processing**: Support for PDF, Word, Excel, images, code files, and more
- **Real-time Chat**: Streaming responses with markdown support
- **Desktop App**: Cross-platform Electron application

### AI Models Supported
- **Local (Ollama)**: Llama 3.2, CodeLlama, Phi3, Gemma2, LLaVA
- **Online**: Claude 3 Sonnet/Haiku, GPT-4 Turbo, GPT-3.5 Turbo, DeepSeek

### File Types Supported
- Documents: PDF, Word, Excel, CSV, JSON, Text
- Images: JPEG, PNG, GIF, WebP (with OCR)
- Code: Python, JavaScript, HTML, CSS, XML, Markdown

## 📋 Requirements

### System Requirements
- **Minimum**: 4GB RAM, 2 CPU cores, 10GB disk
- **Recommended**: 8GB RAM, 4 CPU cores, 20GB disk
- **Optimal**: 16GB RAM, 8 CPU cores, 50GB disk

### Software Dependencies
- Node.js 16+ and npm
- Python 3.8+
- Ollama (for local AI models)

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone https://github.com/your-username/jarvis-ai-assistant.git
cd jarvis-ai-assistant
```

### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt

# Install Ollama models
ollama pull llama3.2
ollama pull codellama
```

### 3. Configuration
```bash
# Copy example config
cp config/settings.example.json config/settings.json

# Edit configuration as needed
nano config/settings.json
```

## 🚦 Running the Application

### Development Mode
```bash
# Start backend API
python -m uvicorn main:app --reload --port 8000

# Start frontend development server
cd frontend
npm start

# Start Electron app (optional)
cd electron
npm run dev
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start production server
python main.py

# Build Electron app
cd electron
npm run build
```

## 🎯 Usage

### Voice Commands
- **"Hey JARVIS"** - Wake word activation
- **"Help me with coding"** - Get coding assistance
- **"Analyze this data"** - Data analysis help
- **"What can you do?"** - Show capabilities

### Chat Interface
1. Click the JARVIS orb to activate
2. Type messages or use voice input
3. Upload files for analysis
4. Switch between AI models as needed

### File Upload
- Drag & drop files onto the interface
- Click "Browse" to select files
- Automatic text extraction and analysis
- Support for batch uploads

## 🔧 API Documentation

### Chat Endpoint
```bash
POST /api/chat
Content-Type: application/json

{
  "message": "Hello, how are you?",
  "model": "llama3.2",
  "temperature": 0.7,
  "stream": true
}
```

### File Upload
```bash
POST /api/files/upload
Content-Type: multipart/form-data

# Form data with 'file' field
```

### Model Management
```bash
GET /api/models          # List available models
POST /api/models/switch  # Switch active model
```

## 🎨 Customization

### Theme Configuration
Edit `config/settings.json`:
```json
{
  "ui": {
    "orb": {
      "color": "#00d4ff",
      "pulse": true,
      "size": "large"
    },
    "theme": {
      "dark": {
        "primary": "#1a1a1a",
        "accent": "#00d4ff"
      }
    }
  }
}
```

### Custom Models
Add models to `config/models.json`:
```json
{
  "ollama_models": {
    "custom": [
      {
        "name": "my-model",
        "description": "Custom model",
        "use_case": ["custom_task"]
      }
    ]
  }
}
```

## 🔒 Security Features

- CORS protection
- Rate limiting
- File validation and scanning
- API key encryption
- Secure storage options

## 🐛 Troubleshooting

### Common Issues

1. **Ollama not responding**
   - Check if Ollama service is running: `ollama serve`
   - Verify models are installed: `ollama list`

2. **Voice input not working**
   - Enable microphone permissions
   - Check browser compatibility (Chrome/Edge recommended)

3. **File upload failures**
   - Check file size (max 10MB)
   - Verify file type is supported
   - Ensure sufficient disk space

### Debug Mode
```bash
# Enable debug logging
export DEBUG=true
python main.py

# Frontend debug mode
cd frontend
npm run dev:debug
```

## 📊 Performance Optimization

### Memory Usage
- Monitor with: `python scripts/debug.py --memory`
- Adjust `max_tokens` and `context_length` in settings
- Use lighter models for better performance

### Model Selection Logic
- **General tasks**: llama3.2 (fast, efficient)
- **Coding**: codellama (specialized)
- **Quick responses**: llama3.2:1b (ultra-fast)
- **Complex reasoning**: llama3.1:8b (high quality)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Ollama team for local AI model support
- Anthropic for Claude API
- OpenAI for GPT models
- DeepSeek for affordable AI models
- React and FastAPI communities

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/jarvis-ai-assistant/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/jarvis-ai-assistant/discussions)
- **Documentation**: [Wiki](https://github.com/your-username/jarvis-ai-assistant/wiki)
- **Email**: support@jarvis-ai.com

---

*Made with ❤️ by the JARVIS Team*
