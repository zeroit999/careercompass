#!/usr/bin/env python3
"""
Career Counseling RAG Agent Runner
Test the career counseling RAG system with real retrieval and generation
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any
from loguru import logger

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

try:
    from rag_system.shared.config import load_config
    from rag_system.online.career_agent import CareerCounselingAgent
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


def run_career_agent_query(question: str = None) -> Dict[str, Any]:
    """
    Run a career counseling query through the RAG agent
    
    Args:
        question: Career-related question to ask
        
    Returns:
        Dict with query results
    """
    setup_logging()
    
    if not question:
        question = "Ngành IT có tương lai không? Tôi nên học những gì?"
    
    logger.info(f"🤖 Career Counseling RAG Agent")
    logger.info(f"📝 Question: {question}")
    
    try:
        # Load configuration
        config = load_config()
        
        # Initialize career agent
        logger.info("🔧 Initializing career counseling agent...")
        agent = CareerCounselingAgent(config)
        
        # Get agent info
        agent_info = agent.get_agent_info()
        logger.info(f"👨‍💼 Agent: {agent_info['name']}")
        logger.info(f"🎯 Domain: {agent_info['domain']}")
        
        # Process question
        logger.info("💭 Processing question...")
        result = agent.answer_question(question)
        
        # Display results
        logger.success("✅ Career counseling completed")
        
        print("\n" + "="*80)
        print("🎯 CAREER COUNSELING RESPONSE")
        print("="*80)
        print(f"📝 Question: {question}")
        print(f"🤖 Type: {result['type']}")
        if 'context_docs' in result:
            print(f"📚 Context docs: {result['context_docs']}")
        print(f"⏱️  Processing time: {result['processing_time']:.2f}s")
        print("\n" + "-"*80)
        print("💬 RESPONSE:")
        print("-"*80)
        print(result['response'])
        print("="*80 + "\n")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Career agent query failed: {str(e)}")
        return {
            "question": question,
            "response": None,
            "success": False,
            "error": str(e)
        }


def run_interactive_session():
    """Run interactive career counseling session"""
    setup_logging()
    
    try:
        # Load configuration and initialize agent
        config = load_config()
        agent = CareerCounselingAgent(config)
        
        print("\n🎯 CAREER COUNSELING INTERACTIVE SESSION")
        print("="*60)
        print("Chào mừng bạn đến với hệ thống tư vấn hướng nghiệp!")
        print("Nhập 'quit' hoặc 'exit' để thoát")
        print("="*60)
        
        while True:
            # Get user input
            print("\n💬 Bạn:")
            question = input("> ").strip()
            
            # Check for exit commands
            if question.lower() in ['quit', 'exit', 'thoát', 'q']:
                print("\n👋 Cảm ơn bạn đã sử dụng dịch vụ tư vấn hướng nghiệp!")
                break
            
            if not question:
                print("⚠️  Vui lòng nhập câu hỏi.")
                continue
            
            # Process question
            print("\n🤖 Trợ lý tư vấn:")
            print("-" * 40)
            
            try:
                result = agent.answer_question(question)
                print(result['response'])
                
                # Show processing info
                if result.get('context_docs', 0) > 0:
                    print(f"\n📚 (Dựa trên {result['context_docs']} tài liệu liên quan)")
                print(f"⏱️  (Xử lý trong {result.get('processing_time', 0):.1f}s)")
                
            except Exception as e:
                logger.error(f"❌ Error processing question: {str(e)}")
                print("❌ Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.")
    
    except KeyboardInterrupt:
        print("\n\n👋 Phiên tư vấn đã kết thúc. Chúc bạn thành công!")
    except Exception as e:
        logger.error(f"❌ Interactive session failed: {str(e)}")


def test_different_question_types():
    """Test agent with different types of questions"""
    setup_logging()
    
    test_questions = [
        # Career questions
        "Ngành công nghệ thông tin có tương lai không?",
        "Tôi nên học gì để trở thành lập trình viên?",
        "Lương của ngành marketing hiện tại như thế nào?",
        
        # Greetings
        "Xin chào!",
        "Chào buổi sáng!",
        
        # Off-topic questions
        "Cách nấu phở ngon?",
        "Thời tiết hôm nay như thế nào?",
        
        # Education questions
        "Nên chọn trường đại học nào để học kinh tế?",
        "Học cao đẳng hay đại học tốt hơn?"
    ]
    
    try:
        config = load_config()
        agent = CareerCounselingAgent(config)
        
        print("\n🧪 TESTING DIFFERENT QUESTION TYPES")
        print("="*60)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n🔍 Test {i}/{len(test_questions)}")
            print(f"❓ Question: {question}")
            
            result = agent.answer_question(question)
            print(f"🤖 Type: {result['type']}")
            print(f"💬 Response: {result['response'][:100]}...")
            print(f"⏱️  Time: {result['processing_time']:.2f}s")
            
            if i < len(test_questions):
                print("-" * 40)
        
        print("\n✅ All tests completed!")
        
    except Exception as e:
        logger.error(f"❌ Testing failed: {str(e)}")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Career Counseling RAG Agent")
    parser.add_argument(
        "--question", "-q",
        type=str,
        help="Single question to ask the agent"
    )
    parser.add_argument(
        "--interactive", "-i",
        action="store_true",
        help="Start interactive session"
    )
    parser.add_argument(
        "--test", "-t",
        action="store_true",
        help="Run test with different question types"
    )
    
    args = parser.parse_args()
    
    try:
        if args.interactive:
            run_interactive_session()
        elif args.test:
            test_different_question_types()
        elif args.question:
            result = run_career_agent_query(args.question)
            exit_code = 0 if result.get("success", True) else 1
            sys.exit(exit_code)
        else:
            # Default: run with sample question
            result = run_career_agent_query()
            exit_code = 0 if result.get("success", True) else 1
            sys.exit(exit_code)
            
    except KeyboardInterrupt:
        logger.warning("Career agent interrupted by user")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        sys.exit(1)
