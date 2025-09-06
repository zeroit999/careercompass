import React, { useState, useEffect } from "react";
import Header from "../Header/header";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowUp } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_MAJOR_API_URL || "http://localhost:8001";

// Helper function để tạo slug từ tên ngành
const createSlugFromName = (name) => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s_]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim("_");
};

const icons = [
  "📊",
  "💰",
  "📈",
  "💻",
  "💡",
  "📢",
  "📚",
  "⚕️",
  "🐾",
  "🛡️",
  "🎮",
  "🏗️",
  "🌐",
  "🚢",
  "🏨",
  "🚗",
  "⚡",
  "🌊",
  "🚀",
  "🔬",
  "🥫",
  "🖨️",
  "🧬",
  "⚖️",
  "⛏️",
  "🎨",
  "🌱",
  "🧠",
  "⚽",
  "👗",
  "🦐",
  "➗",
  "👥",
  "🏛️",
  "🧪",
];

export default function MajorPage() {
  const { majorSlug } = useParams();
  const navigate = useNavigate();
  const [majorGroups, setMajorGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [majorsList, setMajorsList] = useState([]);
  const [tab, setTab] = useState("overview");
  const [majorTabsContent, setMajorTabsContent] = useState({});
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Load major groups on component mount
  useEffect(() => {
    const loadMajorGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/api/majors`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setMajorGroups(data?.major_groups || []);
      } catch (err) {
        console.error("Error loading major groups:", err);
        setError("Không thể tải danh sách nhóm ngành. Vui lòng thử lại.");
        setMajorGroups([]);
      } finally {
        setLoading(false);
      }
    };

    loadMajorGroups();
  }, []);

  // Handle URL parameter for major detail
  useEffect(() => {
    if (majorSlug && majorGroups.length > 0) {
      const foundGroup = majorGroups.find((group) => {
        const groupSlug = createSlugFromName(group.name);
        return groupSlug === majorSlug;
      });
      if (foundGroup) {
        setDetail(foundGroup);
      }
    }
  }, [majorSlug, majorGroups]);

  // Load detail data when detail changes
  useEffect(() => {
    if (!detail?.filename) return;

    const loadDetailData = async () => {
      try {
        setDetailData(null);
        setMajorsList([]);
        setTab("overview");
        setMajorTabsContent({});

        const [detailResponse, majorsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/api/major/${detail.filename}`),
          fetch(`${API_BASE_URL}/api/major/${detail.filename}/majors`),
        ]);

        if (!detailResponse.ok || !majorsResponse.ok) {
          throw new Error("Failed to fetch detail data");
        }

        const [detailData, majorsData] = await Promise.all([
          detailResponse.json(),
          majorsResponse.json(),
        ]);

        setDetailData(detailData);
        setMajorsList(majorsData?.majors || []);
      } catch (err) {
        console.error("Error loading detail data:", err);
        setDetailData(null);
        setMajorsList([]);
      }
    };

    loadDetailData();
  }, [detail]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      setSearchResults({ loading: true, query: search });

      const response = await fetch(
        `${API_BASE_URL}/api/search?query=${encodeURIComponent(search.trim())}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSearchResults({
        ...data,
        loading: false,
        query: search.trim(),
        error: false,
      });
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults({
        error: true,
        loading: false,
        query: search.trim(),
        results: [],
        total: 0,
      });
    }
  };

  const loadMajorTab = async (majorIdx) => {
    if (!detail?.filename || majorIdx < 0) return;

    // If already loaded, just switch tab
    if (majorTabsContent[majorIdx] && !majorTabsContent[majorIdx].loading) {
      setTab(`major-${majorIdx}`);
      return;
    }

    try {
      setMajorTabsContent((prev) => ({
        ...prev,
        [majorIdx]: { loading: true },
      }));

      const response = await fetch(
        `${API_BASE_URL}/api/major/${detail.filename}/major/${majorIdx}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      setMajorTabsContent((prev) => ({
        ...prev,
        [majorIdx]: {
          ...data.major,
          loading: false,
          error: false,
        },
      }));

      setTab(`major-${majorIdx}`);
    } catch (err) {
      console.error("Error loading major tab:", err);
      setMajorTabsContent((prev) => ({
        ...prev,
        [majorIdx]: {
          error: true,
          loading: false,
        },
      }));
      setTab(`major-${majorIdx}`);
    }
  };

  const clearSearch = () => {
    setSearchResults(null);
    setSearch("");
  };

  const goBack = () => {
    setDetail(null);
    setDetailData(null);
    setMajorsList([]);
    setMajorTabsContent({});
    setTab("overview");
    navigate("/major");
  };

  const handleMajorGroupClick = (group) => {
    if (group && group.name) {
      const slug = createSlugFromName(group.name);
      navigate(`/major/${slug}`);
    }
  };

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Handle scroll event to show/hide scroll to top button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-700 to-blue-900">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-10 text-white py-10">
          <h1 className="text-4xl mb-2 font-bold drop-shadow mt-10">
            🎓 Danh sách nhóm ngành đào tạo
          </h1>
          <p className="text-lg opacity-90 font-normal">
            Khám phá các nhóm ngành và tìm hiểu thông tin tuyển sinh chi tiết
          </p>
        </div>

        {/* Search */}
        <div className="bg-white/95 p-6 rounded-2xl shadow-lg mb-8 backdrop-blur">
          <form
            className="flex flex-col sm:flex-row gap-4 mb-4"
            onSubmit={handleSearch}
          >
            <input
              type="text"
              className="flex-1 p-4 border-2 border-blue-100 rounded-lg text-base focus:border-blue-700 focus:ring-2 focus:ring-blue-100 outline-none"
              placeholder="Tìm kiếm trường đại học, ngành học..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="p-4 px-6 bg-gradient-to-r from-blue-600 to-blue-900 text-white rounded-lg font-semibold shadow transition hover:-translate-y-1 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              disabled={!search.trim()}
            >
              🔍 Tìm kiếm
            </button>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="bg-white/95 rounded-2xl shadow-lg p-6 mt-6 backdrop-blur">
            {searchResults.loading ? (
              <div className="text-center py-10 text-gray-600 flex flex-col items-center">
                <Spinner />
                Đang tìm kiếm...
              </div>
            ) : searchResults.error ? (
              <div className="text-center py-6 text-red-700 bg-red-100 rounded-lg">
                Lỗi tìm kiếm. Vui lòng thử lại.
              </div>
            ) : !searchResults.results || searchResults.results.length === 0 ? (
              <div className="text-center py-10 text-gray-600">
                <h3 className="text-xl font-semibold mb-2">
                  ❌ Không tìm thấy kết quả
                </h3>
                <p>
                  Không có kết quả nào cho từ khóa{" "}
                  <strong>"{searchResults.query}"</strong>
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <h3 className="text-lg font-bold">
                    🔍 Kết quả tìm kiếm cho{" "}
                    <strong>"{searchResults.query}"</strong>
                  </h3>
                  <p className="text-gray-500 text-sm">
                    Tìm thấy {searchResults.total || 0} kết quả
                  </p>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {searchResults.results.map((result, idx) => (
                    <div
                      className="p-5 border border-blue-100 rounded-lg hover:bg-blue-50 transition"
                      key={`search-result-${idx}`}
                    >
                      <div className="font-bold text-blue-700 mb-2 text-base">
                        {result.truong || "Tên trường không xác định"}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <div>
                          <strong>Nhóm ngành:</strong>{" "}
                          {result.nhom_nganh || "N/A"}
                        </div>
                        <div>
                          <strong>Ngành:</strong> {result.nganh || "N/A"}
                        </div>
                        <div>
                          <strong>Chuyên ngành:</strong>{" "}
                          {result.chuyen_nganh || "N/A"}
                        </div>
                        <div>
                          <strong>Tổ hợp môn:</strong>{" "}
                          {result.to_hop_mon || "Chưa cập nhật"}
                        </div>
                      </div>
                      <div className="flex gap-4 flex-wrap mt-3">
                        <span className="flex items-center gap-2">
                          <strong>Điểm 2024:</strong>
                          <span className="bg-blue-100 px-2 py-1 rounded font-bold text-blue-700">
                            {result.diem_chuan_2024 || "Chưa có"}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <strong>Điểm 2023:</strong>
                          <span className="bg-blue-100 px-2 py-1 rounded font-bold text-blue-700">
                            {result.diem_chuan_2023 || "Chưa có"}
                          </span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <button
              className="mt-6 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium hover:bg-blue-200 transition"
              onClick={clearSearch}
            >
              ← Quay lại
            </button>
          </div>
        )}

        {/* Major Groups */}
        {!searchResults && !detail && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
            {loading ? (
              <div className="col-span-full text-center py-10 text-gray-600 flex flex-col items-center">
                <Spinner />
                Đang tải dữ liệu...
              </div>
            ) : majorGroups.length === 0 ? (
              <div className="col-span-full text-center py-10 text-gray-600">
                <p>Không có dữ liệu nhóm ngành</p>
              </div>
            ) : (
              majorGroups.map((group, idx) => (
                <div
                  className="bg-white/95 p-8 rounded-2xl shadow-xl cursor-pointer text-center relative overflow-hidden border border-white/20 hover:-translate-y-2 hover:shadow-2xl transition"
                  key={group?.filename || `group-${idx}`}
                  onClick={() => handleMajorGroupClick(group)}
                >
                  <div className="text-4xl mb-4 text-blue-700">
                    {icons[idx % icons.length]}
                  </div>
                  <h3 className="text-gray-800 text-lg font-semibold mb-2">
                    {group?.name || "Nhóm chưa có tên"}
                  </h3>
                </div>
              ))
            )}
          </div>
        )}

        {/* Major Detail */}
        {detail && (
          <div className="bg-white/95 rounded-2xl shadow-lg overflow-hidden backdrop-blur mb-10">
            <div className="bg-gradient-to-r from-blue-600 to-blue-900 text-white px-8 py-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <button
                  className="bg-white/20 text-white border-2 border-white/30 px-4 py-2 rounded-lg hover:bg-white/30 hover:border-white/50 transition text-sm font-medium"
                  onClick={goBack}
                >
                  ← Quay lại
                </button>
                <h2 className="flex-1 text-center text-2xl font-bold">
                  {detail?.name || "Nhóm ngành không xác định"}
                </h2>
                <div></div>
              </div>
              {detailData?.statistics && (
                <div className="bg-white/20 p-5 rounded-xl mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {detailData.statistics.total_majors || 0}
                    </div>
                    <div className="text-sm opacity-80">Ngành</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {detailData.statistics.total_schools || 0}
                    </div>
                    <div className="text-sm opacity-80">Trường</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {detailData.statistics.total_programs || 0}
                    </div>
                    <div className="text-sm opacity-80">Chương trình</div>
                  </div>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="bg-gray-50 border-b border-gray-200">
              <div className="flex flex-nowrap overflow-x-auto">
                <button
                  className={`px-6 py-4 text-sm font-medium border-t-4 transition whitespace-nowrap ${
                    tab === "overview"
                      ? "text-blue-700 border-blue-900 bg-white font-bold"
                      : "text-gray-600 border-transparent bg-transparent hover:text-blue-600"
                  }`}
                  onClick={() => setTab("overview")}
                >
                  📊 Tổng quan
                </button>
                {majorsList.map((major, idx) => (
                  <button
                    key={`major-tab-${idx}`}
                    className={`px-6 py-4 text-sm font-medium border-t-4 transition whitespace-nowrap ${
                      tab === `major-${idx}`
                        ? "text-blue-700 border-blue-900 bg-white font-bold"
                        : "text-gray-600 border-transparent bg-transparent hover:text-blue-600"
                    }`}
                    onClick={() => loadMajorTab(idx)}
                  >
                    {major?.name || "Ngành chưa có tên"}
                    <small className="opacity-70 ml-1">
                      ({major?.school_count || 0} trường)
                    </small>
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8 ">
              {tab === "overview" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {majorsList.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-600">
                      <p>Chưa có dữ liệu ngành học</p>
                    </div>
                  ) : (
                    majorsList.map((major, idx) => (
                      <div
                        className="bg-gray-100 p-6 rounded-xl border-l-4 border-blue-700 cursor-pointer hover:bg-blue-50 hover:-translate-y-1 shadow transition"
                        key={`major-overview-${idx}`}
                        onClick={() => loadMajorTab(idx)}
                      >
                        <h4 className="text-gray-800 font-semibold mb-2">
                          {major?.name || "Ngành chưa có tên"}
                        </h4>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>🏫 {major?.school_count || 0} trường</span>
                          <span>
                            📚 {major?.program_count || 0} chương trình
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <MajorTabContent
                  content={majorTabsContent[parseInt(tab.split("-")[1])]}
                  majorIndex={parseInt(tab.split("-")[1])}
                />
              )}
            </div>
          </div>
        )}

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
}

function Spinner() {
  return (
    <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin mb-4"></div>
  );
}

function MajorTabContent({ content, majorIndex }) {
  const [filter, setFilter] = useState("");

  if (!content) {
    return (
      <div className="text-center py-10 text-gray-600 flex flex-col items-center">
        <Spinner />
        Đang tải dữ liệu ngành...
      </div>
    );
  }

  if (content.loading) {
    return (
      <div className="text-center py-10 text-gray-600 flex flex-col items-center">
        <Spinner />
        Đang tải dữ liệu ngành...
      </div>
    );
  }

  if (content.error) {
    return (
      <div className="text-center py-6 text-red-700 bg-red-100 rounded-lg">
        Lỗi tải dữ liệu ngành. Vui lòng thử lại.
      </div>
    );
  }

  const schools = content.data || [];
  const filteredSchools = schools.filter((school) =>
    (school?.ten_truong || "").toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Filter */}
      <div className="bg-gray-100 p-4 rounded-xl">
        <input
          type="text"
          className="w-full p-3 border-2 border-blue-100 rounded-lg text-sm focus:border-blue-700 focus:ring-2 focus:ring-blue-100 outline-none"
          placeholder="Lọc theo tên trường..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* School List */}
      <div className="space-y-6">
        {filteredSchools.length === 0 ? (
          <div className="text-center py-10 text-gray-600">
            {filter ? (
              <p>Không tìm thấy trường nào với từ khóa "{filter}"</p>
            ) : (
              <p>Chưa có dữ liệu trường học</p>
            )}
          </div>
        ) : (
          filteredSchools.map((school, idx) => (
            <div
              className="bg-white p-6 rounded-xl shadow border-l-4 border-blue-700"
              key={`school-${majorIndex}-${idx}`}
            >
              <div className="text-lg font-bold text-blue-700 mb-3">
                {school?.ten_truong || "Tên trường không xác định"}
              </div>

              {/* Programs */}
              <div className="space-y-3">
                {(school?.data_school || []).length === 0 ? (
                  <div className="text-gray-500 italic">
                    Chưa có thông tin chương trình đào tạo
                  </div>
                ) : (
                  (school.data_school || []).map((program, pidx) => (
                    <div
                      className="bg-gray-100 p-4 rounded-lg"
                      key={`program-${majorIndex}-${idx}-${pidx}`}
                    >
                      <div className="font-bold text-gray-800 mb-2">
                        {program?.ten_nganh ||
                          "Tên chương trình không xác định"}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-600">
                            Tổ hợp môn:
                          </span>
                          <span>{program?.to_hop_mon || "Chưa cập nhật"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-600">
                            Điểm chuẩn 2024:
                          </span>
                          <span className="bg-blue-100 px-2 py-1 rounded font-bold text-blue-700">
                            {program?.diem_chuan_2024 || "Chưa có"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-600">
                            Điểm chuẩn 2023:
                          </span>
                          <span className="bg-blue-100 px-2 py-1 rounded font-bold text-blue-700">
                            {program?.diem_chuan_2023 || "Chưa có"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
