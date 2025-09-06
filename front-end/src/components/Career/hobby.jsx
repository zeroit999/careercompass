import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  Clock,
  AlertCircle,
  Brain,
  Target,
  TrendingUp,
  ArrowLeft,
  Wrench,
  Search,
  Heart,
  Briefcase,
  CheckCircle,
  Paintbrush,
  FileText,
  Download,
  Share2,
  ExternalLink,
} from "lucide-react";
import { db, auth } from "../firebase.js";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import AIKhaiPhaAssistant from "./AIKhaiPhaAssistant";
// Helper function để tạo URL cho major group
const getMajorGroupUrl = (majorName) => {
  // Tạo slug từ tên ngành
  const slug = majorName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim("_");
  return `/major/${slug}`;
};

// Helper function để generate career fields dựa trên MBTI
const generateCareerFields = (mbtiResult) => {
  const careerFieldsMap = {
    INTJ: [
      {
        name: "Khối A - Toán, Lý, Hóa",
        description:
          "Phù hợp với tư duy logic, khả năng phân tích và giải quyết vấn đề phức tạp.",
        career: "Kỹ sư, Lập trình viên, Nhà khoa học...",
        compatibility: "92%",
      },
      {
        name: "Khối D - Toán, Văn, Anh",
        description:
          "Kết hợp tư duy logic với khả năng giao tiếp, phù hợp cho các ngành quản trị, kinh tế.",
        career: "Quản trị kinh doanh, Tài chính, Kinh tế...",
        compatibility: "85%",
      },
      {
        name: "Khối B - Toán, Hóa, Sinh",
        description:
          "Thích hợp cho nghiên cứu khoa học, y học và các ngành liên quan đến sức khỏe.",
        career: "Bác sĩ, Dược sĩ, Nhà nghiên cứu...",
        compatibility: "80%",
      },
    ],
    INTP: [
      {
        name: "Khối A - Toán, Lý, Hóa",
        description: "Hoàn hảo cho tư duy phân tích và khám phá khoa học.",
        career: "Nhà nghiên cứu, Kỹ sư, Nhà khoa học...",
        compatibility: "95%",
      },
      {
        name: "Khối B - Toán, Hóa, Sinh",
        description: "Thích hợp cho nghiên cứu khoa học cơ bản và ứng dụng.",
        career: "Nhà sinh học, Nhà hóa học, Nghiên cứu y học...",
        compatibility: "88%",
      },
      {
        name: "Khối C - Văn, Sử, Địa",
        description: "Phù hợp cho nghiên cứu xã hội và nhân văn.",
        career: "Nhà nghiên cứu xã hội, Giáo viên, Nhà văn...",
        compatibility: "75%",
      },
    ],
    // Thêm các MBTI types khác...
  };

  return (
    careerFieldsMap[mbtiResult] || [
      {
        name: "Khối A - Toán, Lý, Hóa",
        description: "Phù hợp với tư duy logic và khả năng phân tích.",
        career: "Kỹ sư, Khoa học...",
        compatibility: "85%",
      },
      {
        name: "Khối B - Toán, Hóa, Sinh",
        description: "Thích hợp cho nghiên cứu khoa học và y học.",
        career: "Bác sĩ, Nghiên cứu...",
        compatibility: "80%",
      },
      {
        name: "Khối C - Văn, Sử, Địa",
        description: "Phù hợp cho các ngành xã hội và nhân văn.",
        career: "Giáo viên, Xã hội...",
        compatibility: "75%",
      },
    ]
  );
};

