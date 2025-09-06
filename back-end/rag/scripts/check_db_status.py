#!/usr/bin/env python3
"""
Database Status Checker
Simple utility to check MongoDB status and collections
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any
from loguru import logger
import pymongo
from datetime import datetime

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

from rag_system.shared.config import load_config


def setup_logging():
    """Configure logging"""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>.<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )


def check_database_status() -> Dict[str, Any]:
    """
    Check MongoDB connection and collection status
    """
    setup_logging()
    logger.info("📊 Checking Database Status")
    
    status = {
        "connection": False,
        "database_exists": False,
        "collections": {},
        "indexes": {},
        "total_documents": 0,
        "errors": []
    }
    
    try:
        # Load config
        config = load_config()
        
        # Test MongoDB connection
        logger.info(f"🔌 Connecting to: {config.mongodb_uri}")
        client = pymongo.MongoClient(config.mongodb_uri)
        
        # Test connection
        client.admin.command('ping')
        status["connection"] = True
        logger.success("✅ MongoDB connection successful")
        
        # Check database
        db = client[config.mongodb_database_name]
        if config.mongodb_database_name in client.list_database_names():
            status["database_exists"] = True
            logger.success(f"✅ Database '{config.mongodb_database_name}' exists")
        else:
            logger.warning(f"⚠️  Database '{config.mongodb_database_name}' not found")
            return status
        
        # Check collections
        collection_names = [
            config.mongodb_raw_collection_name,
            config.mongodb_rag_collection_name
        ]
        
        for collection_name in collection_names:
            if collection_name in db.list_collection_names():
                collection = db[collection_name]
                doc_count = collection.count_documents({})
                
                status["collections"][collection_name] = {
                    "exists": True,
                    "document_count": doc_count,
                    "indexes": list(collection.list_indexes())
                }
                
                status["total_documents"] += doc_count
                logger.success(f"✅ Collection '{collection_name}': {doc_count} documents")
                
                # Show sample document
                if doc_count > 0:
                    sample = collection.find_one()
                    logger.info(f"   Sample fields: {list(sample.keys())}")
                
            else:
                status["collections"][collection_name] = {
                    "exists": False,
                    "document_count": 0,
                    "indexes": []
                }
                logger.warning(f"⚠️  Collection '{collection_name}' not found")
        
        # Check vector search index (if RAG collection exists)
        rag_collection_name = config.mongodb_rag_collection_name
        if status["collections"].get(rag_collection_name, {}).get("exists"):
            try:
                # Try to check for vector search capabilities
                rag_collection = db[rag_collection_name]
                
                # Check if documents have embeddings
                sample_with_embedding = rag_collection.find_one({"embedding": {"$exists": True}})
                if sample_with_embedding:
                    embedding_dim = len(sample_with_embedding.get("embedding", []))
                    logger.success(f"✅ Vector embeddings found (dimension: {embedding_dim})")
                else:
                    logger.warning("⚠️  No vector embeddings found in RAG collection")
                    
            except Exception as e:
                logger.warning(f"⚠️  Could not check vector capabilities: {str(e)}")
        
        # Print summary
        logger.info("\n📈 Database Summary:")
        logger.info(f"   - Connection: {'✅ Connected' if status['connection'] else '❌ Failed'}")
        logger.info(f"   - Database: {'✅ Exists' if status['database_exists'] else '❌ Missing'}")
        logger.info(f"   - Total Documents: {status['total_documents']}")
        
        for collection_name, info in status["collections"].items():
            exists = "✅" if info["exists"] else "❌"
            logger.info(f"   - {collection_name}: {exists} ({info['document_count']} docs)")
        
        return status
        
    except pymongo.errors.ConnectionFailure as e:
        error_msg = f"MongoDB connection failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        status["errors"].append(error_msg)
        
    except Exception as e:
        error_msg = f"Database check failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        status["errors"].append(error_msg)
    
    return status


def print_recommendations(status: Dict[str, Any]):
    """Print recommendations based on status"""
    logger.info("\n💡 Recommendations:")
    
    if not status["connection"]:
        logger.info("   1. Start MongoDB: make infra-up")
        logger.info("   2. Check .env configuration")
        
    elif not status["database_exists"]:
        logger.info("   1. Run ETL pipeline: make etl-pdf or make etl-precomputed")
        
    elif status["total_documents"] == 0:
        logger.info("   1. Run ETL pipeline to populate database")
        
    elif not any(info["exists"] for info in status["collections"].values()):
        logger.info("   1. Run ETL pipeline: make etl-pdf")
        logger.info("   2. Build RAG index: make rag-ingest")
        
    else:
        logger.info("   ✅ Database looks healthy!")
        logger.info("   You can run: make run-agent or make run-ui")


if __name__ == "__main__":
    try:
        status = check_database_status()
        print_recommendations(status)
        
        exit_code = 0 if status["connection"] else 1
        sys.exit(exit_code)
        
    except KeyboardInterrupt:
        logger.warning("Database check interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
