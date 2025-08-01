# JARVIS AI Assistant - Troubleshooting Guide

This guide helps you resolve common issues with the JARVIS AI Assistant.

## 🚨 Common Issues

### 1. Ollama Connection Issues

#### Problem: "Ollama not responding" or "Model unavailable"

**Symptoms:**
- Error messages about Ollama connection
- Models showing as unavailable
- Timeout errors when sending requests

**Solutions:**

1. **Check Ollama Service**
   ```bash
   # Check if Ollama is running
   ollama serve
   
   # Or start as service (Linux/Mac)
   sudo systemctl start ollama
   
   # Windows - restart Ollama desktop app
   ```

2. **Verify Models are Installed**
   ```bash
   # List installed models
   ollama list
   
   # Install missing models
   ollama pull llama3.2
   ollama pull codellama
   ```

3. **Check Port Configuration**
   - Default Ollama port: `11434`
   - Update `config/settings.json` if using different port:
   ```json
   {
     "features": {
       "integrations": {
         "ollama": {
           "host": "http://localhost:11434"
         }
       }
     }
   }
   ```

4. **Test Ollama Directly**
   ```bash
   curl http://localhost:11434/api/tags
   ```

### 2. Voice Input Problems

#### Problem: Voice recognition not working

**Symptoms:**
- "Speech recognition not supported" message
- Microphone not detected
- No voice transcription

**Solutions:**

1. **Browser Compatibility**
   - Use Chrome, Edge, or Safari (latest versions)
   - Firefox has limited support
   - Enable secure context (HTTPS or localhost)

2. **Microphone Permissions**
   - Allow microphone access in browser
   - Check system microphone permissions
   - Test microphone in other applications

3. **Check Audio Settings**
   ```javascript
   // Test in browser console
   navigator.mediaDevices.getUserMedia({audio: true})
     .then(stream => console.log('Microphone OK'))
     .catch(err => console.error('Microphone error:', err));
   ```

4. **Troubleshoot Wake Word**
   - Speak clearly: "Hey JARVIS"
   - Check wake word sensitivity in settings
   - Ensure quiet environment

### 3. File Upload Issues

#### Problem: Files not uploading or processing

**Symptoms:**
- Upload progress stalls
- "File too large" errors
- Processing failures

**Solutions:**

1. **Check File Size**
   - Maximum: 10MB per file
   - Compress large files before upload
   - Split large documents

2. **Verify File Types**
   ```
   Supported: PDF, DOCX, XLSX, TXT, CSV, JSON, 
   JPG, PNG, GIF, JS, PY, HTML, CSS, XML, MD
   ```

3. **Disk Space**
   ```bash
   # Check available space
   df -h
   
   # Clean cache if needed
   python scripts/debug.py --clean-cache
   ```

4. **File Permissions**
   ```bash
   # Ensure upload directory is writable
   chmod 755 uploads/
   chown -R $USER:$USER uploads/
   ```

### 4. Performance Issues

#### Problem: Slow responses or high memory usage

**Symptoms:**
- Long response times
- High CPU/RAM usage
- Browser freezing

**Solutions:**

1. **Model Selection**
   - Use lighter models: `llama3.2:1b` for quick tasks
   - Switch to `gemma2:2b` for better performance
   - Reduce `max_tokens` in settings

2. **Memory Optimization**
   ```json
   {
     "behavior": {
       "ai": {
         "max_tokens": 1024,
         "context_length": 2048
       },
       "performance": {
         "max_concurrent_requests": 1
       }
     }
   }
   ```

3. **Clear Cache**
   ```bash
   # Clear model cache
   python scripts/debug.py --clear-cache
   
   # Restart Ollama
   ollama stop && ollama serve
   ```

4. **Monitor Resources**
   ```bash
   # Check system resources
   python scripts/debug.py --monitor
   
   # Check GPU usage (if available)
   nvidia-smi
   ```

### 5. API Connection Issues

#### Problem: External API models not working

**Symptoms:**
- OpenAI/Claude/DeepSeek models unavailable
- API key errors
- Network timeout

**Solutions:**

1. **API Key Configuration**
   ```bash
   # Set environment variables
   export OPENAI_API_KEY="your-key-here"
   export ANTHROPIC_API_KEY="your-key-here"
   export DEEPSEEK_API_KEY="your-key-here"
   ```

