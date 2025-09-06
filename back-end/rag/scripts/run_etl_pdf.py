#!/usr/bin/env python3
"""
Simple ETL Pipeline for PDF Processing
Replaces complex ZenML pipeline with straightforward Python script
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Any
from loguru import logger
import time

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

try:
    from rag_system.offline.pdf_processor import PDFProcessor
    from rag_system.offline.document_store import DocumentStore
    from rag_system.shared.config import load_config
except ImportError as e:
    logger.error(f"❌ Import error: {str(e)}")
    logger.info("💡 Make sure to run: uv pip install -e .")
    sys.exit(1)


def setup_logging():
    """Configure logging"""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>.<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )


def run_pdf_etl() -> Dict[str, Any]:
    """
    Run PDF ETL pipeline without ZenML complexity
    """
    setup_logging()
    logger.info("🚀 Starting PDF ETL Pipeline")
    
    start_time = time.time()
    results = {
        "processed_files": 0,
        "total_documents": 0,
        "errors": [],
        "execution_time": 0
    }
    
    try:
        # Load configuration
        config = load_config()
        
        # Ensure data directory exists
        if not config.data_dir.exists():
            config.data_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"📁 Created data directory: {config.data_dir}")
        
        logger.info(f"📁 Data directory: {config.data_dir}")
        
        # Initialize components
        pdf_processor = PDFProcessor(config)
        doc_store = DocumentStore(config)
        
        # Find PDF files
        pdf_files = list(Path(config.data_dir).glob("**/*.pdf"))
        logger.info(f"📄 Found {len(pdf_files)} PDF files")
        
        if not pdf_files:
            logger.warning("No PDF files found in data directory")
            return results
        
        # Process each PDF
        for pdf_file in pdf_files:
            try:
                logger.info(f"Processing: {pdf_file.name}")
                
                # Extract and process content
                documents = pdf_processor.process_pdf(pdf_file)
                
                # Store in MongoDB
                doc_store.store_documents(documents)
                
                results["processed_files"] += 1
                results["total_documents"] += len(documents)
                
                logger.success(f"✅ Processed {pdf_file.name} -> {len(documents)} documents")
                
            except Exception as e:
                error_msg = f"Error processing {pdf_file.name}: {str(e)}"
                logger.error(error_msg)
                results["errors"].append(error_msg)
        
        # Final results
        results["execution_time"] = time.time() - start_time
        
        logger.success(f"🎉 ETL Pipeline Complete!")
        logger.info(f"📊 Results:")
        logger.info(f"   - Files processed: {results['processed_files']}")
        logger.info(f"   - Documents created: {results['total_documents']}")
        logger.info(f"   - Errors: {len(results['errors'])}")
        logger.info(f"   - Execution time: {results['execution_time']:.2f}s")
        
        return results
        
    except Exception as e:
        logger.error(f"❌ Pipeline failed: {str(e)}")
        results["errors"].append(str(e))
        raise


if __name__ == "__main__":
    try:
        results = run_pdf_etl()
        exit_code = 0 if not results["errors"] else 1
        sys.exit(exit_code)
    except KeyboardInterrupt:
        logger.warning("Pipeline interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
