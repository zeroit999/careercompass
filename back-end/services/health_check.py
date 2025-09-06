#!/usr/bin/env python3
"""
Health Check Service for Career Compass All-in-One Platform
Monitors all 4 services and provides unified health status
"""

from flask import Flask, jsonify
import requests
import time
import threading
from datetime import datetime
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/app/logs/health-check.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Service configurations based on actual project structure
SERVICES = {
    'cv-evaluation': {
        'url': 'https://career-compass-cv.dev.huit.vn/health',
        'name': 'CV Evaluation Service',
        'port': 5000,
        'status': 'unknown',
        'last_check': None,
        'error': None,
        'response_time': None
    },
    'interview': {
        'url': 'https://career-compass-interview.dev.huit.vn/health',
        'name': 'Interview Service',
        'port': 5001,
        'status': 'unknown',
        'last_check': None,
        'error': None,
        'response_time': None
    },
    'major-list': {
        'url': 'https://career-compass-major.dev.huit.vn/docs',
        'name': 'Major List Service',
        'port': 8001,
        'status': 'unknown',
        'last_check': None,
        'error': None,
        'response_time': None
    },
    'university-list': {
        'url': 'https://career-compass-university.dev.huit.vn/docs',
        'name': 'University List Service',
        'port': 8000,
        'status': 'unknown',
        'last_check': None,
        'error': None,
        'response_time': None
    }
}

def check_service(service_key, service_config):
    """Check health of a single service with response time measurement"""
    start_time = time.time()
    try:
        response = requests.get(service_config['url'], timeout=10)
        response_time = round((time.time() - start_time) * 1000, 2)  # ms        
        if response.status_code == 200:
            service_config['status'] = 'healthy'
            service_config['error'] = None
            service_config['response_time'] = response_time
            logger.debug(f"{service_config['name']}: Healthy ({response_time}ms)")
        else:
            service_config['status'] = 'unhealthy'
            service_config['error'] = f"HTTP {response.status_code}"
            service_config['response_time'] = response_time
            logger.warning(f"{service_config['name']}: Unhealthy - HTTP {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        service_config['status'] = 'down'
        service_config['error'] = "Connection refused - service may be starting"
        service_config['response_time'] = None
        logger.warning(f"{service_config['name']}: Connection refused")
        
    except requests.exceptions.Timeout:
        service_config['status'] = 'timeout'
        service_config['error'] = "Request timeout (>10s)"
        service_config['response_time'] = None
        logger.warning(f"{service_config['name']}: Timeout")
        
    except Exception as e:
        service_config['status'] = 'error'
        service_config['error'] = str(e)
        service_config['response_time'] = None
        logger.error(f"{service_config['name']}: Error - {str(e)}")
    
    service_config['last_check'] = datetime.now().isoformat()

@app.route('/health')
def health_check():
    """Main health check endpoint with comprehensive status"""    # Force immediate check for API call
    for service_key, service_config in SERVICES.items():
        check_service(service_key, service_config)
    
    # Calculate overall status
    healthy_count = sum(1 for s in SERVICES.values() if s['status'] == 'healthy')
    total_services = len(SERVICES)
    
    # Determine overall status
    if healthy_count == total_services:
        overall_status = 'healthy'
    elif healthy_count > 0:
        overall_status = 'partial'
    else:
        overall_status = 'unhealthy'
    
    return jsonify({
        'status': overall_status,
        'timestamp': datetime.now().isoformat(),
        'platform': 'Career Compass Education Platform',
        'version': '1.0.0',
        'services': {
            key: {
                'name': config['name'],
                'status': config['status'],
                'port': config['port'],
                'last_check': config['last_check'],
                'error': config['error'],
                'response_time_ms': config['response_time']
            }
            for key, config in SERVICES.items()
        },
        'summary': {
            'total_services': total_services,
            'healthy_services': healthy_count,
            'unhealthy_services': total_services - healthy_count,
            'health_percentage': round((healthy_count / total_services) * 100, 1)
        },        'endpoints': {
            'main_platform': 'https://career-compass-frontend.dev.huit.vn',
            'cv_evaluation': 'https://career-compass-cv.dev.huit.vn',
            'interview': 'https://career-compass-interview.dev.huit.vn', 
            'university_list': 'https://career-compass-university.dev.huit.vn',
            'major_list': 'https://career-compass-major.dev.huit.vn'
        }
    })

@app.route('/')
def root():
    """Root endpoint with platform information"""
    return jsonify({
        'service': 'Career Compass Health Monitor',
        'version': '1.0.0',
        'platform': 'All-in-One Container',
        'endpoints': {
            'health': '/health',
            'services': '/services'
        },
        'monitored_services': len(SERVICES),
        'description': 'Health monitoring for Career Compass Education Platform'
    })

@app.route('/services')
def list_services():
    """List all monitored services"""
    return jsonify({
        'services': [
            {
                'key': key,
                'name': config['name'],
                'port': config['port'],
                'url': config['url']
            }
            for key, config in SERVICES.items()
        ],
        'total': len(SERVICES),
        'platform': 'Career Compass Education Platform'
    })

if __name__ == '__main__':
    # Ensure log directory exists
    os.makedirs('/app/logs', exist_ok=True)
    
    logger.info("Starting Career Compass Health Check Service on port 5004...")
    logger.info(f"Monitoring {len(SERVICES)} services: {', '.join(SERVICES.keys())}")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5004, debug=False, threaded=True)