2. **Check API Status**
   - OpenAI: https://status.openai.com/
   - Anthropic: https://status.anthropic.com/
   - DeepSeek: https://platform.deepseek.com/

3. **Network Configuration**
   ```bash
   # Test connectivity
   curl -I https://api.openai.com/v1/models
   
   # Check proxy settings if behind firewall
   export https_proxy=http://proxy:port
   ```

### 6. Frontend Issues

#### Problem: UI not loading or broken

**Symptoms:**
- Blank page
- JavaScript errors
- Components not rendering

**Solutions:**

1. **Clear Browser Cache**
   - Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
   - Clear browser data
   - Try incognito/private mode

2. **Check Console Errors**
   - Open Developer Tools (F12)
   - Check Console tab for errors
   - Report errors to support

3. **Rebuild Frontend**
   ```bash
   cd frontend
   rm -rf node_modules
   npm install
   npm run build
   ```

### 7. Electron App Issues

#### Problem: Desktop app not starting

**Symptoms:**
- App crashes on startup
- White screen
- Menu not working

**Solutions:**

1. **Rebuild Electron**
   ```bash
   cd electron
   npm install
   npm run rebuild
   ```

2. **Check Node Version**
   ```bash
   # Use Node 16 or higher
   node --version
   nvm use 16  # if using nvm
   ```

3. **Clear App Data**
   ```bash
   # Remove app data (varies by OS)
   # Windows: %APPDATA%/JARVIS
   # Mac: ~/Library/Application Support/JARVIS
   # Linux: ~/.local/share/JARVIS
   ```

## 🔧 Debug Tools

### 1. Debug Script
```bash
# Run comprehensive diagnostics
python scripts/debug.py --all

# Check specific components
python scripts/debug.py --ollama
python scripts/debug.py --api
python scripts/debug.py --files
```

### 2. Log Analysis
```bash
# View recent logs
tail -f logs/jarvis.log

# Search for errors
grep -i error logs/jarvis.log

# Monitor API requests
grep -i "api_requests" logs/jarvis.log
```

### 3. System Information
```bash
# System specs
python scripts/debug.py --system

# Model information
python scripts/debug.py --models

# Performance metrics
python scripts/debug.py --performance
```

## 🆘 Getting Help

### Before Reporting Issues

1. **Check Logs**
   - Enable debug mode: `DEBUG=true`
   - Check browser console
   - Review application logs

2. **Gather Information**
   - OS and version
   - Node.js version
   - Python version
   - Browser version
   - Error messages

3. **Try Basic Fixes**
   - Restart services
   - Clear cache
   - Update dependencies

### Reporting Issues

**Include in your report:**
- Detailed description
- Steps to reproduce
- Error messages/logs
- System information
- Configuration files (remove sensitive data)

### Support Channels

1. **GitHub Issues**: For bugs and feature requests
2. **Discussions**: For questions and community help
3. **Documentation**: Check the wiki first
4. **Discord**: Real-time community support

## 📊 Performance Tuning

### Memory Optimization
```json
{
  "behavior": {
    "performance": {
      "cache_responses": false,
      "max_concurrent_requests": 1,
      "preload_models": false
    }
  }
}
```

### Network Optimization
```json
{
  "features": {
    "integrations": {
      "ollama": {
        "timeout": 120000,
        "health_check_interval": 30000
      }
    }
  }
}
```

### Storage Optimization
```json
{
  "storage": {
    "file_cache": {
      "max_size": 536870912,
      "ttl": 86400000
    },
    "conversation_history": {
      "max_conversations": 100
    }
  }
}
```

## 🔄 Recovery Procedures

### Reset to Defaults
```bash
# Backup current config
cp config/settings.json config/settings.backup.json

# Reset to defaults
cp config/settings.example.json config/settings.json

# Clear all caches
python scripts/debug.py --reset-all
```

### Clean Reinstall
```bash
# Remove all dependencies
rm -rf node_modules
rm -rf __pycache__
rm -rf .venv

# Reinstall
npm install
pip install -r requirements.txt

# Rebuild frontend
cd frontend && npm run build
```

---

*If you can't find a solution here, please open an issue on GitHub with detailed information about your problem.*
