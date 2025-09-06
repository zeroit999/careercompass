import React, { useState, useEffect } from 'react';
import { getServiceStatus } from '../utils/serviceHealth';
import { RefreshCw, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const ServiceStatusPanel = () => {
  const [serviceStatus, setServiceStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState(null);

  const checkServices = async () => {
    setIsLoading(true);
    try {
      const status = await getServiceStatus();
      setServiceStatus(status);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkServices();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'timeout':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'offline':
        return 'border-red-200 bg-red-50';
      case 'timeout':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">🛠️ Service Status</h2>
        <button
          onClick={checkServices}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
            isLoading 
              ? 'bg-gray-100 border-gray-300 cursor-not-allowed' 
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Checking...' : 'Refresh'}</span>
        </button>
      </div>

      {lastChecked && (
        <p className="text-sm text-gray-600 mb-4">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      )}

      {serviceStatus && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-4 rounded-lg border-2 ${
            serviceStatus.allHealthy 
              ? 'border-green-200 bg-green-50' 
              : serviceStatus.coreHealthy 
                ? 'border-yellow-200 bg-yellow-50'
                : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex items-center space-x-2">
              {serviceStatus.allHealthy ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : serviceStatus.coreHealthy ? (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <h3 className="text-lg font-semibold">
                {serviceStatus.allHealthy 
                  ? '✅ All Services Healthy' 
                  : serviceStatus.coreHealthy 
                    ? '⚠️ Core Services Running'
                    : '❌ Core Services Down'
                }
              </h3>
            </div>
            <p className="text-sm mt-2 opacity-75">
              {serviceStatus.allHealthy 
                ? 'All features are available' 
                : serviceStatus.coreHealthy 
                  ? 'Authentication and chatbot work, other features may be limited'
                  : 'Please start backend services to use the application'
              }
            </p>
          </div>

          {/* Individual Services */}
          <div className="grid gap-4 md:grid-cols-3">
            {Object.entries(serviceStatus.services).map(([key, service]) => (
              <div
                key={key}
                className={`p-4 rounded-lg border-2 ${getStatusColor(service.status)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-800">{service.name || key}</h4>
                  {getStatusIcon(service.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  Port: {service.port}
                </p>
                
                <p className="text-xs text-gray-500">
                  {service.message}
                </p>
                
                {service.status === 'offline' && service.startCommand && (
                  <div className="mt-3 p-2 bg-white rounded border text-xs">
                    <p className="font-medium text-gray-700 mb-1">Start command:</p>
                    <code className="text-blue-600 break-all">
                      {service.startCommand}
                    </code>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Quick Start Commands */}
          {!serviceStatus.allHealthy && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🚀 Quick Start</h4>
              <div className="space-y-2 text-sm">
                <p className="text-blue-700">
                  <strong>Start all services:</strong>
                </p>
                <code className="block p-2 bg-white border rounded text-blue-600">
                  cd D:\code\career-compass\back-end && .\start_all.ps1
                </code>
                
                <p className="text-blue-700 mt-3">
                  <strong>Or start individually:</strong>
                </p>
                <div className="space-y-1">
                  {Object.entries(serviceStatus.services)
                    .filter(([_, service]) => service.status === 'offline')
                    .map(([key, service]) => (
                      <code key={key} className="block p-2 bg-white border rounded text-blue-600 text-xs">
                        {service.startCommand}
                      </code>
                    ))
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!serviceStatus && !isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Click "Refresh" to check service status</p>
        </div>
      )}
    </div>
  );
};

export default ServiceStatusPanel;