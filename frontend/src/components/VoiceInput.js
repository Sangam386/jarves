import React, { useState, useRef, useEffect } from 'react';
import './VoiceInput.css';

const VoiceInput = ({ enabled, onVoiceInput, isProcessing }) => {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  
  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setError('');
        setTranscript('');
      };
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript) {
          onVoiceInput(finalTranscript);
          setTranscript('');
        }
      };
      
      recognition.onerror = (event) => {
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setTranscript('');
      };
    }
    
    return () => {
      stopListening();
      stopRecording();
    };
  }, [onVoiceInput]);
  
  // Audio level monitoring
  useEffect(() => {
    if (isListening || isRecording) {
      startAudioLevelMonitoring();
    } else {
      stopAudioLevelMonitoring();
    }
    
    return () => stopAudioLevelMonitoring();
  }, [isListening, isRecording]);
  
  const startAudioLevelMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && (isListening || isRecording)) {
          analyserRef.current.getByteFrequencyData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          const level = Math.min(average / 128, 1);
          
          setAudioLevel(level);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Microphone access denied');
    }
  };
  
  const stopAudioLevelMonitoring = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setAudioLevel(0);
  };
  
  const startListening = () => {
    if (!enabled || isProcessing || !recognitionRef.current) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      setError('Failed to start speech recognition');
      console.error('Speech recognition error:', error);
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setTranscript('');
  };
  
  const startRecording = async () => {
    if (!enabled || isProcessing) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await processAudioFile(audioBlob);
        setIsRecording(false);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setError('');
      
    } catch (error) {
      setError('Failed to access microphone');
      console.error('Recording error:', error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };
  
  const processAudioFile = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_input.wav');
      
      const response = await fetch('/api/voice/process', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success && data.text) {
        onVoiceInput(data.text);
      } else {
        setError('Failed to process voice input');
      }
    } catch (error) {
      setError('Failed to process voice input');
      console.error('Voice processing error:', error);
    }
  };
  
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };
  
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const clearError = () => {
    setError('');
  };
  
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  if (!isSupported) {
    return (
      <div className="voice-input-container">
        <div className="voice-input-error">
          <span className="error-icon">🚫</span>
          <span className="error-text">Speech recognition not supported</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="voice-input-container">
      {/* Main Voice Button */}
      <div className="voice-controls">
        <button
          className={`voice-btn ${isListening ? 'listening' : ''} ${isRecording ? 'recording' : ''}`}
          onClick={toggleListening}
          disabled={!enabled || isProcessing || isRecording}
          title={isListening ? 'Stop listening' : 'Start voice input'}
        >
          <div className="voice-icon">
            {isListening ? '🎤' : '🎙️'}
          </div>
          
          {/* Audio Level Visualizer */}
          {(isListening || isRecording) && (
            <div className="audio-visualizer">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className="audio-bar"
                  style={{
                    height: `${Math.max(10, audioLevel * 100 * (0.5 + Math.random() * 0.5))}%`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Status Ring */}
          <div className={`status-ring ${isListening ? 'active' : ''}`}>
            <div className="ring-inner"></div>
          </div>
        </button>
        
        {/* Recording Button */}
        <button
          className={`record-btn ${isRecording ? 'recording' : ''}`}
          onClick={toggleRecording}
          disabled={!enabled || isProcessing || isListening}
          title={isRecording ? 'Stop recording' : 'Record audio message'}
        >
          <div className="record-icon">
            {isRecording ? '⏹️' : '🔴'}
          </div>
        </button>
      </div>
      
      {/* Status Display */}
      <div className="voice-status">
        {isListening && (
          <div className="status-message listening">
            <div className="status-icon">🎧</div>
            <div className="status-text">
              <div className="status-title">Listening...</div>
              <div className="status-subtitle">Speak now</div>
            </div>
          </div>
        )}
        
        {isRecording && (
          <div className="status-message recording">
            <div className="status-icon">🔴</div>
            <div className="status-text">
              <div className="status-title">Recording...</div>
              <div className="status-subtitle">Click to stop</div>
            </div>
          </div>
        )}
        
        {transcript && (
          <div className="transcript-display">
            <div className="transcript-label">Transcript:</div>
            <div className="transcript-text">{transcript}</div>
          </div>
        )}
        
        {error && (
          <div className="error-display">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-message">{error}</span>
            </div>
            <button className="error-dismiss" onClick={clearError}>
              ✕
            </button>
          </div>
        )}
      </div>
      
      {/* Voice Commands Help */}
      <div className="voice-help">
        <details className="help-details">
          <summary className="help-summary">
            <span className="help-icon">❓</span>
            Voice Commands
          </summary>
          <div className="help-content">
            <div className="help-section">
              <h4>Quick Commands:</h4>
              <ul>
                <li>"Help me with coding" - Get coding assistance</li>
                <li>"Analyze this data" - Data analysis help</li>
                <li>"What can you do?" - Show capabilities</li>
                <li>"Clear chat" - Clear conversation</li>
              </ul>
            </div>
            <div className="help-section">
              <h4>Tips:</h4>
              <ul>
                <li>Speak clearly and at normal speed</li>
                <li>Use the microphone button for real-time recognition</li>
                <li>Use the record button for longer messages</li>
                <li>Make sure your microphone is enabled</li>
              </ul>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default VoiceInput; 