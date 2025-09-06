#!/usr/bin/env python3
"""
RAG Vector Index Builder
Simple script to replace ZenML RAG pipeline
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any
from loguru import logger
import time

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from rag_system.offline.vector_store import VectorStore
from rag_system.offline.embeddings import EmbeddingGenerator
from rag_system.offline.document_store import DocumentStore
from rag_system.shared.config import load_config


def setup_logging():
    """Configure logging"""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>.<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )


def build_rag_index(algorithm: str = "parent") -> Dict[str, Any]:
    """
    Build RAG vector index from processed documents
    
    Args:
        algorithm: Retrieval algorithm to use ("parent", "contextual_simple", etc.)
    """
    setup_logging()
    logger.info(f"🔍 Building RAG Index with {algorithm} algorithm")
    
    start_time = time.time()
    results = {
        "total_documents": 0,
        "total_chunks": 0,
        "embeddings_created": 0,
        "algorithm": algorithm,
        "execution_time": 0,
        "errors": []
    }
    
    try:
        # Load configuration
        config = load_config()
        
        # Initialize components
        doc_store = DocumentStore(config)
        embedding_gen = EmbeddingGenerator(config)
        vector_store = VectorStore(config)
        
        # Clear existing RAG collection
        logger.info("🧹 Cleaning existing RAG collection")
        vector_store.clear_collection()
        
        # Get all raw documents
        logger.info("📚 Loading raw documents from MongoDB")
        raw_documents = doc_store.get_all_documents()
        results["total_documents"] = len(raw_documents)
        
        if not raw_documents:
            logger.warning("No raw documents found. Run ETL pipeline first.")
            return results
        
        logger.info(f"Found {len(raw_documents)} documents to process")
        
        # Process documents using VectorStore class
        logger.info(f"📝 Creating chunks using VectorStore.create_text_chunks()")

        if algorithm == "parent":
            chunks = vector_store.create_text_chunks(raw_documents, strategy="parent")
        elif algorithm == "contextual_simple":
            chunks = vector_store.create_text_chunks(raw_documents, strategy="contextual") 
        elif algorithm == "contextual":
            chunks = vector_store.create_text_chunks(raw_documents, strategy="contextual")
        else:
            raise ValueError(f"Unknown algorithm: {algorithm}")
        
        results["total_chunks"] = len(chunks)
        logger.info(f"📝 Created {len(chunks)} chunks for embedding")
        
        # Generate embeddings in batches
        batch_size = 50
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            
            logger.info(f"🔢 Processing batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1}")
            
            # Generate embeddings
            embeddings = embedding_gen.generate_batch([chunk["content"] for chunk in batch])
            
            # Add embeddings to chunks
            for chunk, embedding in zip(batch, embeddings):
                chunk["embedding"] = embedding
            
            # Store in vector database
            vector_store.store_chunks(batch)
            results["embeddings_created"] += len(batch)
            
            logger.success(f"✅ Stored {len(batch)} embeddings")
        
        # Create vector index
        logger.info("🏗️ Creating vector search index")
        vector_store.create_vector_index()
        
        # Final results
        results["execution_time"] = time.time() - start_time
        
        logger.success(f"🎉 RAG Index Build Complete!")
        logger.info(f"📊 Results:")
        logger.info(f"   - Documents processed: {results['total_documents']}")
        logger.info(f"   - Chunks created: {results['total_chunks']}")
        logger.info(f"   - Embeddings generated: {results['embeddings_created']}")
        logger.info(f"   - Algorithm used: {results['algorithm']}")
        logger.info(f"   - Execution time: {results['execution_time']:.2f}s")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ RAG index build failed: {str(e)}")
        results["errors"].append(str(e))
        raise


# def _create_parent_chunks(documents: List[Dict]) -> List[Dict]:
#     """Create chunks using parent-child retrieval strategy"""
#     chunks = []
#     for doc in documents:
#         # Implementation for parent chunking
#         # This would split document into logical sections
#         pass
#     return chunks


# def _create_contextual_chunks(documents: List[Dict], simple: bool = True) -> List[Dict]:
#     """Create chunks using contextual retrieval strategy"""
#     chunks = []
#     for doc in documents:
#         # Implementation for contextual chunking
#         # This would add context to each chunk
#         pass
#     return chunks


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Build RAG vector index")
    parser.add_argument(
        "--algorithm", 
        choices=["parent", "contextual_simple", "contextual"],
        default="parent",
        help="Retrieval algorithm to use"
    )
    
    args = parser.parse_args()
    
    try:
        results = build_rag_index(args.algorithm)
        exit_code = 0 if not results["errors"] else 1
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.warning("RAG index build interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
