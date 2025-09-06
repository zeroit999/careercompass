import jwt
import datetime
import logging
from functools import wraps
from flask import request, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials, firestore

# Import config with fallback
try:
    from config.config import Config
except ImportError:
    import sys
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from config.config import Config

# Initialize Firebase Admin
if not firebase_admin._apps:
    cred = credentials.Certificate(Config.FIREBASE_ADMIN_KEY_PATH)
    firebase_admin.initialize_app(cred)

# Get Firestore client
db = firestore.client()

def check_user_premium_firebase(firebase_uid):
    """Check premium status from Firebase Firestore"""
    try:
        logging.info(f"🔍 [DEBUG] Checking premium status for user: {firebase_uid}")
        
        user_ref = db.collection('users').document(firebase_uid)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            subscription = user_data.get('subscription', {})
            is_pro = subscription.get('isPro', False)
            
            # Check subscription expiry if user is pro
            if is_pro and subscription.get('endDate'):
                try:
                    end_date = subscription['endDate']
                    # Convert Firestore timestamp to datetime if needed
                    if hasattr(end_date, 'timestamp'):
                        end_date = datetime.datetime.fromtimestamp(end_date.timestamp())
                    elif isinstance(end_date, str):
                        end_date = datetime.datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                    
                    now = datetime.datetime.now()
                    if end_date < now:
                        logging.info(f"❌ [DEBUG] User subscription expired: {end_date}")
                        # Update subscription status to expired
                        user_ref.update({
                            'subscription.isPro': False
                        })
                        return False
                except Exception as e:
                    logging.error(f"💥 [DEBUG] Error checking expiry date: {e}")
                    # If error checking date, assume not premium for safety
                    return False
            
            logging.info(f"✅ [DEBUG] User premium status: {is_pro}")
            return is_pro
        else:
            logging.info(f"❌ [DEBUG] User document not found in Firestore")
            return False
            
    except Exception as e:
        logging.error(f"💥 [DEBUG] Firebase error checking premium: {e}")
        return False

def get_user_data_firebase(firebase_uid):
    """Get complete user data from Firebase Firestore"""
    try:
        logging.info(f"🔍 [DEBUG] Getting user data for: {firebase_uid}")
        
        user_ref = db.collection('users').document(firebase_uid)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            logging.info(f"✅ [DEBUG] User data found: {user_data.get('email', 'unknown')}")
            return user_data
        else:
            logging.info(f"❌ [DEBUG] User data not found in Firestore")
            return None
            
    except Exception as e:
        logging.error(f"💥 [DEBUG] Firebase error getting user data: {e}")
        return None

class JWTManager:
    @staticmethod
    def create_access_token(user_data):
        """Tạo JWT access token"""
        payload = {
            'user_id': user_data['uid'],
            'email': user_data['email'],
            'role': user_data.get('role', 'free'),
            'subscription': user_data.get('subscription', 'free'),
            'permissions': user_data.get('permissions', ['basic']),
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES),
            'iat': datetime.datetime.utcnow(),
            'type': 'access'
        }
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    
    @staticmethod
    def create_refresh_token(user_id):
        """Tạo JWT refresh token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(seconds=Config.JWT_REFRESH_TOKEN_EXPIRES),
            'iat': datetime.datetime.utcnow(),
            'type': 'refresh'
        }
        return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')
    
    @staticmethod
    def verify_token(token):
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    @staticmethod
    def verify_firebase_token(id_token):
        """Verify Firebase ID token"""
        try:
            decoded_token = firebase_auth.verify_id_token(id_token)
            return decoded_token
        except Exception as e:
            logging.error(f"Firebase token verification failed: {e}")
            return None

def jwt_required(f):
    """Decorator yêu cầu JWT token hợp lệ (backward compatibility)"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        payload = JWTManager.verify_token(token)
        
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        if payload.get('type') != 'access':
            return jsonify({'error': 'Invalid token type'}), 401
        
        # Attach user info to request
        request.current_user = payload
        return f(*args, **kwargs)
    
    return decorated

def auth_required(f):
    """Decorator hỗ trợ cả JWT token và Firebase ID token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        user_payload = None
        
        # Try Firebase token first (more common from frontend)
        firebase_user = JWTManager.verify_firebase_token(token)
        if firebase_user:
            # Get user data from Firestore
            user_data = get_user_data_firebase(firebase_user['uid'])
            
            # Convert Firebase user to our format
            user_payload = {
                'user_id': firebase_user['uid'],
                'email': firebase_user.get('email', ''),
                'name': firebase_user.get('name', ''),
                'role': 'free',
                'subscription': 'free',
                'type': 'firebase'
            }
            
            # Update with Firestore data if available
            if user_data:
                subscription = user_data.get('subscription', {})
                user_payload.update({
                    'name': user_data.get('firstName', user_payload['name']),
                    'role': 'premium' if subscription.get('isPro', False) else 'free',
                    'subscription': 'premium' if subscription.get('isPro', False) else 'free'
                })
        
        # If not Firebase token, try JWT token
        if not user_payload:
            jwt_payload = JWTManager.verify_token(token)
            if jwt_payload and jwt_payload.get('type') == 'access':
                user_payload = jwt_payload
            
        if not user_payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Attach user info to request
        request.current_user = user_payload
        return f(*args, **kwargs)
    
    return decorated

def firebase_required(f):
    """Decorator chỉ chấp nhận Firebase ID token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Verify Firebase token
        firebase_user = JWTManager.verify_firebase_token(token)
        if not firebase_user:
            return jsonify({'error': 'Invalid Firebase token'}), 401
        
        # Get user data from Firestore
        user_data = get_user_data_firebase(firebase_user['uid'])
        
        # Convert to our user format
        user_payload = {
            'user_id': firebase_user['uid'],
            'email': firebase_user.get('email', ''),
            'name': firebase_user.get('name', ''),
            'role': 'free',
            'subscription': 'free',
            'type': 'firebase'
        }
        
        # Update with Firestore data if available
        if user_data:
            subscription = user_data.get('subscription', {})
            user_payload.update({
                'name': user_data.get('firstName', user_payload['name']),
                'role': 'premium' if subscription.get('isPro', False) else 'free',
                'subscription': 'premium' if subscription.get('isPro', False) else 'free'
            })
        
        # Attach user info to request
        request.current_user = user_payload
        return f(*args, **kwargs)
    
    return decorated

def premium_required(f):
    """Decorator yêu cầu premium subscription - check từ Firebase Firestore"""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = request.current_user.get('user_id')
        if not user_id:
            return jsonify({'error': 'User ID not found'}), 401
        
        # Check premium status from Firebase Firestore
        is_premium = check_user_premium_firebase(user_id)
        
        if not is_premium:
            return jsonify({
                'error': 'Premium subscription required',
                'subscription_required': 'premium',
                'message': 'This feature requires a premium subscription'
            }), 403
        
        # Update current user with premium status
        request.current_user.update({
            'role': 'premium',
            'subscription': 'premium'
        })
        
        return f(*args, **kwargs)
    
    return decorated
