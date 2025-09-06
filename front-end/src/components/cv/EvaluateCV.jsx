import React, { useState, useRef, useEffect } from "react";
import CVFileList from "./CVFileList";
import EnhancedAnalysisResults from "./EnhancedAnalysisResults";
import Header from "../Header/header";
import { auth, db } from "../firebase.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const POSSIBLE_ENDPOINTS = [
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000", 
  "http://127.0.0.1:5000"
];

const EvaluateCV = () => {
  // State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [industry, setIndustry] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [criteriaOption, setCriteriaOption] = useState("ats");
  const [customCriteria, setCustomCriteria] = useState("");
  const [showCustomCriteria, setShowCustomCriteria] = useState(false);
  const [progress, setProgress] = useState({
    show: false,
    message: "",
    percent: 0,
  });
  const [errorMsg, setErrorMsg] = useState("");
  const [results, setResults] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({
    show: false,
    connected: false,
    geminiConfigured: false,
  });
  const [successMsg, setSuccessMsg] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState(POSSIBLE_ENDPOINTS[0]);
  const [isCheckingPro, setIsCheckingPro] = useState(true);
  const [isPro, setIsPro] = useState(false);

  const fileInputRef = useRef();
  const navigate = useNavigate();

  // Kiểm tra hết hạn subscription
  const checkSubscriptionExpiry = async (uid) => {
    try {
      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) return false;
      const userData = userDoc.data();
      const subscription = userData.subscription;
      if (subscription?.isPro && subscription?.endDate) {
        const endDate = subscription.endDate.toDate();
        const now = new Date();
        if (endDate < now) {
          // Hết hạn - cập nhật isPro = false
          await updateDoc(userRef, { "subscription.isPro": false });
          return false;
        }
        return true;
      }
      return subscription?.isPro || false;
    } catch (error) {
      console.error("Error checking subscription expiry:", error);
      return false;
    }
  };

  // Kiểm tra Pro khi mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const proStatus = await checkSubscriptionExpiry(user.uid);
        setIsPro(proStatus);
        setIsCheckingPro(false);
        if (!proStatus) {
          navigate("/premium");
        }
      } else {
        setIsCheckingPro(false);
        setIsPro(false);
        navigate("/login");
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [navigate]);

  // Event handlers
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  };
  const getAuthHeaders = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      return {
        "Authorization": `Bearer ${token}`,
      };
    } catch (error) {
      console.error("Error getting auth token:", error);
      return {};
    }
  };
  const handleFileSelection = (files) => {
    const maxFiles = 10;
    const validFiles = files.filter((file) => {
      if (file.type !== "application/pdf") {
        showError(`File "${file.name}" không phải PDF và đã bị bỏ qua.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        showError(`File "${file.name}" quá lớn (>10MB) và đã bị bỏ qua.`);
        return false;
      }
      return true;
    });
    setSelectedFiles((prev) => {
      let newFiles = [...prev];
      validFiles.forEach((file) => {
        const exists = newFiles.some(
          (f) => f.name === file.name && f.size === file.size
        );
        if (!exists && newFiles.length < maxFiles) {
          newFiles.push(file);
        } else if (newFiles.length >= maxFiles) {
          showError(`Chỉ được chọn tối đa ${maxFiles} file.`);
        }
      });
      return newFiles;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCriteriaChange = (e) => {
    setCriteriaOption(e.target.value);
    setShowCustomCriteria(e.target.value === "custom");
  };

  // Connection check
  const findWorkingEndpoint = async () => {
    for (const endpoint of POSSIBLE_ENDPOINTS) {
      try {
        const authHeaders = await getAuthHeaders();
        const response = await fetch(`${endpoint}/health`, {
          method: "GET",
          mode: "cors",
          headers: authHeaders,
          signal: AbortSignal.timeout(3000),
        });
        if (response.ok) {
          const data = await response.json();
          setApiBaseUrl(endpoint);
          setConnectionStatus({
            show: true,
            connected: true,
            geminiConfigured: data.services?.gemini_api || false,
          });
          if (!data.services?.gemini_api) {
            showError("⚠️ Backend kết nối thành công nhưng Gemini API chưa được cấu hình.");
            return false;
          }
          return true;
        }
      } catch {
        continue;
      }
    }
    setConnectionStatus({
      show: true,
      connected: false,
      geminiConfigured: false,
    });
    showError(
      `❌ Không thể kết nối đến server. Đã thử: ${POSSIBLE_ENDPOINTS.join(
        ", "
      )}`
    );
    return false;
  };

  // Analyze CV
  const analyzeCV = async () => {
    setErrorMsg("");
    setResults(null);
    if (selectedFiles.length === 0) {
      showError("📄 Vui lòng chọn ít nhất 1 file CV.");
      return;
    }
    if (!industry.trim()) {
      showError("🏢 Vui lòng nhập ngành nghề ứng tuyển.");
      return;
    }
    if (criteriaOption === "custom" && !customCriteria.trim()) {
      showError("📝 Vui lòng nhập tiêu chí tùy chỉnh.");
      return;
    }
    
    setProgress({
      show: true,
      message: "Kiểm tra kết nối server...",
      percent: 0,
    });
    
    const isConnected = await findWorkingEndpoint();
    if (!isConnected) {
      setProgress({ show: false, message: "", percent: 0 });
      return;
    }
    
    setProgress({ show: true, message: "Chuẩn bị dữ liệu...", percent: 10 });
    
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("cvs", file);
      });
      formData.append("industry", industry);
      formData.append("criteria_option", criteriaOption);
      if (criteriaOption === "custom") {
        formData.append("custom_criteria", customCriteria);
      }
      if (jobDescription.trim()) {
        formData.append("job_description", jobDescription.trim());
      }
      
      setProgress({
        show: true,
        message: "Đang gửi dữ liệu lên server...",
        percent: 20,
      });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      // THÊM authorization headers
      const authHeaders = await getAuthHeaders();
      
      const response = await fetch(`${apiBaseUrl}/evaluate`, {
        method: "POST",
        body: formData,
        mode: "cors",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...authHeaders, // THÊM dòng này
        },
      });
      
      clearTimeout(timeoutId);
      
      setProgress({
        show: true,
        message: "Nhận kết quả từ server...",
        percent: 80,
      });
      
      if (!response.ok) {
        let errorMessage;
        try {
          const errorData = await response.json();
          errorMessage =
            errorData.error ||
            `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      setProgress({ show: true, message: "Hoàn thành!", percent: 100 });
      
      // Extract results array from response
      const results = responseData.results || responseData;
      
      if (!Array.isArray(results)) {
        throw new Error("Dữ liệu trả về không đúng định dạng.");
      }
      
      setTimeout(() => {
        setProgress({ show: false, message: "", percent: 0 });
        setResults(results);
        setSuccessMsg(`✅ Phân tích hoàn thành cho ${results.length} file CV.`);
        setTimeout(() => setSuccessMsg(""), 5000);
      }, 1000);
    } catch (error) {
      setProgress({ show: false, message: "", percent: 0 });
      if (error.name === "AbortError") {
        showError("⏱️ Quá thời gian chờ. Vui lòng thử lại với ít file hơn.");
      } else if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        showError("🌐 Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.");
      } else {
        showError(`❌ ${error.message}`);
      }
    }
  };

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => {
      const el = document.getElementById("error");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // On mount: check backend
  useEffect(() => {
    findWorkingEndpoint();
    // eslint-disable-next-line
  }, []);

  // UI render
  if (isCheckingPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
        </div>
      </div>
    );
  }

  if (!isPro) {
    // Đã redirect, không render gì nữa
    return null;
  }

  return (
    <>
      <Header />
      {results ? (
        // Show enhanced results full screen
        <EnhancedAnalysisResults 
          results={results} 
          onBack={() => setResults(null)}
        />
      ) : (
        // Show CV evaluation form
        <div className="container mx-auto p-4 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-6  mt-20">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Đánh Giá CV Theo Chuẩn ATS
          </h1>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              AI-Powered
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Multi-PDF
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              Instant Analysis
            </span>
          </div>
          <p className="text-gray-600">
            Phân tích CV chuyên nghiệp với Gemini AI - Tối ưu hóa cho hệ thống
            ATS
          </p>
        </header>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left: Upload & Settings */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Upload CV và Cài đặt
            </h2>
            {/* Upload CV */}
            <div className="mb-4">
              <label
                htmlFor="cv-upload"
                className="block text-sm font-medium text-blue-700 mb-2"
              >
                Tải lên CV (PDF) - Có thể chọn nhiều file
              </label>
              <div
                className="border-2 border-dashed border-blue-200 rounded-lg p-4 text-center cursor-pointer hover:bg-blue-50/50 transition-colors bg-blue-50/30"
                id="dropzone"
                onClick={() =>
                  fileInputRef.current && fileInputRef.current.click()
                }
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add("ring-2", "ring-blue-300");
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.remove(
                    "ring-2",
                    "ring-blue-300"
                  );
                }}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="cv-upload"
                  accept=".pdf"
                  multiple
                  className="hidden"
                  ref={fileInputRef}
                  onChange={(e) =>
                    handleFileSelection(Array.from(e.target.files))
                  }
                />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mx-auto text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-blue-700">
                  Kéo và thả <strong>nhiều file CV</strong> hoặc{" "}
                  <span className="text-blue-600 font-medium">chọn file</span>
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Chỉ hỗ trợ file PDF | Tối đa 10 file
                </p>
              </div>
              {/* File list */}
              <CVFileList
                files={selectedFiles}
                onRemove={removeFile}
                onClear={clearFiles}
              />
            </div>
            {/* Industry input */}
            <div className="mb-4">
              <label
                htmlFor="industry-input"
                className="block text-sm font-medium text-blue-700 mb-2"
              >
                Ngành nghề ứng tuyển
              </label>
              <input
                type="text"
                id="industry-input"
                className="w-full p-3 border-2 border-blue-200 rounded-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-blue-50/30 hover:bg-blue-50/50"
                placeholder="Ví dụ: IT, Data Science, Marketing, v.v."
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            {/* Criteria radio */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-blue-700 mb-2">
                Tiêu chí đánh giá
              </label>
              <div className="flex flex-wrap gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="criteria"
                    value="ats"
                    checked={criteriaOption === "ats"}
                    onChange={handleCriteriaChange}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-blue-700 font-medium">
                    Chuẩn ATS
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="criteria"
                    value="tshape"
                    checked={criteriaOption === "tshape"}
                    onChange={handleCriteriaChange}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-blue-700 font-medium">
                    T-Shape Skills
                  </span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="criteria"
                    value="custom"
                    checked={criteriaOption === "custom"}
                    onChange={handleCriteriaChange}
                    className="form-radio text-blue-600"
                  />
                  <span className="ml-2 text-sm text-blue-700 font-medium">
                    Tùy chỉnh
                  </span>
                </label>
              </div>
            </div>
            {/* Custom criteria */}
            {showCustomCriteria && (
              <div className="mb-4">
                <label
                  htmlFor="custom-criteria"
                  className="block text-sm font-medium text-blue-700 mb-2"
                >
                  Tiêu chí tùy chỉnh
                </label>
                <textarea
                  id="custom-criteria"
                  rows={4}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-blue-50/30 hover:bg-blue-50/50"
                  placeholder="Nhập tiêu chí đánh giá tùy chỉnh..."
                  value={customCriteria}
                  onChange={(e) => setCustomCriteria(e.target.value)}
                />
              </div>
            )}
            {/* Analyze button */}
            <button
              onClick={analyzeCV}
              className={`w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg transition-all duration-200 shadow-md flex items-center justify-center font-medium ${
                progress.show
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:from-blue-700 hover:to-blue-800"
              }`}
              disabled={progress.show}
            >
              {progress.show ? (
                <svg
                  className="animate-spin h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              )}
              {progress.show ? "Đang xử lý..." : "Phân Tích CV Với Gemini AI"}
            </button>
          </section>
          {/* Right: Job Description */}
          <section className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5h7a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z"
                />
              </svg>
              Mô tả công việc (JD)
            </h2>
            <div className="mb-4">
              <label
                htmlFor="job-description"
                className="block text-sm font-medium text-blue-700 mb-2"
              >
                Nhập mô tả công việc để so sánh với CV
              </label>
              <textarea
                id="job-description"
                rows={12}
                className="w-full p-3 border-2 border-blue-200 rounded-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none bg-blue-50/30 hover:bg-blue-50/50"
                placeholder={`Dán mô tả công việc (JD) vào đây để AI có thể so sánh CV với yêu cầu cụ thể...\n\nVí dụ:\n- Yêu cầu 3+ năm kinh nghiệm với React, Node.js\n- Thành thạo JavaScript, TypeScript, HTML/CSS\n- Kinh nghiệm với cơ sở dữ liệu MongoDB, PostgreSQL\n- Hiểu biết về Agile/Scrum\n- Tiếng Anh giao tiếp tốt\n- Khả năng làm việc độc lập và theo nhóm`}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
            <div className="mt-4 bg-blue-50 p-4 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 text-sm mb-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Lưu ý:
              </h3>
              <p className="text-sm text-blue-700">
                Khi cung cấp JD, AI sẽ phân tích mức độ phù hợp cho{" "}
                <strong>tất cả CV</strong> và tăng trọng số đánh giá phù hợp lên
                30%.
              </p>
            </div>
          </section>
        </div>

        {/* Connection Status */}
        {connectionStatus.show && (
          <div
            className={`mt-4 p-3 rounded-md ${
              connectionStatus.connected && connectionStatus.geminiConfigured
                ? "bg-green-50 border border-green-200"
                : connectionStatus.connected
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-center">
              <div className="mr-2">
                {connectionStatus.connected &&
                connectionStatus.geminiConfigured ? (
                  <svg
                    className="h-4 w-4 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : connectionStatus.connected ? (
                  <svg
                    className="h-4 w-4 text-yellow-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-4 w-4 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">
                {connectionStatus.connected &&
                connectionStatus.geminiConfigured ? (
                  <span className="text-green-700">
                    ✅ Kết nối server thành công
                  </span>
                ) : connectionStatus.connected ? (
                  <span className="text-yellow-700">
                    ⚠️ Server OK, cần cấu hình Gemini API
                  </span>
                ) : (
                  <span className="text-red-700">
                    ❌ Không thể kết nối server
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Progress Bar & Loading */}
        {progress.show && (
          <div className="mt-6">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-700">
                  Tiến trình phân tích
                </span>
                <span className="text-sm text-blue-600">
                  {progress.percent}%
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-800 rounded-full transition-all duration-300"
                  style={{ width: `${progress.percent}%` }}
                ></div>
              </div>
              <div className="text-xs text-blue-500 mt-2">
                {progress.message}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMsg && (
          <section
            id="error"
            className="text-red-600 text-center my-4 p-3 bg-red-50 rounded-md"
          >
            <div className="flex items-start justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <h4 className="font-medium text-red-800">Có lỗi xảy ra</h4>
                <p className="text-red-700 text-sm mt-1">{errorMsg}</p>
              </div>
            </div>
          </section>
        )}

        {/* Success message */}
        {successMsg && (
          <div className="fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm">
            <div className="flex items-start">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm">{successMsg}</span>
            </div>
          </div>
        )}

        {/* ATS Info */}
        <section className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Hệ thống ATS đánh giá CV dựa trên các tiêu chí:
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">
                🎯 Từ khóa phù hợp (30%)
              </h3>
              <p className="text-sm text-blue-600">
                CV chứa từ khóa liên quan đến công việc trong JD
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">
                📄 Định dạng chuẩn (20%)
              </h3>
              <p className="text-sm text-blue-600">
                PDF/DOCX, font chữ đơn giản, bố cục rõ ràng
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">
                🏗️ Cấu trúc logic (15%)
              </h3>
              <p className="text-sm text-blue-600">
                Thông tin cá nhân, kinh nghiệm, kỹ năng
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">
                🎯 Phù hợp với JD (20%)
              </h3>
              <p className="text-sm text-blue-600">
                ATS so sánh CV với mô tả công việc
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">
                ✍️ Không lỗi chính tả (10%)
              </h3>
              <p className="text-sm text-blue-600">
                Grammar và spelling chính xác
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <h3 className="font-medium text-blue-700 mb-1">
                🔗 Hồ sơ trực tuyến (5%)
              </h3>
              <p className="text-sm text-blue-600">
                LinkedIn, GitHub, Portfolio
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center mt-8 text-gray-500 text-sm p-4">
          <p>
            CV được đánh giá chi tiết theo từng tiêu chí, giúp bạn tối ưu để
            vượt qua hệ thống ATS
          </p>
          <p className="mt-2">
            Công cụ đánh giá CV theo chuẩn ATS | Gemini AI | Hỗ trợ Multi-PDF
          </p>
        </footer>
        </div>
      )}
    </>
  );
};

export default EvaluateCV;
