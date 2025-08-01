import React, { useState, useRef, useCallback } from 'react';
import './FileUpload.css';

const FileUpload = ({ onFileUpload, isProcessing }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [recentFiles, setRecentFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  // Supported file types
  const supportedTypes = {
    'text/plain': { icon: '📄', name: 'Text' },
    'text/csv': { icon: '📊', name: 'CSV' },
    'application/json': { icon: '📋', name: 'JSON' },
    'application/pdf': { icon: '📕', name: 'PDF' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: '📘', name: 'Word' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: '📗', name: 'Excel' },
    'image/jpeg': { icon: '🖼️', name: 'Image' },
    'image/png': { icon: '🖼️', name: 'Image' },
    'text/javascript': { icon: '💻', name: 'Code' },
    'text/x-python': { icon: '🐍', name: 'Python' },
    'application/x-python-code': { icon: '🐍', name: 'Python' }
  };
  
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);
  
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);
  
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };
  
  const handleFiles = async (files) => {
    if (files.length === 0 || isProcessing) return;
    
    for (const file of files) {
      await processFile(file);
    }
  };
  
  const processFile = async (file) => {
    try {
      setUploadProgress(0);
      setUploadStatus(`Uploading ${file.name}...`);
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size too large (max 10MB)');
      }
      
      // Check file type
      if (!isFileTypeSupported(file.type, file.name)) {
        throw new Error('File type not supported');
      }
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload with progress tracking
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      const uploadPromise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
      });
      
      xhr.open('POST', '/api/upload');
      xhr.send(formData);
      
      const result = await uploadPromise;
      
      setUploadProgress(100);
      setUploadStatus(`✅ ${file.name} uploaded successfully`);
      
      // Add to recent files
      const fileInfo = {
        id: result.file_id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadTime: new Date().toISOString(),
        processed: result.processed_content
      };
      
      setRecentFiles(prev => [fileInfo, ...prev.slice(0, 4)]);
      
      // Extract text content for AI processing
      let extractedText = '';
      if (result.processed_content) {
        extractedText = extractTextFromProcessedContent(result.processed_content);
      }
      
      // Notify parent component
      onFileUpload(file, extractedText, result);
      
      // Clear status after delay
      setTimeout(() => {
        setUploadStatus('');
        setUploadProgress(0);
      }, 3000);
      
    } catch (error) {
      console.error('File processing error:', error);
      setUploadStatus(`❌ Error: ${error.message}`);
      setUploadProgress(0);
      
      setTimeout(() => {
        setUploadStatus('');
      }, 5000);
    }
  };
  
  const extractTextFromProcessedContent = (content) => {
    if (typeof content === 'string') {
      return content;
    }
    
    if (content.text_content) {
      return content.text_content;
    }
    
    if (content.content) {
      return typeof content.content === 'string' ? 
        content.content : 
        JSON.stringify(content.content, null, 2);
    }
    
    if (content.preview && Array.isArray(content.preview)) {
      return content.preview.map(row => 
        Object.values(row).join(', ')
      ).join('\n');
    }
    
    return JSON.stringify(content, null, 2);
  };
  
  const isFileTypeSupported = (mimeType, fileName) => {
    // Check MIME type
    if (supportedTypes[mimeType]) {
      return true;
    }
    
    // Check file extension
    const extension = fileName.toLowerCase().split('.').pop();
    const extensionMap = {
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'pdf': 'application/pdf',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'js': 'text/javascript',
      'py': 'text/x-python',
      'html': 'text/html',
      'css': 'text/css',
      'xml': 'text/xml'
    };
    
    return extensionMap[extension] !== undefined;
  };
  
  const getFileIcon = (type, fileName) => {
    if (supportedTypes[type]) {
      return supportedTypes[type].icon;
    }
    
    const extension = fileName.toLowerCase().split('.').pop();
    const iconMap = {
      'py': '🐍',
      'js': '💻',
      'html': '🌐',
      'css': '🎨',
      'xml': '📰',
      'txt': '📄',
      'md': '📝'
    };
    
    return iconMap[extension] || '📎';
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const openFileDialog = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };
  
  const clearRecentFiles = () => {
    setRecentFiles([]);
  };
  
  return (
    <div className="file-upload-container">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept=".txt,.csv,.json,.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.gif,.js,.py,.html,.css,.xml,.md"
      />
      
      {/* Main upload area */}
      <div
        className={`upload-dropzone ${isDragOver ? 'drag-over' : ''} ${isProcessing ? 'disabled' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="upload-content">
          <div className="upload-icon">
            {uploadProgress > 0 && uploadProgress < 100 ? '⏳' : '📁'}
          </div>
          
          <div className="upload-text">
            <div className="upload-title">
              {isDragOver ? 'Drop files here' : 'Upload Files'}
            </div>
            <div className="upload-subtitle">
              Click to browse or drag & drop files
            </div>
          </div>
          
          {/* Upload progress */}
          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="progress-text">
                {uploadProgress}%
              </div>
            </div>
          )}
          
          {/* Upload status */}
          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.startsWith('❌') ? 'error' : 'success'}`}>
              {uploadStatus}
            </div>
          )}
        </div>
        
        {/* Supported formats */}
        <div className="supported-formats">
          <div className="formats-title">Supported formats:</div>
          <div className="formats-list">
            <span className="format-item">📄 Text</span>
            <span className="format-item">📊 CSV</span>
            <span className="format-item">📋 JSON</span>
            <span className="format-item">📕 PDF</span>
            <span className="format-item">📘 Word</span>
            <span className="format-item">📗 Excel</span>
            <span className="format-item">🖼️ Images</span>
            <span className="format-item">💻 Code</span>
          </div>
        </div>
      </div>
      
      {/* Recent files */}
      {recentFiles.length > 0 && (
        <div className="recent-files">
          <div className="recent-files-header">
            <div className="recent-files-title">
              📂 Recent uploads
            </div>
            <button 
              className="clear-recent-btn"
              onClick={clearRecentFiles}
              title="Clear recent files"
            >
              🗑️
            </button>
          </div>
          
          <div className="recent-files-list">
            {recentFiles.map((file) => (
              <div key={file.id} className="recent-file-item">
                <div className="file-info">
                  <div className="file-icon">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="file-details">
                    <div className="file-name" title={file.name}>
                      {file.name.length > 25 ? 
                        file.name.substring(0, 25) + '...' : 
                        file.name
                      }
                    </div>
                    <div className="file-meta">
                      <span className="file-size">
                        {formatFileSize(file.size)}
                      </span>
                      <span className="file-time">
                        {new Date(file.uploadTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="file-actions">
                  <button
                    className="file-action-btn"
                    onClick={() => onFileUpload(file, extractTextFromProcessedContent(file.processed))}
                    title="Reprocess file"
                    disabled={isProcessing}
                  >
                    🔄
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Quick upload buttons */}
      <div className="quick-upload-actions">
        <button
          className="quick-upload-btn"
          onClick={openFileDialog}
          disabled={isProcessing}
          title="Browse files"
        >
          📂 Browse
        </button>
        
        <button
          className="quick-upload-btn"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => handleFiles(Array.from(e.target.files));
            input.click();
          }}
          disabled={isProcessing}
          title="Upload image"
        >
          🖼️ Image
        </button>
        
        <button
          className="quick-upload-btn"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,.xlsx,.xls';
            input.onchange = (e) => handleFiles(Array.from(e.target.files));
            input.click();
          }}
          disabled={isProcessing}
          title="Upload data file"
        >
          📊 Data
        </button>
        
        <button
          className="quick-upload-btn"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.docx,.doc,.txt';
            input.onchange = (e) => handleFiles(Array.from(e.target.files));
            input.click();
          }}
          disabled={isProcessing}
          title="Upload document"
        >
          📄 Document
        </button>
      </div>
      
      {/* Upload tips */}
      <div className="upload-tips">
        <details className="tips-details">
          <summary className="tips-summary">
            💡 Upload Tips
          </summary>
          <div className="tips-content">
            <ul className="tips-list">
              <li>Maximum file size: 10MB</li>
              <li>Multiple files can be uploaded at once</li>
              <li>Text content will be extracted for AI analysis</li>
              <li>Images are analyzed for content description</li>
              <li>Code files are parsed for functions and imports</li>
              <li>Data files (CSV/Excel) are previewed and summarized</li>
            </ul>
          </div>
        </details>
      </div>
    </div>
  );
};

export default FileUpload;