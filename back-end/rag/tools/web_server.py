import os
import sys
import time
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from loguru import logger

# Add src to path for local module imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src"))

try:
    from rag_system.shared.config import load_config
    from rag_system.online.career_agent import CareerCounselingAgent
    # Add JWT authentication
    sys.path.insert(0, str(Path(__file__).parent.parent.parent))
    from auth import firebase_required, auth_required, JWTManager
except ImportError as e:
    logger.error(f"❌ Import error: {str(e)}")
    logger.info("💡 Make sure to run: uv pip install -e .")
    sys.exit(1)

# Initialize app
app = Flask(__name__)
CORS(app)

# Global state
career_agent = None
config = None

def setup_logging():
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>.<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level="INFO"
    )

def initialize_agent():
    global config, career_agent
    try:
        logger.info("🔧 Initializing career counseling agent...")
        config = load_config()
        career_agent = CareerCounselingAgent(config)
        logger.success("✅ Career agent initialized successfully")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to initialize agent: {str(e)}")
        return False

# API endpoint: test authentication
@app.route('/api/auth-test', methods=['POST'])
@firebase_required
def test_auth():
    """Test endpoint để debug authentication"""
    try:
        user_info = getattr(request, 'current_user', None)
        data = request.get_json() or {}
        
        logger.info(f"🔐 Auth test - User: {user_info}")
        logger.info(f"📋 Headers: {dict(request.headers)}")
        logger.info(f"📦 Data: {data}")
        
        return jsonify({
            'status': 'success',
            'message': 'Authentication successful!',
            'user_info': user_info,
            'headers_received': {
                'authorization': request.headers.get('Authorization', 'Missing')[:50] + '...',
                'user_id': request.headers.get('X-User-ID', 'Missing'),
                'user_pro': request.headers.get('X-User-Pro', 'Missing'),
                'content_type': request.headers.get('Content-Type', 'Missing')
            },
            'data_received': data
        })
        
    except Exception as e:
        logger.error(f"❌ Auth test error: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# API endpoint: ask question
@app.route('/api/ask', methods=['POST'])
@firebase_required
def ask_question():
    global career_agent

    try:
        # Debug: Log user info
        user_info = getattr(request, 'current_user', None)
        logger.info(f"🔐 Authenticated user: {user_info}")
        
        if career_agent is None:
            return jsonify({
                'error': 'Career agent not initialized',
                'response': 'Hệ thống đang khởi động, vui lòng thử lại sau.',
                'type': 'system_error'
            }), 500

        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({
                'error': 'No question provided',
                'response': 'Vui lòng cung cấp câu hỏi.',
                'type': 'invalid_request'
            }), 400

        question = data['question'].strip()
        if not question:
            return jsonify({
                'error': 'Empty question',
                'response': 'Câu hỏi không được để trống.',
                'type': 'empty_question'
            }), 400

        logger.info(f"🤖 API Request from {user_info.get('email', 'unknown')}: {question[:100]}...")

        start_time = time.time()
        result = career_agent.answer_question(question)
        result['api_processing_time'] = time.time() - start_time
        result['user_info'] = user_info  # Add user info to response for debugging

        logger.success(f"✅ API Response sent ({result.get('processing_time', 0):.2f}s)")
        return jsonify(result)

    except Exception as e:
        logger.error(f"❌ API Error: {str(e)}")
        return jsonify({
            'error': str(e),
            'response': 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.',
            'type': 'system_error'
        }), 500

# API endpoint: system status
@app.route('/api/status')
def get_status():
    global career_agent, config
    try:
        agent_status = career_agent is not None
        status = {
            'status': 'healthy' if agent_status else 'initializing',
            'agent_initialized': agent_status,
            'timestamp': time.time()
        }
        if agent_status and config:
            agent_info = career_agent.get_agent_info()
            status.update({
                'agent_info': agent_info,
                'model': config.openai_model_name,
                'embedding_model': config.embedding_model_name
            })
        return jsonify(status)
    except Exception as e:
        logger.error(f"❌ Status check error: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': time.time()
        }), 500

# API endpoint: health check
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'service': 'career-counseling-rag',
        'timestamp': time.time()
    })

# Error handling
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'error': 'Endpoint not found',
        'message': 'The requested endpoint does not exist.'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"❌ Internal server error: {str(error)}")
    return jsonify({
        'error': 'Internal server error',
        'message': 'An unexpected error occurred.'
    }), 500

# Start server
if __name__ == '__main__':
    setup_logging()
    logger.info("🚀 Starting API-only Career Counseling Server")

    if not initialize_agent():
        logger.warning("⚠️  Agent initialization failed, server will start but API may not work")

    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5002))
    debug = os.getenv('FLASK_DEBUG', 'false').lower() == 'true'

    logger.info(f"🌐 API server listening at http://{host}:{port}")
    logger.info("📋 Available endpoints:")
    logger.info("   - POST /api/ask       - Ask questions")
    logger.info("   - GET  /api/status    - System status")
    logger.info("   - GET  /api/health    - Health check")

    try:
        app.run(host=host, port=port, debug=debug, threaded=True)
    except KeyboardInterrupt:
        logger.info("👋 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {str(e)}")
        sys.exit(1)
