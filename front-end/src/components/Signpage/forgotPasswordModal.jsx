import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.js";
import { ArrowLeft, Mail, Send } from "lucide-react";

function ForgotPasswordModal() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Đặt lại mật khẩu đã được gửi đến email của bạn.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 5000);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Side - Illustration/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <button className="flex items-center text-white/80 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Quay lại
          </button>

          <h1 className="text-4xl font-bold mb-4">Khôi phục mật khẩu</h1>
          <p className="text-xl text-white/90 mb-8 leading-relaxed">
            Đừng lo lắng! Chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu đến
            email của bạn
          </p>

          <button className="bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-xl font-medium hover:bg-white/30 transition-all duration-200 border border-white/30 self-start">
            Tìm hiểu thêm
          </button>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">Q</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Đặt lại mật khẩu
              </h2>
              <p className="text-gray-600">
                Nhập email của bạn và chúng tôi sẽ gửi liên kết đặt lại mật khẩu
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập địa chỉ email của bạn"
                    className="w-full pl-10 pr-4 py-3 border-2 border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-blue-50/50 hover:from-blue-50/50 hover:to-blue-50/70"
                    required
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg ${
                    message.includes("gửi đến email")
                      ? "bg-green-50 border border-green-200"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <p
                    className={`text-sm ${
                      message.includes("gửi đến email")
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center ${
                  isLoading
                    ? "opacity-75 cursor-not-allowed"
                    : "hover:from-blue-700 hover:to-blue-800"
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Gửi liên kết
                  </>
                )}
              </button>

              <div className="text-center">
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Quay lại đăng nhập
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
