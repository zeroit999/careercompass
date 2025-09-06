// Service Health Checker
// Utility to check if backend services are running

const services = {
  ragChatbot: {
    name: 'RAG/Chatbot',
    url: 'http://localhost:5002/api/status',
    port: 5002,
    required: true
  },
  interview: {
    name: 'Interview',
    url: 'http://localhost:5005/health',
    port: 5005,
    required: false
  },
  cvEvaluation: {
    name: 'CV Evaluation', 
    url: 'http://localhost:5000/health',
    port: 5000,
    required: false
  }
};

export const checkServiceHealth = async (serviceName) => {
  const service = services[serviceName];
  if (!service) {
    return { status: 'error', message: 'Unknown service' };
  }
  
  try {
    const response = await fetch(service.url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      return { 
        status: 'healthy', 
        message: `${service.name} is running`,
        port: service.port
      };
    } else {
      return { 
        status: 'unhealthy', 
        message: `${service.name} returned ${response.status}`,
        port: service.port
      };
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { 
        status: 'timeout', 
        message: `${service.name} connection timeout`,
        port: service.port
      };
    } else {
      return { 
        status: 'offline', 
        message: `${service.name} is not running (${error.message})`,
        port: service.port,
        startCommand: getStartCommand(serviceName)
      };
    }
  }
};

export const checkAllServices = async () => {
  const results = {};
  
  for (const [key, service] of Object.entries(services)) {
    results[key] = await checkServiceHealth(key);
  }
  
  return results;
};

const getStartCommand = (serviceName) => {
  const commands = {
    ragChatbot: 'cd D:\\code\\career-compass\\back-end\\rag\\tools && python web_server.py',
    interview: 'cd D:\\code\\career-compass\\back-end\\services && python interview.py',
    cvEvaluation: 'cd D:\\code\\career-compass\\back-end\\services && python evaluate_cv.py'
  };
  
  return commands[serviceName] || 'Unknown command';
};

export const getServiceStatus = async () => {
  const allServices = await checkAllServices();
  
  const summary = {
    allHealthy: Object.values(allServices).every(s => s.status === 'healthy'),
    coreHealthy: allServices.ragChatbot.status === 'healthy',
    services: allServices
  };
  
  return summary;
};

// Create user-friendly error messages
export const getErrorMessage = (serviceName, error) => {
  const service = services[serviceName];
  
  if (!service) return 'Unknown service error';
  
  const baseMessage = `⚠️ ${service.name} service is not available`;
  const startupMessage = service.required 
    ? '🚀 Please start the backend service to continue'
    : '💡 This feature requires the backend service to be running';
    
  const commandMessage = `\n📋 Start command:\n${getStartCommand(serviceName)}`;
  
  return `${baseMessage}\n${startupMessage}${commandMessage}`;
};

export default {
  checkServiceHealth,
  checkAllServices, 
  getServiceStatus,
  getErrorMessage,
  services
};