import React, { useState } from "react";
import {
  ChevronRight,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  Users,
  BookOpen,
  Calculator,
  Globe,
  Microscope,
  Music,
  Palette,
  Trophy,
  Target,
  TrendingUp,
  Award,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import { db, auth } from "../firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const QuesticAdmissionAdvisor = () => {
  // User data
  const [userData, setUserData] = useState({
    name: "",
    grade: "",
    province: "",
    email: "",
    phone: "",
    mbtiAnswers: {},
    mbtiResult: "",
    mbtiPercentages: {},
  });

  // Test variables
  const [currentPage, setCurrentPage] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [aiData, setAiData] = useState(null);

  const questionsPerPage = 7;

  // Questions array
  const questions = [
    {
      id: 1,
      question: "Ở các bữa tiệc bạn thường",
      a: "Nói chuyện với nhiều người, kể cả người lạ",
      b: "Nói chuyện với số ít những người quen thân",
      dimension: "EI",
    },
    {
      id: 2,
      question: "Bạn thấy mình là người thuộc loại nào nhiều hơn?",
      a: "Thực tế",
      b: "Mơ mộng",
      dimension: "SN",
    },
    {
      id: 3,
      question: "Bạn quan tâm đến điều gì nhiều hơn?",
      a: "Dữ liệu, thực tế",
      b: "Các câu chuyện",
      dimension: "SN",
    },
    {
      id: 4,
      question: "Bạn thường đối xử như thế nào nhiều hơn?",
      a: "Công bằng",
      b: "Đối xử tốt, theo tình cảm",
      dimension: "TF",
    },
    {
      id: 5,
      question: "Bạn thường",
      a: "Vô tư, không bao giờ thiên vị",
      b: "Cảm thông, đôi khi xử lí tình huống theo cảm tính",
      dimension: "TF",
    },
    {
      id: 6,
      question: "Bạn thích làm việc theo kiểu nào nhiều hơn?",
      a: "Theo đúng thời hạn",
      b: "Theo hứng",
      dimension: "JP",
    },
    {
      id: 7,
      question: "Bạn sẽ lựa chọn",
      a: "Rất cẩn thận",
      b: "Phần nào theo cảm nhận",
      dimension: "JP",
    },
    {
      id: 8,
      question: "Tại các bữa tiệc, bạn thường",
      a: "Ở lại muộn, cảm thấy ngày càng khỏe khoắn cao hứng hơn",
      b: "Ra về sớm và cảm thấy mỏi mệt dần",
      dimension: "EI",
    },
    {
      id: 9,
      question: "Bạn là người",
      a: "Nhạy cảm",
      b: "Suy nghĩ cẩn trọng",
      dimension: "SN",
    },
    {
      id: 10,
      question: "Bạn thích",
      a: "Dữ liệu, sự kiện thực tế",
      b: "Các ý tưởng khác nhau",
      dimension: "SN",
    },
    {
      id: 11,
      question: "Về bản chất bạn thường",
      a: "Công bằng với mọi người",
      b: "Tốt với mọi người",
      dimension: "TF",
    },
    {
      id: 12,
      question: "Lần đầu tiên tiếp xúc bạn thường",
      a: "Im lặng và cảm thấy xấu hổ",
      b: "Nói nhiều và tỏ ra thân thiện",
      dimension: "TF",
    },
    {
      id: 13,
      question: "Thường thì bạn là người",
      a: "Đúng giờ, chuẩn mực",
      b: "Thong thả",
      dimension: "JP",
    },
    {
      id: 14,
      question: "Trường hợp nào bạn cảm thấy nóng ruột, bồn chồn hơn?",
      a: "Khi mọi việc chưa hoàn thành",
      b: "Khi mọi việc đã hoàn thành",
      dimension: "JP",
    },
    {
      id: 15,
      question: "Với những người bạn của mình, bạn thường",
      a: "Biết điều gì đang xảy ra đối với mọi người",
      b: "Biết những điều đó cuối cùng",
      dimension: "EI",
    },
    {
      id: 16,
      question: "Bạn thường quan tâm tới",
      a: "Những chi tiết cụ thể",
      b: "Ý tưởng, khái niệm",
      dimension: "SN",
    },
    {
      id: 17,
      question: "Bạn thích những tác giả",
      a: "Nói thẳng điều định nói",
      b: "Dùng nhiều câu chuyện để minh họa cho điều họ định nói",
      dimension: "SN",
    },
    {
      id: 18,
      question: "Về bản chất bạn thường",
      a: "Vô tư, không thiên vị",
      b: "Hay thương người",
      dimension: "TF",
    },
    {
      id: 19,
      question: "Khi đánh giá, bạn thường",
      a: "Không để tình cảm cá nhân ảnh hưởng",
      b: "Đa cảm, hay động lòng",
      dimension: "TF",
    },
    {
      id: 20,
      question: "Bạn thường",
      a: "Sắp đặt công việc",
      b: "Khuyến khích các phương án khác nhau",
      dimension: "JP",
    },
    {
      id: 21,
      question: "Bạn thường muốn",
      a: "Các buổi hẹn có sắp đặt trước",
      b: "Để mọi việc tự do, thoải mái",
      dimension: "JP",
    },
    {
      id: 22,
      question: "Khi gọi điện thoại bạn",
      a: "Cứ gọi bình thường",
      b: "Chuẩn bị trước những điều sẽ nói",
      dimension: "EI",
    },
    {
      id: 23,
      question: "Sự kiện thực tế",
      a: "Tự nói lên mọi điều",
      b: "Thường cần có lời giải thích",
      dimension: "SN",
    },
    {
      id: 24,
      question: "Bạn thích làm việc với",
      a: "Những thông tin thực tế",
      b: "Những ý tưởng trừu tượng",
      dimension: "SN",
    },
    {
      id: 25,
      question: "Bạn là người",
      a: "Trầm tĩnh, lạnh lùng",
      b: "Sôi nổi, sốt sắng",
      dimension: "TF",
    },
    {
      id: 26,
      question: "Bạn thường là người",
      a: "Thực tế, vô tư hơn là thương xót, cảm thông",
      b: "Thương xót cảm thông hơn là vô tư, thực tế",
      dimension: "TF",
    },
    {
      id: 27,
      question: "Bạn cảm thấy thoải mái hơn khi",
      a: "Lập thời gian biểu rõ ràng",
      b: "Cứ để mọi việc tự nhiên",
      dimension: "JP",
    },
    {
      id: 28,
      question: "Bạn cảm thấy thoải mái hơn với",
      a: "Bản thỏa thuận viết lên giấy",
      b: "Thỏa thuận bằng lời và những cái bắt tay",
      dimension: "JP",
    },
    {
      id: 29,
      question: "Ở nơi làm việc bạn thường",
      a: "Là người bắt đầu các câu chuyện",
      b: "Ngồi chờ người khác đến với mình",
      dimension: "EI",
    },
    {
      id: 30,
      question: "Những nguyên tắc truyền thống",
      a: "Thường đáng tin cậy",
      b: "Thường làm ta sai phương hướng",
      dimension: "SN",
    },
    {
      id: 31,
      question: "Trẻ em thường không",
      a: "Hoạt động có ích hết khả năng chúng có",
      b: "Mơ mộng như đáng có",
      dimension: "SN",
    },
    {
      id: 32,
      question: "Bạn có thường",
      a: "Suy nghĩ luận giải chặt chẽ",
      b: "Dễ xúc động",
      dimension: "TF",
    },
    {
      id: 33,
      question: "Bạn có thường",
      a: "Chắc chắn, chặt chẽ hơn là mềm mỏng, dễ dãi",
      b: "Mềm mỏng dễ dãi hơn là chắc chắn chặt chẽ",
      dimension: "TF",
    },
    {
      id: 34,
      question: "Bạn có sắp xếp mọi thứ",
      a: "Trật tự ngăn nắp",
      b: "Để chúng thoải mái, tự do",
      dimension: "JP",
    },
    {
      id: 35,
      question: "Bạn thấy điều gì có giá trị hơn",
      a: "Điều chắc chắn, đã xác định",
      b: "Điều chưa chắc chắn, còn thay đổi",
      dimension: "JP",
    },
    {
      id: 36,
      question: "Những mối quan hệ giao tiếp mới với người khác",
      a: "Khuyến khích và thúc đẩy bạn",
      b: "Làm bạn cảm thấy bạn cần tìm một chỗ khác để nghỉ và suy nghĩ",
      dimension: "EI",
    },
    {
      id: 37,
      question: "Bạn thường xuyên là người",
      a: "Gắn với thực tế",
      b: "Gắn với ý tưởng trừu tượng",
      dimension: "SN",
    },
    {
      id: 38,
      question: "Bạn bị cuốn hút vào việc gì nhiều hơn",
      a: "Xem xét và hiểu các sự kiện",
      b: "Phát triển ý tưởng mới",
      dimension: "SN",
    },
    {
      id: 39,
      question: "Điều gì làm bạn thỏa mãn hơn",
      a: "Thảo luận mọi khía cạnh của một vấn đề",
      b: "Tiến tới thỏa thuận về một vấn đề",
      dimension: "TF",
    },
    {
      id: 40,
      question: "Điều gì thúc đẩy bạn nhiều hơn",
      a: "Trí óc của bạn",
      b: "Trái tim của bạn",
      dimension: "TF",
    },
    {
      id: 41,
      question: "Bạn thấy thoải mái hơn với những công việc",
      a: "Theo hợp đồng",
      b: "Theo phong thái thoải mái tự nhiên",
      dimension: "JP",
    },
    {
      id: 42,
      question: "Bạn thích công việc được",
      a: "Chuẩn xác và ngăn nắp",
      b: "Mở cho nhiều giải thích khác nhau",
      dimension: "JP",
    },
    {
      id: 43,
      question: "Bạn thích",
      a: "Nhiều bạn bè với những cuộc trao đổi ngắn",
      b: "Một bạn mới với cuộc nói chuyện dài",
      dimension: "EI",
    },
    {
      id: 44,
      question: "Bạn bị cuốn hút bởi",
      a: "Nhiều thông tin",
      b: "Những giả thiết tuyệt vời",
      dimension: "SN",
    },
    {
      id: 45,
      question: "Bạn quan tâm nhiều hơn tới",
      a: "Sản xuất",
      b: "Nghiên cứu",
      dimension: "SN",
    },
    {
      id: 46,
      question: "Bạn cảm thấy thoải mái hơn khi bạn",
      a: "Khách quan",
      b: "Tính tới tình cảm cá nhân",
      dimension: "TF",
    },
    {
      id: 47,
      question: "Bạn tự đánh giá mình là người",
      a: "Rõ ràng và chắc chắn",
      b: "Sẵn sàng hy sinh",
      dimension: "TF",
    },
    {
      id: 48,
      question: "Bạn cảm thấy thoải mái hơn với",
      a: "Lời phát ngôn cuối cùng",
      b: "Những ý kiến kiến nghị, thảo luận",
      dimension: "JP",
    },
    {
      id: 49,
      question: "Bạn cảm thấy thoải mái hơn",
      a: "Sau một quyết định",
      b: "Trước một quyết định",
      dimension: "JP",
    },
    {
      id: 50,
      question: "Bạn có",
      a: "Nói được nhiều chuyện, dễ dàng, với người lạ",
      b: "Thấy chẳng có gì nhiều để nói với người lạ cả",
      dimension: "EI",
    },
    {
      id: 51,
      question: "Bạn có thường quan tâm tới",
      a: "Dữ liệu, sự kiện của một tình huống cụ thể",
      b: "Các tình huống chung",
      dimension: "SN",
    },
    {
      id: 52,
      question: "Bạn có cảm thấy mình là người",
      a: "Chân chất hơn là khéo léo",
      b: "Khéo léo hơn là chân chất",
      dimension: "SN",
    },
    {
      id: 53,
      question: "Bạn thực sự là người của",
      a: "Những luận giải rõ ràng",
      b: "Cảm nhận tình cảm mạnh mẽ",
      dimension: "TF",
    },
    {
      id: 54,
      question: "Bạn có thiên hướng hơn về",
      a: "Suy luận vô tư, công minh",
      b: "Cảm thông",
      dimension: "TF",
    },
    {
      id: 55,
      question: "Điều hoàn hảo nói chung là",
      a: "Đảm bảo rằng mọi việc đều được sắp xếp có quy củ",
      b: "Cứ để mọi việc xảy ra tự nhiên",
      dimension: "JP",
    },
    {
      id: 56,
      question: "Có phải cách làm việc của bạn là",
      a: "Mọi việc cần được giải quyết đúng hạn",
      b: "Trì hoãn giải quyết công việc",
      dimension: "JP",
    },
    {
      id: 57,
      question: "Khi chuông điện thoại reo, bạn có",
      a: "Trả lời điện thoại trước",
      b: "Hy vọng ai đó sẽ trả lời",
      dimension: "EI",
    },
    {
      id: 58,
      question: "Điều gì có giá trị hơn? nếu có",
      a: "Cảm nhận tốt về hiện thực",
      b: "Trí tưởng tượng phong phú",
      dimension: "SN",
    },
    {
      id: 59,
      question: "Bạn có thiên hướng về",
      a: "Sự kiện, dữ liệu",
      b: "Suy luận",
      dimension: "SN",
    },
    {
      id: 60,
      question: "Khi đánh giá bạn thường",
      a: "Trung lập",
      b: "Độ lượng, khoan dung",
      dimension: "TF",
    },
    {
      id: 61,
      question: "Bạn có thấy mình thiên về bên nào hơn",
      a: "Suy nghĩ rõ ràng, cẩn trọng",
      b: "Có ý chí mạnh mẽ",
      dimension: "TF",
    },
    {
      id: 62,
      question: "Bạn có",
      a: "Lập thời gian biểu cho các công việc",
      b: "Việc gì đến thì làm",
      dimension: "JP",
    },
    {
      id: 63,
      question: "Bạn là người có thiên hướng nào nhiều hơn",
      a: "Làm việc theo nền nếp hàng ngày",
      b: "Tự do",
      dimension: "JP",
    },
    {
      id: 64,
      question: "Bạn là người",
      a: "Dễ tiếp xúc, làm quen",
      b: "Kín đáo",
      dimension: "EI",
    },
    {
      id: 65,
      question: "Bạn thấy vui sướng với",
      a: "Những kinh nghiệm được người khác trao đổi",
      b: "Những ý tưởng kỳ quặc",
      dimension: "SN",
    },
    {
      id: 66,
      question: "Khi viết, bạn thích",
      a: "Sự rõ ràng, trong sáng",
      b: "Những ý tưởng thông minh",
      dimension: "SN",
    },
    {
      id: 67,
      question: "Bạn thường",
      a: "Không định kiến",
      b: "Thương người",
      dimension: "TF",
    },
    {
      id: 68,
      question: "Bạn thực sự là người",
      a: "Công minh hơn là nhân hậu",
      b: "Nhân hậu hơn là công minh",
      dimension: "TF",
    },
    {
      id: 69,
      question: "Bạn là người",
      a: "Hay đưa ra những đánh giá bất ngờ",
      b: "Trì hoãn việc đánh giá",
      dimension: "JP",
    },
    {
      id: 70,
      question: "Bạn có xu hướng",
      a: "Cẩn trọng, chín chắn hơn là tự do",
      b: "Tự do hơn là cẩn trọng, chín chắn",
      dimension: "JP",
    },
  ];

  // Choice mapping for scoring
  const choiceMap = [
    { a: 5, b: 0 },
    { a: 4, b: 1 },
    { a: 3, b: 2 },
    { a: 2, b: 3 },
    { a: 1, b: 4 },
    { a: 0, b: 5 },
  ];

  // Province options
  const provinceOptions = [
    { value: "hanoi", label: "Hà Nội" },
    { value: "hcm", label: "Thành phố Hồ Chí Minh" },
    { value: "danang", label: "Đà Nẵng" },
    { value: "haiphong", label: "Hải Phòng" },
    { value: "cantho", label: "Cần Thơ" },
    { value: "angiang", label: "An Giang" },
    { value: "baria", label: "Bà Rịa - Vũng Tàu" },
    { value: "baclieu", label: "Bạc Liêu" },
    { value: "bacgiang", label: "Bắc Giang" },
    { value: "backan", label: "Bắc Kạn" },
    { value: "bacninh", label: "Bắc Ninh" },
    { value: "bentre", label: "Bến Tre" },
    { value: "binhdinh", label: "Bình Định" },
    { value: "binhduong", label: "Bình Dương" },
    { value: "binhphuoc", label: "Bình Phước" },
    { value: "binhthuan", label: "Bình Thuận" },
    { value: "camau", label: "Cà Mau" },
    { value: "caobang", label: "Cao Bằng" },
    { value: "daklak", label: "Đắk Lắk" },
    { value: "daknong", label: "Đắk Nông" },
    { value: "dienbien", label: "Điện Biên" },
    { value: "dongnai", label: "Đồng Nai" },
    { value: "dongthap", label: "Đồng Tháp" },
    { value: "gialai", label: "Gia Lai" },
    { value: "hagiang", label: "Hà Giang" },
    { value: "hanam", label: "Hà Nam" },
    { value: "hatinh", label: "Hà Tĩnh" },
    { value: "haiduong", label: "Hải Dương" },
    { value: "haugiang", label: "Hậu Giang" },
    { value: "hoabinh", label: "Hòa Bình" },
    { value: "hungyen", label: "Hưng Yên" },
    { value: "khanhhoa", label: "Khánh Hòa" },
    { value: "kiengiang", label: "Kiên Giang" },
    { value: "kontum", label: "Kon Tum" },
    { value: "laichau", label: "Lai Châu" },
    { value: "lamdong", label: "Lâm Đồng" },
    { value: "langson", label: "Lạng Sơn" },
    { value: "laocai", label: "Lào Cai" },
    { value: "longan", label: "Long An" },
    { value: "namdinh", label: "Nam Định" },
    { value: "nghean", label: "Nghệ An" },
    { value: "ninhbinh", label: "Ninh Bình" },
    { value: "ninhthuan", label: "Ninh Thuận" },
    { value: "phutho", label: "Phú Thọ" },
    { value: "phuyen", label: "Phú Yên" },
    { value: "quangbinh", label: "Quảng Bình" },
    { value: "quangnam", label: "Quảng Nam" },
    { value: "quangngai", label: "Quảng Ngãi" },
    { value: "quangninh", label: "Quảng Ninh" },
    { value: "quangtri", label: "Quảng Trị" },
    { value: "soctrang", label: "Sóc Trăng" },
    { value: "sonla", label: "Sơn La" },
    { value: "tayninh", label: "Tây Ninh" },
    { value: "thaibinh", label: "Thái Bình" },
    { value: "thainguyen", label: "Thái Nguyên" },
    { value: "thanhhoa", label: "Thanh Hóa" },
    { value: "thuathienhue", label: "Thừa Thiên Huế" },
    { value: "tiengiang", label: "Tiền Giang" },
    { value: "travinh", label: "Trà Vinh" },
    { value: "tuyenquang", label: "Tuyên Quang" },
    { value: "vinhlong", label: "Vĩnh Long" },
    { value: "vinhphuc", label: "Vĩnh Phúc" },
    { value: "yenbai", label: "Yên Bái" },
  ];

  const steps = [
    "Thông tin cá nhân",
    "Test Hướng Nghiệp",
    "Hoàn tất",
    "Kết quả",
  ];

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (currentStep === 0) return 25;
    if (currentStep === 1) {
      const answeredCount = Object.keys(userData.mbtiAnswers).length;
      return 25 + (answeredCount / questions.length) * 50;
    }
    if (currentStep === 2) return 85;
    return 100;
  };

  // Validate personal info and move to next step
  const handleNextStep = () => {
    if (!userData.name || !userData.grade || !userData.province) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    setCurrentStep(1);
  };

  // Render current question page
  const renderQuestionPage = () => {
    const start = currentPage * questionsPerPage;
    const end = Math.min(start + questionsPerPage, questions.length);

    return questions.slice(start, end).map((q, index) => (
      <div
        key={q.id}
        className="mb-10 p-6 bg-gradient-to-r from-blue-50/30 to-blue-50/50 rounded-lg border-l-4 border-blue-600"
      >
        <div className="text-lg font-semibold text-blue-800 mb-6">
          {start + index + 1}. {q.question}
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 text-sm font-medium text-center text-blue-600">
            {q.a}
          </div>

          <div className="flex items-center justify-center gap-2">
            {[0, 1, 2, 3, 4, 5].map((optionIndex) => (
              <button
                key={optionIndex}
                onClick={() => {
                  setUserData((prev) => ({
                    ...prev,
                    mbtiAnswers: {
                      ...prev.mbtiAnswers,
                      [q.id]: optionIndex,
                    },
                  }));
                }}
                className={`rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                  optionIndex < 3
                    ? "border-blue-500 hover:border-blue-600"
                    : "border-red-400 hover:border-red-500"
                } ${
                  userData.mbtiAnswers[q.id] === optionIndex
                    ? optionIndex < 3
                      ? "bg-blue-500 scale-110"
                      : "bg-red-400 scale-110"
                    : "bg-white"
                } ${
                  optionIndex === 0 || optionIndex === 5
                    ? "w-10 h-10"
                    : optionIndex === 1 || optionIndex === 4
                    ? "w-8 h-8"
                    : "w-6 h-6"
                }`}
              />
            ))}
          </div>

          <div className="flex-1 text-sm font-medium text-center text-red-500">
            {q.b}
          </div>
        </div>
      </div>
    ));
  };

  // Next question handler
  const handleNextQuestion = () => {
    const start = currentPage * questionsPerPage;
    const end = Math.min(start + questionsPerPage, questions.length);

    // Check if all questions in current page are answered
    for (let i = start; i < end; i++) {
      if (userData.mbtiAnswers[i + 1] === undefined) {
        alert(`Vui lòng trả lời câu hỏi số ${i + 1}`);
        return;
      }
    }

    if (end === questions.length) {
      // All questions answered, calculate result
      calculateMBTIResult();
    } else {
      // Move to next page
      setCurrentPage((prev) => prev + 1);
    }
  };

  // Calculate MBTI result
  const calculateMBTIResult = () => {
    const scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    for (const q of questions) {
      const selected = userData.mbtiAnswers[q.id];
      const score = choiceMap[selected];
      const [first, second] = q.dimension.split("");
      scores[first] += score.a;
      scores[second] += score.b;
    }

    const result = [
      scores.E >= scores.I ? "E" : "I",
      scores.S >= scores.N ? "S" : "N",
      scores.T >= scores.F ? "T" : "F",
      scores.J >= scores.P ? "J" : "P",
    ];

    const percentages = {
      EI: Math.round((scores.E / (scores.E + scores.I)) * 100),
      SN: Math.round((scores.S / (scores.S + scores.N)) * 100),
      TF: Math.round((scores.T / (scores.T + scores.F)) * 100),
      JP: Math.round((scores.J / (scores.J + scores.P)) * 100),
    };

    setUserData((prev) => ({
      ...prev,
      mbtiResult: result.join(""),
      mbtiPercentages: percentages,
    }));

    setCurrentStep(2);
    analyzeWithAI(result.join(""), percentages);
  };

  // Analyze with AI
  const analyzeWithAI = async (mbtiResult, percentages) => {
    try {
      const prompt = `
        Học sinh ${
          userData.name
        } vừa hoàn thành bài test MBTI với kết quả: ${mbtiResult}
        
        Thông tin thêm:
        - Cấp học: ${userData.grade === "grade11" ? "Lớp 11" : "Lớp 12"}
        - Tỉnh/Thành phố: ${userData.province}
        - Tỷ lệ phần trăm: ${JSON.stringify(percentages)}
        
        Hãy phân tích tính cách MBTI này và đưa ra gợi ý về các khối ngành phù hợp cho học sinh cấp 2, các khối ngành bao gồm: 
        Khối A: Toán, Vật lí, Hóa học;
        Khối A1: Toán, Vật Lí, Tiếng Anh;
        Khối B: Toán, Sinh học, Hóa học;
        Khối C: Thi Địa lý, Lịch sử, Ngữ văn
        Khối D: Toán, Ngoại ngữ, Ngữ văn
        Khối thi năng khiếu: Kiến thức Âm nhạc, Hội họa, bố cục, Năng khiếu TDTT,.... 
        
        Trả về kết quả dưới dạng JSON với format sau:
        {
            "mbti_description": "Mô tả chi tiết về tính cách MBTI này",
            "career_fields": [
                {
                    "name": "Tên khối ngành VD: Khối A: Toán, Vật lí và Hóa học",
                    "description": "Mô tả cực kì chi tiết về khối ngành và tại sao phù hợp, bắt đầu bằng cách phân tích từng chữ viết tắt của tính cách",
                    "career": "Đưa ra các ngành nghề phù hợp với khối này, để dấu ba chấm phía cuối"
                    "compatibility": "Hãy để một phần trăm nhất định"
                }
            ]
        }
        
        Hãy sắp xếp các khối ngành theo thứ tự độ phù hợp từ cao đến thấp.
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDHabYfby9JrvSEzDmsJzZLFZcQYzKh_7Q`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `API Error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error("Invalid API response structure");
      }

      const aiResponse = data.candidates[0].content.parts[0].text;

      // Parse AI response
      let parsedData;
      try {
        const jsonStart = aiResponse.indexOf("{");
        const jsonEnd = aiResponse.lastIndexOf("}") + 1;
        const jsonStr = aiResponse.substring(jsonStart, jsonEnd);
        parsedData = JSON.parse(jsonStr);
      } catch {
        console.log("JSON parsing failed, using fallback");
        parsedData = generateFallbackData(mbtiResult);
      }

      // Save to Firestore if grade11
      if (userData.grade === "grade11") {
        try {
          const user = auth.currentUser;
          await addDoc(collection(db, "career_tests"), {
            type: "mbti_test",
            userUid: user ? user.uid : null,
            name: userData.name,
            grade: userData.grade,
            province: userData.province,
            email: userData.email,
            phone: userData.phone,
            mbtiAnswers: userData.mbtiAnswers,
            mbtiResult: mbtiResult,
            mbtiPercentages: percentages,
            aiData: parsedData,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          console.error("Error saving MBTI test to Firestore:", err);
        }
      }

      setAiData(parsedData);
      setCurrentStep(3);
    } catch (error) {
      console.error("Error calling AI:", error);
      setAiData(generateFallbackData(mbtiResult));
      setCurrentStep(3);
    } finally {
      // No-op
    }
  };

  // Generate fallback data
  const generateFallbackData = (mbtiResult) => {
    const mbtiDescriptions = {
      INTJ: "Bạn là người có tư duy chiến lược, độc lập và có khả năng nhìn xa trông rộng. Bạn thích làm việc với các ý tưởng phức tạp và có khả năng tổ chức tốt.",
      INTP: "Bạn là người tò mò, sáng tạo và thích khám phá những ý tưởng mới. Bạn có khả năng phân tích logic mạnh mẽ và thích làm việc độc lập.",
      ENTJ: "Bạn là người lãnh đạo tự nhiên, có khả năng tổ chức và điều hành tốt. Bạn thích thử thách và có khả năng nhìn nhận vấn đề một cách tổng thể.",
      ENTP: "Bạn là người năng động, sáng tạo và thích khám phá những khả năng mới. Bạn có khả năng giao tiếp tốt và thích làm việc với con người.",
      INFJ: "Bạn là người có khả năng thấu hiểu người khác, có lý tưởng cao và thích giúp đỡ người khác. Bạn có khả năng nhìn xa trông rộng và có trực giác tốt.",
      INFP: "Bạn là người có lòng trắc ẩn, sáng tạo và có giá trị cá nhân mạnh mẽ. Bạn thích làm việc trong môi trường hỗ trợ và có ý nghĩa.",
      ENFJ: "Bạn là người có khả năng lãnh đạo tự nhiên, quan tâm đến người khác và có khả năng truyền cảm hứng. Bạn thích làm việc với con người và giúp họ phát triển.",
      ENFP: "Bạn là người nhiệt tình, sáng tạo và có khả năng giao tiếp tốt. Bạn thích khám phá những khả năng mới và làm việc trong môi trường năng động.",
      ISTJ: "Bạn là người đáng tin cậy, có trách nhiệm và thích làm việc theo quy trình. Bạn có khả năng tổ chức tốt và thích môi trường ổn định.",
      ISFJ: "Bạn là người quan tâm đến người khác, có trách nhiệm và thích giúp đỡ. Bạn có khả năng làm việc tỉ mỉ và thích môi trường hỗ trợ.",
      ESTJ: "Bạn là người có khả năng tổ chức tốt, thích lãnh đạo và làm việc hiệu quả. Bạn có khả năng quản lý và thích môi trường có cấu trúc.",
      ESFJ: "Bạn là người quan tâm đến người khác, có khả năng giao tiếp tốt và thích làm việc nhóm. Bạn có khả năng tổ chức và thích môi trường hỗ trợ.",
      ISTP: "Bạn là người thực tế, thích khám phá và có khả năng giải quyết vấn đề. Bạn thích làm việc với tay và có khả năng thích ứng tốt.",
      ISFP: "Bạn là người nhạy cảm, sáng tạo và có giá trị cá nhân mạnh mẽ. Bạn thích làm việc trong môi trường linh hoạt và có ý nghĩa.",
      ESTP: "Bạn là người năng động, thích hành động và có khả năng thích ứng tốt. Bạn thích làm việc với con người và trong môi trường năng động.",
      ESFP: "Bạn là người nhiệt tình, thích giao tiếp và có khả năng tạo động lực cho người khác. Bạn thích làm việc trong môi trường tích cực và có ý nghĩa.",
    };

    const careerFieldsMap = {
      INTJ: [
        {
          name: "Khối A - Toán, Lý, Hóa",
          description:
            "Phù hợp với tư duy logic, khả năng phân tích và giải quyết vấn đề phức tạp. Mở ra con đường vào các ngành kỹ thuật, công nghệ.",
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
          description:
            "Hoàn hảo cho tư duy phân tích và khám phá khoa học. Phù hợp với các ngành nghiên cứu, công nghệ.",
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
          description:
            "Phù hợp với khả năng nghiên cứu và phân tích trong các lĩnh vực xã hội.",
          career: "Nhà nghiên cứu xã hội, Nhà sử học, Nhà địa lý...",
          compatibility: "75%",
        },
      ],
      ENTJ: [
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Lý tưởng cho các vị trí lãnh đạo, quản trị kinh doanh và giao tiếp quốc tế.",
          career: "CEO, Quản lý dự án, Kinh doanh quốc tế...",
          compatibility: "93%",
        },
        {
          name: "Khối A - Toán, Lý, Hóa",
          description:
            "Phù hợp cho quản lý dự án kỹ thuật và lãnh đạo trong các ngành công nghệ.",
          career: "Quản lý kỹ thuật, Giám đốc công nghệ...",
          compatibility: "87%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Thích hợp cho lãnh đạo trong các lĩnh vực chính trị, xã hội.",
          career: "Chính trị gia, Quản lý công...",
          compatibility: "82%",
        },
      ],
      ENTP: [
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Hoàn hảo cho khởi nghiệp, marketing, truyền thông và các ngành sáng tạo.",
          career: "Khởi nghiệp, Marketing, Truyền thông...",
          compatibility: "90%",
        },
        {
          name: "Khối A - Toán, Lý, Hóa",
          description:
            "Phù hợp cho đổi mới sáng tạo trong công nghệ và kỹ thuật.",
          career: "Kỹ sư sáng tạo, Nhà phát triển sản phẩm...",
          compatibility: "85%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Thích hợp cho báo chí, truyền thông và các ngành sáng tạo.",
          career: "Nhà báo, Biên tập viên, Nhà viết...",
          compatibility: "88%",
        },
      ],
      INFJ: [
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Phù hợp với khả năng thấu hiểu con người và xã hội, lý tưởng cho giáo dục, tư vấn.",
          career: "Giáo viên, Tư vấn tâm lý, Công tác xã hội...",
          compatibility: "92%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description:
            "Thích hợp cho y học, tâm lý học và các ngành chăm sóc sức khỏe.",
          career: "Bác sĩ, Tâm lý học, Điều dưỡng...",
          compatibility: "88%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description: "Phù hợp cho các ngành tư vấn, phát triển nhân sự.",
          career: "Tư vấn, HR, Phát triển tổ chức...",
          compatibility: "85%",
        },
      ],
      INFP: [
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Lý tưởng cho các ngành sáng tạo, giáo dục và phát triển cá nhân.",
          career: "Nhà văn, Nghệ sĩ, Giáo viên...",
          compatibility: "90%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description:
            "Phù hợp cho các ngành chăm sóc sức khỏe và nghiên cứu xã hội.",
          career: "Tâm lý học, Điều dưỡng, Nghiên cứu xã hội...",
          compatibility: "83%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description: "Thích hợp cho viết lách, dịch thuật và giao tiếp.",
          career: "Dịch giả, Biên tập viên, Nhà viết...",
          compatibility: "87%",
        },
      ],
      ENFJ: [
        {
          name: "Khối C - Văn, Sử, Địa",
          description: "Hoàn hảo cho giáo dục, tư vấn và phát triển cộng đồng.",
          career: "Giáo viên, Tư vấn, Phát triển cộng đồng...",
          compatibility: "95%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Phù hợp cho quản lý nhân sự, truyền thông và phát triển tổ chức.",
          career: "HR, Truyền thông, Quản lý...",
          compatibility: "90%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description: "Thích hợp cho y học cộng đồng và chăm sóc sức khỏe.",
          career: "Y tế cộng đồng, Điều dưỡng...",
          compatibility: "80%",
        },
      ],
      ENFP: [
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Lý tưởng cho marketing, truyền thông và các ngành sáng tạo.",
          career: "Marketing, Truyền thông, Sáng tạo...",
          compatibility: "93%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description: "Phù hợp cho báo chí, giáo dục và các ngành xã hội.",
          career: "Nhà báo, Giáo viên, Nghệ sĩ...",
          compatibility: "90%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description: "Thích hợp cho nghiên cứu xã hội và tâm lý học.",
          career: "Tâm lý học, Nghiên cứu xã hội...",
          compatibility: "82%",
        },
      ],
      ISTJ: [
        {
          name: "Khối A - Toán, Lý, Hóa",
          description:
            "Phù hợp với tính cách cẩn thận, tỉ mỉ trong các ngành kỹ thuật và công nghệ.",
          career: "Kỹ sư, Kỹ thuật viên, Nhà khoa học...",
          compatibility: "88%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Thích hợp cho kế toán, tài chính và quản trị doanh nghiệp.",
          career: "Kế toán, Tài chính, Quản trị...",
          compatibility: "92%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description: "Phù hợp cho nghiên cứu khoa học ứng dụng và y học.",
          career: "Bác sĩ, Dược sĩ, Nghiên cứu...",
          compatibility: "85%",
        },
      ],
      ISFJ: [
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description:
            "Lý tưởng cho y học, dược học và các ngành chăm sóc sức khỏe.",
          career: "Bác sĩ, Dược sĩ, Điều dưỡng...",
          compatibility: "94%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Phù hợp cho giáo dục, công tác xã hội và phát triển cộng đồng.",
          career: "Giáo viên, Công tác xã hội...",
          compatibility: "89%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description: "Thích hợp cho các ngành dịch vụ và hỗ trợ khách hàng.",
          career: "Dịch vụ khách hàng, Hỗ trợ...",
          compatibility: "83%",
        },
      ],
      ESTJ: [
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Hoàn hảo cho quản trị kinh doanh, tài chính và lãnh đạo doanh nghiệp.",
          career: "Quản lý, Kinh doanh, Tài chính...",
          compatibility: "96%",
        },
        {
          name: "Khối A - Toán, Lý, Hóa",
          description:
            "Phù hợp cho quản lý dự án kỹ thuật và sản xuất công nghiệp.",
          career: "Quản lý kỹ thuật, Sản xuất...",
          compatibility: "88%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description: "Thích hợp cho quản lý công và chính quyền địa phương.",
          career: "Quản lý công, Chính quyền...",
          compatibility: "85%",
        },
      ],
      ESFJ: [
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description:
            "Lý tưởng cho y học, dược học và chăm sóc sức khỏe cộng đồng.",
          career: "Bác sĩ, Dược sĩ, Y tế cộng đồng...",
          compatibility: "92%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Phù hợp cho giáo dục, công tác xã hội và phát triển cộng đồng.",
          career: "Giáo viên, Công tác xã hội...",
          compatibility: "90%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Thích hợp cho quan hệ công chúng và dịch vụ khách hàng.",
          career: "PR, Dịch vụ khách hàng...",
          compatibility: "87%",
        },
      ],
      ISTP: [
        {
          name: "Khối A - Toán, Lý, Hóa",
          description: "Hoàn hảo cho cơ khí, kỹ thuật và các ngành thực hành.",
          career: "Kỹ sư cơ khí, Kỹ thuật...",
          compatibility: "93%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description: "Phù hợp cho nghiên cứu ứng dụng và công nghệ sinh học.",
          career: "Công nghệ sinh học, Nghiên cứu...",
          compatibility: "87%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description: "Thích hợp cho phân tích dữ liệu và hệ thống thông tin.",
          career: "Phân tích dữ liệu, IT...",
          compatibility: "82%",
        },
      ],
      ISFP: [
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Lý tưởng cho nghệ thuật, thiết kế và các ngành sáng tạo.",
          career: "Nghệ sĩ, Thiết kế, Sáng tạo...",
          compatibility: "88%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description:
            "Phù hợp cho nghiên cứu môi trường và bảo tồn thiên nhiên.",
          career: "Môi trường, Bảo tồn thiên nhiên...",
          compatibility: "85%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description: "Thích hợp cho dịch thuật và giao tiếp đa văn hóa.",
          career: "Dịch thuật, Giao tiếp...",
          compatibility: "80%",
        },
      ],
      ESTP: [
        {
          name: "Khối D - Toán, Văn, Anh",
          description:
            "Hoàn hảo cho kinh doanh, bán hàng và các ngành năng động.",
          career: "Kinh doanh, Bán hàng, Marketing...",
          compatibility: "91%",
        },
        {
          name: "Khối A - Toán, Lý, Hóa",
          description: "Phù hợp cho kỹ thuật ứng dụng và công nghệ thực tế.",
          career: "Kỹ thuật ứng dụng, Công nghệ...",
          compatibility: "86%",
        },
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Thích hợp cho báo chí, truyền thông và quan hệ công chúng.",
          career: "Nhà báo, Truyền thông, PR...",
          compatibility: "88%",
        },
      ],
      ESFP: [
        {
          name: "Khối C - Văn, Sử, Địa",
          description:
            "Lý tưởng cho giáo dục, nghệ thuật và các ngành giao tiếp.",
          career: "Giáo viên, Nghệ sĩ, Truyền thông...",
          compatibility: "90%",
        },
        {
          name: "Khối D - Toán, Văn, Anh",
          description: "Phù hợp cho du lịch, dịch vụ và quan hệ khách hàng.",
          career: "Du lịch, Dịch vụ, Khách hàng...",
          compatibility: "89%",
        },
        {
          name: "Khối B - Toán, Hóa, Sinh",
          description: "Thích hợp cho chăm sóc sức khỏe và phục hồi chức năng.",
          career: "Chăm sóc sức khỏe, Phục hồi...",
          compatibility: "83%",
        },
      ],
    };

    const description =
      mbtiDescriptions[mbtiResult] ||
      "Bạn có một tính cách độc đáo với nhiều điểm mạnh và tiềm năng phát triển.";
    const career_fields = careerFieldsMap[mbtiResult] || [
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
    ];

    return {
      mbti_description: description,
      career_fields: career_fields,
    };
  };

  // Handle redirect to hobby test
  const handleRedirectToHobbyTest = () => {
    // Tạo data để truyền qua
    const dataToPass = {
      name: userData.name,
      grade: userData.grade,
      province: userData.province,
      email: userData.email,
      phone: userData.phone,
      mbtiResult: userData.mbtiResult,
      mbtiPercentages: userData.mbtiPercentages,
      mbtiDescription: aiData?.mbti_description || "Mô tả tính cách MBTI",
    };

    // Lưu vào localStorage hoặc truyền qua props/navigation
    localStorage.setItem("questicMBTIData", JSON.stringify(dataToPass));

    // Chuyển trang (tùy thuộc vào routing system bạn dùng)
    // Nếu dùng React Router:
    // navigate('/hobby-test');

    // Hoặc đơn giản reload trang với parameter:
    window.location.href = "/hobby";
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
            {/* Logo */}
            <Link to="/">
              <div className="flex items-center w-48">
                <img src={"./Logo_CC_tron.svg"} alt="Logo" className="h-20" />
              </div>
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-blue-700 mb-2 flex items-center justify-center gap-2">
            Tư vấn Tuyển sinh Đại học
          </h2>
          <p className="text-blue-600 text-lg flex items-center justify-center gap-2">
            <BookOpen className="w-5 h-5" />
            Hoàn thành thông tin để nhận gợi ý trường và ngành phù hợp
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

        {/* Step 1: Personal Information */}
        {currentStep === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
              <User className="w-6 h-6" />
              Thông tin cá nhân
            </h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Họ và tên *
                </label>
                <input
                  type="text"
                  value={userData.name}
                  onChange={(e) =>
                    setUserData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/30 hover:bg-blue-50/50"
                  placeholder="Nhập tên của bạn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  <Users className="inline w-4 h-4 mr-2" />
                  Bạn là học sinh *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-3 px-4 py-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-all duration-200">
                    <input
                      type="radio"
                      name="grade"
                      value="grade11"
                      checked={userData.grade === "grade11"}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          grade: e.target.value,
                        }))
                      }
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-blue-700 font-medium">
                      Học sinh cấp 2
                    </span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50/50 transition-all duration-200">
                    <input
                      type="radio"
                      name="grade"
                      value="grade12"
                      checked={userData.grade === "grade12"}
                      onChange={(e) =>
                        setUserData((prev) => ({
                          ...prev,
                          grade: e.target.value,
                        }))
                      }
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-blue-700 font-medium">
                      Học sinh cấp 3
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  <MapPin className="inline w-4 h-4 mr-2" />
                  Tỉnh/Thành phố hiện tại *
                </label>
                <select
                  value={userData.province}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      province: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/30 hover:bg-blue-50/50"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  {provinceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email (không bắt buộc)
                </label>
                <input
                  type="email"
                  value={userData.email}
                  onChange={(e) =>
                    setUserData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/30 hover:bg-blue-50/50"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Số điện thoại (không bắt buộc)
                </label>
                <input
                  type="tel"
                  value={userData.phone}
                  onChange={(e) =>
                    setUserData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/30 hover:bg-blue-50/50"
                  placeholder="0123 456 789"
                />
              </div>

              <button
                onClick={handleNextStep}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Tiếp tục
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: MBTI Test */}
        {currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-md p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-blue-800 mb-2 flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Test MBTI - Khám phá tính cách của bạn
            </h3>
            <p className="text-blue-600 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Hãy trả lời các câu hỏi sau một cách thật lòng để chúng tôi có thể
              đưa ra gợi ý phù hợp nhất.
            </p>

            {/* Test Progress */}
            <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex justify-between mb-2">
                <span className="text-blue-700 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Câu hỏi{" "}
                  <span className="font-bold">
                    {Object.keys(userData.mbtiAnswers).length + 1}
                  </span>{" "}
                  / 70
                </span>
                <span className="text-blue-600 font-semibold">
                  {Math.round(
                    (Object.keys(userData.mbtiAnswers).length /
                      questions.length) *
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
                      (Object.keys(userData.mbtiAnswers).length /
                        questions.length) *
                      100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">{renderQuestionPage()}</div>

            <button
              onClick={handleNextQuestion}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {currentPage * questionsPerPage + questionsPerPage >=
              questions.length
                ? "Xem kết quả"
                : "Tiếp tục"}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step 3: Loading */}
        {currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-md p-8 border border-blue-200">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-800 mb-2 flex items-center justify-center gap-2">
                Đang phân tích kết quả
              </h3>
              <p className="text-blue-600 flex items-center justify-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Đang tạo gợi ý phù hợp cho bạn...
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 3 && aiData && (
          <div className="space-y-6">
            {/* MBTI Result */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center shadow-lg">
              <h3 className="text-2xl font-bold mb-4 flex items-center justify-center gap-2">
                Kết quả định hướng của bạn
              </h3>
              <div className="text-6xl font-bold mb-4 flex items-center justify-center gap-4">
                <Brain className="w-12 h-12" />
                {userData.mbtiResult}
              </div>
              <p className="text-blue-100 text-lg">{aiData.mbti_description}</p>

              <a
                href={`https://tuansu-lonewolf.github.io/MBTI_informations/pages/detail.html?code=${userData.mbtiResult}`}
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

            {/* Trait Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "EI", left: "Hướng ngoại", right: "Hướng nội" },
                { key: "SN", left: "Trực giác", right: "Tinh ý" },
                { key: "TF", left: "Lý trí", right: "Cảm xúc" },
                { key: "JP", left: "Có tổ chức", right: "Linh hoạt" },
              ].map((trait) => {
                const leftPercent = userData.mbtiPercentages[trait.key];
                const rightPercent = 100 - leftPercent;

                return (
                  <div
                    key={trait.key}
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
              })}
            </div>

            {/* Career Suggestions or Huy Ngu */}
            {userData.grade === "grade11" ? (
              <div>
                <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
                  <Award className="w-6 h-6" />
                  Gợi ý khối ngành phù hợp
                </h3>
                <div className="space-y-4">
                  {aiData.career_fields.map((field, index) => {
                    // Get appropriate icon based on field name
                    const getFieldIcon = (fieldName) => {
                      if (fieldName.includes("Khối A"))
                        return <Calculator className="w-6 h-6" />;
                      if (fieldName.includes("Khối B"))
                        return <Microscope className="w-6 h-6" />;
                      if (fieldName.includes("Khối C"))
                        return <BookOpen className="w-6 h-6" />;
                      if (fieldName.includes("Khối D"))
                        return <Globe className="w-6 h-6" />;
                      if (fieldName.includes("năng khiếu"))
                        return <Palette className="w-6 h-6" />;
                      return <Target className="w-6 h-6" />;
                    };

                    return (
                      <div
                        key={index}
                        className="bg-white rounded-lg p-6 shadow-md border border-blue-200 hover:shadow-lg transition-all duration-200 hover:border-blue-300"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                            <div className="text-blue-600">
                              {getFieldIcon(field.name)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-blue-700 mb-3 flex items-center gap-2">
                              {field.name}
                              <div className="ml-auto flex items-center gap-2 text-green-600">
                                <TrendingUp className="w-4 h-4" />
                                <span className="text-sm font-bold">
                                  {field.compatibility}
                                </span>
                              </div>
                            </h4>
                            <p className="text-blue-600 mb-3 text-sm leading-relaxed">
                              {field.description}
                            </p>
                            <div className="flex items-start gap-2 mb-4">
                              <Users className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                              <p className="text-gray-600 text-sm">
                                {field.career}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-blue-700">
                                Độ phù hợp:
                              </span>
                              <div className="flex-1 bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-1000 ease-out"
                                  style={{ width: field.compatibility }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-12 text-center shadow-lg cursor-pointer hover:to-red-700 transition-all duration-500 trasition-all"
                onClick={handleRedirectToHobbyTest}
              >
                <div className="text-4xl font-bold text-white flex items-center justify-center gap-4 mb-4">
                  <AlertCircle className="w-10 h-10" />
                  Tiếp tục thôi nào
                </div>
                <p className="text-red-100 text-lg">
                  Bấm vào đây để làm test sở thích nghề nghiệp!
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  <ChevronRight className="w-6 h-6 text-white" />
                  <span className="text-white font-medium">Tiếp tục</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuesticAdmissionAdvisor;
