import React from "react";

const EnhancedAnalysisResults = ({ results, onBack }) => {
  // Function to generate and download PDF report
  const generatePDFReport = (result) => {
    const reportContent = `
      <html>
        <head>
          <title>Career Compass - Báo cáo phân tích CV</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; color: #1e40af; margin-bottom: 30px; border-bottom: 2px solid #1e40af; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section-title { color: #1e40af; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .score-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .score { font-size: 24px; font-weight: bold; color: #1e40af; }
            .filename { font-weight: bold; color: #374151; margin-bottom: 10px; }
            .evaluation { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
            .timestamp { color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📊 Career Compass - Báo cáo phân tích CV</h1>
            <p>Ngày tạo: ${new Date().toLocaleDateString("vi-VN")}</p>
          </div>

          <div class="section">
            <div class="section-title">📄 Thông tin CV</div>
            <div class="score-box">
              <div class="filename">Tên file: ${result.filename}</div>
              <div>Kích thước: ${(result.file_size / 1024).toFixed(1)} KB</div>
              <div>Thời gian xử lý: ${result.processing_time?.toFixed(1)}s</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">🎯 Điểm số ATS</div>
            <div class="score-box">
              <div class="score">${result.score}/100</div>
              <div>Trạng thái: ${getScoreLabel(result.score)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">📋 Chi tiết đánh giá</div>
            <div class="evaluation">
              ${
                result.evaluation
                  ? result.evaluation
                      .replace(/\n/g, "<br>")
                      .replace(/\*/g, "&#42;")
                  : "Không có dữ liệu đánh giá"
              }
            </div>
          </div>

          <div class="section">
            <div class="section-title">ℹ️ Lưu ý</div>
            <p>Báo cáo này được tạo tự động bởi hệ thống Career Compass. 
            Điểm số ATS được tính toán dựa trên các tiêu chí tối ưu hóa cho hệ thống ATS (Applicant Tracking System).</p>
          </div>

          <div class="timestamp">
            Báo cáo được tạo lúc: ${new Date().toLocaleString("vi-VN")}
          </div>
        </body>
      </html>
    `;

    // Create blob and download
    const blob = new Blob([reportContent], { type: "text/html" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `career-compass-cv-analysis-${result.filename.replace(
      /\.[^/.]+$/,
      ""
    )}-${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Function to redirect to evaluate CV page
  const handleReanalyze = () => {
    window.location.href = "/evaluatecv";
  };
  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 border border-blue-200 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-blue-800 mb-2">
              Chưa có kết quả phân tích
            </h3>
            <p className="text-blue-600">
              Vui lòng upload CV để bắt đầu phân tích.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-green-600";
    if (score >= 60) return "from-yellow-500 to-yellow-600";
    if (score >= 40) return "from-blue-600 to-blue-700";
    return "from-gray-500 to-gray-600";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Xuất sắc";
    if (score >= 60) return "Tốt";
    if (score >= 40) return "Cần cải thiện";
    return "Yếu";
  };

  const formatEvaluation = (evaluation) => {
    if (!evaluation) return "";

    // Split by ## sections first
    const sections = evaluation
      .split(/##\s*/)
      .filter((section) => section.trim());

    return sections
      .map((section, index) => {
        const lines = section.split("\n").filter((line) => line.trim());
        if (lines.length === 0) return null;

        const firstLine = lines[0];
        const content = lines.slice(1).join("\n");

        // Check if this is a main section (starts with *1. and ends with **)
        const isMainSection = firstLine.match(/^\*[0-9]+\./);

        if (isMainSection) {
          // Extract title (remove * and **)
          const title = firstLine
            .replace(/^\*[0-9]+\.\s*/, "")
            .replace(/\*\*$/, "")
            .trim();

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border border-blue-200 mb-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h4 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full"></div>
                {title}
              </h4>
              <div className="space-y-4">
                {content.split("\n").map((line, i) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return <br key={i} />;

                  // Check if this is a subsection (starts with ** and ends with **)
                  const isSubsection = trimmedLine.match(/^\*\*.*\*\*$/);
                  if (isSubsection) {
                    const subsectionTitle = trimmedLine
                      .replace(/\*\*/g, "")
                      .trim();
                    return (
                      <div key={i} className="mb-4">
                        <h5 className="font-bold text-blue-700 text-lg mb-3">
                          {subsectionTitle}
                        </h5>
                      </div>
                    );
                  }

                  // Check if this is a bullet point
                  if (
                    trimmedLine.startsWith("*") &&
                    !trimmedLine.match(/^\*\*.*\*\*$/)
                  ) {
                    const content = trimmedLine.substring(1).trim();

                    // Check if content has ** bold markers
                    if (content.includes("**")) {
                      const parts = content.split("**");
                      return (
                        <div key={i} className="flex items-start gap-3 py-2">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-blue-700 leading-relaxed">
                            {parts.map((part, partIndex) =>
                              partIndex % 2 === 1 ? (
                                <strong key={partIndex} className="font-bold">
                                  {part}
                                </strong>
                              ) : (
                                <span key={partIndex}>{part}</span>
                              )
                            )}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={i} className="flex items-start gap-3 py-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-blue-700 leading-relaxed">
                          {content}
                        </span>
                      </div>
                    );
                  }

                  // Check if this is a numbered list
                  if (/^\d+\./.test(trimmedLine)) {
                    return (
                      <div key={i} className="py-2">
                        <span className="text-blue-700 font-medium leading-relaxed">
                          {trimmedLine}
                        </span>
                      </div>
                    );
                  }

                  // Check if this is a warning
                  if (
                    trimmedLine.includes("🚩") ||
                    trimmedLine.includes("⚠️")
                  ) {
                    return (
                      <div
                        key={i}
                        className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400 my-3"
                      >
                        <span className="text-blue-700 leading-relaxed">
                          {trimmedLine}
                        </span>
                      </div>
                    );
                  }

                  // Check if this is a positive highlight
                  if (
                    trimmedLine.includes("✅") ||
                    trimmedLine.includes("💪")
                  ) {
                    return (
                      <div
                        key={i}
                        className="p-4 bg-green-50 rounded-lg border-l-4 border-green-400 my-3"
                      >
                        <span className="text-green-700 leading-relaxed">
                          {trimmedLine}
                        </span>
                      </div>
                    );
                  }

                  // Check if this is a note (italic text with icon)
                  if (
                    trimmedLine.includes("Tuy nhiên") ||
                    trimmedLine.includes("Độ phù hợp")
                  ) {
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200 my-3"
                      >
                        <svg
                          className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-yellow-700 italic leading-relaxed">
                          {trimmedLine}
                        </span>
                      </div>
                    );
                  }

                  // Regular text
                  const processTextWithBold = (text) => {
                    if (!text.includes("**")) {
                      return <span>{text}</span>;
                    }

                    const parts = text.split("**");
                    return (
                      <span>
                        {parts.map((part, partIndex) =>
                          partIndex % 2 === 1 ? (
                            <strong key={partIndex} className="font-bold">
                              {part}
                            </strong>
                          ) : (
                            <span key={partIndex}>{part}</span>
                          )
                        )}
                      </span>
                    );
                  };

                  return (
                    <p key={i} className="text-blue-700 leading-relaxed py-1">
                      {processTextWithBold(trimmedLine)}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        } else {
          // This is a regular section (starts with ** and ends with **)
          const title = firstLine.replace(/\*\*/g, "").trim();

          return (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 border border-blue-200 mb-6 transition-shadow duration-200"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h5 className="font-semibold text-blue-800 mb-3 italic text-lg">
                    {title}
                  </h5>
                  <div className="space-y-3">
                    {content.split("\n").map((line, i) => {
                      const trimmedLine = line.trim();
                      if (!trimmedLine) return <br key={i} />;

                      // Check if this is a bullet point
                      if (
                        trimmedLine.startsWith("*") &&
                        !trimmedLine.match(/^\*\*.*\*\*$/)
                      ) {
                        const content = trimmedLine.substring(1).trim();

                        // Check if content has ** bold markers
                        if (content.includes("**")) {
                          const parts = content.split("**");
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-3 py-2"
                            >
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-blue-700 italic leading-relaxed">
                                {parts.map((part, partIndex) =>
                                  partIndex % 2 === 1 ? (
                                    <strong
                                      key={partIndex}
                                      className="font-bold"
                                    >
                                      {part}
                                    </strong>
                                  ) : (
                                    <span key={partIndex}>{part}</span>
                                  )
                                )}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div key={i} className="flex items-start gap-3 py-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                            <span className="text-blue-700 italic leading-relaxed">
                              {content}
                            </span>
                          </div>
                        );
                      }

                      // Regular text
                      const processTextWithBold = (text) => {
                        if (!text.includes("**")) {
                          return <span>{text}</span>;
                        }

                        const parts = text.split("**");
                        return (
                          <span>
                            {parts.map((part, partIndex) =>
                              partIndex % 2 === 1 ? (
                                <strong key={partIndex} className="font-bold">
                                  {part}
                                </strong>
                              ) : (
                                <span key={partIndex}>{part}</span>
                              )
                            )}
                          </span>
                        );
                      };

                      return (
                        <p
                          key={i}
                          className="text-blue-700 italic leading-relaxed"
                        >
                          {processTextWithBold(trimmedLine)}
                        </p>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        }
      })
      .filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 mt-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="flex items-center w-48">
              <img src={"./Logo_CC_tron.svg"} alt="Logo" className="h-20" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-blue-700 mb-2 flex items-center justify-center gap-2">
            📊 Kết quả phân tích CV
          </h2>
          <p className="text-blue-600 text-lg flex items-center justify-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Đã phân tích {results.length} CV •{" "}
            {results.filter((r) => !r.errors || r.errors.length === 0).length}{" "}
            thành công
          </p>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-medium rounded-lg shadow-md hover:bg-blue-50 transition-all duration-200 border border-blue-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Quay lại
          </button>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 gap-8 mb-8">
          {results.map((result, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md border-2  overflow-hidden transition-all duration-300 "
            >
              {/* Header with filename and score */}
              <div
                className={`bg-gradient-to-r ${getScoreColor(
                  result.score
                )} p-6 text-white`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        📄 {result.filename}
                      </h3>
                      <span className="text-blue-100 text-sm">
                        {(result.file_size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-4 border-white/30 flex flex-col items-center justify-center bg-white/20">
                      <span className="text-2xl font-bold">{result.score}</span>
                      <span className="text-xs text-white/80">/100</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-sm font-semibold">
                        {getScoreLabel(result.score)}
                      </span>
                      <div className="text-xs text-white/80">Điểm ATS</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-white/90">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm">
                    {result.processing_time?.toFixed(1)}s
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 bg-white/90 backdrop-blur-sm">
                {/* Errors if any */}
                {result.errors && result.errors.length > 0 && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-blue-800 font-semibold mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Lỗi trong quá trình xử lý:
                    </h4>
                    <ul className="space-y-2">
                      {result.errors.map((error, i) => (
                        <li
                          key={i}
                          className="text-blue-700 text-sm flex items-start gap-2"
                        >
                          <span className="text-blue-500 mt-1">•</span>
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warning notice */}
                {result.evaluation && result.evaluation.includes("🚩") && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="text-green-800 font-semibold mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Lưu ý quan trọng
                    </h4>
                    <p className="text-green-700 text-md leading-relaxed italic">
                      Những phần có icon 🚩 là những điểm mà người tạo CV cần
                      phải lưu ý để cải thiện. Đây là những gợi ý giúp CV của
                      bạn trở nên hoàn thiện hơn và tăng khả năng được chọn bởi
                      nhà tuyển dụng.
                    </p>
                  </div>
                )}

                {/* Main evaluation content */}
                {result.evaluation && (
                  <div className="evaluation-content">
                    {formatEvaluation(result.evaluation)}
                  </div>
                )}

                {/* Download/Action buttons */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => generatePDFReport(result)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Tải báo cáo
                  </button>
                  <button
                    onClick={handleReanalyze}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Phân tích lại
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Overall summary */}
        <div className="bg-white rounded-lg shadow-md border border-blue-200 p-8">
          <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Tổng quan
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <span className="text-blue-700 font-semibold">
                  Điểm trung bình:
                </span>
              </div>
              <span className="text-2xl font-bold text-blue-800">
                {(
                  results.reduce((sum, r) => sum + (r.score || 0), 0) /
                  results.length
                ).toFixed(1)}
              </span>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg border border-green-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-green-700 font-semibold">
                  CV xuất sắc (80+):
                </span>
              </div>
              <span className="text-2xl font-bold text-green-800">
                {results.filter((r) => r.score >= 80).length}
              </span>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <span className="text-yellow-700 font-semibold">
                  Cần cải thiện:
                </span>
              </div>
              <span className="text-2xl font-bold text-yellow-800">
                {results.filter((r) => r.score < 60).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAnalysisResults;