const QuesticHobbyAdvisor = () => {
  const riasecQuestions = [
    // Realistic – R
    { id: 1, question: "Tự mua và lắp ráp máy vi tính theo ý mình", type: "R" },
    {
      id: 2,
      question: "Lắp ráp tủ theo hướng dẫn của sách hướng dẫn hoặc trang mạng",
      type: "R",
    },
    {
      id: 3,
      question:
        "Trang điểm cho mình hay cho bạn theo hướng dẫn của sách hướng dẫn hoặc trang mạng",
      type: "R",
    },
    { id: 4, question: "Cắt tỉa cây cảnh", type: "R" },
    {
      id: 5,
      question: "Tháo điện thoại di động hay máy tính ra để tìm hiểu",
      type: "R",
    },
    {
      id: 6,
      question:
        "Tham gia một chuyến du lịch thám hiểm (như khám phá hang động, núi rừng)",
      type: "R",
    },
    { id: 7, question: "Chăm sóc vật nuôi", type: "R" },
    { id: 8, question: "Sửa xe, như xe đạp, xe máy (các lỗi nhỏ)", type: "R" },
    { id: 9, question: "Làm đồ nội thất", type: "R" },
    { id: 10, question: "Lắp ráp máy vi tính", type: "R" },
    { id: 11, question: "Leo núi", type: "R" },
    { id: 12, question: "Đóng gói đồ đạc vào thùng", type: "R" },
    { id: 13, question: "Chơi một môn thể thao", type: "R" },
    {
      id: 14,
      question:
        "Tham gia chuyến đạp xe xuyên quốc gia (từ TPHCM ra Hà Nội, từ Hà Nội vào TPHCM)",
      type: "R",
    },

    // Investigative – I
    { id: 15, question: "Tham quan bảo tàng", type: "I" },
    {
      id: 16,
      question: "Tìm hiểu sự hình thành của các vì sao và vũ trụ",
      type: "I",
    },
    {
      id: 17,
      question: "Tìm hiểu về văn hóa một quốc gia mà mình thích",
      type: "I",
    },
    { id: 18, question: "Tìm hiểu về tâm lý con người", type: "I" },
    {
      id: 19,
      question:
        "Đọc một cuốn sách về tương lai của loài người trong một triệu năm nữa",
      type: "I",
    },
    {
      id: 20,
      question: "Đọc sách, báo hay xem trang tin tức về khoa học",
      type: "I",
    },
    { id: 21, question: "Tìm hiểu về cảm xúc con người", type: "I" },
    { id: 22, question: "Được xem một ca mổ tim", type: "I" },
    {
      id: 23,
      question:
        "Tìm hiểu về nguồn gốc của một dịch bệnh, nguồn gốc của con người,...",
      type: "I",
    },
    {
      id: 24,
      question:
        "Đọc các bài báo về ảnh hưởng của AI (Trí tuệ nhân tạo) lên nghề nghiệp tương lai",
      type: "I",
    },
    {
      id: 25,
      question:
        "Tìm hiểu về thế giới động vật (qua các kênh tìm hiểu khoa học)",
      type: "I",
    },
    { id: 26, question: "Phát minh xe điện", type: "I" },
    { id: 27, question: "Tiến hành thí nghiệm hóa học", type: "I" },
    { id: 28, question: "Nghiên cứu về chế độ dinh dưỡng", type: "I" },

    // Artistic – A
    {
      id: 29,
      question: "Tạo ra một tác phẩm nghệ thuật, tranh, câu chuyện",
      type: "A",
    },
    { id: 30, question: "Viết truyện ngắn", type: "A" },
    {
      id: 31,
      question:
        "Chứng tỏ năng lực nghệ thuật của bản thân với người khác (nói lên suy nghĩ/quan điểm qua tác phẩm nghệ thuật)",
      type: "A",
    },
    { id: 32, question: "Chơi trong một ban nhạc", type: "A" },
    { id: 33, question: "Chỉnh sửa phim", type: "A" },
    {
      id: 34,
      question: "Thuyết trình hoặc thiết kế, theo ý tưởng của mình",
      type: "A",
    },
    { id: 35, question: "Vẽ phim hoạt hình", type: "A" },
    { id: 36, question: "Hát trong một ban nhạc", type: "A" },
    { id: 37, question: "Biểu diễn nhảy hiện đại", type: "A" },
    { id: 38, question: "Dẫn chương trình (MC) cho một sự kiện", type: "A" },
    {
      id: 39,
      question: "Độc thoại hay kể chuyện trên đài phát thanh/phần mềm",
      type: "A",
    },
    {
      id: 40,
      question: "Viết kịch bản cho phim hoặc chương trình truyền hình",
      type: "A",
    },
    {
      id: 41,
      question:
        "Chụp ảnh cho các sự kiện trong cuộc sống hoặc sự kiện nghệ thuật",
      type: "A",
    },
    {
      id: 42,
      question: "Viết một bài phê bình phim cho bộ phim mình thích/ghét nhất",
      type: "A",
    },

    // Social – S
    { id: 43, question: "Giúp người khác chọn nghề nghiệp phù hợp", type: "S" },
    { id: 44, question: "Kết nối hai người bạn với nhau", type: "S" },
    {
      id: 45,
      question: "Dạy cho bạn mình cách giảm cân qua ăn uống đúng cách",
      type: "S",
    },
    {
      id: 46,
      question: "Tham gia ngày trái đất bằng cách lượm rác hay tắt điện",
      type: "S",
    },
    { id: 47, question: "Hướng dẫn khách nước ngoài chỗ ăn ngon", type: "S" },
    { id: 48, question: "Cứu động vật bị bỏ rơi ngoài đường", type: "S" },
    { id: 49, question: "Tham gia vào một cuộc thảo luận nhóm nhỏ", type: "S" },
    { id: 50, question: "Kể chuyện cười cho bạn bè nghe", type: "S" },
    {
      id: 51,
      question: "Dạy trẻ con chơi một trò chơi hay một môn thể thao",
      type: "S",
    },
    {
      id: 52,
      question: "Lắng nghe bạn bè tâm sự về vấn đề cá nhân của họ",
      type: "S",
    },
    {
      id: 53,
      question: "Giúp bạn bè giải quyết vấn đề liên quan đến tình yêu",
      type: "S",
    },
    { id: 54, question: "Tham gia một chuyến đi từ thiện", type: "S" },
    {
      id: 55,
      question: "Giúp một dự án cộng đồng trong sức của mình",
      type: "S",
    },
    {
      id: 56,
      question: "Sẵn sàng giúp thầy cô, bạn bè khi thấy họ cần",
      type: "S",
    },

    // Enterprising – E
    { id: 57, question: "Tham gia ban đại diện học sinh ở trường", type: "E" },
    { id: 58, question: "Làm cán bộ lớp", type: "E" },
    { id: 59, question: "Bán hàng trực tuyến", type: "E" },
    { id: 60, question: "Quản lý một cửa hàng trực tuyến", type: "E" },
    { id: 61, question: "Học về thị trường chứng khoán", type: "E" },
    {
      id: 62,
      question: "Tham gia một khóa học về quản lý tài chính",
      type: "E",
    },
    {
      id: 63,
      question:
        "Tham dự một trại huấn luyện kỹ năng lãnh đạo dành cho lứa tuổi thanh thiếu niên",
      type: "E",
    },
    {
      id: 64,
      question: "Lập kế hoạch làm việc cho thành viên nhóm",
      type: "E",
    },
    { id: 65, question: "Kiếm tiền bằng cách kinh doanh online", type: "E" },
    {
      id: 66,
      question: "Nói trước đám đông về một đề tài bạn thích",
      type: "E",
    },
    {
      id: 67,
      question: "Tham gia xây dựng các luật lệ mới cho lớp/ trường",
      type: "E",
    },
    { id: 68, question: "Thuyết phục cha mẹ theo ý mình", type: "E" },
    { id: 69, question: "Tổ chức đi chơi cho một nhóm bạn", type: "E" },
    { id: 70, question: "Kiếm tiền bằng cách làm thêm", type: "E" },

    // Conventional – C
    { id: 71, question: "Mở tài khoản tiết kiệm", type: "C" },
    { id: 72, question: "Lập kế hoạch chi tiêu hàng tháng", type: "C" },
    {
      id: 73,
      question: "Chuẩn bị ngân sách cho chuyến đi chơi tập thể lớp",
      type: "C",
    },
    { id: 74, question: "Chuẩn bị cho buổi trình bày trước lớp", type: "C" },
    { id: 75, question: "Lập kế hoạch cho kỳ nghỉ hè/ Tết", type: "C" },
    { id: 76, question: "Đếm và sắp xếp tiền", type: "C" },
    { id: 77, question: "Sắp xếp lại bàn học", type: "C" },
    { id: 78, question: "Viết kế hoạch học tập cho học kỳ mới", type: "C" },
    { id: 79, question: "Hoàn tất bài tập theo đúng hạn được giao", type: "C" },
    {
      id: 80,
      question: "Dò lỗi chính tả trong văn bản hoặc bài viết",
      type: "C",
    },
    {
      id: 81,
      question:
        "Học một khóa vi tính văn phòng và biết cách sắp xếp văn bản, thư mục sao cho chỉn chu",
      type: "C",
    },
    { id: 82, question: "Làm thủ quỹ cho lớp", type: "C" },
    { id: 83, question: "Sắp xếp lại tủ quần áo cá nhân", type: "C" },
    {
      id: 84,
      question:
        "Giúp cha mẹ quản lí tiền chợ của gia đình (mua gì, mua khi nào, mua bao nhiêu)",
      type: "C",
    },
  ];

  const groups = [
    {
      type: "R",
      name: "Kỹ thuật (Realistic)",
      description: "Thích làm việc với tay, máy móc, công cụ",
    },
    {
      type: "I",
      name: "Nghiên cứu (Investigative)",
      description: "Thích tìm hiểu, phân tích, nghiên cứu",
    },
    {
      type: "A",
      name: "Nghệ thuật (Artistic)",
      description: "Thích sáng tạo, nghệ thuật, thể hiện bản thân",
    },
    {
      type: "S",
      name: "Xã hội (Social)",
      description: "Thích giúp đỡ, dạy dỗ, chăm sóc người khác",
    },
    {
      type: "E",
      name: "Quản lý (Enterprising)",
      description: "Thích lãnh đạo, thuyết phục, kinh doanh",
    },
    {
      type: "C",
      name: "Nghiệp vụ (Conventional)",
      description: "Thích tổ chức, sắp xếp, làm việc có hệ thống",
    },
  ];

  // State management
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [scores, setScores] = useState({ R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 });

  // Đọc dữ liệu MBTI từ localStorage
  const [previousData, setPreviousData] = useState(null);

  useEffect(() => {
    const savedData = localStorage.getItem("questicMBTIData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setPreviousData(parsedData);
      } catch (error) {
        console.error("Error parsing MBTI data:", error);
      }
    }
  }, []);

  // Không lưu test vào Firebase ngay khi hoàn thành
  // Test sẽ được lưu khi AI analysis hoàn thành

  const steps = ["Test RIASEC", "Hoàn tất", "Kết quả tổng hợp"];

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (currentStep === 0) {
      const totalQuestions = riasecQuestions.length;
      const answeredQuestions = Object.keys(answers).length;
      return (answeredQuestions / totalQuestions) * 75; // 75% for completing test
    }
    if (currentStep === 1) return 85;
    return 100;
  };

  // Get icon for RIASEC type
  const getTypeIcon = (type) => {
    switch (type) {
      case "R":
        return <Wrench className="w-6 h-6" />;
      case "I":
        return <Search className="w-6 h-6" />;
      case "A":
        return <Paintbrush className="w-6 h-6" />;
      case "S":
        return <Heart className="w-6 h-6" />;
      case "E":
        return <Briefcase className="w-6 h-6" />;
      case "C":
        return <FileText className="w-6 h-6" />;
      default:
        return <Target className="w-6 h-6" />;
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  // Validate current group
  const validateCurrentGroup = () => {
    const currentGroupQuestions = riasecQuestions.filter(
      (q) => q.type === groups[currentGroupIndex].type
    );
    return currentGroupQuestions.every((q) => answers[q.id] !== undefined);
  };

  // Handle next group or finish
  const handleNext = () => {
    if (!validateCurrentGroup()) {
      alert("Bạn cần trả lời đủ 14 câu hỏi trước khi tiếp tục.");
      return;
    }

    if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex((prev) => prev + 1);
    } else {
      // All groups completed, calculate results
      setCurrentStep(1);

      // Simulate processing time
      setTimeout(() => {
        calculateResults();
      }, 2000);
    }
  };

  // Calculate RIASEC results
  const calculateResults = async () => {
    const newScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    riasecQuestions.forEach((q) => {
      if (answers[q.id] !== undefined) {
        newScores[q.type] += answers[q.id];
      }
    });

    setScores(newScores);

    // Lưu dữ liệu test vào Firebase ngay khi hoàn thành
    try {
      const user = auth.currentUser;
      const careerRecommendations = getCareerRecommendations();

      const aiData = {
        mbti_description: previousData.mbtiDescription,
        career_fields: generateCareerFields(previousData.mbtiResult),
      };

      const testData = {
        type: "full_test",
        userUid: user ? user.uid : null,
        name: previousData.name,
        grade: previousData.grade,
        province: previousData.province,
        email: previousData.email,
        phone: previousData.phone,
        mbtiResult: previousData.mbtiResult,
        mbtiPercentages: previousData.mbtiPercentages,
        mbtiDescription: previousData.mbtiDescription,
        riasecAnswers: answers,
        riasecScores: newScores,
        careerRecommendations: careerRecommendations,
        aiData: aiData,
        aiAnalysisCompleted: false, // Đánh dấu chưa có AI analysis
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "career_tests"), testData);
      console.log("Test data saved to Firebase with ID:", docRef.id);

      // Lưu test ID vào localStorage để có thể redirect
      localStorage.setItem("lastTestId", docRef.id);
    } catch (error) {
      console.error("Error saving test data:", error);
    }

    setCurrentStep(2);
  };

  // Generate PDF report
  const generatePDFReport = () => {
    const careerRecommendations = getCareerRecommendations();
    const sortedScores = Object.entries(scores)
      .map(([type, score]) => ({
        type,
        score,
        percentage: Math.round((score / (14 * 5)) * 100),
        name: groups.find((g) => g.type === type).name,
        description: groups.find((g) => g.type === type).description,
      }))
      .sort((a, b) => b.score - a.score);

    // Create PDF content
    const pdfContent = `
      <html>
        <head>
          <title>Career Compass - Kết quả Test</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; color: #1e40af; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .career-item { margin-bottom: 15px; padding: 10px; border: 1px solid #dbeafe; border-radius: 8px; }
            .career-name { font-weight: bold; color: #1e40af; }
            .career-score { color: #059669; font-weight: bold; }
            .mbti-section { background: #f3e8ff; padding: 10px; border-radius: 8px; margin-bottom: 15px; }
            .riasec-section { background: #f0fdf4; padding: 10px; border-radius: 8px; margin-bottom: 15px; }
            .score-bar { background: #e5e7eb; height: 20px; border-radius: 10px; overflow: hidden; }
            .score-fill { background: linear-gradient(to right, #10b981, #059669); height: 100%; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 Career Compass - Kết quả Test</h1>
            <p>Ngày tạo: ${new Date().toLocaleDateString("vi-VN")}</p>
          </div>

          <div class="section">
            <div class="section-title">📊 Kết quả MBTI</div>
            <div class="mbti-section">
              <p><strong>Nhóm tính cách:</strong> ${
                previousData?.mbtiResult || "N/A"
              }</p>
              <p><strong>Mô tả:</strong> ${
                previousData?.mbtiDescription || "N/A"
              }</p>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🎯 Kết quả RIASEC</div>
            ${sortedScores
              .map(
                (item, index) => `
              <div class="career-item">
                <div class="career-name">#${index + 1} ${item.name}</div>
                <p>${item.description}</p>
                <p><strong>Điểm số:</strong> ${item.score}/${14 * 5} (${
                  item.percentage
                }%)</p>
                <div class="score-bar">
                  <div class="score-fill" style="width: ${
                    item.percentage
                  }%"></div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">💼 Top 5 Ngành Nghề Phù Hợp</div>
            ${careerRecommendations
              .map(
                (career, index) => `
              <div class="career-item">
                <div class="career-name">#${index + 1} ${career.name}</div>
                <p>${career.description}</p>
                <p class="career-score">Độ tương thích: ${career.score.toFixed(
                  1
                )}/5.0</p>
                <p><strong>MBTI phù hợp:</strong> ${career.mbtiTypes.join(
                  ", "
                )}</p>
                <p><strong>RIASEC phù hợp:</strong> ${career.riasecTypes.join(
                  ", "
                )}</p>
              </div>
            `
              )
              .join("")}
          </div>

          <div class="section">
            <div class="section-title">ℹ️ Lưu ý</div>
            <p>Kết quả này được tính toán dựa trên sự kết hợp giữa tính cách MBTI (60%) và sở thích RIASEC (40%). 
            Đây chỉ là gợi ý tham khảo, bạn nên cân nhắc thêm các yếu tố khác như khả năng, đam mê và cơ hội thực tế.</p>
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([pdfContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `career-compass-result-${
      new Date().toISOString().split("T")[0]
    }.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Career recommendation logic
  const getCareerRecommendations = () => {
    if (!previousData || !scores) return [];

    const careers = [
      {
        name: "Kế toán - Kiểm toán",
        mbtiTypes: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
        riasecTypes: ["C", "I"],
        description: "Quản lý tài chính, kiểm toán và báo cáo",
      },
      {
        name: "Tài chính - Ngân hàng - Bảo hiểm",
        mbtiTypes: ["ISTJ", "ESTJ", "INTJ", "ENTJ"],
        riasecTypes: ["C", "E"],
        description: "Quản lý tài chính và dịch vụ ngân hàng",
      },
      {
        name: "Kinh tế - Quản trị kinh doanh - Thương mại",
        mbtiTypes: ["ENTJ", "ESTJ", "ENFJ", "ENTP"],
        riasecTypes: ["E", "C"],
        description: "Quản lý doanh nghiệp và kinh doanh",
      },
      {
        name: "Công nghệ thông tin - Tin học",
        mbtiTypes: ["INTJ", "INTP", "ENTJ", "ENTP"],
        riasecTypes: ["I", "R"],
        description: "Phát triển phần mềm và hệ thống CNTT",
      },
      {
        name: "Công nghiệp bán dẫn",
        mbtiTypes: ["INTJ", "INTP", "ISTP", "ESTP"],
        riasecTypes: ["I", "R"],
        description: "Thiết kế và sản xuất chip điện tử",
      },
      {
        name: "Báo chí - Marketing - Quảng cáo - PR",
        mbtiTypes: ["ENFJ", "ENFP", "ENTJ", "ENTP"],
        riasecTypes: ["A", "E"],
        description: "Truyền thông và marketing",
      },
      {
        name: "Sư phạm - Giáo dục",
        mbtiTypes: ["ENFJ", "ENFP", "INFJ", "INFP"],
        riasecTypes: ["S", "A"],
        description: "Giảng dạy và đào tạo",
      },
      {
        name: "Y - Dược",
        mbtiTypes: ["INTJ", "INTP", "ISFJ", "INFJ"],
        riasecTypes: ["I", "S"],
        description: "Chăm sóc sức khỏe và điều trị",
      },
      {
        name: "Bác sĩ thú y",
        mbtiTypes: ["ISFJ", "INFJ", "ISTP", "INTP"],
        riasecTypes: ["S", "I"],
        description: "Chăm sóc và điều trị động vật",
      },
      {
        name: "Công an - Quân đội",
        mbtiTypes: ["ISTJ", "ESTJ", "ISTP", "ESTP"],
        riasecTypes: ["R", "C"],
        description: "Bảo vệ an ninh và trật tự",
      },
      {
        name: "Thiết kế đồ họa - Game - Đa phương tiện",
        mbtiTypes: ["INFP", "ENFP", "ISFP", "ESFP"],
        riasecTypes: ["A", "I"],
        description: "Thiết kế sáng tạo và phát triển game",
      },
      {
        name: "Xây dựng - Kiến trúc - Giao thông",
        mbtiTypes: ["INTJ", "INTP", "ISTP", "ESTP"],
        riasecTypes: ["R", "A"],
        description: "Thiết kế và xây dựng công trình",
      },
      {
        name: "Ngoại giao - Ngoại ngữ",
        mbtiTypes: ["ENFJ", "ENFP", "INFJ", "INFP"],
        riasecTypes: ["S", "A"],
        description: "Quan hệ quốc tế và ngôn ngữ",
      },
      {
        name: "Ngoại thương - Xuất nhập khẩu - Kinh tế quốc tế",
        mbtiTypes: ["ENTJ", "ESTJ", "ENFJ", "ENTP"],
        riasecTypes: ["E", "C"],
        description: "Thương mại quốc tế và xuất nhập khẩu",
      },
      {
        name: "Du lịch - Khách sạn",
        mbtiTypes: ["ESFJ", "ENFJ", "ESFP", "ENFP"],
        riasecTypes: ["S", "E"],
        description: "Dịch vụ du lịch và khách sạn",
      },
      {
        name: "Ô tô - Cơ khí - Chế tạo",
        mbtiTypes: ["ISTP", "ESTP", "INTJ", "INTP"],
        riasecTypes: ["R", "I"],
        description: "Sản xuất và chế tạo máy móc",
      },
      {
        name: "Điện lạnh - Điện tử - Điện - Tự động hóa",
        mbtiTypes: ["INTJ", "INTP", "ISTP", "ESTP"],
        riasecTypes: ["R", "I"],
        description: "Hệ thống điện và tự động hóa",
      },
      {
        name: "Hàng hải - Thủy lợi - Thời tiết",
        mbtiTypes: ["ISTP", "INTP", "INTJ", "ISTJ"],
        riasecTypes: ["R", "I"],
        description: "Hàng hải và thủy lợi",
      },
      {
        name: "Hàng không - Vũ trụ - Hạt nhân",
        mbtiTypes: ["INTJ", "INTP", "ISTP", "ESTP"],
        riasecTypes: ["I", "R"],
        description: "Hàng không và công nghệ vũ trụ",
      },
      {
        name: "Công nghệ vật liệu",
        mbtiTypes: ["INTJ", "INTP", "ISTP", "ESTP"],
        riasecTypes: ["I", "R"],
        description: "Nghiên cứu và phát triển vật liệu",
      },
      {
        name: "Công nghệ chế biến thực phẩm",
        mbtiTypes: ["ISFJ", "ISTJ", "INTP", "INTJ"],
        riasecTypes: ["I", "R"],
        description: "Chế biến và bảo quản thực phẩm",
      },
      {
        name: "Công nghệ In - Giấy",
        mbtiTypes: ["ISTP", "ESTP", "ISTJ", "ESTJ"],
        riasecTypes: ["R", "C"],
        description: "Công nghệ in ấn và giấy",
      },
      {
        name: "Công nghệ sinh - Hóa",
        mbtiTypes: ["INTJ", "INTP", "ISFJ", "INFJ"],
        riasecTypes: ["I", "R"],
        description: "Công nghệ sinh học và hóa học",
      },
      {
        name: "Luật - Tòa án",
        mbtiTypes: ["ENTJ", "INTJ", "ESTJ", "ISTJ"],
        riasecTypes: ["E", "C"],
        description: "Tư vấn pháp lý và tòa án",
      },
      {
        name: "Mỏ - Địa chất",
        mbtiTypes: ["ISTP", "INTP", "INTJ", "ISTJ"],
        riasecTypes: ["I", "R"],
        description: "Khai thác mỏ và địa chất",
      },
      {
        name: "Mỹ thuật - Âm nhạc - Nghệ thuật",
        mbtiTypes: ["INFP", "ENFP", "ISFP", "ESFP"],
        riasecTypes: ["A", "I"],
        description: "Nghệ thuật và sáng tạo",
      },
      {
        name: "Tài nguyên - Môi trường",
        mbtiTypes: ["INFJ", "INFP", "ISFJ", "INTP"],
        riasecTypes: ["I", "S"],
        description: "Bảo vệ môi trường và tài nguyên",
      },
      {
        name: "Tâm lý",
        mbtiTypes: ["INFJ", "INFP", "ENFJ", "ENFP"],
        riasecTypes: ["S", "I"],
        description: "Tư vấn tâm lý và nghiên cứu",
      },
      {
        name: "Thể dục - Thể thao",
        mbtiTypes: ["ESFP", "ESTP", "ENFP", "ENTP"],
        riasecTypes: ["R", "S"],
        description: "Thể dục thể thao và huấn luyện",
      },
      {
        name: "Thời trang - May mặc",
        mbtiTypes: ["ISFP", "ESFP", "INFP", "ENFP"],
        riasecTypes: ["A", "R"],
        description: "Thiết kế thời trang và may mặc",
      },
      {
        name: "Thủy sản - Lâm nghiệp - Nông nghiệp",
        mbtiTypes: ["ISFJ", "ISTJ", "ISTP", "INTP"],
        riasecTypes: ["R", "I"],
        description: "Nông nghiệp và thủy sản",
      },
      {
        name: "Toán học và thống kê",
        mbtiTypes: ["INTJ", "INTP", "ISTJ", "ISTP"],
        riasecTypes: ["I", "C"],
        description: "Toán học và thống kê",
      },
      {
        name: "Nhân sự - Hành chính",
        mbtiTypes: ["ESFJ", "ISFJ", "ESTJ", "ISTJ"],
        riasecTypes: ["S", "C"],
        description: "Quản lý nhân sự và hành chính",
      },
      {
        name: "Văn hóa - Chính trị - Khoa học xã hội",
        mbtiTypes: ["INFJ", "INFP", "ENFJ", "ENFP"],
        riasecTypes: ["S", "A"],
        description: "Nghiên cứu văn hóa và xã hội",
      },
      {
        name: "Khoa học tự nhiên khác",
        mbtiTypes: ["INTJ", "INTP", "ISTP", "INFP"],
        riasecTypes: ["I", "R"],
        description: "Nghiên cứu khoa học tự nhiên",
      },
    ];

    const calculateCareerScore = (career) => {
      let mbtiScore = 0;
      let riasecScore = 0;

      // Calculate MBTI score with better logic
      if (
        previousData.mbtiResult &&
        career.mbtiTypes.includes(previousData.mbtiResult)
      ) {
        mbtiScore = 5; // Perfect match
      } else {
        // Check partial matches (2-3 letters)
        const userMBTI = previousData.mbtiResult;
        let maxPartialScore = 0;

        career.mbtiTypes.forEach((type) => {
          let matchCount = 0;
          for (let i = 0; i < 4; i++) {
            if (userMBTI[i] === type[i]) matchCount++;
          }
          if (matchCount === 3) maxPartialScore = Math.max(maxPartialScore, 4);
          else if (matchCount === 2)
            maxPartialScore = Math.max(maxPartialScore, 3);
          else if (matchCount === 1)
            maxPartialScore = Math.max(maxPartialScore, 2);
        });

        mbtiScore = maxPartialScore || 1;
      }

      // Calculate RIASEC score based on top 3 types with better weighting
      const sortedScores = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type);

      let totalRiasScore = 0;
      let validTypes = 0;

      career.riasecTypes.forEach((type) => {
        const rank = sortedScores.indexOf(type);
        if (rank === 0) {
          totalRiasScore += 5;
          validTypes++;
        } else if (rank === 1) {
          totalRiasScore += 4;
          validTypes++;
        } else if (rank === 2) {
          totalRiasScore += 3;
          validTypes++;
        } else if (rank >= 3) {
          totalRiasScore += 1;
          validTypes++;
        }
      });

      riasecScore = validTypes > 0 ? totalRiasScore / validTypes : 1;

      // Final score: 60% MBTI + 40% RIASEC
      return mbtiScore * 0.6 + riasecScore * 0.4;
    };

    return careers
      .map((career) => ({
        ...career,
        score: calculateCareerScore(career),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  };

  // Render current group questions
  const renderCurrentGroupQuestions = () => {
    const currentGroupQuestions = riasecQuestions.filter(
      (q) => q.type === groups[currentGroupIndex].type
    );

    return currentGroupQuestions.map((q, index) => (
      <div
        key={q.id}
        className="mb-10 p-6 bg-gradient-to-r from-blue-50/30 to-blue-50/50 rounded-lg border-l-4 border-blue-600"
      >
        <div className="text-lg font-semibold text-blue-800 mb-6">
          {index + 1}. {q.question}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 text-sm font-medium text-center text-red-500">
            Rất không thích
          </div>

          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => handleAnswerSelect(q.id, value)}
                className={`rounded-full border-2 transition-all duration-200 hover:scale-110 flex items-center justify-center ${
                  value <= 2
                    ? "border-red-400 hover:border-red-500"
                    : value === 3
                    ? "border-gray-400 hover:border-gray-500"
                    : "border-blue-500 hover:border-blue-600"
                } ${
                  answers[q.id] === value
                    ? value <= 2
                      ? "bg-red-400 scale-110"
                      : value === 3
                      ? "bg-gray-400 scale-110"
                      : "bg-blue-500 scale-110"
                    : "bg-white hover:bg-gray-50"
                } ${
                  value === 1 || value === 5
                    ? "w-12 h-12"
                    : value === 2 || value === 4
                    ? "w-9 h-9"
                    : "w-6 h-6"
                }`}
              ></button>
            ))}
          </div>

          <div className="flex-1 text-sm font-medium text-center text-blue-500">
            Rất thích
          </div>
        </div>
      </div>
    ));
  };

  // Render results
  const renderResults = () => {
    const maxScore = 14 * 5;
    const sortedScores = Object.entries(scores)
      .map(([type, score]) => ({
        type,
        score,
        percentage: Math.round((score / maxScore) * 100),
        name: groups.find((g) => g.type === type).name,
        description: groups.find((g) => g.type === type).description,
      }))
      .sort((a, b) => b.score - a.score);

    // Lấy user info từ previousData nếu có
    const userInfo = previousData
      ? {
          name: previousData.name,
          grade: previousData.grade,
          province: previousData.province,
          email: previousData.email,
          phone: previousData.phone,
        }
      : null;

    return (
      <div className="space-y-6">
        <AIKhaiPhaAssistant
          mbtiResult={previousData?.mbtiResult}
          mbtiDescription={previousData?.mbtiDescription}
          mbtiPercentages={previousData?.mbtiPercentages}
          riasecScores={scores}
          riasecAnswers={answers}
          careerRecommendations={getCareerRecommendations()}
          userInfo={userInfo}
          aiAnalysisCompleted={false} // Chưa có AI analysis khi ở hobby.jsx
          aiAnalysisResult="" // Chưa có kết quả AI analysis
          onAnalysisComplete={async (aiResult) => {
            try {
              // Cập nhật AI analysis result vào Firebase document đã có
              const lastTestId = localStorage.getItem("lastTestId");
              if (lastTestId) {
                const docRef = doc(db, "career_tests", lastTestId);
                await updateDoc(docRef, {
                  aiAnalysisResult: aiResult,
                  aiAnalysisCompletedAt: serverTimestamp(),
                  aiAnalysisCompleted: true,
                });
                console.log("AI analysis result updated in Firebase");
              }
            } catch (error) {
              console.error("Error updating AI analysis result:", error);
            }
          }}
        />
        {/* Previous MBTI Results */}
        {previousData && (
          <div>
            <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Kết quả Test Định hướng trước đó
            </h3>

            {/* MBTI Result Summary */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center shadow-lg mb-6">
              <div className="text-4xl font-bold mb-4 flex items-center justify-center gap-4">
                <Brain className="w-10 h-10" />
                {previousData.mbtiResult}
              </div>
              <p className="text-blue-100 text-lg mb-4">
                {previousData.mbtiDescription}
              </p>
              <a
                href={`https://tuansu-lonewolf.github.io/MBTI_informations/pages/detail.html?code=${previousData.mbtiResult}`}
                target="_blank"
              >
                <div className="group transition-all duration-200 hover:shadow-lg hover:bg-blue-200 bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mt-8 cursor-pointer">
                  <div className="text-lg font-medium text-blue-800 flex items-center justify-center gap-3">
                    <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center transition-all duration-200 group-hover:bg-blue-700 group-hover:scale-110">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <span className="transition-colors duration-200 group-hover:text-blue-900">
                      Cùng Career Compass hiểu rõ hơn về nhóm tính cách này nhé
                    </span>
                  </div>
                </div>
              </a>
            </div>

            {/* MBTI Trait Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {previousData.mbtiPercentages &&
                Object.entries(previousData.mbtiPercentages).map(
                  ([key, value]) => {
                    const traitMap = {
                      EI: { left: "Hướng ngoại", right: "Hướng nội" },
                      SN: { left: "Trực giác", right: "Tinh ý" },
                      TF: { left: "Lý trí", right: "Cảm xúc" },
                      JP: { left: "Có tổ chức", right: "Linh hoạt" },
                    };

                    const trait = traitMap[key];
                    if (!trait) return null;

                    const leftPercent = value;
                    const rightPercent = 100 - leftPercent;

                    return (
                      <div
                        key={key}
                        className="bg-white rounded-lg p-6 shadow-md border border-blue-200"
                      >
                        <div className="flex justify-between mb-3">
                          <span className="text-blue-700 font-medium">
                            {trait.left} {leftPercent}%
                          </span>
                          <span className="text-red-500 font-medium">
                            {rightPercent}% {trait.right}
                          </span>
                        </div>
                        <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                            style={{ width: `${leftPercent}%` }}
                          />
                          <div
                            className="bg-gradient-to-r from-red-400 to-red-500 h-full transition-all duration-500"
                            style={{ width: `${rightPercent}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
            </div>
          </div>
        )}

        {/* RIASEC Results */}
        <div>
          <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
            <Target className="w-6 h-6" />
            Kết quả Test Sở thích RIASEC
          </h3>

          {/* Top 3 RIASEC Types */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white text-center shadow-lg mb-6">
            <h4 className="text-2xl font-bold mb-4">
              Top 3 nhóm sở thích của bạn
            </h4>
            <div className="flex justify-center items-center gap-8">
              {sortedScores.slice(0, 3).map((item, index) => (
                <div key={item.type} className="text-center">
                  <div className="text-4xl font-bold mb-2">#{index + 1}</div>
                  <div className="flex items-center justify-center mb-2">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="text-lg font-semibold">{item.name}</div>
                  <div className="text-green-100">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed RIASEC Scores */}
          <div className="space-y-4">
            {sortedScores.map((item, index) => (
              <div
                key={item.type}
                className="bg-white rounded-lg p-6 shadow-md border border-blue-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <div className="text-blue-600">
                      {getTypeIcon(item.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                      #{index + 1} {item.name}
                      <div className="ml-auto flex items-center gap-2 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {item.percentage}%
                        </span>
                      </div>
                    </h4>
                    <p className="text-blue-600 text-sm">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-700">
                    Điểm số: {item.score}/{maxScore}
                  </span>
                  <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RIASEC Pairs Table */}
          <div className="mt-8 bg-white rounded-lg shadow-md border border-blue-200 overflow-hidden">
            <div className="p-6">
              <h4 className="text-lg font-bold text-blue-800 mb-4">
                Bảng so sánh theo cặp
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-50">
                      <th className="border border-blue-200 p-3 text-left font-semibold text-blue-800">
                        Tên nhóm
                      </th>
                      <th className="border border-blue-200 p-3 text-left font-semibold text-blue-800">
                        Mô tả
                      </th>
                      <th className="border border-blue-200 p-3 text-left font-semibold text-blue-800">
                        Điểm số
                      </th>
                      <th className="border border-blue-200 p-3 text-left font-semibold text-blue-800">
                        Tên nhóm
                      </th>
                      <th className="border border-blue-200 p-3 text-left font-semibold text-blue-800">
                        Mô tả
                      </th>
                      <th className="border border-blue-200 p-3 text-left font-semibold text-blue-800">
                        Điểm số
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["R", "S"],
                      ["I", "E"],
                      ["A", "C"],
                    ].map(([leftType, rightType]) => {
                      const leftGroup = groups.find((g) => g.type === leftType);
                      const rightGroup = groups.find(
                        (g) => g.type === rightType
                      );
                      const leftScore = scores[leftType];
                      const rightScore = scores[rightType];

                      return (
                        <tr
                          key={`${leftType}-${rightType}`}
                          className="hover:bg-blue-50"
                        >
                          <td className="border border-blue-200 p-3 font-medium text-blue-700">
                            {leftGroup.name}
                          </td>
                          <td className="border border-blue-200 p-3 text-blue-600">
                            {leftGroup.description}
                          </td>
                          <td className="border border-blue-200 p-3 font-semibold text-blue-800">
                            {leftScore}/70
                          </td>
                          <td className="border border-blue-200 p-3 font-medium text-blue-700">
                            {rightGroup.name}
                          </td>
                          <td className="border border-blue-200 p-3 text-blue-600">
                            {rightGroup.description}
                          </td>
                          <td className="border border-blue-200 p-3 font-semibold text-blue-800">
                            {rightScore}/70
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Career Recommendations */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
              <Briefcase className="w-6 h-6" />
              Top 5 Ngành Nghề Phù Hợp
            </h3>

            {/* Detailed Career Scores */}
            <div className="space-y-4">
              {getCareerRecommendations().map((career, index) => (
                <div
                  key={career.name}
                  className="bg-white rounded-lg p-6 shadow-md border border-blue-200 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={() => {
                    const majorUrl = getMajorGroupUrl(career.name);
                    window.open(majorUrl, "_blank");
                  }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200">
                      <div className="text-blue-600">
                        <Briefcase className="w-6 h-6" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-blue-700 flex items-center gap-2 group-hover:text-blue-800 transition-colors">
                        #{index + 1} {career.name}
                        <div className="ml-auto flex items-center gap-2 text-green-600">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-sm font-bold">
                            {career.score.toFixed(1)}/5.0
                          </span>
                        </div>
                      </h4>
                      <p className="text-blue-600 text-sm group-hover:text-blue-700 transition-colors">
                        {career.description}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <ExternalLink className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-medium text-blue-700">
                      Độ tương thích: {career.score.toFixed(1)}/5.0
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(career.score / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Compatibility Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-semibold text-purple-700">
                          MBTI phù hợp:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {career.mbtiTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          RIASEC phù hợp:
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {career.riasecTypes.map((type, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Click hint */}
                  <div className="mt-4 text-center">
                    <span className="text-xs text-blue-500 font-medium">
                      👆 Click để xem chi tiết ngành {career.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={generatePDFReport}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Tải Kết Quả PDF
              </button>

              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: "Career Compass - Kết quả Test",
                      text: "Xem kết quả test định hướng nghề nghiệp của tôi!",
                      url: window.location.href,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    alert("Đã copy link vào clipboard!");
                  }
                }}
                className="flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Share2 className="w-5 h-5" />
                Chia Sẻ Kết Quả
              </button>
            </div>

            {/* Information Box */}
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-md">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-blue-800 mb-3">
                    Lưu ý về kết quả
                  </h4>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Kết quả này được tính toán dựa trên sự kết hợp giữa tính
                    cách MBTI (60%) và sở thích RIASEC (40%). Đây chỉ là gợi ý
                    tham khảo, bạn nên cân nhắc thêm các yếu tố khác như khả
                    năng, đam mê và cơ hội thực tế.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Back button - góc trái trên */}
      <button
        onClick={() => window.history.back()}
        className="fixed top-6 left-6 flex items-center space-x-2 px-3 py-2 bg-white text-gray-600 rounded-lg shadow-md  hover:text-blue-600 transition-all duration-200 border border-gray-200"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Quay lại</span>
      </button>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center w-48">
              <img src={"./Logo_CC_tron.svg"} alt="Logo" className="h-20" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-blue-700 mb-2 flex items-center justify-center gap-2">
            Test Sở thích Nghề nghiệp RIASEC
          </h2>
          <p className="text-blue-600 text-lg flex items-center justify-center gap-2">
            <Target className="w-5 h-5" />
            Khám phá sở thích và năng khiếu nghề nghiệp của bạn
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-blue-200 rounded-full h-3 mb-4">
            <div
              className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-200 ${
                    index <= currentStep
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                      : "bg-blue-200 text-blue-500"
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    index <= currentStep ? "text-blue-700" : "text-blue-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: RIASEC Test */}
        {currentStep === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-800 mb-2 flex items-center gap-2">
              {getTypeIcon(groups[currentGroupIndex].type)}
              {groups[currentGroupIndex].name}
            </h3>
            <p className="text-blue-600 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Nhóm {currentGroupIndex + 1} / {groups.length} -{" "}
              {groups[currentGroupIndex].description}
            </p>

            {/* Group Progress */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between mb-2">
                <span className="text-blue-700 font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Câu hỏi{" "}
                  <span className="font-bold">
                    {
                      riasecQuestions.filter(
                        (q) =>
                          q.type === groups[currentGroupIndex].type &&
                          answers[q.id] !== undefined
                      ).length
                    }
                  </span>{" "}
                  / 14
                </span>
                <span className="text-blue-600 font-semibold">
                  {Math.round(
                    (riasecQuestions.filter(
                      (q) =>
                        q.type === groups[currentGroupIndex].type &&
                        answers[q.id] !== undefined
                    ).length /
                      14) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-200"
                  style={{
                    width: `${
                      (riasecQuestions.filter(
                        (q) =>
                          q.type === groups[currentGroupIndex].type &&
                          answers[q.id] !== undefined
                      ).length /
                        14) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">{renderCurrentGroupQuestions()}</div>

            <button
              onClick={handleNext}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {currentGroupIndex === groups.length - 1
                ? "Xem kết quả"
                : "Nhóm tiếp theo"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 2: Loading */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-8 border border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-800 mb-2 flex items-center justify-center gap-2">
                Đang phân tích kết quả
              </h3>
              <p className="text-blue-600 flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Đang tổng hợp kết quả RIASEC và MBTI...
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Results */}
        {currentStep === 2 && renderResults()}
      </div>
    </div>
  );
};

export default QuesticHobbyAdvisor;
