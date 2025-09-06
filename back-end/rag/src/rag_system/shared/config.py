"""
Shared Configuration System
Unified configuration for the optimized RAG system
"""

import os
from pathlib import Path
from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings
from pydantic import Field
from loguru import logger


class RagSystemConfig(BaseSettings):
    """
    Unified configuration for RAG system
    Replaces separate offline/online configs
    """
    # === GEMINI SETTINGS ===
    gemini_max_chunk_size: int = Field(default=20000, env="GEMINI_MAX_CHUNK_SIZE")
    gemini_chunk_overlap: int = Field(default=2000, env="GEMINI_CHUNK_OVERLAP")
    gemini_enable_chunking: bool = Field(default=True, env="GEMINI_ENABLE_CHUNKING")

    # === PROJECT SETTINGS ===
    project_name: str = "rag-system-optimized"
    version: str = "0.1.0"
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # === DIRECTORIES ===
    root_dir: Path = Path(__file__).parent.parent.parent.parent
    data_dir: Path = root_dir / "data"
    config_dir: Path = root_dir / "configs"
    
    # === API KEYS ===
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    openai_model_name: str = Field(default="gpt-4o-mini", env="OPENAI_MODEL_NAME")
    
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")
    gemini_model_name: str = Field(default="gemini-1.5-flash", env="GEMINI_MODEL_NAME")
    
    huggingface_access_token: str = Field(default="", env="HUGGINGFACE_ACCESS_TOKEN")
    huggingface_dedicated_endpoint: Optional[str] = Field(None, env="HUGGINGFACE_DEDICATED_ENDPOINT")
    
    comet_api_key: str = Field(default="", env="COMET_API_KEY")
    
    # === DATABASE SETTINGS ===
    mongodb_uri: str = Field(default="mongodb://localhost:27017/", env="MONGODB_URI")
    mongodb_database_name: str = Field(default="rag_system", env="MONGODB_DATABASE_NAME")
    mongodb_raw_collection_name: str = Field(default="documents_raw", env="MONGODB_RAW_COLLECTION_NAME")
    mongodb_rag_collection_name: str = Field(default="documents_rag", env="MONGODB_RAG_COLLECTION_NAME")
    
    # === EMBEDDING SETTINGS ===
    embedding_model_name: str = Field(default="text-embedding-3-small", env="EMBEDDING_MODEL_NAME")
    embedding_dimension: int = Field(default=1536, env="EMBEDDING_DIMENSION")
    vector_index_name: str = Field(default="rag_vector_index", env="VECTOR_INDEX_NAME")
    
    # === RAG SETTINGS ===
    max_retrieval_results: int = Field(default=5, env="MAX_RETRIEVAL_RESULTS")
    chunk_size: int = Field(default=1000, env="CHUNK_SIZE")
    chunk_overlap: int = Field(default=200, env="CHUNK_OVERLAP")
    
    # === AGENT SETTINGS ===
    agent_system_prompt: str = Field(
        default="You are a helpful AI assistant specialized in PDF document analysis.",
        env="AGENT_SYSTEM_PROMPT"
    )
    temperature: float = Field(default=0.1, env="TEMPERATURE")
    
    # === FINE-TUNING SETTINGS ===
    summarization_model_id: Optional[str] = Field(None, env="SUMMARIZATION_MODEL_ID")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global config instance
_config: Optional[RagSystemConfig] = None


def load_config(env_file: Optional[str] = None) -> RagSystemConfig:
    """Load configuration singleton"""
    global _config
    
    if _config is None:
        try:
            if env_file:
                _config = RagSystemConfig(_env_file=env_file)
            else:
                _config = RagSystemConfig()
                
            logger.info(f"✅ Configuration loaded for {_config.project_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to load configuration: {str(e)}")
            raise
    
    return _config


def get_config() -> RagSystemConfig:
    """Get current configuration"""
    if _config is None:
        raise RuntimeError("Configuration not loaded. Call load_config() first.")
    
    return _config
