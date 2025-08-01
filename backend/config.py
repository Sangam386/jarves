import os
import json
from typing import Optional, Dict, List, Any
from pathlib import Path

class Config:
    """Configuration management for JARVIS AI Assistant"""
    
    def __init__(self):
        # Server configuration
        self.HOST = os.getenv("HOST", "127.0.0.1")
        self.PORT = int(os.getenv("PORT", 8000))
        self.DEBUG = os.getenv("DEBUG", "False").lower() == "true"
        
        # Ollama configuration
        self.OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
        self.OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT", 300))
        
        # API Keys for online models
        self.CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY", "")
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
        self.DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
        
        # File paths
        self.CONFIG_DIR = Path("config")
        self.MODELS_CONFIG = self.CONFIG_DIR / "models.json"
        self.SETTINGS_CONFIG = self.CONFIG_DIR / "settings.json"
        
        # Create config directory if it doesn't exist
        self.CONFIG_DIR.mkdir(exist_ok=True)
        
        # Load configurations
        self.models_config = self._load_models_config()
        self.settings_config = self._load_settings_config()
    
    def _load_models_config(self) -> Dict[str, Any]:
        """Load models configuration"""
        default_config = {
            "ollama_models": {
                "recommended": [
                    {
                        "name": "llama3.2",
                        "description": "Fast and efficient model for general tasks",
                        "size": "3.2B",
                        "use_case": ["general", "coding", "conversation"]
                    },
                    {
                        "name": "codellama",
                        "description": "Specialized for coding tasks",
                        "size": "7B",
                        "use_case": ["coding", "programming", "debugging"]
                    },
                    {
                        "name": "llama3.1:8b",
                        "description": "Balanced model for complex reasoning",
                        "size": "8B",
                        "use_case": ["reasoning", "analysis", "prediction"]
                    },
                    {
                        "name": "mistral:7b",
                        "description": "Fast and accurate for various tasks",
                        "size": "7B",
                        "use_case": ["general", "fast_responses"]
                    },
                    {
                        "name": "phi3:mini",
                        "description": "Lightweight model for quick responses",
                        "size": "3.8B",
                        "use_case": ["quick_tasks", "low_resource"]
                    }
                ],
                "specialized": [
                    {
                        "name": "deepseek-coder",
                        "description": "Advanced coding assistant",
                        "size": "6.7B",
                        "use_case": ["advanced_coding", "architecture", "debugging"]
                    },
                    {
                        "name": "wizard-coder",
                        "description": "Code generation and explanation",
                        "size": "13B",
                        "use_case": ["code_generation", "explanation"]
                    },
                    {
                        "name": "neural-chat",
                        "description": "Conversational AI optimized",
                        "size": "7B",
                        "use_case": ["conversation", "assistance"]
                    }
                ]
            },
            "online_models": {
                "claude": [
                    {
                        "name": "claude-3-opus",
                        "description": "Most capable Claude model",
                        "provider": "anthropic",
                        "use_case": ["complex_reasoning", "analysis", "creative_writing"]
                    },
                    {
                        "name": "claude-3-sonnet",
                        "description": "Balanced Claude model",
                        "provider": "anthropic",
                        "use_case": ["general", "coding", "analysis"]
                    }
                ],
                "openai": [
                    {
                        "name": "gpt-4",
                        "description": "Most capable GPT model",
                        "provider": "openai",
                        "use_case": ["complex_tasks", "reasoning", "coding"]
                    },
                    {
                        "name": "gpt-3.5-turbo",
                        "description": "Fast and efficient GPT model",
                        "provider": "openai",
                        "use_case": ["general", "conversation", "quick_tasks"]
                    }
                ],
                "deepseek": [
                    {
                        "name": "deepseek-chat",
                        "description": "Advanced reasoning model",
                        "provider": "deepseek",
                        "use_case": ["reasoning", "analysis", "coding"]
                    }
                ]
            },
            "model_preferences": {
                "coding": ["codellama", "deepseek-coder", "claude-3-sonnet"],
                "prediction": ["llama3.1:8b", "claude-3-opus", "gpt-4"],
                "conversation": ["llama3.2", "neural-chat", "claude-3-sonnet"],
                "analysis": ["llama3.1:8b", "claude-3-opus", "deepseek-chat"],
                "quick_tasks": ["phi3:mini", "gpt-3.5-turbo", "llama3.2"]
            }
        }
        
        if self.MODELS_CONFIG.exists():
            try:
                with open(self.MODELS_CONFIG, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading models config: {e}")
                return default_config
        else:
            # Create default config file
            with open(self.MODELS_CONFIG, 'w') as f:
                json.dump(default_config, f, indent=2)
            return default_config
    
    def _load_settings_config(self) -> Dict[str, Any]:
        """Load application settings"""
        default_settings = {
            "app": {
                "name": "JARVIS AI Assistant",
                "version": "1.0.0",
                "theme": "dark",
                "language": "en"
            },
            "ui": {
                "orb_color": "#00d4ff",
                "orb_pulse": True,
                "chat_animations": True,
                "voice_feedback": True,
                "auto_scroll": True
            },
            "behavior": {
                "default_model": "llama3.2",
                "auto_switch_models": True,
                "context_length": 4096,
                "temperature": 0.7,
                "max_tokens": 2000
            },
            "features": {
                "voice_input": True,
                "file_upload": True,
                "model_switching": True,
                "online_models": True,
                "session_persistence": True
            },
            "performance": {
                "max_concurrent_requests": 10,
                "request_timeout": 300,
                "cache_responses": True,
                "log_level": "INFO"
            }
        }
        
        if self.SETTINGS_CONFIG.exists():
            try:
                with open(self.SETTINGS_CONFIG, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading settings config: {e}")
                return default_settings
        else:
            # Create default settings file
            with open(self.SETTINGS_CONFIG, 'w') as f:
                json.dump(default_settings, f, indent=2)
            return default_settings
    
    def get_recommended_models(self) -> List[Dict[str, Any]]:
        """Get list of recommended Ollama models"""
        return self.models_config.get("ollama_models", {}).get("recommended", [])
    
    def get_specialized_models(self) -> List[Dict[str, Any]]:
        """Get list of specialized Ollama models"""
        return self.models_config.get("ollama_models", {}).get("specialized", [])
    
    def get_online_models(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get list of online models"""
        return self.models_config.get("online_models", {})
    
    def get_model_for_task(self, task: str) -> List[str]:
        """Get recommended models for a specific task"""
        return self.models_config.get("model_preferences", {}).get(task, ["llama3.2"])
    
    def get_claude_api_key(self) -> str:
        """Get Claude API key"""
        return self.CLAUDE_API_KEY
    
    def get_openai_api_key(self) -> str:
        """Get OpenAI API key"""
        return self.OPENAI_API_KEY
    
    def get_deepseek_api_key(self) -> str:
        """Get DeepSeek API key"""
        return self.DEEPSEEK_API_KEY
    
    def get_ui_settings(self) -> Dict[str, Any]:
        """Get UI settings"""
        return self.settings_config.get("ui", {})
    
    def get_behavior_settings(self) -> Dict[str, Any]:
        """Get behavior settings"""
        return self.settings_config.get("behavior", {})
    
    def update_setting(self, category: str, key: str, value: Any) -> bool:
        """Update a specific setting"""
        try:
            if category not in self.settings_config:
                self.settings_config[category] = {}
            
            self.settings_config[category][key] = value
            
            # Save to file
            with open(self.SETTINGS_CONFIG, 'w') as f:
                json.dump(self.settings_config, f, indent=2)
            
            return True
        except Exception as e:
            print(f"Error updating setting: {e}")
            return False
    
    def is_api_key_configured(self, provider: str) -> bool:
        """Check if API key is configured for a provider"""
        if provider == "claude":
            return bool(self.CLAUDE_API_KEY)
        elif provider == "openai":
            return bool(self.OPENAI_API_KEY)
        elif provider == "deepseek":
            return bool(self.DEEPSEEK_API_KEY)
        return False
    
    def get_model_info(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific model"""
        # Check in recommended models
        for model in self.get_recommended_models():
            if model["name"] == model_name:
                return model
        
        # Check in specialized models
        for model in self.get_specialized_models():
            if model["name"] == model_name:
                return model
        
        # Check in online models
        for provider_models in self.get_online_models().values():
            for model in provider_models:
                if model["name"] == model_name:
                    return model
        
        return None
    
    def get_system_prompt(self) -> str:
        """Get system prompt for the AI assistant"""
        return """You are JARVIS, an advanced AI assistant created to help with various tasks including:

1. Coding and Programming - Write, debug, and explain code in multiple languages
2. Data Analysis and Predictions - Analyze data patterns and make informed predictions
3. General Assistance - Answer questions and help with various tasks
4. File Processing - Analyze and extract information from uploaded files
5. Research and Information - Provide accurate and helpful information

You should be:
- Professional yet friendly
- Accurate and helpful
- Clear in your explanations
- Proactive in suggesting improvements
- Honest about your limitations

When working with code, always provide clean, well-commented, and efficient solutions.
When making predictions, explain your reasoning and any assumptions.
When uncertain, acknowledge it and suggest ways to get better information."""

# Create global config instance
config = Config()