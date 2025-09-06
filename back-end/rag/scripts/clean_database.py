#!/usr/bin/env python3
"""
Database Cleanup Utility
Clean all collections in the RAG system database
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any
from loguru import logger
import pymongo

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


def clean_database(confirm: bool = False) -> Dict[str, Any]:
    """
    Clean all collections in the database
    
    Args:
        confirm: If True, skip confirmation prompt
        
    Returns:
        Dict with cleanup results
    """
    setup_logging()
    logger.warning("🧹 Database Cleanup Utility")
    
    results = {
        "collections_cleaned": [],
        "documents_removed": 0,
        "success": True,
        "errors": []
    }
    
    try:
        # Load configuration
        config = load_config()
        
        # Get confirmation unless auto-confirmed
        if not confirm:
            logger.warning("⚠️  This will DELETE ALL documents from the database!")
            logger.info(f"Database: {config.mongodb_database_name}")
            logger.info(f"Collections: {config.mongodb_raw_collection_name}, {config.mongodb_rag_collection_name}")
            
            response = input("\nAre you sure? Type 'yes' to continue: ")
            if response.lower() != 'yes':
                logger.info("❌ Cleanup cancelled by user")
                results["success"] = False
                return results
        
        # Connect to MongoDB
        logger.info(f"🔌 Connecting to MongoDB: {config.mongodb_uri}")
        client = pymongo.MongoClient(config.mongodb_uri)
        db = client[config.mongodb_database_name]
        
        # Collections to clean
        collections_to_clean = [
            config.mongodb_raw_collection_name,
            config.mongodb_rag_collection_name
        ]
        
        # Clean each collection
        for collection_name in collections_to_clean:
            if collection_name in db.list_collection_names():
                collection = db[collection_name]
                
                # Count documents before deletion
                doc_count = collection.count_documents({})
                
                if doc_count > 0:
                    # Delete all documents
                    delete_result = collection.delete_many({})
                    
                    logger.success(f"✅ Cleaned '{collection_name}': {delete_result.deleted_count} documents removed")
                    results["collections_cleaned"].append(collection_name)
                    results["documents_removed"] += delete_result.deleted_count
                else:
                    logger.info(f"📋 Collection '{collection_name}' was already empty")
                    results["collections_cleaned"].append(collection_name)
            else:
                logger.warning(f"⚠️  Collection '{collection_name}' not found")
        
        # Summary
        logger.success(f"🎉 Database cleanup complete!")
        logger.info(f"📊 Summary:")
        logger.info(f"   - Collections cleaned: {len(results['collections_cleaned'])}")
        logger.info(f"   - Documents removed: {results['documents_removed']}")
        
        return results
        
    except pymongo.errors.ConnectionFailure as e:
        error_msg = f"MongoDB connection failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        results["errors"].append(error_msg)
        results["success"] = False
        
    except Exception as e:
        error_msg = f"Database cleanup failed: {str(e)}"
        logger.error(f"❌ {error_msg}")
        results["errors"].append(error_msg)
        results["success"] = False
    
    return results


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Clean RAG system database")
    parser.add_argument(
        "--yes", 
        action="store_true",
        help="Skip confirmation prompt"
    )
    
    args = parser.parse_args()
    
    try:
        results = clean_database(confirm=args.yes)
        exit_code = 0 if results["success"] else 1
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.warning("Database cleanup interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
