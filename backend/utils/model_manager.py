import asyncio
import httpx
import json
import logging
import subprocess
import psutil
from typing import List, Dict, Optional, Any
import time

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages Ollama models and API interactions"""
    
    def __init__(self, config):
        self.config = config
        self.ollama_host = config.OLLAMA_HOST
        self.timeout = config.OLLAMA_TIMEOUT
        self.current_model = config.get_behavior_settings().get("default_model", "llama3.2")
        self._client = None
    
    async def get_client(self):
        """Get HTTP client with proper configuration"""
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=self.timeout)
        return self._client
    
    async def check_ollama_status(self) -> bool:
        """Check if Ollama is running and accessible"""
        try:
            client = await self.get_client()
            response = await client.get(f"{self.ollama_host}/api/version")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama not accessible: {e}")
            return False
    
    async def start_ollama(self) -> bool:
        """Start Ollama service if not running"""
        try:
            # Check if already running
            if await self.check_ollama_status():
                return True
            
            # Try to start Ollama
            if self._is_windows():
                process = subprocess.Popen(
                    ["ollama", "serve"],
                    creationflags=subprocess.CREATE_NEW_CONSOLE
                )
            else:
                process = subprocess.Popen(
                    ["ollama", "serve"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
            
            # Wait a bit for startup
            await asyncio.sleep(5)
            
            # Check if it started successfully
            return await self.check_ollama_status()
            
        except Exception as e:
            logger.error(f"Failed to start Ollama: {e}")
            return False
    
    def _is_windows(self) -> bool:
        """Check if running on Windows"""
        import platform
        return platform.system().lower() == "windows"
    
    async def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama"""
        try:
            if not await self.check_ollama_status():
                if not await self.start_ollama():
                    return []
            
            client = await self.get_client()
            response = await client.get(f"{self.ollama_host}/api/tags")
            
            if response.status_code == 200:
                data = response.json()
                models = [model["name"] for model in data.get("models", [])]
                return models
            else:
                logger.error(f"Failed to get models: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting available models: {e}")
            return []
    
    async def pull_model(self, model_name: str) -> bool:
        """Pull/download a model from Ollama registry"""
        try:
            if not await self.check_ollama_status():
                if not await self.start_ollama():
                    return False
            
            client = await self.get_client()
            
            # Start the pull request
            async with client.stream(
                "POST",
                f"{self.ollama_host}/api/pull",
                json={"name": model_name}
            ) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                status = data.get("status", "")
                                logger.info(f"Pulling {model_name}: {status}")
                                
                                # Check if pull is complete
                                if "success" in status.lower() or data.get("status") == "success":
                                    return True
                            except json.JSONDecodeError:
                                continue
                else:
                    logger.error(f"Failed to pull model: {response.status_code}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error pulling model {model_name}: {e}")
            return False
    
    async def switch_model(self, model_name: str) -> bool:
        """Switch to a different model"""
        try:
            # Check if model is available
            available_models = await self.get_available_models()
            
            if model_name not in available_models:
                logger.warning(f"Model {model_name} not available. Attempting to pull...")
                if not await self.pull_model(model_name):
                    return False
            
            # Test the model with a simple query
            test_response = await self.generate_response(
                "Hello, respond with 'Model switched successfully'",
                model_name
            )
            
            if "successfully" in test_response.lower() or test_response:
                self.current_model = model_name
                logger.info(f"Successfully switched to model: {model_name}")
                return True
            else:
                logger.error(f"Model {model_name} test failed")
                return False
                
        except Exception as e:
            logger.error(f"Error switching to model {model_name}: {e}")
            return False
    
    async def generate_response(
        self, 
        message: str, 
        model: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """Generate response using Ollama model"""
        try:
            if not await self.check_ollama_status():
                if not await self.start_ollama():
                    return "Error: Ollama service is not available"
            
            model_to_use = model or self.current_model
            client = await self.get_client()
            
            # Prepare the prompt with conversation history
            prompt = self._prepare_prompt(message, conversation_history)
            
            # Generate response
            response = await client.post(
                f"{self.ollama_host}/api/generate",
                json={
                    "model": model_to_use,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": self.config.get_behavior_settings().get("temperature", 0.7),
                        "top_p": 0.9,
                        "top_k": 40,
                        "num_predict": self.config.get_behavior_settings().get("max_tokens", 2000)
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "No response generated")
            else:
                logger.error(f"Generation failed: {response.status_code}")
                return f"Error: Failed to generate response (Status: {response.status_code})"
                
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"Error: {str(e)}"
    
    async def generate_streaming_response(
        self, 
        message: str, 
        model: Optional[str] = None,
        conversation_history: Optional[List[Dict]] = None
    ):
        """Generate streaming response using Ollama model"""
        try:
            if not await self.check_ollama_status():
                if not await self.start_ollama():
                    yield "Error: Ollama service is not available"
                    return
            
            model_to_use = model or self.current_model
            client = await self.get_client()
            
            # Prepare the prompt with conversation history
            prompt = self._prepare_prompt(message, conversation_history)
            
            # Generate streaming response
            async with client.stream(
                "POST",
                f"{self.ollama_host}/api/generate",
                json={
                    "model": model_to_use,
                    "prompt": prompt,
                    "stream": True,
                    "options": {
                        "temperature": self.config.get_behavior_settings().get("temperature", 0.7),
                        "top_p": 0.9,
                        "top_k": 40,
                        "num_predict": self.config.get_behavior_settings().get("max_tokens", 2000)
                    }
                }
            ) as response:
                if response.status_code == 200:
                    async for line in response.aiter_lines():
                        if line:
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                                    
                                if data.get("done", False):
                                    break
                            except json.JSONDecodeError:
                                continue
                else:
                    yield f"Error: Failed to generate response (Status: {response.status_code})"
                    
        except Exception as e:
            logger.error(f"Error generating streaming response: {e}")
            yield f"Error: {str(e)}"
    
    def _prepare_prompt(self, message: str, conversation_history: Optional[List[Dict]] = None) -> str:
        """Prepare prompt with system context and conversation history"""
        system_prompt = self.config.get_system_prompt()
        
        # Build conversation context
        context = f"System: {system_prompt}\n\n"
        
        if conversation_history:
            # Include last 10 messages for context
            recent_history = conversation_history[-10:]
            for msg in recent_history:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "user":
                    context += f"User: {content}\n"
                elif role == "assistant":
                    context += f"Assistant: {content}\n"
        
        context += f"User: {message}\nAssistant: "
        
        return context
    
    async def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get detailed information about a model"""
        try:
            if not await self.check_ollama_status():
                return None
            
            client = await self.get_client()
            response = await client.post(
                f"{self.ollama_host}/api/show",
                json={"name": model_name}
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error getting model info for {model_name}: {e}")
            return None
    
    async def delete_model(self, model_name: str) -> bool:
        """Delete a model from local storage"""
        try:
            if not await self.check_ollama_status():
                return False
            
            client = await self.get_client()
            response = await client.delete(
                f"{self.ollama_host}/api/delete",
                json={"name": model_name}
            )
            
            return response.status_code == 200
            
        except Exception as e:
            logger.error(f"Error deleting model {model_name}: {e}")
            return False
    
    async def get_system_resources(self) -> Dict[str, Any]:
        """Get system resource usage"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)
            
            # Memory usage
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # GPU usage (if available)
            gpu_info = await self._get_gpu_info()
            
            return {
                "cpu": {
                    "percent": cpu_percent,
                    "count": psutil.cpu_count(),
                    "freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
                },
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "used_gb": round(memory.used / (1024**3), 2),
                    "percent": memory.percent
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "used_gb": round(disk.used / (1024**3), 2),
                    "percent": round((disk.used / disk.total) * 100, 2)
                },
                "gpu": gpu_info
            }
            
        except Exception as e:
            logger.error(f"Error getting system resources: {e}")
            return {}
    
    async def _get_gpu_info(self) -> Optional[Dict[str, Any]]:
        """Get GPU information if available"""
        try:
            # Try to get NVIDIA GPU info
            result = subprocess.run(
                ["nvidia-smi", "--query-gpu=name,memory.total,memory.used,utilization.gpu", 
                 "--format=csv,noheader,nounits"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                lines = result.stdout.strip().split('\n')
                gpus = []
                for line in lines:
                    if line.strip():
                        parts = line.split(', ')
                        if len(parts) >= 4:
                            gpus.append({
                                "name": parts[0],
                                "memory_total_mb": int(parts[1]),
                                "memory_used_mb": int(parts[2]),
                                "utilization_percent": int(parts[3])
                            })
                return {"nvidia_gpus": gpus} if gpus else None
                
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError, FileNotFoundError):
            pass
        
        return None
    
    async def optimize_model_selection(self, task_type: str, message: str) -> str:
        """Automatically select the best model for a given task"""
        try:
            # Get recommended models for the task
            recommended_models = self.config.get_model_for_task(task_type)
            available_models = await self.get_available_models()
            
            # Find the first available recommended model
            for model in recommended_models:
                if model in available_models:
                    return model
            
            # If no recommended model is available, try to pull the first one
            if recommended_models:
                first_choice = recommended_models[0]
                logger.info(f"Attempting to pull recommended model: {first_choice}")
                if await self.pull_model(first_choice):
                    return first_choice
            
            # Fall back to current model
            return self.current_model
            
        except Exception as e:
            logger.error(f"Error optimizing model selection: {e}")
            return self.current_model
    
    async def cleanup(self):
        """Cleanup resources"""
        if self._client:
            await self._client.aclose()
            self._client = None