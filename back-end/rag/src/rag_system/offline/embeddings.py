"""
Embedding Generation Service for RAG System
Handles text embedding generation using OpenAI and HuggingFace models
"""

from typing import List, Union, Literal, Optional
from loguru import logger
import time

from langchain_huggingface import HuggingFaceEmbeddings
from langchain_openai import OpenAIEmbeddings

from rag_system.shared.config import RagSystemConfig

EmbeddingModelType = Literal["openai", "huggingface"]
EmbeddingsModel = Union[OpenAIEmbeddings, HuggingFaceEmbeddings]


class EmbeddingGenerator:
    """
    Service for generating embeddings from text using various models
    Supports both OpenAI and HuggingFace embedding models
    """

    def __init__(self, config: RagSystemConfig, model_type: EmbeddingModelType = "openai"):
        """
        Initialize EmbeddingGenerator
        
        Args:
            config: RagSystemConfig instance
            model_type: Type of embedding model to use ("openai" or "huggingface")
        """
        self.config = config
        self.model_type = model_type
        self.model: Optional[EmbeddingsModel] = None
        
        self._initialize_model()

    def _initialize_model(self) -> None:
        """Initialize the embedding model based on configuration"""
        try:
            if self.model_type == "openai":
                self.model = self._get_openai_model()
                logger.success(f"✅ Initialized OpenAI embedding model: {self.config.embedding_model_name}")
                
            elif self.model_type == "huggingface":
                self.model = self._get_huggingface_model()
                logger.success(f"✅ Initialized HuggingFace embedding model: {self.config.embedding_model_name}")
                
            else:
                raise ValueError(f"Invalid embedding model type: {self.model_type}")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize embedding model: {str(e)}")
            raise

    def _get_openai_model(self) -> OpenAIEmbeddings:
        """
        Get OpenAI embedding model instance
        
        Returns:
            Configured OpenAI embeddings model
        """
        return OpenAIEmbeddings(
            model=self.config.embedding_model_name,
            allowed_special={"<|endoftext|>"},
            openai_api_key=self.config.openai_api_key,
        )

    def _get_huggingface_model(self) -> HuggingFaceEmbeddings:
        """
        Get HuggingFace embedding model instance
        
        Returns:
            Configured HuggingFace embeddings model
        """
        return HuggingFaceEmbeddings(
            model_name=self.config.embedding_model_name,
            model_kwargs={"device": "cpu", "trust_remote_code": True},
            encode_kwargs={"normalize_embeddings": False},
        )

    def generate_single(self, text: str) -> List[float]:
        """
        Generate embedding for a single text
        
        Args:
            text: Input text to embed
            
        Returns:
            List of float values representing the embedding
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for embedding")
            return [0.0] * self.config.embedding_dimension

        try:
            embedding = self.model.embed_query(text)
            
            # Validate embedding dimension
            if len(embedding) != self.config.embedding_dimension:
                logger.warning(
                    f"Embedding dimension mismatch: got {len(embedding)}, expected {self.config.embedding_dimension}"
                )
            
            logger.debug(f"Generated embedding for text of length {len(text)}")
            return embedding
            
        except Exception as e:
            logger.error(f"❌ Error generating single embedding: {str(e)}")
            raise

    def generate_batch(self, texts: List[str], batch_size: int = 50) -> List[List[float]]:
        """
        Generate embeddings for a batch of texts
        
        Args:
            texts: List of input texts to embed
            batch_size: Size of batches for processing
            
        Returns:
            List of embeddings (each embedding is a list of floats)
        """
        if not texts:
            logger.warning("Empty text list provided for batch embedding")
            return []

        try:
            all_embeddings = []
            
            # Process in batches to avoid API limits
            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]
                
                logger.info(f"🔢 Processing batch {i//batch_size + 1}/{(len(texts)-1)//batch_size + 1} ({len(batch)} texts)")
                
                start_time = time.time()
                
                # Generate embeddings for batch
                batch_embeddings = self.model.embed_documents(batch)
                
                # Validate embeddings
                for j, embedding in enumerate(batch_embeddings):
                    if len(embedding) != self.config.embedding_dimension:
                        logger.warning(
                            f"Embedding dimension mismatch for item {i+j}: got {len(embedding)}, expected {self.config.embedding_dimension}"
                        )
                
                all_embeddings.extend(batch_embeddings)
                
                elapsed = time.time() - start_time
                logger.debug(f"Batch processed in {elapsed:.2f}s ({len(batch)/elapsed:.1f} texts/sec)")
                
                # Small delay to respect API rate limits
                if self.model_type == "openai" and i + batch_size < len(texts):
                    time.sleep(0.1)
            
            logger.success(f"✅ Generated {len(all_embeddings)} embeddings from {len(texts)} texts")
            return all_embeddings
            
        except Exception as e:
            logger.error(f"❌ Error generating batch embeddings: {str(e)}")
            raise

    def get_model_info(self) -> dict:
        """
        Get information about the current embedding model
        
        Returns:
            Dictionary with model information
        """
        return {
            "model_type": self.model_type,
            "model_name": self.config.embedding_model_name,
            "embedding_dimension": self.config.embedding_dimension,
            "model_class": self.model.__class__.__name__ if self.model else None
        }

    def test_embedding(self, test_text: str = "This is a test text for embedding generation.") -> dict:
        """
        Test the embedding generation with a sample text
        
        Args:
            test_text: Text to use for testing
            
        Returns:
            Dictionary with test results
        """
        try:
            logger.info(f"🧪 Testing embedding generation with: '{test_text[:50]}...'")
            
            start_time = time.time()
            embedding = self.generate_single(test_text)
            elapsed = time.time() - start_time
            
            result = {
                "success": True,
                "text_length": len(test_text),
                "embedding_dimension": len(embedding),
                "generation_time": elapsed,
                "embedding_preview": embedding[:5] if len(embedding) >= 5 else embedding
            }
            
            logger.success(f"✅ Embedding test successful: {result['embedding_dimension']}D in {elapsed:.3f}s")
            return result
            
        except Exception as e:
            logger.error(f"❌ Embedding test failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }


# Convenience functions for backward compatibility
def get_embedding_model(
    model_id: str,
    model_type: EmbeddingModelType = "huggingface",
    device: str = "cpu",
) -> EmbeddingsModel:
    """
    Get an embedding model instance (backward compatibility)
    
    Args:
        model_id: Model identifier
        model_type: Type of model ("openai" or "huggingface")
        device: Device for computation
        
    Returns:
        Embedding model instance
    """
    if model_type == "openai":
        return OpenAIEmbeddings(
            model=model_id,
            allowed_special={"<|endoftext|>"},
        )
    elif model_type == "huggingface":
        return HuggingFaceEmbeddings(
            model_name=model_id,
            model_kwargs={"device": device, "trust_remote_code": True},
            encode_kwargs={"normalize_embeddings": False},
        )
    else:
        raise ValueError(f"Invalid embedding model type: {model_type}")
