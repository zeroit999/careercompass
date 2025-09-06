import React, { useEffect } from "react";
import Header from "../Header/header";
import {
  Search,
  Star,
  Heart,
  Eye,
  MessageCircle,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  CheckCircle,
  Bot,
  FileText,
  Brain,
  MessageSquare,
  Target,
  Zap,
} from "lucide-react";

const Home = () => {
  useEffect(() => {
    const nav = document.getElementById("mainNav");
    const handleScroll = () => {
      const currentScroll = window.pageYOffset;
      if (currentScroll <= 0) {
        nav.classList.remove("fixed");
        nav.classList.add("block");
      } else {
        nav.classList.remove("block");
        nav.classList.add("fixed");
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <style>{`
        .hero-pattern {
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .nav-transition {
          transition: all 0.3s ease-in-out;
        }
      `}</style>

      <Header />

      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 hero-pattern">
        <div className="absolute inset-0 overflow-hidden ">
          <div
            className="absolute -top-28 -right-40 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float"
            style={{
              animationDuration: "8s",
              animationTimingFunction: "ease-in-out",
              transformOrigin: "center center",
            }}
          ></div>

          <div
            className="absolute -bottom-32 -left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-float"
            style={{
              animationDuration: "10s",
              animationDelay: "-2s",
              animationTimingFunction: "ease-in-out",
              transformOrigin: "center center",
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10  mt-24">
          <div className="text-center">
            <h1 className="text-4xl tracking-tight font-extrabold text-gray-800 sm:text-5xl md:text-7xl">
              <span className="block">Định hướng nghề nghiệp</span>
              <span className="block text-blue-600 mt-8 italic">
                cùng{" "}
                <span className="bg-blue-600 text-white px-4 rounded">
                  Career Compass 🌟
                </span>{" "}
              </span>
            </h1>
            <p className="mt-12 max-w-2xl mx-auto text-lg text-blue-600 italic">
              Nền tảng chatbot AI giúp học sinh, sinh viên luyện tập phỏng vấn,
              đánh giá CV và phát triển kỹ năng toàn diện và định hướng nghề
              nghiệp
            </p>
            <div className="mt-10 flex justify-center space-x-4">
              <a
                href="../pv/interview.html"
                className="px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-50 transition duration-300"
              >
                Khám phá ngay
              </a>
              <a
                href="https://www.facebook.com/nctstemists"
                className="px-8 py-3 border bg-blue-700 text-base font-medium rounded-md text-white hover:bg-blue-300 transition duration-300"
              >
                Xem demo
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 "></div>
      </section>

      {/* Features Section - Updated with Questic Style */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-lg text-blue-700">
              Khám phá những tính năng độc đáo giúp bạn chuẩn bị tốt nhất cho sự
              nghiệp
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Phỏng vấn thông minh
              </h3>
              <p className="text-blue-700">
                Luyện tập với AI Coach, mô phỏng các tình huống phỏng vấn thực
                tế
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Đánh giá CV
              </h3>
              <p className="text-blue-700">
                Phân tích và chấm điểm hồ sơ, phát hiện điểm yếu cần cải thiện
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Lộ trình phát triển
              </h3>
              <p className="text-blue-700">
                Đề xuất kế hoạch cải thiện kỹ năng dựa trên đánh giá AI
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Phản hồi tức thì
              </h3>
              <p className="text-blue-700">
                Nhận đánh giá chi tiết và gợi ý cải thiện ngay sau mỗi buổi
                luyện tập
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                AI thông minh
              </h3>
              <p className="text-blue-700">
                Sử dụng công nghệ AI tiên tiến để phân tích và đánh giá toàn
                diện
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Bài tập tình huống
              </h3>
              <p className="text-blue-700">
                Thực hành với các tình huống thực tế từ nhiều ngành nghề khác
                nhau
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Cách sử dụng
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Chỉ với 3 bước đơn giản để bắt đầu hành trình của bạn
            </p>
          </div>

          <div className="mt-16 space-y-16">
            <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
              <div className="w-full md:w-1/2">
                <img
                  src={"./Untitled design (5).png"}
                  alt="Tạo tài khoản"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white">
                    <span className="text-lg font-bold">1</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Nhập thông tin cơ bản
                  </h3>
                </div>
                <p className="mt-4 text-lg text-gray-600">
                  Đăng ký nhanh chóng và dễ dàng chỉ với email của bạn. Bạn sẽ
                  có ngay một tài khoản để bắt đầu hành trình luyện tập phỏng
                  vấn.
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
              <div className="w-full md:w-1/2 mt-8">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white">
                    <span className="text-lg font-bold">2</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Chọn chế độ
                  </h3>
                </div>
                <p className="mt-4 text-lg text-gray-600">
                  Lựa chọn lĩnh vực bạn muốn luyện tập từ nhiều ngành nghề khác
                  nhau. Mỗi lĩnh vực đều có những bộ câu hỏi được thiết kế
                  riêng.
                </p>
              </div>
              <div className="w-full md:w-1/2">
                <img
                  src={"./Untitled design (4).png"}
                  alt="Chọn chủ đề"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-8">
              <div className="w-full md:w-1/2">
                <img
                  src={"./Untitled design (6).png"}
                  alt="Bắt đầu luyện tập"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
              <div className="w-full md:w-1/2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-blue-600 text-white">
                    <span className="text-lg font-bold">3</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Bắt đầu luyện tập
                  </h3>
                </div>
                <p className="mt-4 text-lg text-gray-600">
                  Tương tác với AI Coach và nhận phản hồi chi tiết về câu trả
                  lời của bạn. Hệ thống sẽ phân tích và đưa ra những gợi ý cải
                  thiện cụ thể.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Updated with Questic Style */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl mb-4">
              Đánh giá từ người dùng
            </h2>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">NH</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Nguyễn Thị Hương
                  </h4>
                  <p className="text-blue-700">Sinh viên ĐH Bách Khoa</p>
                </div>
              </div>
              <p className="text-blue-700">
                "AI Interview Coach đã giúp tôi tự tin hơn rất nhiều trong các
                buổi phỏng vấn thực tế. Các phản hồi rất chi tiết và hữu ích!"
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">TM</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Trần Văn Minh
                  </h4>
                  <p className="text-blue-700">Sinh viên ĐH Kinh tế</p>
                </div>
              </div>
              <p className="text-blue-700">
                "Tôi đã cải thiện kỹ năng trả lời phỏng vấn đáng kể nhờ vào các
                bài tập tình huống thực tế từ nền tảng này."
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">LA</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Lê Thị Anh
                  </h4>
                  <p className="text-blue-700">Sinh viên ĐH Ngoại thương</p>
                </div>
              </div>
              <p className="text-blue-700">
                "Phần đánh giá CV rất hữu ích, giúp tôi phát hiện và khắc phục
                những điểm yếu trong hồ sơ của mình."
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">NT</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Nguyễn Thị Thu Thảo
                  </h4>
                  <p className="text-blue-700">Sinh viên ĐH Bách Khoa</p>
                </div>
              </div>
              <p className="text-blue-700">
                "Nhờ AI Interview Coach, tôi đã cảm thấy tự tin hơn hẳn mỗi khi
                tham gia phỏng vấn. Những góp ý từ hệ thống thực sự rõ ràng"
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">PB</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Phạm Gia Bảo
                  </h4>
                  <p className="text-blue-700">Sinh viên ĐH Kinh tế</p>
                </div>
              </div>
              <p className="text-blue-700">
                "Tôi đã nâng cao kỹ năng trả lời phỏng vấn rõ rệt nhờ vào những
                tình huống thực tế mà nền tảng cung cấp."
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">NA</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-bold text-blue-800">
                    Nguyễn Thị Ánh
                  </h4>
                  <p className="text-blue-700">Sinh viên ĐH Ngoại thương</p>
                </div>
              </div>
              <p className="text-blue-700">
                "Phần đánh giá CV rất hữu ích, giúp tôi phát hiện và khắc phục
                những điểm yếu trong hồ sơ của mình."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Updated with Questic Style */}
      <section
        id="why-us"
        className="py-20 bg-gradient-to-br from-blue-50 to-blue-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-800 sm:text-4xl mb-4">
              Tại sao chọn chúng tôi?
            </h2>
          </div>
          <div className="mt-16 space-y-6">
            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-blue-600 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Công nghệ AI tiên tiến
                  </h3>
                  <p className="text-blue-700 leading-relaxed">
                    Sử dụng các mô hình AI mới nhất như GPT, Gemini để đánh giá
                    toàn diện kỹ năng phỏng vấn của bạn. Hệ thống không chỉ phân
                    tích nội dung câu trả lời mà còn nhận diện cách diễn đạt,
                    logic trình bày và thậm chí là độ tự tin qua giọng nói (nếu
                    có). Bạn sẽ nhận được phản hồi theo thời gian thực, giúp
                    điều chỉnh và cải thiện nhanh chóng.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-green-600 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Nội dung đa dạng
                  </h3>
                  <p className="text-blue-700 leading-relaxed">
                    Kho bài tập và tình huống được thiết kế dựa trên hàng nghìn
                    buổi phỏng vấn thực tế từ các lĩnh vực như Công nghệ,
                    Marketing, Tài chính, Nhân sự,... Mỗi buổi luyện tập đều có
                    thể cá nhân hóa theo mục tiêu nghề nghiệp, giúp bạn rèn
                    luyện đúng trọng tâm và tiết kiệm thời gian.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-purple-600 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Phản hồi chi tiết
                  </h3>
                  <p className="text-blue-700 leading-relaxed">
                    Sau mỗi buổi luyện tập, bạn sẽ nhận được bản phân tích chi
                    tiết về điểm mạnh và điểm cần cải thiện, kèm theo các gợi ý
                    cụ thể để nâng cao từng khía cạnh. Hệ thống còn theo dõi
                    tiến trình của bạn qua từng phiên luyện tập để bạn thấy rõ
                    sự tiến bộ của mình theo thời gian.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="text-xl font-bold text-white">Questic</span>
              </div>
              <p className="text-gray-400 mb-4">
                Nền tảng AI hàng đầu giúp bạn phát triển kỹ năng phỏng vấn và
                định hướng nghề nghiệp
              </p>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a
                  href="#"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Sản phẩm
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Luyện phỏng vấn
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Đánh giá CV
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Định hướng nghề nghiệp
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Kỹ năng mềm
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
                Hỗ trợ
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Điều khoản
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Bảo mật
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <p className="text-gray-400 text-center">
              &copy; 2025 Questic. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home;
