import React, { useEffect, useRef, useState } from 'react';
import './JarvisOrb.css';

const JarvisOrb = ({ 
  isActive, 
  isProcessing, 
  color = '#00d4ff', 
  onClick, 
  systemStatus 
}) => {
  const orbRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Initialize particles and canvas
  useEffect(() => {
    initializeParticles();
    initializeCanvas();
    startAnimation();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  // Update orb state based on props
  useEffect(() => {
    updateOrbState();
  }, [isActive, isProcessing, color, systemStatus]);
  
  const initializeParticles = () => {
    const newParticles = [];
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * 400,
        y: Math.random() * 400,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        originalOpacity: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2
      });
    }
    
    setParticles(newParticles);
  };
  
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = 400;
    canvas.height = 400;
  };
  
  const startAnimation = () => {
    const animate = () => {
      drawOrb();
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };
  
  const drawOrb = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const time = Date.now() * 0.001;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background particles
    drawParticles(ctx, time);
    
    // Draw main orb
    drawMainOrb(ctx, centerX, centerY, time);
    
    // Draw energy rings
    drawEnergyRings(ctx, centerX, centerY, time);
    
    // Draw status indicators
    drawStatusIndicators(ctx, centerX, centerY, time);
  };
  
  const drawParticles = (ctx, time) => {
    particles.forEach((particle, index) => {
      // Update particle position
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x <= 0 || particle.x >= 400) particle.vx *= -1;
      if (particle.y <= 0 || particle.y >= 400) particle.vy *= -1;
      
      // Pulsing opacity
      particle.opacity = particle.originalOpacity + 
        Math.sin(time + particle.phase) * 0.3;
      
      // Draw particle
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };
  
  const drawMainOrb = (ctx, centerX, centerY, time) => {
    const baseRadius = 80;
    const pulseRadius = isActive ? 
      baseRadius + Math.sin(time * 2) * 10 : 
      baseRadius + Math.sin(time * 0.5) * 5;
    
    // Outer glow
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, pulseRadius * 2
    );
    
    const alpha = isProcessing ? 0.8 : (isActive ? 0.6 : 0.3);
    gradient.addColorStop(0, `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.5, `${color}40`);
    gradient.addColorStop(1, `${color}00`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Main orb body
    const mainGradient = ctx.createRadialGradient(
      centerX - 20, centerY - 20, 0,
      centerX, centerY, pulseRadius
    );
    
    mainGradient.addColorStop(0, `${color}FF`);
    mainGradient.addColorStop(0.7, `${color}CC`);
    mainGradient.addColorStop(1, `${color}88`);
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner core
    const coreGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, pulseRadius * 0.3
    );
    
    coreGradient.addColorStop(0, '#FFFFFF');
    coreGradient.addColorStop(1, color);
    
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, pulseRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  };
  
  const drawEnergyRings = (ctx, centerX, centerY, time) => {
    if (!isActive && !isProcessing) return;
    
    const ringCount = isProcessing ? 4 : 2;
    
    for (let i = 0; i < ringCount; i++) {
      const radius = 100 + i * 30 + Math.sin(time * 2 + i) * 10;
      const opacity = (1 - i / ringCount) * 0.5;
      
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.lineDashOffset = -time * 20 + i * 10;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };
  
  const drawStatusIndicators = (ctx, centerX, centerY, time) => {
    // Processing indicator
    if (isProcessing) {
      const dotCount = 8;
      const dotRadius = 120;
      
      for (let i = 0; i < dotCount; i++) {
        const angle = (time * 2 + i * (Math.PI * 2 / dotCount)) % (Math.PI * 2);
        const x = centerX + Math.cos(angle) * dotRadius;
        const y = centerY + Math.sin(angle) * dotRadius;
        
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // System status indicator
    if (systemStatus) {
      const statusColor = systemStatus.ollama_running ? '#00ff00' : '#ff4444';
      const statusX = centerX + 60;
      const statusY = centerY - 60;
      
      ctx.save();
      ctx.fillStyle = statusColor;
      ctx.beginPath();
      ctx.arc(statusX, statusY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };
  
  const updateOrbState = () => {
    const orb = orbRef.current;
    if (!orb) return;
    
    // Update CSS custom properties
    orb.style.setProperty('--orb-color', color);
    orb.style.setProperty('--orb-scale', isActive ? '1.1' : '1');
    orb.style.setProperty('--animation-speed', isProcessing ? '0.5s' : '2s');
  };
  
  const handleOrbClick = () => {
    if (onClick) {
      onClick();
    }
    
    // Add click effect
    const orb = orbRef.current;
    if (orb) {
      orb.classList.add('clicked');
      setTimeout(() => {
        orb.classList.remove('clicked');
      }, 300);
    }
  };
  
  const handleOrbHover = (isHovering) => {
    const orb = orbRef.current;
    if (orb) {
      if (isHovering) {
        orb.classList.add('hovered');
      } else {
        orb.classList.remove('hovered');
      }
    }
  };
  
  return (
    <div className="jarvis-orb-container">
      <div
        ref={orbRef}
        className={`jarvis-orb ${isActive ? 'active' : ''} ${isProcessing ? 'processing' : ''}`}
        onClick={handleOrbClick}
        onMouseEnter={() => handleOrbHover(true)}
        onMouseLeave={() => handleOrbHover(false)}
        style={{ '--orb-color': color }}
      >
        {/* Canvas for dynamic effects */}
        <canvas
          ref={canvasRef}
          className="orb-canvas"
          width="400"
          height="400"
        />
        
        {/* Static orb layers */}
        <div className="orb-core">
          <div className="orb-inner"></div>
          <div className="orb-middle"></div>
          <div className="orb-outer"></div>
        </div>
        
        {/* Pulse rings */}
        <div className="pulse-rings">
          <div className="pulse-ring ring-1"></div>
          <div className="pulse-ring ring-2"></div>
          <div className="pulse-ring ring-3"></div>
        </div>
        
        {/* Status indicators */}
        <div className="status-indicators">
          {systemStatus && (
            <div className={`system-status ${systemStatus.ollama_running ? 'online' : 'offline'}`}>
              <div className="status-dot"></div>
            </div>
          )}
          
          {isProcessing && (
            <div className="processing-indicator">
              <div className="processing-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Energy field */}
        <div className="energy-field">
          {Array.from({ length: 12 }, (_, i) => (
            <div
              key={i}
              className="energy-particle"
              style={{
                '--delay': `${i * 0.1}s`,
                '--rotation': `${i * 30}deg`
              }}
            ></div>
          ))}
        </div>
        
        {/* Interaction feedback */}
        <div className="interaction-feedback">
          <div className="click-ripple"></div>
          <div className="hover-glow"></div>
        </div>
      </div>
      
      {/* Orb label */}
      <div className="orb-label">
        <div className="label-text">
          {isProcessing ? 'Processing...' : (isActive ? 'JARVIS Active' : 'Click to Activate')}
        </div>
        <div className="label-subtitle">
          {systemStatus && (
            <span className={systemStatus.ollama_running ? 'status-online' : 'status-offline'}>
              {systemStatus.ollama_running ? 'AI Ready' : 'Limited Mode'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JarvisOrb;