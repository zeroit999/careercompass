"""
Enhanced Career Counseling Agent for RAG System
Uses semantic similarity instead of keyword matching
"""

from typing import List, Dict, Any, Optional
from loguru import logger
import time
import numpy as np

from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage, SystemMessage

from rag_system.shared.config import RagSystemConfig
from rag_system.offline.document_store import DocumentStore
from rag_system.offline.embeddings import EmbeddingGenerator
from rag_system.offline.vector_store import VectorStore


class CareerCounselingAgent:
    """
    Enhanced Career Counseling Agent using semantic similarity
    instead of keyword-based domain detection
    """

    def __init__(self, config: RagSystemConfig):
        """
        Initialize Enhanced Career Counseling Agent
        
        Args:
            config: RagSystemConfig instance
        """
        self.config = config
        self.llm = None
        self.document_store = None
        self.embedding_generator = None
        self.vector_store = None
        
        # Thresholds for semantic filtering
        self.relevance_threshold = 0.6  # Minimum similarity score for relevance
        self.high_confidence_threshold = 0.8  # High confidence threshold
        
        self._initialize_components()
        self._setup_prompt_templates()
        self._initialize_domain_references()

    def _initialize_components(self) -> None:
        """Initialize RAG components"""
        try:
            # Initialize LLM
            self.llm = ChatOpenAI(
                model=self.config.openai_model_name,
                temperature=self.config.temperature,
                openai_api_key=self.config.openai_api_key
            )
            
            # Initialize RAG components
            self.document_store = DocumentStore(self.config)
            self.embedding_generator = EmbeddingGenerator(self.config)
            self.vector_store = VectorStore(self.config)
            
            logger.success("✅ Enhanced career counseling agent initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize enhanced career agent: {str(e)}")
            raise

    def _setup_prompt_templates(self) -> None:
        """Setup custom prompt templates"""
        self.system_prompt = """Bạn là một trợ lý AI chuyên về tư vấn hướng nghiệp cho học sinh, sinh viên hoặc người đang tìm kiếm định hướng nghề nghiệp.

Nhiệm vụ của bạn:
1. Đưa ra lời khuyên chuyên nghiệp về hướng nghiệp dựa trên ngữ cảnh được cung cấp
2. Trả lời một cách rõ ràng, chuyên nghiệp và mang tính định hướng
3. Nếu ngữ cảnh không đủ thông tin liên quan, hãy đưa ra lời khuyên chung nhưng vẫn hữu ích
4. Luôn giữ thái độ tích cực và hỗ trợ người dùng"""

        self.answer_template = """Dưới đây là ngữ cảnh tài liệu liên quan (độ liên quan: {confidence_level}):

{context}

Câu hỏi từ người dùng: {question}

Dựa trên ngữ cảnh trên, hãy trả lời một cách rõ ràng, chuyên nghiệp và mang tính định hướng:"""

        self.insufficient_context_template = """Câu hỏi từ người dùng: {question}

Tôi không tìm thấy thông tin cụ thể liên quan đến câu hỏi này trong cơ sở dữ liệu hiện tại. 
Tuy nhiên, với tư cách là trợ lý tư vấn nghề nghiệp, tôi có thể đưa ra một số lời khuyên chung và hướng dẫn bạn tìm hiểu thêm:"""

        self.off_topic_check_template = """Hãy đánh giá xem câu hỏi sau có liên quan đến nghề nghiệp, học tập, hoặc định hướng tương lai không:

Câu hỏi: "{question}"

Trả lời chỉ "CÓ" hoặc "KHÔNG" và giải thích ngắn gọn."""

    def _initialize_domain_references(self) -> None:
        """Initialize domain reference questions for semantic comparison"""
        self.career_reference_questions = [
            "Nên học ngành gì để có tương lai tốt?",
            "Làm thế nào để chọn nghề phù hợp?",
            "Ngành công nghệ thông tin có triển vọng không?",
            "Mức lương của nghề marketing như thế nào?",
            "Tôi nên học đại học hay học nghề?",
            "Kỹ năng nào cần thiết để xin việc?",
            "Làm sao để viết CV ấn tượng?",
            "Cách chuẩn bị cho buổi phỏng vấn xin việc?",
            "Nghề nào phù hợp với người hướng nội?",
            "Học bằng cấp 2 có thể làm nghề gì?",
        ]
        
        # Pre-compute embeddings for reference questions
        try:
            self.reference_embeddings = []
            for question in self.career_reference_questions:
                embedding = self.embedding_generator.generate_single(question)
                self.reference_embeddings.append(embedding)
            logger.info(f"✅ Computed {len(self.reference_embeddings)} reference embeddings")
        except Exception as e:
            logger.warning(f"⚠️ Failed to compute reference embeddings: {str(e)}")
            self.reference_embeddings = []

    def is_greeting(self, question: str) -> bool:
        """Check if the question is a greeting"""
        greetings = [
            "xin chào", "chào", "hello", "hi", "hey",
            "chào bạn", "bạn khỏe không", "chúc buổi sáng",
            "chúc buổi chiều", "chúc buổi tối", "chào buổi"
        ]
        
        question_lower = question.lower().strip()
        return any(greeting in question_lower for greeting in greetings)

    def compute_semantic_relevance(self, question: str) -> float:
        """
        Compute semantic relevance to career domain using reference questions
        
        Args:
            question: User's question
            
        Returns:
            float: Relevance score (0-1)
        """
        if not self.reference_embeddings:
            logger.warning("⚠️ No reference embeddings available, using fallback")
            return 0.5  # Neutral score if no references
        
        try:
            # Generate embedding for user question
            question_embedding = self.embedding_generator.generate_single(question)
            
            # Compute similarity with reference questions
            similarities = []
            for ref_embedding in self.reference_embeddings:
                # Cosine similarity
                similarity = np.dot(question_embedding, ref_embedding) / (
                    np.linalg.norm(question_embedding) * np.linalg.norm(ref_embedding)
                )
                similarities.append(similarity)
            
            # Return maximum similarity
            max_similarity = max(similarities)
            logger.info(f"🎯 Semantic relevance score: {max_similarity:.3f}")
            return max_similarity
            
        except Exception as e:
            logger.warning(f"⚠️ Semantic relevance computation failed: {str(e)}")
            return 0.5

    def retrieve_context_with_confidence(self, question: str, max_results: int = 5) -> tuple[List[Dict[str, Any]], float]:
        """
        Retrieve relevant context and compute confidence score
        
        Returns:
            tuple: (documents, max_confidence_score)
        """
        try:
            # Generate embedding for question
            question_embedding = self.embedding_generator.generate_single(question)
            
            # Search for similar documents
            similar_docs = self.vector_store.search_similar(
                query_embedding=question_embedding,
                k=max_results
            )
            
            # Compute confidence from similarity scores
            if similar_docs:
                scores = [doc.get('similarity_score', 0) for doc in similar_docs]
                max_confidence = max(scores) if scores else 0
            else:
                max_confidence = 0
            
            logger.info(f"🔍 Retrieved {len(similar_docs)} docs, max confidence: {max_confidence:.3f}")
            return similar_docs, max_confidence
            
        except Exception as e:
            logger.warning(f"⚠️ Context retrieval failed: {str(e)}")
            return [], 0.0

    def format_context(self, documents: List[Dict[str, Any]], confidence: float) -> str:
        """Format retrieved documents into context string"""
        if not documents:
            return "Không tìm thấy tài liệu liên quan trong cơ sở dữ liệu."
        
        context_parts = []
        for i, doc in enumerate(documents, 1):
            content = doc.get("content", "")
            score = doc.get("similarity_score", 0)
            
            # Limit content length
            if len(content) > 500:
                content = content[:500] + "..."
            
            source = doc.get("metadata", {}).get("title", f"Tài liệu {i}")
            context_parts.append(f"[{source}] (độ liên quan: {score:.2f})\n{content}")
        
        return "\n\n".join(context_parts)

    def get_confidence_level_text(self, confidence: float) -> str:
        """Convert confidence score to descriptive text"""
        if confidence >= self.high_confidence_threshold:
            return "cao"
        elif confidence >= self.relevance_threshold:
            return "trung bình"
        else:
            return "thấp"

    def generate_response(self, question: str, context: str, confidence: float) -> str:
        """Generate response using LLM with context and confidence"""
        try:
            confidence_level = self.get_confidence_level_text(confidence)
            
            if confidence >= self.relevance_threshold:
                # Use context-based template
                formatted_prompt = self.answer_template.format(
                    context=context,
                    question=question,
                    confidence_level=confidence_level
                )
            else:
                # Use insufficient context template
                formatted_prompt = self.insufficient_context_template.format(
                    question=question
                )
            
            messages = [
                SystemMessage(content=self.system_prompt),
                HumanMessage(content=formatted_prompt)
            ]
            
            # Generate response
            start_time = time.time()
            response = self.llm.invoke(messages)
            elapsed = time.time() - start_time
            
            logger.success(f"✅ Generated response in {elapsed:.2f}s")
            return response.content
            
        except Exception as e:
            logger.error(f"❌ Response generation failed: {str(e)}")
            return "Xin lỗi, tôi gặp lỗi kỹ thuật. Vui lòng thử lại sau."

    def check_topic_relevance_with_llm(self, question: str) -> bool:
        """
        Use LLM to check if question is career-related (fallback method)
        """
        try:
            formatted_prompt = self.off_topic_check_template.format(question=question)
            
            messages = [
                SystemMessage(content="Bạn là chuyên gia phân loại câu hỏi."),
                HumanMessage(content=formatted_prompt)
            ]
            
            response = self.llm.invoke(messages)
            response_text = response.content.strip().upper()
            
            is_relevant = "CÓ" in response_text
            logger.info(f"🤖 LLM topic check: {is_relevant}")
            return is_relevant
            
        except Exception as e:
            logger.warning(f"⚠️ LLM topic check failed: {str(e)}")
            return True  # Default to allowing the question

    def handle_greeting(self, question: str) -> str:
        """Handle greeting messages"""
        greetings_responses = [
            "Xin chào! Tôi là trợ lý tư vấn hướng nghiệp. Tôi có thể giúp bạn với các câu hỏi về nghề nghiệp, học tập và định hướng tương lai. Bạn có câu hỏi gì không?",
            "Chào bạn! Rất vui được hỗ trợ bạn về vấn đề hướng nghiệp. Bạn đang quan tâm đến lĩnh vực nào?",
            "Hello! Tôi chuyên tư vấn về nghề nghiệp và định hướng học tập. Bạn cần tư vấn về vấn đề gì?"
        ]
        
        if "buổi sáng" in question.lower():
            return "Chào buổi sáng! " + greetings_responses[0]
        elif "buổi chiều" in question.lower():
            return "Chào buổi chiều! " + greetings_responses[1]
        elif "buổi tối" in question.lower():
            return "Chào buổi tối! " + greetings_responses[2]
        else:
            return greetings_responses[0]

    def answer_question(self, question: str) -> Dict[str, Any]:
        """
        Main method to answer career counseling questions using semantic approach
        
        Args:
            question: User's question
            
        Returns:
            Dict with response and metadata
        """
        start_time = time.time()
        
        # Trim and clean question
        question = question.strip()
        if not question:
            return {
                "response": "Bạn chưa đặt câu hỏi. Hãy hỏi tôi về các vấn đề liên quan đến nghề nghiệp nhé!",
                "type": "empty_question",
                "processing_time": 0
            }
        
        logger.info(f"🤖 Processing question: {question[:100]}...")
        
        # Handle greetings
        if self.is_greeting(question):
            response = self.handle_greeting(question)
            return {
                "response": response,
                "type": "greeting",
                "processing_time": time.time() - start_time
            }
        
        # Always retrieve context first
        relevant_docs, retrieval_confidence = self.retrieve_context_with_confidence(question)
        
        # Compute semantic relevance to career domain
        semantic_relevance = self.compute_semantic_relevance(question)
        
        # Combine retrieval confidence and semantic relevance
        combined_confidence = max(retrieval_confidence, semantic_relevance)
        
        # Decision logic based on confidence scores
        if combined_confidence < 0.3:
            # Very low confidence - likely off-topic
            # Use LLM as final check
            if not self.check_topic_relevance_with_llm(question):
                return {
                    "response": "Tôi chuyên tư vấn về các vấn đề liên quan đến nghề nghiệp, học tập và định hướng tương lai. Bạn có thể đặt câu hỏi khác liên quan đến những chủ đề này không?",
                    "type": "off_topic",
                    "semantic_relevance": semantic_relevance,
                    "retrieval_confidence": retrieval_confidence,
                    "processing_time": time.time() - start_time
                }
        
        # Format context and generate response
        context = self.format_context(relevant_docs, retrieval_confidence)
        response = self.generate_response(question, context, combined_confidence)
        
        processing_time = time.time() - start_time
        
        # Determine response type based on confidence
        if combined_confidence >= self.high_confidence_threshold:
            response_type = "high_confidence_advice"
        elif combined_confidence >= self.relevance_threshold:
            response_type = "medium_confidence_advice"
        else:
            response_type = "general_advice"
        
        result = {
            "response": response,
            "type": response_type,
            "context_docs": len(relevant_docs),
            "semantic_relevance": semantic_relevance,
            "retrieval_confidence": retrieval_confidence,
            "combined_confidence": combined_confidence,
            "processing_time": processing_time
        }
        
        logger.success(f"✅ Question answered in {processing_time:.2f}s")
        return result

    def update_domain_references(self, new_questions: List[str]) -> None:
        """
        Update domain reference questions for better semantic matching
        
        Args:
            new_questions: List of new reference questions
        """
        try:
            self.career_reference_questions.extend(new_questions)
            
            # Recompute all embeddings
            self.reference_embeddings = []
            for question in self.career_reference_questions:
                embedding = self.embedding_generator.generate_single(question)
                self.reference_embeddings.append(embedding)
            
            logger.success(f"✅ Updated domain references: {len(self.career_reference_questions)} questions")
            
        except Exception as e:
            logger.error(f"❌ Failed to update domain references: {str(e)}")

    def get_agent_info(self) -> Dict[str, Any]:
        """Get information about the enhanced agent"""
        return {
            "name": "Enhanced Career Counseling Agent",
            "domain": "career_counseling",
            "approach": "semantic_similarity",
            "capabilities": [
                "Tư vấn hướng nghiệp với độ tin cậy cao",
                "Phân tích ngữ nghĩa để xác định chủ đề",
                "Định hướng học tập dựa trên ngữ cảnh",
                "Đánh giá độ liên quan tự động"
            ],
            "languages": ["Vietnamese"],
            "model": self.config.openai_model_name,
            "embedding_model": self.config.embedding_model_name,
            "relevance_threshold": self.relevance_threshold,
            "high_confidence_threshold": self.high_confidence_threshold,
            "reference_questions": len(self.career_reference_questions)
        }