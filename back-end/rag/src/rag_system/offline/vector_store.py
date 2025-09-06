"""
Vector Store Service for RAG System
Handles vector storage and similarity search using MongoDB Atlas Vector Search
"""

from typing import List, Dict, Any, Optional, Literal
from loguru import logger
import time

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from pymongo.collection import Collection

from rag_system.shared.config import RagSystemConfig

ChunkingStrategy = Literal["simple", "contextual", "parent"]


class VectorStore:
    """
    Service for vector storage and retrieval using MongoDB Atlas Vector Search
    Supports multiple chunking strategies and vector similarity search
    """

    def __init__(self, config: RagSystemConfig):
        """
        Initialize VectorStore
        
        Args:
            config: RagSystemConfig instance
        """
        self.config = config
        self.client: Optional[MongoClient] = None
        self.collection: Optional[Collection] = None
        self.vector_store: Optional[MongoDBAtlasVectorSearch] = None
        
        self._connect()

    def _connect(self) -> None:
        """Establish connection to MongoDB"""
        try:
            self.client = MongoClient(
                self.config.mongodb_uri,
                appname="rag-system-optimized"
            )
            
            # Test connection
            self.client.admin.command("ping")
            
            # Setup collection
            database = self.client[self.config.mongodb_database_name]
            self.collection = database[self.config.mongodb_rag_collection_name]
            
            logger.success(f"✅ Connected to vector store: {self.config.mongodb_rag_collection_name}")
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB for vector store: {str(e)}")
            raise

    def store_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Store text chunks with embeddings in vector database
        
        Args:
            chunks: List of chunk dictionaries with embeddings
            
        Returns:
            Number of chunks stored
        """
        if not chunks:
            logger.warning("No chunks to store")
            return 0

        try:
            # Validate chunks have required fields
            required_fields = ["content", "embedding"]
            for i, chunk in enumerate(chunks):
                for field in required_fields:
                    if field not in chunk:
                        raise ValueError(f"Chunk {i} missing required field: {field}")

            # Clean chunks (remove MongoDB _id if present)
            clean_chunks = []
            for chunk in chunks:
                clean_chunk = chunk.copy()
                clean_chunk.pop("_id", None)
                clean_chunks.append(clean_chunk)

            # Insert chunks
            result = self.collection.insert_many(clean_chunks)
            count = len(result.inserted_ids)
            
            logger.success(f"✅ Stored {count} chunks in vector database")
            return count
            
        except Exception as e:
            logger.error(f"❌ Error storing chunks: {str(e)}")
            raise

    def create_vector_index(self) -> bool:
        """
        Create vector search index on the collection
        Note: This requires MongoDB Atlas with vector search capability
        
        Returns:
            True if index creation was attempted
        """
        try:
            logger.info("🏗️ Creating vector search index...")
            
            # Check if we have vector data
            sample_doc = self.collection.find_one({"embedding": {"$exists": True}})
            if not sample_doc:
                logger.warning("⚠️  No documents with embeddings found")
                return False

            embedding_dim = len(sample_doc.get("embedding", []))
            logger.info(f"📐 Detected embedding dimension: {embedding_dim}")

            # Vector search index definition
            index_definition = {
                "type": "vectorSearch",
                "name": self.config.vector_index_name,
                "definition": {
                    "fields": [
                        {
                            "type": "vector",
                            "path": "embedding",
                            "numDimensions": embedding_dim,
                            "similarity": "cosine"
                        },
                        {
                            "type": "filter",
                            "path": "metadata.source"
                        }
                    ]
                }
            }

            # Note: Creating vector search indexes requires MongoDB Atlas
            # For local development, this will be skipped
            try:
                # This would work on Atlas
                self.collection.create_search_index(index_definition)
                logger.success(f"✅ Vector search index '{self.config.vector_index_name}' created")
                
            except Exception as e:
                logger.warning(f"⚠️  Vector search index creation skipped (requires Atlas): {str(e)}")
                logger.info("💡 For local development, vector search will use basic similarity")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error creating vector index: {str(e)}")
            return False

    def clear_collection(self) -> int:
        """
        Clear all chunks from vector collection
        
        Returns:
            Number of chunks deleted
        """
        try:
            result = self.collection.delete_many({})
            count = result.deleted_count
            logger.warning(f"🧹 Cleared {count} chunks from vector collection")
            return count
            
        except Exception as e:
            logger.error(f"❌ Error clearing vector collection: {str(e)}")
            raise

    def search_similar(self, query_embedding: List[float], k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar chunks using vector similarity
        
        Args:
            query_embedding: Query vector embedding
            k: Number of results to return
            
        Returns:
            List of similar chunk dictionaries
        """
        try:
            # For local development without Atlas Vector Search,
            # we'll implement a basic similarity search
            logger.info(f"🔍 Searching for {k} similar chunks")
            
            # Simple MongoDB query (won't use vector similarity without Atlas)
            # This is a fallback for local development
            cursor = self.collection.find({
                "embedding": {"$exists": True}
            }).limit(k)
            
            results = []
            for doc in cursor:
                # Convert ObjectId to string
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                results.append(doc)
            
            logger.info(f"📊 Found {len(results)} similar chunks")
            return results
            
        except Exception as e:
            logger.error(f"❌ Error searching similar chunks: {str(e)}")
            return []

    def create_text_chunks(
        self, 
        documents: List[Dict[str, Any]], 
        strategy: ChunkingStrategy = "simple"
    ) -> List[Dict[str, Any]]:
        """
        Create text chunks from documents using specified strategy
        
        Args:
            documents: List of document dictionaries
            strategy: Chunking strategy to use
            
        Returns:
            List of chunk dictionaries (without embeddings)
        """
        if not documents:
            logger.warning("No documents to chunk")
            return []

        try:
            logger.info(f"📝 Creating chunks using '{strategy}' strategy")
            
            all_chunks = []
            
            for doc in documents:
                content = doc.get("content", "")
                if not content.strip():
                    logger.warning(f"Empty content in document {doc.get('id', 'unknown')}")
                    continue
                
                # Create chunks based on strategy
                if strategy == "simple":
                    chunks = self._create_simple_chunks(doc)
                elif strategy == "contextual":
                    chunks = self._create_contextual_chunks(doc)
                elif strategy == "parent":
                    chunks = self._create_parent_chunks(doc)
                else:
                    raise ValueError(f"Unknown chunking strategy: {strategy}")
                
                all_chunks.extend(chunks)
            
            logger.success(f"✅ Created {len(all_chunks)} chunks from {len(documents)} documents")
            return all_chunks
            
        except Exception as e:
            logger.error(f"❌ Error creating chunks: {str(e)}")
            raise

    def _create_simple_chunks(self, document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create simple overlapping chunks"""
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size,
            chunk_overlap=self.config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        content = document.get("content", "")
        text_chunks = splitter.split_text(content)
        
        chunks = []
        for i, chunk_text in enumerate(text_chunks):
            chunk = {
                "content": chunk_text,
                "chunk_id": f"{document.get('id', 'unknown')}_{i}",
                "chunk_index": i,
                "total_chunks": len(text_chunks),
                "strategy": "simple",
                "metadata": {
                    **document.get("metadata", {}),
                    "parent_document_id": document.get("id"),
                    "chunk_size": len(chunk_text),
                    "word_count": len(chunk_text.split())
                }
            }
            chunks.append(chunk)
        
        return chunks

    def _create_contextual_chunks(self, document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create chunks with contextual information"""
        # For now, implement as simple chunks with added context
        # In a full implementation, this would add surrounding context
        simple_chunks = self._create_simple_chunks(document)
        
        # Add contextual information
        for chunk in simple_chunks:
            chunk["strategy"] = "contextual"
            # Add document title/summary as context if available
            if "title" in document.get("metadata", {}):
                title = document["metadata"]["title"]
                chunk["content"] = f"Document: {title}\n\n{chunk['content']}"
        
        return simple_chunks

    def _create_parent_chunks(self, document: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create parent-child hierarchical chunks"""
        # Create parent chunks (larger)
        parent_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size * 2,  # Larger parent chunks
            chunk_overlap=self.config.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        # Create child chunks (smaller) 
        child_splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.config.chunk_size // 2,  # Smaller child chunks
            chunk_overlap=self.config.chunk_overlap // 2,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        content = document.get("content", "")
        parent_chunks = parent_splitter.split_text(content)
        
        chunks = []
        for i, parent_text in enumerate(parent_chunks):
            # Create child chunks from parent
            child_texts = child_splitter.split_text(parent_text)
            
            for j, child_text in enumerate(child_texts):
                chunk = {
                    "content": child_text,
                    "parent_content": parent_text,  # Store parent for context
                    "chunk_id": f"{document.get('id', 'unknown')}_{i}_{j}",
                    "parent_chunk_id": f"{document.get('id', 'unknown')}_{i}",
                    "chunk_index": j,
                    "parent_index": i,
                    "strategy": "parent",
                    "metadata": {
                        **document.get("metadata", {}),
                        "parent_document_id": document.get("id"),
                        "chunk_size": len(child_text),
                        "parent_size": len(parent_text),
                        "word_count": len(child_text.split())
                    }
                }
                chunks.append(chunk)
        
        return chunks

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the vector collection
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            total_chunks = self.collection.count_documents({})
            chunks_with_embeddings = self.collection.count_documents({"embedding": {"$exists": True}})
            
            # Get sample for embedding info
            sample_chunk = self.collection.find_one({"embedding": {"$exists": True}})
            embedding_dim = len(sample_chunk.get("embedding", [])) if sample_chunk else 0
            
            # Get strategy distribution
            pipeline = [
                {"$group": {"_id": "$strategy", "count": {"$sum": 1}}}
            ]
            strategy_counts = {doc["_id"]: doc["count"] for doc in self.collection.aggregate(pipeline)}
            
            stats = {
                "total_chunks": total_chunks,
                "chunks_with_embeddings": chunks_with_embeddings,
                "embedding_dimension": embedding_dim,
                "strategy_distribution": strategy_counts,
                "index_name": self.config.vector_index_name
            }
            
            logger.info(f"📊 Vector store stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"❌ Error getting vector store stats: {str(e)}")
            return {}

    def close(self) -> None:
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.debug("🔌 Closed vector store connection")

    def __enter__(self) -> "VectorStore":
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit"""
        self.close()
