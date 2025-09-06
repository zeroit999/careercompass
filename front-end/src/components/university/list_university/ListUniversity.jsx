import React, { useEffect, useState, useCallback } from "react";
import Header from "../../Header/header";
const API_BASE_URL =
  import.meta.env.VITE_UNIVERSITY_API_URL || "http://localhost:8000";
import { useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function countMajors(data) {
  if (!data || !data.majors) return 0;
  return Array.isArray(data.majors)
    ? data.majors.length
    : Object.keys(data.majors).length;
}

const ListUniversity = () => {
  // State
  const [universities, setUniversities] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [apiStatus, setApiStatus] = useState("loading"); // online/offline/loading
  const [successMsg, setSuccessMsg] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // API fetch
  const fetchUniversities = useCallback(
    async (search = "", type_filter = "all") => {
      setLoading(true);
      setError("");
      setApiStatus("loading");
      try {
        const params = [];
        if (search) params.push(`search=${encodeURIComponent(search)}`);
        if (type_filter && type_filter !== "all")
          params.push(`type_filter=${encodeURIComponent(type_filter)}`);
        const url = `${API_BASE_URL}/universities${
          params.length ? "?" + params.join("&") : ""
        }`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        setUniversities(data.universities || []);
        setFiltered(data.universities || []);
        setApiStatus("online");
        setSuccessMsg(
          `Đã tải thành công ${
            data.total || (data.universities || []).length
          } trường đại học từ API!`
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      } catch (err) {
        setApiStatus("offline");
        setError("Không thể kết nối API. Đang chuyển sang chế độ offline.");
        // TODO: fallback local nếu cần
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // On mount: fetch data
  useEffect(() => {
    fetchUniversities();
    // Health check định kỳ
    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/health`)
        .then((res) => {
          setApiStatus(res.ok ? "online" : "offline");
        })
        .catch(() => setApiStatus("offline"));
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUniversities]);

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

  // Search handler
  const handleSearch = debounce((value) => {
    setSearchTerm(value);
    if (!value) {
      setFiltered(universities);
      return;
    }
    const lower = value.toLowerCase();
    setFiltered(
      universities.filter(
        (uni) =>
          (uni.code && uni.code.toLowerCase().includes(lower)) ||
          (uni.data &&
            uni.data.school_name &&
            uni.data.school_name.toLowerCase().includes(lower))
      )
    );
  }, 400);

  // Filter handler
  const handleFilter = (type) => {
    setFilter(type);
    if (type === "all") {
      setFiltered(universities);
    } else {
      setFiltered(
        universities.filter(
          (uni) =>
            uni.data &&
            uni.data.type &&
            uni.data.type.toLowerCase().includes(type.toLowerCase())
        )
      );
    }
  };

  // Card click handler
  const navigate = useNavigate();
  const handleCardClick = (schoolCode) => {
    navigate(`/university/list_job?school=${schoolCode}`);
  };

  // Stats
  const totalUniversities = universities.length;
  const totalMajors = universities.reduce((sum, uni) => {
    const data = uni.data || uni;
    return sum + (uni.major_count || data.major_count || countMajors(data));
  }, 0);
  const displayedUniversities = filtered.length;

  // UI render
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      {/* Top Menu Bar (có thể tách thành component sau) */}
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
          🔴 Mất kết nối với server
        </div>
      )}

      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="text-center mb-8 mt-20">
          <h1 className="text-3xl md:text-4xl font-bold text-blue-800 bg-white rounded-2xl py-6 px-4 inline-block shadow mb-2">
            🎓 Danh sách các trường đại học
          </h1>
          <p className="text-lg text-blue-900">
            Khám phá các trường đại học và ngành học phù hợp với bạn
          </p>
          <p className="text-sm text-blue-700 bg-blue-50 rounded-full px-4 py-2 inline-block mt-2">
            💡 <strong>Mẹo:</strong> Click vào card trường đại học để xem danh
            sách ngành đào tạo
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-8 bg-white/70 rounded-xl p-6 shadow">
          <div className="text-center">
            <div
              className="text-2xl font-bold text-blue-700"
              id="totalUniversities"
            >
              {totalUniversities}
            </div>
            <div className="text-sm text-blue-700">Tổng số trường</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700" id="totalMajors">
              {totalMajors}
            </div>
            <div className="text-sm text-blue-700">Tổng số ngành</div>
          </div>
          <div className="text-center">
            <div
              className="text-2xl font-bold text-blue-700"
              id="displayedUniversities"
            >
              {displayedUniversities}
            </div>
            <div className="text-sm text-blue-700">Đang hiển thị</div>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-wrap gap-4 items-center mb-8 bg-white rounded-xl p-6 shadow">
          <input
            type="text"
            className="flex-1 min-w-[200px] px-4 py-3 border-2 border-blue-200 rounded-lg text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-blue-50 hover:bg-blue-100"
            placeholder="Tìm kiếm trường đại học, mã trường, hoặc ngành học..."
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button
            className="bg-gradient-to-r from-blue-600 to-blue-800 text-white font-bold px-6 py-3 rounded-lg shadow hover:from-blue-700 hover:to-blue-900 transition"
            onClick={() => handleSearch(searchTerm)}
          >
            🔍 Tìm kiếm
          </button>
          <button
            className="text-red-600 underline text-sm ml-2"
            onClick={() => {
              setSearchTerm("");
              setFiltered(universities);
            }}
          >
            Xóa bộ lọc
          </button>
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

        {/* Universities grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          id="universitiesGrid"
        >
          {!loading && filtered.length === 0 && !error && (
            <div className="col-span-full text-center text-blue-700 bg-blue-50 rounded-lg p-8 shadow">
              <div className="text-2xl mb-2">
                🔍 Không tìm thấy trường đại học nào phù hợp
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => {
                    setSearchTerm("");
                    setFiltered(universities);
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
          {filtered.map((uni, idx) => {
            const data = uni.data || uni;
            const code = uni.code || uni.school_code;
            const majorCount =
              uni.major_count || data.major_count || countMajors(data);
            const icon = data.school_name
              ? data.school_name.charAt(0).toUpperCase()
              : code.charAt(0);
            return (
              <div
                key={code}
                className="university-card bg-white rounded-2xl p-6 shadow hover:shadow-lg transition cursor-pointer flex flex-col gap-2 border-t-4 border-blue-600 animate-fade-in justify-between"
                onClick={() => handleCardClick(code)}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center mb-3">
                  <div className="w-14 h-14 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-2xl font-bold text-white border-4 border-blue-100 mr-4">
                    {icon}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-700">
                      {data.school_name || "Chưa có tên trường"}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      Mã trường: {code}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="major-count bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 py-2 rounded-full text-sm font-bold inline-block mt-2">
                    🎓 {majorCount} ngành đào tạo
                  </div>
                  <div className="view-details mt-3 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-center text-sm font-medium opacity-80 hover:opacity-100">
                    👁️ Xem chi tiết ngành đào tạo
                  </div>
                </div>
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

export default ListUniversity;
