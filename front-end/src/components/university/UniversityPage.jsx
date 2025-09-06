import React from "react";
import Header from "../Header/header";
import { useNavigate } from "react-router-dom";

const UniversityPage = () => {
  const navigate = useNavigate();
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-300 flex flex-col items-center justify-center pt-20">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-6xl px-4">
          {/* Card: Danh sách đại học */}
          <div
            className="flex-1 cursor-pointer bg-white rounded-2xl shadow-lg py-10 px-10 flex flex-col items-center justify-center hover:shadow-2xl transition group border-t-4 border-blue-600"
            onClick={() => navigate("/university/list_university")}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">
              🎓
            </div>
            <div className="text-2xl font-bold text-blue-800 mb-2">
              Danh sách đại học
            </div>
            <div className="text-blue-600 text-center">
              Khám phá các trường đại học, thông tin tuyển sinh, ngành đào
              tạo...
            </div>
          </div>
          {/* Card: Nhóm ngành đào tạo */}
          <div
            className="flex-1 cursor-pointer bg-white rounded-2xl shadow-lg py-10 px-10 flex flex-col items-center justify-center hover:shadow-2xl transition group border-t-4 border-red-600"
            onClick={() => navigate("/major")}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition">
              🗂️
            </div>
            <div className="text-2xl font-bold text-red-800 mb-2">
              Nhóm ngành đào tạo
            </div>
            <div className="text-red-600 text-center">
              Xem các nhóm ngành, tổng quan và thống kê ngành học...
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UniversityPage;
