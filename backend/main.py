from fastapi import FastAPI, File, UploadFile, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import asyncio
import json
import logging
import os
from typing import Optional, List, Dict, Any
import httpx
import aiofiles
from datetime import datetime
import uuid
import subprocess
import psutil

from config import Config
from utils.model_manager import ModelManager
from utils.file_processor import FileProcessor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/jarvis.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = FastAPI(title="JARVIS AI Assistant", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="frontend/dist"), name="static")

# Initialize components
config = Config()
model_manager = ModelManager(config)
file_processor = FileProcessor()

# Pydantic models
class ChatMessage(BaseModel):
    message: str
    model: str = "llama3.2"
    use_online: bool = False
    online_provider: Optional[str] = None
    session_id: Optional[str] = None

class ModelSwitch(BaseModel):
    model_name: str
    provider: str = "ollama"

class SystemStatus(BaseModel):
    status: str
    ollama_running: bool
    available_models: List[str]
    system_resources: Dict[str, Any]

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.sessions: Dict[str, List[Dict]] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        if session_id not in self.sessions:
            self.sessions[session_id] = []

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# Health check endpoint
@app.get("/health")
async def health_check():
    """System health check"""
    try:
        # Check Ollama status
        ollama_status = await model_manager.check_ollama_status()
        
        # Get system resources
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        system_resources = {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_available_gb": round(memory.available / (1024**3), 2),
            "disk_free_gb": round(disk.free / (1024**3), 2),
            "disk_percent": round((disk.used / disk.total) * 100, 2)
        }
        
        available_models = await model_manager.get_available_models()
        
        return SystemStatus(
            status="healthy",
            ollama_running=ollama_status,
            available_models=available_models,
            system_resources=system_resources
        )
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Chat endpoint
@app.post("/chat")
async def chat_endpoint(chat_request: ChatMessage):
    """Main chat endpoint"""
    try:
        session_id = chat_request.session_id or str(uuid.uuid4())
        
        # Store message in session
        if session_id not in manager.sessions:
            manager.sessions[session_id] = []
        
        manager.sessions[session_id].append({
            "role": "user",
            "content": chat_request.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Process message
        if chat_request.use_online and chat_request.online_provider:
            response = await process_online_model(
                chat_request.message,
                chat_request.online_provider,
                manager.sessions[session_id]
            )
        else:
            response = await model_manager.generate_response(
                chat_request.message,
                chat_request.model,
                manager.sessions[session_id]
            )
        
        # Store response in session
        manager.sessions[session_id].append({
            "role": "assistant",
            "content": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "response": response,
            "session_id": session_id,
            "model_used": chat_request.online_provider if chat_request.use_online else chat_request.model,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# File upload endpoint
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Handle file uploads"""
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = f"uploads/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process file
        processed_content = await file_processor.process_file(file_path, file.content_type)
        
        return {
            "filename": file.filename,
            "file_id": unique_filename,
            "content_type": file.content_type,
            "processed_content": processed_content,
            "file_size": len(content),
            "upload_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Model management endpoints
@app.get("/models")
async def get_models():
    """Get available models"""
    try:
        local_models = await model_manager.get_available_models()
        online_models = config.get_online_models()
        
        return {
            "local_models": local_models,
            "online_models": online_models,
            "current_model": model_manager.current_model
        }
        
    except Exception as e:
        logger.error(f"Get models error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/models/switch")
async def switch_model(model_request: ModelSwitch):
    """Switch AI model"""
    try:
        if model_request.provider == "ollama":
            success = await model_manager.switch_model(model_request.model_name)
            if not success:
                raise HTTPException(status_code=400, detail="Failed to switch model")
        
        return {
            "success": True,
            "current_model": model_request.model_name,
            "provider": model_request.provider
        }
        
    except Exception as e:
        logger.error(f"Model switch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/models/pull/{model_name}")
async def pull_model(model_name: str):
    """Pull/download a new model"""
    try:
        success = await model_manager.pull_model(model_name)
        if not success:
            raise HTTPException(status_code=400, detail="Failed to pull model")
        
        return {
            "success": True,
            "message": f"Model {model_name} pulled successfully"
        }
        
    except Exception as e:
        logger.error(f"Model pull error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time chat
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Process message
            if message_data.get("use_online"):
                response = await process_online_model(
                    message_data["message"],
                    message_data.get("online_provider", "claude"),
                    manager.sessions.get(session_id, [])
                )
            else:
                response = await model_manager.generate_response(
                    message_data["message"],
                    message_data.get("model", "llama3.2"),
                    manager.sessions.get(session_id, [])
                )
            
            # Send response
            await manager.send_personal_message(json.dumps({
                "type": "response",
                "content": response,
                "timestamp": datetime.now().isoformat()
            }), websocket)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# Online model processing
async def process_online_model(message: str, provider: str, conversation_history: List[Dict]):
    """Process message using online AI models"""
    try:
        if provider == "claude":
            return await call_claude_api(message, conversation_history)
        elif provider == "openai":
            return await call_openai_api(message, conversation_history)
        elif provider == "deepseek":
            return await call_deepseek_api(message, conversation_history)
        else:
            raise ValueError(f"Unsupported online provider: {provider}")
    except Exception as e:
        logger.error(f"Online model error: {e}")
        return f"Error processing with {provider}: {str(e)}"

async def call_claude_api(message: str, history: List[Dict]):
    """Call Claude API"""
    # Note: You'll need to add your API key in config
    api_key = config.get_claude_api_key()
    if not api_key:
        return "Claude API key not configured"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "Content-Type": "application/json",
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01"
            },
            json={
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 2000,
                "messages": [{"role": "user", "content": message}]
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["content"][0]["text"]
        else:
            return f"Claude API error: {response.status_code}"

async def call_openai_api(message: str, history: List[Dict]):
    """Call OpenAI API"""
    api_key = config.get_openai_api_key()
    if not api_key:
        return "OpenAI API key not configured"
    
    async with httpx.AsyncClient() as client:
        messages = [{"role": "system", "content": "You are JARVIS, an advanced AI assistant."}]
        messages.extend([{"role": h["role"], "content": h["content"]} for h in history[-10:]])
        messages.append({"role": "user", "content": message})
        
        response = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "gpt-4",
                "messages": messages,
                "max_tokens": 2000
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            return f"OpenAI API error: {response.status_code}"

async def call_deepseek_api(message: str, history: List[Dict]):
    """Call DeepSeek API"""
    api_key = config.get_deepseek_api_key()
    if not api_key:
        return "DeepSeek API key not configured"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": message}],
                "max_tokens": 2000
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            return f"DeepSeek API error: {response.status_code}"

# Session management
@app.get("/sessions/{session_id}")
async def get_session_history(session_id: str):
    """Get conversation history for a session"""
    return {
        "session_id": session_id,
        "messages": manager.sessions.get(session_id, [])
    }

@app.delete("/sessions/{session_id}")
async def clear_session(session_id: str):
    """Clear conversation history for a session"""
    if session_id in manager.sessions:
        del manager.sessions[session_id]
    return {"success": True, "message": "Session cleared"}

# Voice endpoints
@app.post("/voice/process")
async def process_voice(file: UploadFile = File(...)):
    """Process voice input"""
    try:
        # Save uploaded audio file
        audio_path = f"uploads/audio_{uuid.uuid4()}.wav"
        async with aiofiles.open(audio_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Process audio to text (you can integrate Whisper or other STT)
        text = await speech_to_text(audio_path)
        
        # Clean up audio file
        os.remove(audio_path)
        
        return {"text": text, "success": True}
        
    except Exception as e:
        logger.error(f"Voice processing error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def speech_to_text(audio_path: str) -> str:
    """Convert speech to text (placeholder - integrate with Whisper)"""
    # This is a placeholder - you should integrate with OpenAI Whisper or similar
    return "Voice input received (STT not implemented yet)"

if __name__ == "__main__":
    # Ensure directories exist
    os.makedirs("logs", exist_ok=True)
    os.makedirs("uploads", exist_ok=True)
    
    # Start server
    uvicorn.run(
        app,
        host=config.HOST,
        port=config.PORT,
        log_level="info",
        reload=config.DEBUG
    )