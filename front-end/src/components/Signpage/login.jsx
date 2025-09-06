import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { useAuth } from "../../contexts/AuthContext";
import SignWithGoogle from "./signWithGoogle";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isPro, isLoading } = useAuth();

  // Updated handleSubmit to use Firebase auth directly
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("🔄 Logging in with Firebase...");

      // Sign in with Firebase directly
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("✅ Firebase login successful:", userCredential.user.email);

      // AuthContext will automatically handle the rest
      // Navigate based on user type (will be handled after AuthContext updates)
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      console.error("❌ Login error:", error);

      // Display user-friendly error messages
      if (error.code === "auth/user-not-found") {
        setError("Không tìm thấy tài khoản với email này");
      } else if (error.code === "auth/wrong-password") {
        setError("Mật khẩu không chính xác");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ");
      } else if (error.code === "auth/invalid-credential") {
        setError("Thông tin đăng nhập không chính xác");
      } else {
        setError("Đăng nhập thất bại. Vui lòng thử lại.");
      }

      setTimeout(() => {
        setError("");
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is already logged in via AuthContext
  useEffect(() => {
    if (!isLoading && user) {
      console.log("✅ User already logged in, redirecting...");
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex">
      {/* Left Side - Illustration/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-black/10"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src="https://gqefcpylonobj.vcdn.cloud/directus-upload/3842e061-79b5-4f70-9b48-b6219f75883d.png"
            alt="Mô tả hình ảnh"
            style={{
              width: "70%",
              height: "auto",
            }}
          />
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="text-center mb-6 justify-center items-center flex flex-col">
              <div className="mb-4">
                <img src={"./Logo_CC_tron.svg"} alt="Logo" className="h-12" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Chào mừng bạn trở lại!
              </h2>
              <p className="text-sm text-gray-600">
                Rất vui được gặp bạn! Vui lòng đăng nhập để tiếp tục
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-blue-50/50 hover:from-blue-50/50 hover:to-blue-50/70"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-blue-700">
                    Mật khẩu
                  </label>
                  <Link
                    to="/forgotpass"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn"
                    className="w-full pl-10 pr-12 py-2.5 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gradient-to-r from-blue-50/30 to-blue-50/50 hover:from-blue-50/50 hover:to-blue-50/70"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-2.5 font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                }`}
              >
                {loading ? "Đang đăng nhập..." : "Đăng nhập"}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>

              <SignWithGoogle />

              <p className="text-center text-gray-600">
                Chưa có tài khoản?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Đăng ký
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
