const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App info and control
  getVersion: () => ipcRenderer.invoke('app-version'),
  quit: () => ipcRenderer.invoke('app-quit'),

  // File system operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  showItemInFolder: (path) => ipcRenderer.invoke('show-item-in-folder', path),

  // Menu events - listen to menu actions
  onMenuNewChat: (callback) => {
    ipcRenderer.on('menu-new-chat', callback);
    return () => ipcRenderer.removeListener('menu-new-chat', callback);
  },

  onMenuOpenFiles: (callback) => {
    ipcRenderer.on('menu-open-files', callback);
    return () => ipcRenderer.removeListener('menu-open-files', callback);
  },

  onMenuExportChat: (callback) => {
    ipcRenderer.on('menu-export-chat', callback);
    return () => ipcRenderer.removeListener('menu-export-chat', callback);
  },

  onMenuSwitchModel: (callback) => {
    ipcRenderer.on('menu-switch-model', callback);
    return () => ipcRenderer.removeListener('menu-switch-model', callback);
  },

  onMenuRefreshModels: (callback) => {
    ipcRenderer.on('menu-refresh-models', callback);
    return () => ipcRenderer.removeListener('menu-refresh-models', callback);
  },

  onMenuShowShortcuts: (callback) => {
    ipcRenderer.on('menu-show-shortcuts', callback);
    return () => ipcRenderer.removeListener('menu-show-shortcuts', callback);
  },

  // Auto updater events
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', callback);
    return () => ipcRenderer.removeListener('update-available', callback);
  },

  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', callback);
    return () => ipcRenderer.removeListener('download-progress', callback);
  },

  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', callback);
    return () => ipcRenderer.removeListener('update-downloaded', callback);
  },

  // Protocol handler
  onProtocolUrl: (callback) => {
    ipcRenderer.on('protocol-url', callback);
    return () => ipcRenderer.removeListener('protocol-url', callback);
  },

  // Platform info
  platform: process.platform,
  
  // Node.js APIs (limited exposure for security)
  path: {
    join: (...args) => require('path').join(...args),
    basename: (path) => require('path').basename(path),
    dirname: (path) => require('path').dirname(path),
    extname: (path) => require('path').extname(path)
  },

  // File operations (secure)
  fs: {
    readFile: async (filePath, options = {}) => {
      const fs = require('fs').promises;
      try {
        const data = await fs.readFile(filePath, options);
        return data;
      } catch (error) {
        throw new Error(`Failed to read file: ${error.message}`);
      }
    },

    writeFile: async (filePath, data, options = {}) => {
      const fs = require('fs').promises;
      try {
        await fs.writeFile(filePath, data, options);
        return true;
      } catch (error) {
        throw new Error(`Failed to write file: ${error.message}`);
      }
    },

    exists: async (filePath) => {
      const fs = require('fs').promises;
      try {
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    },

    stat: async (filePath) => {
      const fs = require('fs').promises;
      try {
        const stats = await fs.stat(filePath);
        return {
          size: stats.size,
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          mtime: stats.mtime,
          ctime: stats.ctime
        };
      } catch (error) {
        throw new Error(`Failed to get file stats: ${error.message}`);
      }
    }
  },

  // Environment variables (limited)
  env: {
    NODE_ENV: process.env.NODE_ENV,
    PLATFORM: process.platform,
    ARCH: process.arch
  }
});

// Expose specific Node.js modules that are safe to use
contextBridge.exposeInMainWorld('nodeAPI', {
  // Crypto for generating UUIDs and hashing
  crypto: {
    randomUUID: () => require('crypto').randomUUID(),
    createHash: (algorithm) => require('crypto').createHash(algorithm)
  },

  // OS information
  os: {
    platform: () => require('os').platform(),
    arch: () => require('os').arch(),
    cpus: () => require('os').cpus(),
    totalmem: () => require('os').totalmem(),
    freemem: () => require('os').freemem(),
    hostname: () => require('os').hostname(),
    userInfo: () => {
      const userInfo = require('os').userInfo();
      return {
        username: userInfo.username,
        homedir: userInfo.homedir
      };
    }
  },

  // URL parsing
  url: {
    parse: (urlString) => {
      try {
        return new URL(urlString);
      } catch (error) {
        throw new Error(`Invalid URL: ${error.message}`);
      }
    }
  }
});

// Keyboard shortcuts handler
contextBridge.exposeInMainWorld('shortcuts', {
  register: (shortcut, callback) => {
    const handleKeydown = (event) => {
      const keys = [];
      if (event.ctrlKey || event.metaKey) keys.push('mod');
      if (event.shiftKey) keys.push('shift');
      if (event.altKey) keys.push('alt');
      keys.push(event.key.toLowerCase());
      
      const pressed = keys.join('+');
      const normalized = shortcut.toLowerCase()
        .replace('cmdorctrl', 'mod')
        .replace('cmd', 'mod')
        .replace('ctrl', 'mod');
      
      if (pressed === normalized) {
        event.preventDefault();
        callback(event);
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }
});

// Theme and appearance
contextBridge.exposeInMainWorld('theme', {
  shouldUseDarkColors: () => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  },
  
  onThemeChange: (callback) => {
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', callback);
      return () => mediaQuery.removeEventListener('change', callback);
    }
    return () => {};
  }
});

// Notification support
contextBridge.exposeInMainWorld('notifications', {
  show: (title, options = {}) => {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        return new Notification(title, options);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            return new Notification(title, options);
          }
        });
      }
    }
    return null;
  },

  requestPermission: () => {
    if ('Notification' in window) {
      return Notification.requestPermission();
    }
    return Promise.resolve('denied');
  },

  permission: () => {
    if ('Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  }
});

// System clipboard
contextBridge.exposeInMainWorld('clipboard', {
  writeText: (text) => {
    return navigator.clipboard.writeText(text);
  },

  readText: () => {
    return navigator.clipboard.readText();
  },

  write: (data) => {
    return navigator.clipboard.write(data);
  }
});

// App state management
let appState = {
  isOnline: navigator.onLine,
  lastActivity: Date.now()
};

contextBridge.exposeInMainWorld('appState', {
  get: () => ({ ...appState }),
  
  onOnlineStatusChange: (callback) => {
    const handleOnline = () => {
      appState.isOnline = true;
      callback(true);
    };
    const handleOffline = () => {
      appState.isOnline = false;
      callback(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  },

  updateActivity: () => {
    appState.lastActivity = Date.now();
  }
});

// Performance monitoring
contextBridge.exposeInMainWorld('performance', {
  mark: (name) => {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  },

  measure: (name, startMark, endMark) => {
    if (window.performance && window.performance.measure) {
      window.performance.measure(name, startMark, endMark);
    }
  },

  getEntries: () => {
    if (window.performance && window.performance.getEntries) {
      return window.performance.getEntries();
    }
    return [];
  },

  memory: () => {
    if (window.performance && window.performance.memory) {
      return {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit
      };
    }
    return null;
  }
});

// Error handling
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  // Clean up any remaining listeners
  ipcRenderer.removeAllListeners();
});

console.log('Preload script loaded successfully');
