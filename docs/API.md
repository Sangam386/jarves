# JARVIS AI Assistant API Documentation

## Overview

The JARVIS AI Assistant provides a RESTful API built with FastAPI, offering endpoints for AI interactions, file processing, voice features, and system management.

**Base URL:** `http://localhost:8000`

## Authentication

Currently, the API uses optional API key authentication for external model providers. Local Ollama models don't require authentication.

```bash
# For endpoints requiring external API keys
curl -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     http://localhost:8000/api/endpoint
```

## Core Endpoints

### Chat and AI Interaction

#### POST `/api/chat`
Send a message to the AI assistant.

**Request Body:**
```json
{
  "message": "Hello, how are you?",
  "model": "llama3.2",
  "temperature": 0.7,
  "max_tokens": 2048,
  "stream": true,
  "conversation_id": "optional-uuid",
  "context": "optional previous context"
}
```

**Response (Non-streaming):**
```json
{
  "response": "Hello! I'm doing well, thank you for asking. How can I assist you today?",
  "model_used": "llama3.2",
  "tokens_used": 45,
  "conversation_id": "uuid-here",
  "processing_time": 1.23
}
```

**Response (Streaming):**
Server-Sent Events (SSE) format:
```
data: {"type": "start", "conversation_id": "uuid"}
data: {"type": "token", "content": "Hello"}
data: {"type": "token", "content": "!"}
data: {"type": "end", "tokens_used": 45, "processing_time": 1.23}
```

#### GET `/api/models`
Get available AI models.

**Response:**
```json
{
  "ollama_models": [
    {
      "name": "llama3.2",
      "description": "Fast and efficient model for general tasks",
      "size": "3.2B",
      "status": "available",
      "memory_usage": "4.2GB"
    }
  ],
  "online_models": [
    {
      "name": "claude-3-sonnet",
      "provider": "anthropic",
      "status": "available",
      "requires_key": true
    }
  ]
}
```

#### POST `/api/models/switch`
Switch the active AI model.

**Request Body:**
```json
{
  "model": "codellama",
  "preload": true
}
```

**Response:**
```json
{
  "success": true,
  "model": "codellama",
  "status": "loaded",
  "message": "Model switched successfully"
}
```

### File Processing

#### POST `/api/files/upload`
Upload and process files.

**Request:**
- Multipart form data
- Field: `file` (the uploaded file)
- Optional field: `analyze` (boolean, default: true)

**Response:**
```json
{
  "file_id": "uuid-here",
  "filename": "document.pdf",
  "size": 1048576,
  "type": "application/pdf",
  "processed": true,
  "analysis": {
    "text_extracted": "Document content here...",
    "summary": "This document discusses...",
    "metadata": {
      "pages": 5,
      "language": "en",
      "created_date": "2024-01-01"
    }
  },
  "upload_time": "2024-01-01T12:00:00Z"
}
```

#### GET `/api/files/{file_id}`
Get information about an uploaded file.

**Response:**
```json
{
  "file_id": "uuid-here",
  "filename": "document.pdf",
  "size":