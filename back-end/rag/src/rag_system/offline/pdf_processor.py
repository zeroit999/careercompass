"""
PDF Processing Service for RAG System
Handles PDF document reading, text extraction, and structure enhancement
"""

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import time

import google.generativeai as genai
import pdfplumber
from loguru import logger

from rag_system.shared.config import RagSystemConfig


class PDFProcessor:
    """
    Service for processing PDF documents into structured text
    Supports both basic text extraction and Gemini-enhanced structure preservation
    """

    def __init__(self, config: RagSystemConfig, use_gemini: bool = True):
        """
        Initialize PDFProcessor
        
        Args:
            config: RagSystemConfig instance
            use_gemini: Whether to use Gemini for structure enhancement
        """
        self.config = config
        self.use_gemini = use_gemini
        self.gemini_model = None
        
        if self.use_gemini:
            self._initialize_gemini()

    def _initialize_gemini(self) -> None:
        """Initialize Gemini model for structure enhancement"""
        try:
            if not self.config.gemini_api_key:
                logger.warning("⚠️  Gemini API key not provided, falling back to basic extraction")
                self.use_gemini = False
                return

            genai.configure(api_key=self.config.gemini_api_key)
            self.gemini_model = genai.GenerativeModel(self.config.gemini_model_name)
            
            logger.success(f"✅ Gemini configured: {self.config.gemini_model_name}")
            
        except Exception as e:
            logger.warning(f"⚠️  Failed to initialize Gemini: {str(e)}, using basic extraction")
            self.use_gemini = False
            self.gemini_model = None

    def process_pdf(self, pdf_file: Path) -> List[Dict[str, Any]]:
        """
        Process a single PDF file into document dictionaries
        
        Args:
            pdf_file: Path to PDF file
            
        Returns:
            List of document dictionaries (usually one per PDF)
        """
        if not pdf_file.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_file}")

        try:
            logger.info(f"📄 Processing PDF: {pdf_file.name}")
            
            # Extract text from PDF
            raw_text = self._extract_text_from_pdf(pdf_file)
            
            if not raw_text.strip():
                logger.warning(f"⚠️  No text extracted from {pdf_file.name}")
                return []

            # Enhance structure with Gemini if available
            if self.use_gemini and self.gemini_model:
                structured_text = self._enhance_structure_with_gemini(raw_text)
            else:
                structured_text = raw_text

            # Create document dictionary
            document = self._create_document_dict(pdf_file, structured_text)
            
            logger.success(f"✅ Processed {pdf_file.name}: {len(structured_text)} characters")
            return [document]
            
        except Exception as e:
            logger.error(f"❌ Error processing {pdf_file.name}: {str(e)}")
            raise

    def process_pdf_directory(self, directory: Path, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Process all PDF files in a directory
        
        Args:
            directory: Directory containing PDF files
            limit: Maximum number of files to process
            
        Returns:
            List of document dictionaries
        """
        if not directory.exists():
            raise FileNotFoundError(f"Directory not found: {directory}")

        # Find PDF files
        pdf_files = list(directory.glob("*.pdf"))
        
        if limit:
            pdf_files = pdf_files[:limit]
            logger.info(f"🔢 Processing first {len(pdf_files)} PDF files (limit: {limit})")
        
        if not pdf_files:
            logger.warning(f"⚠️  No PDF files found in {directory}")
            return []

        logger.info(f"📁 Found {len(pdf_files)} PDF files to process")

        documents = []
        processed_count = 0
        error_count = 0

        for pdf_file in pdf_files:
            try:
                file_documents = self.process_pdf(pdf_file)
                documents.extend(file_documents)
                processed_count += 1
                
            except Exception as e:
                logger.error(f"❌ Failed to process {pdf_file.name}: {str(e)}")
                error_count += 1
                continue

        logger.success(f"🎉 Processed {processed_count} PDFs successfully, {error_count} errors")
        return documents

    def _extract_text_from_pdf(self, pdf_file: Path) -> str:
        """
        Extract text from PDF using pdfplumber
        
        Args:
            pdf_file: Path to PDF file
            
        Returns:
            Extracted text content
        """
        text_content = []
        
        try:
            with pdfplumber.open(pdf_file) as pdf:
                total_pages = len(pdf.pages)
                logger.debug(f"📖 Extracting text from {total_pages} pages")
                
                for page_num, page in enumerate(pdf.pages, 1):
                    page_text = page.extract_text()
                    
                    if page_text and page_text.strip():
                        # Add page separator for multi-page documents
                        if page_num > 1:
                            text_content.append(f"\n\n--- Page {page_num} ---\n")
                        text_content.append(page_text)
                
            extracted_text = "\n".join(text_content)
            logger.debug(f"📝 Extracted {len(extracted_text)} characters from PDF")
            
            return extracted_text
            
        except Exception as e:
            logger.error(f"❌ Error extracting text from {pdf_file}: {str(e)}")
            raise

#     def _enhance_structure_with_gemini(self, text_content: str) -> str:
#         """
#         Use Gemini to enhance document structure preservation
        
#         Args:
#             text_content: Raw text from PDF
            
#         Returns:
#             Enhanced text with better structure
#         """
#         if not self.gemini_model:
#             return text_content

#         # Truncate very long content to avoid API limits
#         max_length = 30000  # Conservative limit for Gemini
#         if len(text_content) > max_length:
#             logger.warning(f"⚠️  Text too long ({len(text_content)} chars), truncating to {max_length}")
#             text_content = text_content[:max_length] + "\n\n[Content truncated due to length...]"

#         prompt = f"""
# Please clean and structure the following text extracted from a PDF document. 
# Preserve and enhance the document structure by:

# 1. Identifying and properly formatting headers and subheaders
# 2. Maintaining paragraph structure  
# 3. Preserving lists and numbered items
# 4. Fixing any OCR errors or formatting issues
# 5. Adding appropriate line breaks and spacing
# 6. Keeping all the original content but making it more readable

# Original text:
# ---
# {text_content}
# ---

# Please return the cleaned and structured version:
# """

#         try:
#             logger.debug("🤖 Enhancing structure with Gemini...")
#             start_time = time.time()
            
#             response = self.gemini_model.generate_content(prompt)
#             enhanced_text = response.text
            
#             elapsed = time.time() - start_time
#             logger.success(f"✅ Gemini enhancement completed in {elapsed:.2f}s")
            
#             return enhanced_text
            
#         except Exception as e:
#             logger.warning(f"⚠️  Gemini structure enhancement failed: {str(e)}")
#             logger.info("Using original text as fallback")
#             return text_content
    def _enhance_structure_with_gemini(self, text_content: str) -> str:
        """Enhanced version with chunked processing"""
        
        if not self.gemini_model:
            return text_content
        
        # Check if chunking is needed
        if len(text_content) <= self.config.gemini_max_chunk_size:
            # Process normally for small docs
            return self._process_single_chunk(text_content)
        
        # Use chunked processing for large docs
        if self.config.gemini_enable_chunking:
            logger.info(f"📄 Large document ({len(text_content)} chars), using chunked processing")
            return self._process_with_chunks(text_content)
        else:
            # Fallback to truncation if chunking disabled
            logger.warning(f"⚠️  Text too long, truncating (chunking disabled)")
            return self._process_single_chunk(text_content[:self.config.gemini_max_chunk_size])
        
    def _process_with_chunks(self, text_content: str) -> str:
        """Process large text using overlapping chunks"""
    
        # Split into chunks with overlap
        chunks = self._create_overlapping_chunks(text_content)
        logger.info(f"📝 Split into {len(chunks)} chunks for processing")
        
        processed_chunks = []
        
        for i, chunk in enumerate(chunks, 1):
            try:
                logger.debug(f"🔢 Processing chunk {i}/{len(chunks)} ({len(chunk)} chars)")
                
                # Process chunk with Gemini
                enhanced_chunk = self._process_single_chunk(chunk, chunk_index=i)
                processed_chunks.append(enhanced_chunk)
                
                # Small delay between API calls to respect rate limits
                if i < len(chunks):
                    time.sleep(0.5)
                    
            except Exception as e:
                logger.warning(f"⚠️  Failed to process chunk {i}: {str(e)}")
                # Use original chunk as fallback
                processed_chunks.append(chunk)
        
        # Merge processed chunks
        merged_result = self._merge_processed_chunks(processed_chunks)
        
        logger.success(f"✅ Completed chunked processing: {len(merged_result)} chars")
        return merged_result

    def _create_overlapping_chunks(self, text: str) -> List[str]:
        """Create overlapping text chunks for processing"""
        
        chunk_size = self.config.gemini_max_chunk_size
        overlap = self.config.gemini_chunk_overlap
        
        chunks = []
        start = 0
        
        while start < len(text):
            # Define chunk end
            end = start + chunk_size
            
            if start > 0:
                # For non-first chunks, start a bit earlier for overlap
                actual_start = max(0, start - overlap)
            else:
                actual_start = start
            
            # Extract chunk
            if end >= len(text):
                # Last chunk
                chunk = text[actual_start:]
            else:
                # Find good break point (paragraph, sentence, or space)
                chunk_text = text[actual_start:end]
                
                # Try to break at paragraph
                last_paragraph = chunk_text.rfind('\n\n')
                if last_paragraph > len(chunk_text) * 0.7:  # If break point is not too early
                    chunk = text[actual_start:actual_start + last_paragraph]
                    start = actual_start + last_paragraph + 2
                else:
                    # Try to break at sentence
                    last_period = chunk_text.rfind('. ')
                    if last_period > len(chunk_text) * 0.8:
                        chunk = text[actual_start:actual_start + last_period + 1]
                        start = actual_start + last_period + 2
                    else:
                        # Break at space
                        last_space = chunk_text.rfind(' ')
                        if last_space > len(chunk_text) * 0.9:
                            chunk = text[actual_start:actual_start + last_space]
                            start = actual_start + last_space + 1
                        else:
                            # Hard break if no good point found
                            chunk = chunk_text
                            start = end
            
            if chunk.strip():  # Only add non-empty chunks
                chunks.append(chunk.strip())
            
            # Break if we've reached the end
            if end >= len(text):
                break
        
        return chunks

    def _process_single_chunk(self, chunk: str, chunk_index: int = None) -> str:
        """Process a single chunk with Gemini"""
        
        chunk_info = f" (chunk {chunk_index})" if chunk_index else ""
        
        prompt = f"""
    Please clean and structure the following text extracted from a PDF document{chunk_info}.
    Preserve and enhance the document structure by:

    1. Identifying and properly formatting headers and subheaders
    2. Maintaining paragraph structure  
    3. Preserving lists and numbered items
    4. Fixing any OCR errors or formatting issues
    5. Adding appropriate line breaks and spacing
    6. Keeping all the original content but making it more readable

    {"Note: This is part of a larger document. Focus on making this section coherent while preserving connection points for merging." if chunk_index else ""}

    Original text:
    ---
    {chunk}
    ---

    Please return the cleaned and structured version:
    """

        try:
            start_time = time.time()
            response = self.gemini_model.generate_content(prompt)
            enhanced_text = response.text
            
            elapsed = time.time() - start_time
            logger.debug(f"✅ Gemini processing{chunk_info} completed in {elapsed:.2f}s")
            
            return enhanced_text
            
        except Exception as e:
            logger.warning(f"⚠️  Gemini processing{chunk_info} failed: {str(e)}")
            return chunk

    def _merge_processed_chunks(self, chunks: List[str]) -> str:
        """Intelligently merge processed chunks"""
        
        if not chunks:
            return ""
        
        if len(chunks) == 1:
            return chunks[0]
        
        # Simple merge with section separators
        merged_parts = []
        
        for i, chunk in enumerate(chunks):
            # Clean up chunk
            clean_chunk = chunk.strip()
            
            if i == 0:
                # First chunk - use as is
                merged_parts.append(clean_chunk)
            else:
                # Subsequent chunks - add separator and remove potential overlap
                # Try to detect and remove repeated content from overlap
                clean_chunk = self._remove_overlap_content(merged_parts[-1], clean_chunk)
                
                if clean_chunk.strip():  # Only add if there's content left
                    merged_parts.append("\n\n" + clean_chunk)
        
        result = "".join(merged_parts)
        
        # Final cleanup
        result = result.replace("\n\n\n\n", "\n\n")  # Remove excessive line breaks
        result = result.strip()
        
        return result

    def _remove_overlap_content(self, previous_chunk: str, current_chunk: str) -> str:
        """Remove overlapping content between chunks"""
        
        # Simple overlap detection - look for common endings/beginnings
        prev_words = previous_chunk.split()
        curr_words = current_chunk.split()
        
        if len(prev_words) < 10 or len(curr_words) < 10:
            return current_chunk
        
        # Check for overlap in last/first 50 words
        overlap_size = min(50, len(prev_words), len(curr_words))
        
        for i in range(overlap_size, 5, -1):  # Start from larger overlap
            prev_end = " ".join(prev_words[-i:])
            curr_start = " ".join(curr_words[:i])
            
            # If we find a match, remove the overlap from current chunk
            if prev_end.lower() == curr_start.lower():
                remaining_words = curr_words[i:]
                return " ".join(remaining_words)
        
        return current_chunk
    def _create_document_dict(self, pdf_file: Path, content: str) -> Dict[str, Any]:
        """
        Create a document dictionary from PDF file and content
        
        Args:
            pdf_file: Path to PDF file
            content: Processed text content
            
        Returns:
            Document dictionary ready for storage
        """
        import uuid
        from datetime import datetime
        
        # Generate unique ID
        doc_id = str(uuid.uuid4().hex)
        
        # Get file stats
        file_stats = pdf_file.stat()
        
        document = {
            "id": doc_id,
            "content": content,
            "metadata": {
                "source": str(pdf_file.absolute()),
                "title": pdf_file.stem,
                "file_name": pdf_file.name,
                "file_size": file_stats.st_size,
                "file_type": "pdf",
                "source_type": "local_pdf",
                "created_at": datetime.now().isoformat(),
                "processed_with_gemini": self.use_gemini and self.gemini_model is not None,
                "character_count": len(content),
                "word_count": len(content.split()) if content else 0,
            }
        }
        
        return document

    def get_processing_stats(self) -> Dict[str, Any]:
        """
        Get information about the PDF processing configuration
        
        Returns:
            Dictionary with processing stats
        """
        return {
            "use_gemini": self.use_gemini,
            "gemini_model": self.config.gemini_model_name if self.use_gemini else None,
            "gemini_available": self.gemini_model is not None,
            "config_gemini_key_set": bool(self.config.gemini_api_key),
        }

    def test_processing(self, test_text: str = "This is a test document for PDF processing.") -> Dict[str, Any]:
        """
        Test the PDF processing capabilities
        
        Args:
            test_text: Sample text to test with
            
        Returns:
            Dictionary with test results
        """
        try:
            logger.info("🧪 Testing PDF processing capabilities...")
            
            # Test Gemini enhancement if available
            if self.use_gemini and self.gemini_model:
                start_time = time.time()
                enhanced = self._enhance_structure_with_gemini(test_text)
                elapsed = time.time() - start_time
                
                result = {
                    "success": True,
                    "gemini_available": True,
                    "original_length": len(test_text),
                    "enhanced_length": len(enhanced),
                    "processing_time": elapsed,
                    "enhancement_ratio": len(enhanced) / len(test_text) if test_text else 0
                }
            else:
                result = {
                    "success": True,
                    "gemini_available": False,
                    "message": "Basic text extraction only"
                }
            
            logger.success("✅ PDF processing test completed")
            return result
            
        except Exception as e:
            logger.error(f"❌ PDF processing test failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
