import React, { useState, useEffect, useRef } from 'react';
import JarvisOrb from './components/JarvisOrb';
import ChatBox from './components/ChatBox';
import VoiceInput from './components/VoiceInput';
import FileUpload from './components/FileUpload';
import { initializeAPI, checkSystemHealth } from './utils/api';
import './App.css';

const App = () => {
  // State management
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentModel, setCurrentModel] = useState('llama3.2');
  const [availableModels, setAvailableModels] = useState({
    local_models: [],
    online_models: {}
  });
  const [useOnlineModel, setUseOnlineModel] = useState(false);
  const [onlineProvider, setOnlineProvider] = useState('claude');
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [settings, setSettings] = useState({
    theme: 'dark',
    orbColor: '#00d4ff',
    voiceEnabled: true,
    autoScroll: true
  });
  
  // Refs
  const websocketRef = useRef(null);
  const chatContainerRef = useRef(null);
  
  // Initialize app
  useEffect(() => {
    initializeApp();
    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);
  
  // Auto-scroll chat
  useEffect(() => {
    if (settings.autoScroll && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, settings.autoScroll]);
  
  const initializeApp = async () => {
    try {
      // Initialize API
      await initializeAPI();
      
      // Generate session ID
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      
      // Check system status
      await updateSystemStatus();
      
      // Load available models
      await loadAvailableModels();
      
      // Initialize WebSocket connection
      initializeWebSocket(newSessionId);
      
      // Add welcome message
      setMessages([{
        id: Date.now(),
        type: 'assistant',
        content: '🤖 JARVIS AI Assistant is ready. How can I help you today?',
        timestamp: new Date().toISOString(),
        model: 'system'
      }]);
      
    } catch (error) {
      console.error('App initialization error:', error);
      setMessages([{
        id: Date.now(),
        type: 'error',
        content: '❌ Failed to initialize JARVIS. Please check your connection and try again.',
        timestamp: new Date().toISOString()
      }]);
    }
  };
  
  const generateSessionId = () => {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  };
  
  const updateSystemStatus = async () => {
    try {
      const status = await checkSystemHealth();
      setSystemStatus(status);
      
      if (!status.ollama_running) {
        addSystemMessage('⚠️ Ollama service is not running. Online models only.', 'warning');
      }
    } catch (error) {
      console.error('System status check failed:', error);
    }
  };
  
  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/models');
      const data = await response.json();
      setAvailableModels(data);
      
      if (data.current_model) {
        setCurrentModel(data.current_model);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
    }
  };
  
  const initializeWebSocket = (sessionId) => {
    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/ws/${sessionId}`;
      
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsActive(true);
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
      
      websocketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsActive(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(() => initializeWebSocket(sessionId), 3000);
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsActive(false);
      };
      
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  };
  
  const handleWebSocketMessage = (data) => {
    if (data.type === 'response') {
      const responseMessage = {
        id: Date.now(),
        type: 'assistant',
        content: data.content,
        timestamp: data.timestamp,
        model: useOnlineModel ? onlineProvider : currentModel
      };
      
      setMessages(prev => [...prev, responseMessage]);
      setIsProcessing(false);
    }
  };
  
  const sendMessage = async (message, options = {}) => {
    if (!message.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        // Send via WebSocket for real-time response
        const payload = {
          message,
          model: currentModel,
          use_online: useOnlineModel,
          online_provider: onlineProvider,
          session_id: sessionId,
          ...options
        };
        
        websocketRef.current.send(JSON.stringify(payload));
      } else {
        // Fallback to HTTP API
        await sendMessageHTTP(message, options);
      }
    } catch (error) {
      console.error('Send message error:', error);
      addSystemMessage('❌ Failed to send message. Please try again.', 'error');
      setIsProcessing(false);
    }
  };
  
  const sendMessageHTTP = async (message, options = {}) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          model: currentModel,
          use_online: useOnlineModel,
          online_provider: onlineProvider,
          session_id: sessionId,
          ...options
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const assistantMessage = {
          id: Date.now() + 1,
          type: 'assistant',
          content: data.response,
          timestamp: data.timestamp,
          model: data.model_used
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.detail || 'Failed to get response');
      }
    } catch (error) {
      console.error('HTTP message error:', error);
      addSystemMessage(`❌ Error: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const addSystemMessage = (content, type = 'info') => {
    const systemMessage = {
      id: Date.now(),
      type: 'system',
      content,
      timestamp: new Date().toISOString(),
      systemType: type
    };
    
    setMessages(prev => [...prev, systemMessage]);
  };
  
  const handleVoiceInput = async (transcript) => {
    if (transcript) {
      await sendMessage(transcript);
    }
  };
  
  const handleFileUpload = async (file, extractedText) => {
    try {
      const fileMessage = {
        id: Date.now(),
        type: 'file',
        content: `📎 Uploaded: ${file.name}`,
        timestamp: new Date().toISOString(),
        fileName: file.name,
        fileSize: file.size
      };
      
      setMessages(prev => [...prev, fileMessage]);
      
      if (extractedText) {
        const analysisPrompt = `Please analyze this file content:\n\nFile: ${file.name}\nContent:\n${extractedText}`;
        await sendMessage(analysisPrompt);
      }
    } catch (error) {
      console.error('File upload error:', error);
      addSystemMessage(`❌ File upload failed: ${error.message}`, 'error');
    }
  };
  
  const switchModel = async (modelName, provider = 'ollama') => {
    try {
      setIsProcessing(true);
      addSystemMessage(`🔄 Switching to ${modelName}...`, 'info');
      
      if (provider === 'ollama') {
        const response = await fetch('/api/models/switch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_name: modelName,
            provider
          })
        });
        
        if (response.ok) {
          setCurrentModel(modelName);
          setUseOnlineModel(false);
          addSystemMessage(`✅ Switched to ${modelName}`, 'success');
        } else {
          throw new Error('Failed to switch model');
        }
      } else {
        // Online model
        setCurrentModel(modelName);
        setUseOnlineModel(true);
        setOnlineProvider(provider);
        addSystemMessage(`✅ Switched to ${provider} - ${modelName}`, 'success');
      }
    } catch (error) {
      console.error('Model switch error:', error);
      addSystemMessage(`❌ Failed to switch model: ${error.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      type: 'assistant',
      content: '🤖 Chat cleared. How can I help you?',
      timestamp: new Date().toISOString(),
      model: 'system'
    }]);
  };
  
  const toggleTheme = () => {
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    setSettings(prev => ({ ...prev, theme: newTheme }));
    document.body.className = newTheme;
  };
  
  const orbProps = {
    isActive,
    isProcessing,
    color: settings.orbColor,
    onClick: () => setIsActive(!isActive),
    systemStatus
  };
  
  const chatProps = {
    messages,
    isProcessing,
    onSendMessage: sendMessage,
    onClearChat: clearChat,
    ref: chatContainerRef
  };
  
  const voiceProps = {
    enabled: settings.voiceEnabled,
    onVoiceInput: handleVoiceInput,
    isProcessing
  };
  
  const fileUploadProps = {
    onFileUpload: handleFileUpload,
    isProcessing
  };
  
  const modelSelectorProps = {
    currentModel,
    availableModels,
    useOnlineModel,
    onlineProvider,
    onSwitchModel: switchModel,
    isProcessing
  };
  
  return (
    <div className={`app ${settings.theme}`} data-theme={settings.theme}>
      {/* Background Effects */}
      <div className="background-effects">
        <div className="grid-pattern"></div>
        <div className="floating-particles"></div>
      </div>
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">🤖</span>
            JARVIS AI Assistant
          </h1>
          
          <div className="header-controls">
            <div className="system-status">
              {systemStatus && (
                <div className={`status-indicator ${systemStatus.ollama_running ? 'online' : 'offline'}`}>
                  <span className="status-dot"></span>
                  {systemStatus.ollama_running ? 'Ollama Online' : 'Ollama Offline'}
                </div>
              )}
            </div>
            
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="app-main">
        {/* JARVIS Orb */}
        <div className="orb-container">
          <JarvisOrb {...orbProps} />
        </div>
        
        {/* Chat Interface */}
        <div className={`chat-interface ${isActive ? 'active' : 'inactive'}`}>
          <ChatBox {...chatProps} />
          
          {/* Control Panel */}
          <div className="control-panel">
            <div className="input-controls">
              <VoiceInput {...voiceProps} />
              <FileUpload {...fileUploadProps} />
              
              {/* Model Selector */}
              <div className="model-selector">
                <select
                  value={useOnlineModel ? `${onlineProvider}:${currentModel}` : currentModel}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.includes(':')) {
                      const [provider, model] = value.split(':');
                      switchModel(model, provider);
                    } else {
                      switchModel(value, 'ollama');
                    }
                  }}
                  disabled={isProcessing}
                  className="model-select"
                >
                  <optgroup label="Local Models (Ollama)">
                    {availableModels.local_models.map(model => (
                      <option key={model} value={model}>
                        🖥️ {model}
                      </option>
                    ))}
                  </optgroup>
                  
                  {Object.entries(availableModels.online_models).map(([provider, models]) => (
                    <optgroup key={provider} label={`Online - ${provider.toUpperCase()}`}>
                      {models.map(model => (
                        <option key={`${provider}:${model.name}`} value={`${provider}:${model.name}`}>
                          🌐 {model.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="quick-actions">
              <button
                onClick={() => sendMessage("What can you help me with?")}
                disabled={isProcessing}
                className="quick-action-btn"
              >
                ❓ Help
              </button>
              
              <button
                onClick={() => sendMessage("Show me your current system status and capabilities")}
                disabled={isProcessing}
                className="quick-action-btn"
              >
                📊 Status
              </button>
              
              <button
                onClick={clearChat}
                disabled={isProcessing}
                className="quick-action-btn"
              >
                🗑️ Clear
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span className="footer-text">
            JARVIS AI Assistant v1.0 - Powered by Ollama & Advanced AI Models
          </span>
          <div className="footer-links">
            <button onClick={() => updateSystemStatus()} className="refresh-btn">
              🔄 Refresh Status
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;