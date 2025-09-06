import React, { useState } from "react";
import {
  Check,
  Star,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import Header from "../Header/header";
import Firstplan from "./firstplan";
import { Link } from "react-router-dom";

const Premium = () => {
  const [selectedPlan, setSelectedPlan] = useState("3-month");

  const plans = [
    {
      id: "3-month",
      duration: "3 THÁNG",
      subtitle: "(90 NGÀY)",
      originalPrice: "35.000 VND",
      pricePerMonth: "27k",
      description: "Thử xem Career Compass có gì :)",
      features: [
        "Phân tích CV cơ bản",
        "Luyện tập phỏng vấn không giới hạn",
        "Thông tin chi tiết bài test",
        "Truy cập thư viện câu hỏi cơ bản",
      ],
      buttonText: "Thanh toán",
      buttonStyle: "outline",
      popular: true,
    },

    {
      id: "company",
      duration: "DOANH NGHIỆP",
      subtitle: "Không giới hạn",
      originalPrice: "Giá liên hệ",
      pricePerMonth: "Giá liên hệ",
      description: "Khai phá tìm năng, đi đúng đường chọn đúng hướng",
      features: [
        "Tất cả tính năng gói 6 tháng",
        "Mentor 1-1 hàng tuần",
        "Phân tích speaking chi tiết",
        "Lộ trình học cá nhân hóa",
        "Chứng chỉ hoàn thành",
        "Ưu tiên hỗ trợ 24/7",
      ],
      buttonText: "Liên hệ ngay",
      buttonStyle: "outline",
      popular: false,
    },
  ];

  const features = [
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: "Luyện tập phỏng vấn AI",
      description:
        "Hệ thống AI thông minh giúp bạn luyện tập phỏng vấn như thật",
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Phân tích CV chuyên sâu",
      description: "AI đánh giá và đưa ra gợi ý cải thiện CV của bạn",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Cộng đồng học viên",
      description: "Kết nối và học hỏi từ cộng đồng hơn 10,000+ học viên",
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Theo dõi tiến độ",
      description: "Thống kê chi tiết về quá trình học và cải thiện của bạn",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <Header />
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-24 py-32">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Chọn gói phù hợp với bạn
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Nâng cao kỹ năng phỏng vấn và cải thiện CV với công nghệ AI tiên
            tiến
          </p>

          {/* Trust indicators */}
          <div className="flex items-center justify-center space-x-8 mt-8">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500 fill-current" />
              <span className="text-gray-600">4.9/5 từ 2,000+ đánh giá</span>
            </div>
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-gray-600">10,000+ học viên tin tưởng</span>
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 transition-all duration-300 hover:shadow-xl ${
                plan.popular
                  ? "border-2 border-blue-600 transform scale-105"
                  : "border border-gray-200 hover:border-blue-200"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium">
                    Phổ biến nhất
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-lg font-bold text-blue-600 mb-1">
                  {plan.duration}
                </h3>
                {plan.subtitle && (
                  <p className="text-sm text-gray-500 mb-4">{plan.subtitle}</p>
                )}

                <div className="mb-4">
                  <p className="text-sm text-gray-500 line-through">
                    {plan.originalPrice}
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-800">
                      {plan.pricePerMonth}
                    </span>
                    <span className="text-gray-600 ml-1">/tháng</span>
                  </div>
                </div>

                <p className="text-blue-700 font-medium mb-6 min-h-[3rem] flex items-center justify-center">
                  {plan.description}
                </p>
                <Link to="/firstplan">
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-3 px-6 rounded-lg font-medium transition-all duration-200 mb-6 ${
                      plan.buttonStyle === "primary"
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg"
                        : "border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    {plan.buttonText}
                  </button>
                </Link>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 text-sm">
                  Tính năng bao gồm:
                </h4>
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Premium;
