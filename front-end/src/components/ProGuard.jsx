import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, Compass, Sparkles } from 'lucide-react';

const ProGuard = ({ 
  children, 
  showModal = true, 
  fallback = null,
  feature = "tính năng này"
}) => {
  const { isPro, isLoading, user } = useAuth();
  const navigate = useNavigate();

  // Đang loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return fallback || (
      <div className="text-center p-8">
        <div className="bg-blue-50 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">
            Cần đăng nhập
          </h3>
          <p className="text-blue-600 mb-4">
            Vui lòng đăng nhập để sử dụng {feature}.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Đã đăng nhập và là Pro
  if (isPro) {
    return children;
  }

  // Đã đăng nhập nhưng chưa Pro
  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="relative p-6 text-center">
            {/* Lock Icon với glow effect */}
            <div className="relative mx-auto mb-4">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur opacity-20 animate-pulse"></div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Tính năng Premium
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              <strong className="capitalize">{feature}</strong> chỉ dành cho thành viên Premium. 
              Nâng cấp ngay để trải nghiệm đầy đủ các tính năng chuyên sâu!
            </p>

            {/* Premium features list */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <Compass className="w-5 h-5 mr-2" />
                Những gì bạn sẽ có với Premium:
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Truy cập không giới hạn tất cả tính năng
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Phân tích chi tiết và cá nhân hóa
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Hỗ trợ ưu tiên 24/7
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  Truy cập sớm các tính năng mới
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(-1)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                Quay lại
              </button>
              <button
                onClick={() => navigate('/premium')}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Nâng cấp ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback nếu không showModal
  return fallback || (
    <div className="text-center p-8">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 max-w-md mx-auto">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-purple-800 mb-2">
          Tính năng Premium
        </h3>
        <p className="text-purple-600 mb-4">
          Nâng cấp để sử dụng {feature}.
        </p>
        <button
          onClick={() => navigate('/premium')}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Tìm hiểu thêm
        </button>
      </div>
    </div>
  );
};

export default ProGuard;