"""
Document Storage Service for RAG System
Handles MongoDB operations for storing and retrieving documents
"""

from typing import List, Dict, Any, Optional
from bson import ObjectId
from loguru import logger
from pymongo import MongoClient, errors
from pymongo.collection import Collection
from pymongo.database import Database

from rag_system.shared.config import RagSystemConfig


class DocumentStore:
    """
    Service for storing and retrieving documents in MongoDB
    Handles both raw PDF documents and processed RAG chunks
    """

    def __init__(self, config: RagSystemConfig):
        """
        Initialize DocumentStore with configuration
        
        Args:
            config: RagSystemConfig instance with MongoDB settings
        """
        self.config = config
        self.client: Optional[MongoClient] = None
        self.database: Optional[Database] = None
        self.raw_collection: Optional[Collection] = None
        self.rag_collection: Optional[Collection] = None
        
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
            
            # Setup database and collections
            self.database = self.client[self.config.mongodb_database_name]
            self.raw_collection = self.database[self.config.mongodb_raw_collection_name]
            self.rag_collection = self.database[self.config.mongodb_rag_collection_name]
            
            logger.success(
                f"✅ Connected to MongoDB: {self.config.mongodb_database_name}"
            )
            
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
            raise

    def store_documents(self, documents: List[Dict[str, Any]]) -> int:
        """
        Store raw documents from PDF processing
        
        Args:
            documents: List of document dictionaries
            
        Returns:
            Number of documents stored
        """
        if not documents:
            logger.warning("No documents to store")
            return 0

        try:
            # Clean documents (remove MongoDB _id if present)
            clean_documents = []
            for doc in documents:
                clean_doc = doc.copy()
                clean_doc.pop("_id", None)
                clean_documents.append(clean_doc)

            # Insert into raw collection
            result = self.raw_collection.insert_many(clean_documents)
            
            count = len(result.inserted_ids)
            logger.success(f"✅ Stored {count} documents in raw collection")
            
            return count
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error storing documents: {str(e)}")
            raise

    def store_rag_chunks(self, chunks: List[Dict[str, Any]]) -> int:
        """
        Store processed RAG chunks with embeddings
        
        Args:
            chunks: List of chunk dictionaries with embeddings
            
        Returns:
            Number of chunks stored
        """
        if not chunks:
            logger.warning("No chunks to store")
            return 0

        try:
            # Clean chunks
            clean_chunks = []
            for chunk in chunks:
                clean_chunk = chunk.copy()
                clean_chunk.pop("_id", None)
                clean_chunks.append(clean_chunk)

            # Insert into RAG collection
            result = self.rag_collection.insert_many(clean_chunks)
            
            count = len(result.inserted_ids)
            logger.success(f"✅ Stored {count} chunks in RAG collection")
            
            return count
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error storing RAG chunks: {str(e)}")
            raise

    def get_all_documents(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieve all documents from raw collection
        
        Args:
            limit: Maximum number of documents to retrieve
            
        Returns:
            List of document dictionaries
        """
        try:
            query = {}
            cursor = self.raw_collection.find(query)
            
            if limit:
                cursor = cursor.limit(limit)
            
            documents = list(cursor)
            
            # Convert ObjectId to string
            for doc in documents:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
            
            logger.info(f"📚 Retrieved {len(documents)} documents from raw collection")
            return documents
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error retrieving documents: {str(e)}")
            raise

    def get_rag_chunks(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Retrieve all chunks from RAG collection
        
        Args:
            limit: Maximum number of chunks to retrieve
            
        Returns:
            List of chunk dictionaries
        """
        try:
            query = {}
            cursor = self.rag_collection.find(query)
            
            if limit:
                cursor = cursor.limit(limit)
            
            chunks = list(cursor)
            
            # Convert ObjectId to string
            for chunk in chunks:
                if "_id" in chunk:
                    chunk["_id"] = str(chunk["_id"])
            
            logger.info(f"🔍 Retrieved {len(chunks)} chunks from RAG collection")
            return chunks
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error retrieving chunks: {str(e)}")
            raise

    def clear_raw_collection(self) -> int:
        """
        Clear all documents from raw collection
        
        Returns:
            Number of documents deleted
        """
        try:
            result = self.raw_collection.delete_many({})
            count = result.deleted_count
            logger.warning(f"🧹 Cleared {count} documents from raw collection")
            return count
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error clearing raw collection: {str(e)}")
            raise

    def clear_rag_collection(self) -> int:
        """
        Clear all chunks from RAG collection
        
        Returns:
            Number of chunks deleted
        """
        try:
            result = self.rag_collection.delete_many({})
            count = result.deleted_count
            logger.warning(f"🧹 Cleared {count} chunks from RAG collection")
            return count
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error clearing RAG collection: {str(e)}")
            raise

    def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about collections
        
        Returns:
            Dictionary with collection statistics
        """
        try:
            raw_count = self.raw_collection.count_documents({})
            rag_count = self.rag_collection.count_documents({})
            
            # Check if RAG collection has embeddings
            sample_rag = self.rag_collection.find_one({"embedding": {"$exists": True}})
            has_embeddings = sample_rag is not None
            
            stats = {
                "raw_documents": raw_count,
                "rag_chunks": rag_count,
                "has_embeddings": has_embeddings,
                "embedding_dimension": len(sample_rag.get("embedding", [])) if sample_rag else 0
            }
            
            logger.info(f"📊 Collection stats: {stats}")
            return stats
            
        except errors.PyMongoError as e:
            logger.error(f"❌ Error getting collection stats: {str(e)}")
            raise

    def close(self) -> None:
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.debug("🔌 Closed MongoDB connection")

    def __enter__(self) -> "DocumentStore":
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit"""
        self.close()
