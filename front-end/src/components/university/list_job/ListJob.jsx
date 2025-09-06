import React, { useEffect, useState, useCallback } from "react";
import Header from "../../Header/header";
import { ArrowLeft, ArrowUp } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_UNIVERSITY_API_URL || "http://localhost:8000";

function getSchoolCodeFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get("school") || "";
}

const ListJob = () => {
  // State
  const [university, setUniversity] = useState(null);
  const [majors, setMajors] = useState([]);
  const [filteredMajors, setFilteredMajors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [availableMethods, setAvailableMethods] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [apiStatus, setApiStatus] = useState("loading");
  const [successMsg, setSuccessMsg] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // API fetch
  const fetchUniversityData = useCallback(async () => {
    setLoading(true);
    setError("");
    setApiStatus("loading");
    const schoolCode = getSchoolCodeFromURL();
    if (!schoolCode) {
      setError("Không tìm thấy mã trường trong URL");
      setLoading(false);
      return;
    }
    try {
      // Fetch university info
      const uniRes = await fetch(`${API_BASE_URL}/universities/${schoolCode}`);
      if (!uniRes.ok)
        throw new Error(`HTTP ${uniRes.status}: ${uniRes.statusText}`);
      const uniData = await uniRes.json();
      setUniversity(uniData);
      // Fetch majors
      const majorsRes = await fetch(
        `${API_BASE_URL}/universities/${schoolCode}`
      );
      if (!majorsRes.ok)
        throw new Error(`HTTP ${majorsRes.status}: ${majorsRes.statusText}`);
      const majorsData = await majorsRes.json();
      // Parse majors from tables
      let allMajors = [];
      let methods = new Set();
      let years = new Set();
      if (majorsData.tables && majorsData.tables.length > 0) {
        majorsData.tables.forEach((table) => {
          if (table.data && Array.isArray(table.data)) {
            // Parse method & year from table title
            const yearMatch = table.table_title.match(/năm\s*(\d{4})/i);
            const year = yearMatch ? yearMatch[1] : null;
            let method = table.table_title;
            if (yearMatch)
              method = table.table_title.replace(/năm\s*\d{4}/i, "").trim();
            method = method
              .replace(/^Điểm chuẩn theo phương thức\s*/i, "")
              .trim();
            if (method) methods.add(method);
            if (year) years.add(year);
            table.data.forEach((major) => {
              allMajors.push({
                ...major,
                table_title: table.table_title,
                method,
                year,
              });
            });
          }
        });
      }
      setMajors(allMajors);
      setFilteredMajors(allMajors);
      setAvailableMethods(Array.from(methods).sort());
      setAvailableYears(Array.from(years).sort((a, b) => b - a));
      setApiStatus("online");
      setSuccessMsg(`Đã tải xong ${allMajors.length} ngành!`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setApiStatus("offline");
      setError("Không thể tải dữ liệu: " + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // On mount: fetch data
  useEffect(() => {
    fetchUniversityData();
    // Health check định kỳ
    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/health`)
        .then((res) => {
          setApiStatus(res.ok ? "online" : "offline");
        })
        .catch(() => setApiStatus("offline"));
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUniversityData]);

  // Handle scroll event to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Search/filter handler
  useEffect(() => {
    let data = majors;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      data = data.filter(
        (major) =>
          (major["Tên ngành"] &&
            major["Tên ngành"].toLowerCase().includes(lower)) ||
          (major["Tổ hợp môn"] &&
            major["Tổ hợp môn"].toLowerCase().includes(lower)) ||
          (major["Mã ngành"] && major["Mã ngành"].toLowerCase().includes(lower))
      );
    }
    if (scoreFilter !== "all") {
      data = data.filter((major) => {
        const score = parseFloat(major["Điểm chuẩn"]) || 0;
        switch (scoreFilter) {
          case "high":
            return score > 25;
          case "medium":
            return score >= 20 && score <= 25;
          case "low":
            return score < 20 && score > 0;
          default:
            return true;
        }
      });
    }
    if (methodFilter !== "all") {
      data = data.filter((major) => major.method === methodFilter);
    }
    if (yearFilter !== "all") {
      data = data.filter((major) => major.year === yearFilter);
    }
    setFilteredMajors(data);
  }, [majors, searchTerm, scoreFilter, methodFilter, yearFilter]);

  // UI render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      {/* Top Menu Bar */}

      <Header />

      {/* API Status */}
      <div
        className={`fixed top-20 right-6 px-4 py-2 rounded-full text-white text-sm z-50 flex items-center gap-2 ${
          apiStatus === "online"
            ? "bg-green-600"
            : apiStatus === "offline"
            ? "bg-red-600"
            : "bg-yellow-500 animate-pulse"
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        {apiStatus === "online" && <span>🟢 API Online</span>}
        {apiStatus === "offline" && <span>🔴 API Offline</span>}
        {apiStatus === "loading" && <span>🟡 Đang kết nối...</span>}
      </div>

      {/* Offline Banner */}
      {apiStatus === "offline" && (
        <div className="fixed top-16 left-0 right-0 bg-red-600 text-white text-center font-bold py-3 z-40 animate-slide-in-down">
          ⚠️ Không thể kết nối với server. Một số tính năng có thể không hoạt
          động.
        </div>
      )}

      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* University Header */}
        <div className="text-center mb-8 mt-20">
          {/* Back button - góc trái trên */}
          <button
            onClick={() => window.history.back()}
            className=" top-120 top-32 left-6 flex items-center space-x-2 px-3 py-2 bg-white text-gray-600 rounded-lg shadow-md  hover:text-blue-600 transition-all duration-200 border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Quay lại</span>
          </button>
          <div className="flex flex-col items-center mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-4xl font-bold text-white border-4 border-blue-100 mb-4">
              {university && university.school_name
                ? university.school_name.charAt(0).toUpperCase()
                : university && university.school_code
                ? university.school_code.charAt(0)
                : "🏛️"}
            </div>
            <div className="university-name bg-white rounded-2xl py-4 px-6 text-2xl font-bold text-blue-800 shadow mb-2">
              {university
                ? university.school_name || `Trường ${university.school_code}`
                : "Đang tải..."}
            </div>
            <div className="university-code text-blue-700 text-lg mb-2">
              {university
                ? `Mã trường: ${university.school_code}`
                : "Mã trường: ..."}
            </div>
            <div className="university-meta flex flex-wrap gap-4 justify-center mt-2">
              {university && university.location && (
                <div className="meta-item bg-white/30 border border-white/50 rounded-full px-4 py-2 text-blue-700 flex items-center gap-2">
                  📍 {university.location}
                </div>
              )}
              {university && university.type && (
                <div className="meta-item bg-white/30 border border-white/50 rounded-full px-4 py-2 text-blue-700 flex items-center gap-2">
                  🏛️ {university.type}
                </div>
              )}
              {university && university.website && (
                <div className="meta-item bg-white/30 border border-white/50 rounded-full px-4 py-2 text-blue-700 flex items-center gap-2">
                  🌐{" "}
                  <a
                    href={university.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Website
                  </a>
                </div>
              )}
              {university && university.major_count && (
                <div className="meta-item bg-white/30 border border-white/50 rounded-full px-4 py-2 text-blue-700 flex items-center gap-2">
                  🎓 {university.major_count} ngành đào tạo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl p-6 shadow mb-8">
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <input
              type="text"
              className="flex-1 min-w-[200px] px-4 py-3 border-2 border-blue-200 rounded-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50 hover:bg-blue-100"
              placeholder="Tìm kiếm ngành học, tổ hợp môn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-blue-900 transition"
              onClick={() => setSearchTerm(searchTerm)}
            >
              🔍 Tìm kiếm
            </button>
            <button
              className="text-red-600 underline text-sm ml-2"
              onClick={() => {
                setSearchTerm("");
                setScoreFilter("all");
                setMethodFilter("all");
                setYearFilter("all");
              }}
            >
              Xóa bộ lọc
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-6">
            {/* Score Filter */}
            <div className="flex flex-col gap-2 items-center">
              <span className="font-semibold text-blue-700">
                📊 Điểm chuẩn:
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={`filter-btn px-4 py-2 rounded-full border-2 ${
                    scoreFilter === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200"
                  }`}
                  onClick={() => setScoreFilter("all")}
                >
                  Tất cả
                </button>
                <button
                  className={`filter-btn px-4 py-2 rounded-full border-2 ${
                    scoreFilter === "high"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200"
                  }`}
                  onClick={() => setScoreFilter("high")}
                >
                  Cao (&gt;25)
                </button>
                <button
                  className={`filter-btn px-4 py-2 rounded-full border-2 ${
                    scoreFilter === "medium"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200"
                  }`}
                  onClick={() => setScoreFilter("medium")}
                >
                  Trung bình (20-25)
                </button>
                <button
                  className={`filter-btn px-4 py-2 rounded-full border-2 ${
                    scoreFilter === "low"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200"
                  }`}
                  onClick={() => setScoreFilter("low")}
                >
                  Thấp (&lt;20)
                </button>
              </div>
            </div>
            {/* Method Filter */}
            <div className="flex flex-col gap-2 items-center">
              <span className="font-semibold text-blue-700">
                🎯 Phương thức:
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={`filter-btn px-4 py-2 rounded-full border-2 ${
                    methodFilter === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200"
                  }`}
                  onClick={() => setMethodFilter("all")}
                >
                  Tất cả
                </button>
                {availableMethods.map((method) => (
                  <button
                    key={method}
                    className={`filter-btn px-4 py-2 rounded-full border-2 ${
                      methodFilter === method
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-700 border-blue-200"
                    }`}
                    onClick={() => setMethodFilter(method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
            {/* Year Filter */}
            <div className="flex flex-col gap-2 items-center">
              <span className="font-semibold text-blue-700">📅 Năm học:</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={`filter-btn px-4 py-2 rounded-full border-2 ${
                    yearFilter === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700 border-blue-200"
                  }`}
                  onClick={() => setYearFilter("all")}
                >
                  Tất cả
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    className={`filter-btn px-4 py-2 rounded-full border-2 ${
                      yearFilter === year
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-blue-700 border-blue-200"
                    }`}
                    onClick={() => setYearFilter(year)}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success message */}
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow mb-4 text-center animate-fade-in">
            {successMsg}
          </div>
        )}
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow mb-4 text-center animate-fade-in">
            {error}
          </div>
        )}
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <div className="text-blue-700 font-medium">Đang tải dữ liệu...</div>
          </div>
        )}

        {/* Majors grid */}
        <div
          className="majors-grid grid grid-cols-1 md:grid-cols-2 gap-6"
          id="majorsGrid"
        >
          {!loading && filteredMajors.length === 0 && !error && (
            <div className="col-span-full text-center text-blue-700 bg-blue-50 rounded-lg p-8 shadow">
              <div className="text-2xl mb-2">
                🔍 Không tìm thấy ngành học nào phù hợp
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    setSearchTerm("");
                    setScoreFilter("all");
                    setMethodFilter("all");
                    setYearFilter("all");
                  }}
                >
                  Xóa bộ lọc
                </button>
                <button
                  className="bg-gray-200 text-blue-700 px-4 py-2 rounded-lg"
                  onClick={() => window.location.reload()}
                >
                  Tải lại trang
                </button>
              </div>
            </div>
          )}
          {filteredMajors.map((major, idx) => {
            const majorIcon = major["Tên ngành"]
              ? major["Tên ngành"].charAt(0).toUpperCase()
              : "🎓";
            const score = major["Điểm chuẩn"] || "Chưa công bố";
            const subjects = major["Tổ hợp môn"]
              ? major["Tổ hợp môn"].split(";").map((s) => s.trim())
              : [];
            return (
              <div
                key={major["Mã ngành"] + idx}
                className="major-card bg-white rounded-2xl p-6 shadow hover:shadow-lg transition flex flex-col gap-2 border-t-4 border-blue-600 animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="major-name flex items-center gap-3 text-lg font-bold text-blue-700 mb-2">
                  <div className="major-icon w-12 h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl font-bold text-white border-2 border-blue-100">
                    {majorIcon}
                  </div>
                  {major["Tên ngành"] || "Chưa có tên ngành"}
                </div>

                <div className="major-info flex flex-col gap-2 mb-2">
                  {subjects.length > 0 && (
                    <div className="info-row flex gap-2 items-center text-sm">
                      <span className="info-label font-semibold text-blue-700">
                        📚 Tổ hợp môn:
                      </span>
                      <div className="info-value flex flex-wrap gap-1">
                        {subjects.map((subject, i) => (
                          <span
                            key={i}
                            className="subject-combo bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200 text-xs font-medium mr-1 mb-1"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="info-row flex gap-2 items-center text-sm">
                    <span className="info-label font-semibold text-blue-700">
                      📈 Điểm chuẩn:
                    </span>
                    <span className="info-value">
                      <span className="score-highlight bg-gradient-to-r from-blue-600 to-blue-800 text-white px-3 py-1 rounded-full font-bold text-sm">
                        {score}
                      </span>
                    </span>
                  </div>
                  {major["Chỉ tiêu"] && (
                    <div className="info-row flex gap-2 items-center text-sm">
                      <span className="info-label font-semibold text-blue-700">
                        👥 Chỉ tiêu:
                      </span>
                      <span className="info-value">
                        {major["Chỉ tiêu"]} sinh viên
                      </span>
                    </div>
                  )}
                  {major["Mã ngành"] && (
                    <div className="info-row flex gap-2 items-center text-sm">
                      <span className="info-label font-semibold text-blue-700">
                        🔖 Mã ngành:
                      </span>
                      <span className="info-value">{major["Mã ngành"]}</span>
                    </div>
                  )}
                  {(major.method || major.year) && (
                    <div className="info-row flex gap-2 items-center text-sm">
                      <span className="info-label font-semibold text-blue-700">
                        📋 Phương thức:
                      </span>
                      <span className="info-value">
                        {major.method || "Chưa xác định"}
                        {major.year ? ` (${major.year})` : ""}
                      </span>
                    </div>
                  )}
                </div>
                {major["Ghi chú"] && (
                  <div className="note-section bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-yellow-800 text-sm mt-2">
                    <strong>📝 Ghi chú:</strong> {major["Ghi chú"]}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 flex items-center justify-center z-50"
            aria-label="Cuộn lên đầu trang"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ListJob;
