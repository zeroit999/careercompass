import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { useAuth } from "../../contexts/AuthContext.jsx";
import {
  Compass,
  Sparkles,
  Zap,
  Star,
  X,
  Lock,
  ArrowRight,
} from "lucide-react";

function Header() {
  const navigate = useNavigate();
  const { userDetails, isLoading, isPro } = useAuth();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Kiểm tra hết hạn subscription đã được handle trong AuthContext

  useEffect(() => {
    // Authentication đã được handle trong AuthContext
    // Không cần thêm logic ở đây
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAvatarClick = () => {
    setIsModalVisible((prev) => !prev);
  };

  const handleUpgrade = () => {
    navigate("/premium");
  };

  const handleInterviewClick = (e) => {
    if (!isPro) {
      e.preventDefault();
      setShowProModal(true);
    }
  };

  const closeProModal = () => {
    setShowProModal(false);
  };

  const goToPremium = () => {
    setShowProModal(false);
    navigate("/premium");
  };

  // Premium Badge Component
  const PremiumBadge = () => (
    <div className="relative">
      <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-amber-900 font-bold rounded-lg shadow-lg hover:shadow-xl ">
        <Compass className="w-5 h-5 text-amber-800" />
        <span className="text-sm font-extrabold">PREMIUM</span>
        <Sparkles className="w-4 h-4 text-amber-800" />
      </div>
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-lg blur opacity-20 "></div>
    </div>
  );

  // Upgrade Button Component
  const UpgradeButton = () => (
    <Link to="/premium">
      <div className="relative">
        <button
          onClick={handleUpgrade}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl"
        >
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="text-sm font-extrabold">NÂNG CẤP</span>
          <Star className="w-4 h-4 text-yellow-300 " />
        </button>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 rounded-lg blur opacity-30 "></div>

        {/* Floating particles effect */}
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full"></div>
        <div
          className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-pink-400 rounded-full"
          style={{ animationDelay: "0.5s" }}
        ></div>
      </div>
    </Link>
  );

  return (
    <nav className="bg-white shadow-lg block w-full z-50 fixed">
      <div className="max-w-7xl mx-auto px-12">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center w-48">
              <img src={"/Logo_CC_tron.svg"} alt="Logo" className="h-10" />
            </div>
          </Link>

          {/* Menu */}
          <div className="hidden md:flex items-center space-x-6 font-medium relative">
            {/* Interview Link with Pro restriction */}
            <div className="relative group">
              <Link
                to={isPro ? "/interview" : "#"}
                onClick={handleInterviewClick}
                className={`transition-colors duration-200 font-medium relative ${
                  isPro
                    ? "text-gray-700 hover:text-blue-600"
                    : "text-gray-500 hover:text-gray-600 cursor-pointer"
                }`}
              >
                <span
                  className={
                    isPro ? "" : "border-b-2 border-dashed border-gray-400"
                  }
                >
                  Phỏng vấn nghề nghiệp
                </span>
                {!isPro && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
                    PRO
                  </span>
                )}
              </Link>
            </div>

            {/* CV Evaluation Link with Pro restriction */}
            <div className="relative group">
              <Link
                to={isPro ? "/evaluatecv" : "#"}
                onClick={(e) => {
                  if (!isPro) {
                    e.preventDefault();
                    setShowProModal(true);
                  }
                }}
                className={`transition-colors duration-200 font-medium relative ${
                  isPro
                    ? "text-gray-700 hover:text-blue-600"
                    : "text-gray-500 hover:text-gray-600 cursor-pointer"
                }`}
              >
                <span
                  className={
                    isPro ? "" : "border-b-2 border-dashed border-gray-400"
                  }
                >
                  Kiểm tra CV
                </span>
                {!isPro && (
                  <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-lg">
                    PRO
                  </span>
                )}
              </Link>
            </div>

            <Link
              to="/university"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Danh sách đại học
            </Link>
            <Link
              to="/career"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Hướng nghiệp
            </Link>
            <Link
              to="/chatbot"
              className="text-gray-700 hover:text-blue-600 transition-colors duration-200 font-medium"
            >
              Chatbot AI
            </Link>

            {!isLoading && userDetails ? (
              <>
                {/* Premium Badge or Upgrade Button */}
                <div className="mr-4">
                  {isPro ? <PremiumBadge /> : <UpgradeButton />}
                </div>

                <div className="relative">
                  <div className="relative">
                    <img
                      src={
                        userDetails.photo ||
                        "https://i.postimg.cc/zXkPfDnB/logo192.png"
                      }
                      alt="Avatar"
                      className={`h-10 w-10 rounded-full cursor-pointer border-2 transition-all duration-200 ${
                        isPro
                          ? "border-amber-400 shadow-lg shadow-amber-200"
                          : "border-blue-200 hover:border-blue-300"
                      }`}
                      onClick={handleAvatarClick}
                    />
                    {/* Premium compass overlay */}
                  </div>

                  {isModalVisible && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg z-50 border-2 border-blue-200 overflow-hidden">
                      <div
                        className={`p-4 flex items-center space-x-3 ${
                          isPro
                            ? "bg-gradient-to-r from-amber-50/30 to-amber-50/50"
                            : "bg-gradient-to-r from-blue-50/30 to-blue-50/50"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={
                              userDetails.photo ||
                              "https://i.postimg.cc/zXkPfDnB/logo192.png"
                            }
                            alt="Avatar"
                            className={`h-10 w-10 rounded-full border-2 ${
                              isPro ? "border-amber-400" : "border-blue-200"
                            }`}
                          />
                        </div>
                        <div>
                          <div
                            className={`font-semibold ${
                              isPro ? "text-amber-700" : "text-blue-700"
                            }`}
                          >
                            {userDetails.firstName}
                            {isPro && (
                              <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                PRO
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-ellipsis line-clamp-1 truncate w-[160px] text-sm ${
                              isPro ? "text-amber-600" : "text-blue-600"
                            }`}
                          >
                            {userDetails.email}
                          </div>
                        </div>
                      </div>
                      <hr className="border-blue-100" />
                      <ul className="py-2 text-sm">
                        <li>
                          <Link
                            to="/profile"
                            className="block px-4 py-3 text-blue-700 hover:bg-blue-50 transition-colors duration-200 font-medium"
                          >
                            Trang cá nhân
                          </Link>
                        </li>

                        {!isPro && (
                          <>
                            <hr className="border-blue-100 my-1" />
                            <li>
                              <button
                                onClick={handleUpgrade}
                                className="w-full text-left px-4 py-3 text-purple-700 hover:bg-purple-50 transition-colors duration-200 font-bold flex items-center space-x-2"
                              >
                                <Zap className="w-4 h-4" />
                                <span>Nâng cấp Premium</span>
                              </button>
                            </li>
                          </>
                        )}
                      </ul>
                      <hr className="border-blue-100" />
                      <div
                        className="px-4 py-3 text-red-600 hover:bg-red-50 cursor-pointer text-sm font-medium transition-colors duration-200"
                        onClick={handleLogout}
                      >
                        Đăng xuất
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-all duration-200"
                >
                  Đăng ký
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white border-2 border-blue-600 font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md"
              onClick={() => setShowMobileMenu(true)}
            >
              Menu
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex">
          {/* Side menu */}
          <div className="bg-white w-64 h-full shadow-lg p-6 flex flex-col animate-slideInLeft relative">
            <button
              className="self-end mb-6 text-gray-600 hover:text-blue-700"
              onClick={() => setShowMobileMenu(false)}
            >
              <X className="w-7 h-7" />
            </button>
            <Link
              to="/interview"
              className="mb-4 text-blue-700 font-semibold"
              onClick={() => setShowMobileMenu(false)}
            >
              Phỏng vấn nghề nghiệp
            </Link>
            <Link
              to="/evaluatecv"
              className="mb-4 text-blue-700 font-semibold"
              onClick={() => setShowMobileMenu(false)}
            >
              Kiểm tra CV
            </Link>
            <Link
              to="/university"
              className="mb-4 text-blue-700 font-semibold"
              onClick={() => setShowMobileMenu(false)}
            >
              Danh sách đại học
            </Link>
            <Link
              to="/career"
              className="mb-4 text-blue-700 font-semibold"
              onClick={() => setShowMobileMenu(false)}
            >
              Hướng nghiệp
            </Link>
            <Link
              to="/chatbot"
              className="mb-4 text-blue-700 font-semibold"
              onClick={() => setShowMobileMenu(false)}
            >
              Chatbot AI
            </Link>
            {!isLoading && userDetails ? (
              <>
                <div className="mb-4 border-b border-blue-100 pb-2">
                  <Link
                    to="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 mb-2 hover:bg-blue-50 rounded-lg p-2 transition"
                  >
                    <img
                      src={
                        userDetails.photo ||
                        "https://i.postimg.cc/zXkPfDnB/logo192.png"
                      }
                      alt="Avatar"
                      className={`h-9 w-9 rounded-full border-2 ${
                        isPro ? "border-amber-400" : "border-blue-200"
                      }`}
                    />
                    <div>
                      <div
                        className={`font-semibold ${
                          isPro ? "text-amber-700" : "text-blue-700"
                        }`}
                      >
                        {userDetails.firstName}
                        {isPro && (
                          <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[120px]">
                        {userDetails.email}
                      </div>
                    </div>
                  </Link>
                </div>
                <button
                  onClick={() => {
                    setShowMobileMenu(false);
                    handleLogout();
                  }}
                  className="mt-4 text-red-600 font-semibold"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="mb-4 text-blue-700 font-semibold"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Đăng ký
                </Link>
                <Link
                  to="/login"
                  className="mb-4 text-blue-700 font-semibold"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Đăng nhập
                </Link>
              </>
            )}
          </div>
          {/* Overlay background */}
          <div
            className="flex-1 bg-black/40"
            onClick={() => setShowMobileMenu(false)}
          ></div>
        </div>
      )}

      {/* Pro Required Modal */}
      {showProModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            {/* Modal Header */}
            <div className="relative p-6 text-center">
              {/* Lock Icon with glow effect */}
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
                Tính năng <strong>Phỏng vấn nghề nghiệp</strong> chỉ dành cho
                thành viên Premium. Nâng cấp ngay để trải nghiệm đầy đủ các tính
                năng hướng nghiệp chuyên sâu!
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
                    Phỏng vấn nghề nghiệp AI không giới hạn
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Phân tích chi tiết kết quả phỏng vấn
                  </li>
                  <li className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    Gợi ý cải thiện kỹ năng cá nhân
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
                  onClick={closeProModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200"
                >
                  Để sau
                </button>
                <button
                  onClick={goToPremium}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>Nâng cấp ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Header;
