import React, { useState, useRef, useEffect, forwardRef } from 'react';
import './ChatBox.css';

const ChatBox = forwardRef(({ 
  messages, 
  isProcessing, 
  onSendMessage, 
  onClearChat 
}, ref) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isProcessing) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const formatMessage = (content) => {
    // Convert markdown-like syntax to HTML
    let formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/\n/g, '<br>');
    
    return { __html: formatted };
  };
  
  const getMessageIcon = (type, systemType) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return systemType === 'error' ? '❌' : 
               systemType === 'warning' ? '⚠️' : 
               systemType === 'success' ? '✅' : 'ℹ️';
      case 'file':
        return '📎';
      default:
        return '💬';
    }
  };
  
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Export chat function
  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      messages: messages.map(msg => ({
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp,
        model: msg.model
      }))
    };
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `jarvis-chat-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const renderMessage = (message) => {
    const { id, type, content, timestamp, model, systemType, fileName, fileSize } = message;
    
    return (
      <div 
        key={id} 
        className={`message ${type} ${systemType || ''}`}
        data-message-id={id}
      >
        <div className="message-header">
          <div className="message-icon">
            {getMessageIcon(type, systemType)}
          </div>
          <div className="message-meta">
            <span className="message-type">
              {type === 'user' ? 'You' :
               type === 'assistant' ? (model ? `JARVIS (${model})` : 'JARVIS') :
               type === 'system' ? 'System' :
               type === 'file' ? 'File Upload' : 'Message'}
            </span>
            <span className="message-time">
              {formatTimestamp(timestamp)}
            </span>
          </div>
        </div>
        
        <div className="message-content">
          {type === 'file' && fileName ? (
            <div className="file-message">
              <div className="file-info">
                <div className="file-name">{fileName}</div>
                {fileSize && (
                  <div className="file-size">
                    {(fileSize / 1024 / 1024).toFixed(2)} MB
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div 
              className="message-text"
              dangerouslySetInnerHTML={formatMessage(content)}
            />
          )}
        </div>
        
        {type === 'assistant' && (
          <div className="message-actions">
            <button 
              className="action-btn copy-btn"
              onClick={() => navigator.clipboard.writeText(content)}
              title="Copy message"
            >
              📋
            </button>
            <button 
              className="action-btn regenerate-btn"
              onClick={() => onSendMessage('Please regenerate your last response')}
              title="Regenerate response"
              disabled={isProcessing}
            >
              🔄
            </button>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className={`chat-box ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-title">
          <span className="title-icon">💬</span>
          Chat with JARVIS
        </div>
        <div className="chat-controls">
          <button
            className="control-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Minimize chat' : 'Expand chat'}
          >
            {isExpanded ? '🔽' : '🔼'}
          </button>
          <button
            className="control-btn"
            onClick={onClearChat}
            title="Clear chat"
            disabled={isProcessing}
          >
            🗑️
          </button>
        </div>
      </div>
      
      {/* Messages Container */}
      <div 
        ref={ref}
        className="messages-container"
        style={{ display: isExpanded ? 'block' : 'none' }}
      >
        <div className="messages-list">
          {messages.length === 0 ? (
            <div className="empty-chat">
              <div className="empty-icon">🤖</div>
              <div className="empty-text">
                <h3>Welcome to JARVIS AI Assistant</h3>
                <p>I'm here to help you with coding, analysis, predictions, and more!</p>
                <div className="quick-suggestions">
                  <button 
                    className="suggestion-btn"
                    onClick={() => onSendMessage("What can you help me with?")}
                    disabled={isProcessing}
                  >
                    💡 What can you do?
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => onSendMessage("Help me write some Python code")}
                    disabled={isProcessing}
                  >
                    🐍 Python Help
                  </button>
                  <button 
                    className="suggestion-btn"
                    onClick={() => onSendMessage("Analyze data trends and make predictions")}
                    disabled={isProcessing}
                  >
                    📈 Data Analysis
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map(renderMessage)}
              {isProcessing && (
                <div className="message assistant processing">
                  <div className="message-header">
                    <div className="message-icon">🤖</div>
                    <div className="message-meta">
                      <span className="message-type">JARVIS</span>
                      <span className="message-time">Processing...</span>
                    </div>
                  </div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <span className="typing-text">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Form */}
      {isExpanded && (
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <div className="input-container">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message to JARVIS..."
              className="message-input"
              disabled={isProcessing}
              rows="2"
            />
            <button
              type="submit"
              className="send-button"
              disabled={!inputMessage.trim() || isProcessing}
              title="Send message (Enter)"
            >
              {isProcessing ? (
                <div className="loading-spinner">⏳</div>
              ) : (
                '🚀'
              )}
            </button>
          </div>
          
          {/* Input Tools */}
          <div className="input-tools">
            <div className="tool-group">
              <button
                type="button"
                className="tool-btn"
                onClick={() => setInputMessage(prev => prev + '\n```\n\n```')}
                title="Add code block"
                disabled={isProcessing}
              >
                💻 Code
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() => setInputMessage(prev => prev + '**bold text**')}
                title="Add bold text"
                disabled={isProcessing}
              >
                **B**
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={() => setInputMessage(prev => prev + '*italic text*')}
                title="Add italic text"
                disabled={isProcessing}
              >
                *I*
              </button>
            </div>
            
            <div className="character-count">
              {inputMessage.length}/2000
            </div>
          </div>
        </form>
      )}
      
      {/* Quick Actions (when collapsed) */}
      {!isExpanded && (
        <div className="quick-actions-collapsed">
          <button
            className="quick-chat-btn"
            onClick={() => {
              setIsExpanded(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
            disabled={isProcessing}
          >
            💬 Start Chat
          </button>
          {messages.length > 0 && (
            <div className="message-preview">
              Last: {messages[messages.length - 1]?.content?.substring(0, 50)}...
            </div>
          )}
        </div>
      )}
      
      {/* Status Bar */}
      <div className="chat-status-bar">
        <div className="status-info">
          <span className="message-count">
            {messages.length} messages
          </span>
          {isProcessing && (
            <span className="processing-status">
              <div className="pulse-dot"></div>
              Processing...
            </span>
          )}
        </div>
        
        <div className="chat-actions">
          <button
            className="export-btn"
            onClick={() => exportChat()}
            title="Export chat"
            disabled={messages.length === 0}
          >
            📄
          </button>
          <button
            className="scroll-to-top-btn"
            onClick={() => ref.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Scroll to top"
          >
            ⬆️
          </button>
        </div>
      </div>
    </div>
  );
});

ChatBox.displayName = 'ChatBox';

export default ChatBox;