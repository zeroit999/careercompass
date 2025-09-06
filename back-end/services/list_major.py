from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import Dict, Any
import unicodedata
import re

# ====== Base paths ======
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data", "job")

app = FastAPI()

# ====== CORS middleware ======
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, set to specific domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====== Helpers ======
def remove_vietnamese_accents(text: str) -> str:
    text = unicodedata.normalize('NFD', text)
    text = ''.join(char for char in text if unicodedata.category(char) != 'Mn')
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '_', text)
    text = text.replace('đ', 'd').replace('Đ', 'D')
    return text.lower().strip('_')


# ====== Endpoints ======

@app.get("/api/majors")
async def get_all_majors():
    major_groups = [
        "Kế toán - Kiểm toán",
        "Tài chính - Ngân hàng - Bảo hiểm",
        "Kinh tế - Quản trị kinh doanh - Thương Mại",
        "Công nghệ thông tin - Tin học",
        "Công nghiệp bán dẫn",
        "Báo chí - Marketing - Quảng cáo - PR",
        "Sư phạm - Giáo dục",
        "Y - Dược",
        "Bác sĩ thú y",
        "Công an - Quân đội",
        "Thiết kế đồ họa - Game - Đa phương tiện",
        "Xây dựng - Kiến trúc - Giao thông",
        "Ngoại giao - Ngoại ngữ",
        "Ngoại thương - Xuất nhập khẩu - Kinh Tế quốc tế",
        "Du lịch - Khách sạn",
        "Ô tô - Cơ khí - Chế tạo",
        "Điện lạnh - Điện tử - Điện - Tự động hóa",
        "Hàng hải - Thủy lợi - Thời tiết",
        "Hàng không - Vũ trụ - Hạt nhân",
        "Công nghệ vật liệu",
        "Công nghệ chế biến thực phẩm",
        "Công nghệ In - Giấy",
        "Công nghệ sinh - Hóa",
        "Luật - Tòa án",
        "Mỏ - Địa chất",
        "Mỹ thuật - Âm nhạc - Nghệ thuật",
        "Tài nguyên - Môi trường",
        "Tâm lý",
        "Thể dục - Thể thao",
        "Thời trang - May mặc",
        "Thủy sản - Lâm Nghiệp - Nông nghiệp",
        "Toán học và thống kê",
        "Nhân sự - Hành chính",
        "Văn hóa - Chính trị - Khoa học Xã hội",
        "Khoa học tự nhiên khác"
    ]

    return {
        "major_groups": [
            {
                "name": group,
                "filename": remove_vietnamese_accents(group),
                "id": i
            }
            for i, group in enumerate(major_groups)
        ]
    }

@app.get("/api/major/{major_filename}")
async def get_major_data(major_filename: str):
    try:
        file_path = os.path.join(DATA_DIR, f"{major_filename}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Major data not found: {major_filename}")

        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        total_schools = 0
        total_programs = 0

        for nganh in data.get("danh_sach_nganh", []):
            total_schools += len(nganh.get("data", []))
            for school in nganh.get("data", []):
                total_programs += len(school.get("data_school", []))

        data["statistics"] = {
            "total_majors": len(data.get("danh_sach_nganh", [])),
            "total_schools": total_schools,
            "total_programs": total_programs
        }

        return data

    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@app.get("/api/major/{major_filename}/majors")
async def get_major_list(major_filename: str):
    try:
        file_path = os.path.join(DATA_DIR, f"{major_filename}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Major data not found: {major_filename}")

        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        majors = []
        for i, nganh in enumerate(data.get("danh_sach_nganh", [])):
            school_count = len(nganh.get("data", []))
            program_count = sum(len(school.get("data_school", [])) for school in nganh.get("data", []))

            majors.append({
                "id": i,
                "name": nganh.get("ten_nganh", ""),
                "school_count": school_count,
                "program_count": program_count
            })

        return {"majors": majors}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@app.get("/api/major/{major_filename}/major/{major_id}")
async def get_specific_major(major_filename: str, major_id: int):
    try:
        file_path = os.path.join(DATA_DIR, f"{major_filename}.json")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"Major data not found: {major_filename}")

        with open(file_path, 'r', encoding='utf-8') as file:
            data = json.load(file)

        majors = data.get("danh_sach_nganh", [])
        if major_id >= len(majors):
            raise HTTPException(status_code=404, detail="Major not found")

        return {
            "nhom_nganh": data.get("nhom_nganh", ""),
            "major": majors[major_id]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@app.get("/api/search")
async def search_schools(query: str, major_group: str = None):
    try:
        results = []

        if major_group:
            file_path = os.path.join(DATA_DIR, f"{major_group}.json")
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as file:
                    data = json.load(file)
                    results.extend(search_in_data(data, query))
        else:
            if os.path.exists(DATA_DIR):
                for filename in os.listdir(DATA_DIR):
                    if filename.endswith('.json'):
                        file_path = os.path.join(DATA_DIR, filename)
                        try:
                            with open(file_path, 'r', encoding='utf-8') as file:
                                data = json.load(file)
                                results.extend(search_in_data(data, query))
                        except:
                            continue  # Skip bad files

        return {"results": results, "total": len(results)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

def search_in_data(data: Dict[Any, Any], query: str) -> list:
    results = []
    query_lower = query.lower()

    for nganh in data.get("danh_sach_nganh", []):
        for school_data in nganh.get("data", []):
            school_name = school_data.get("ten_truong", "")
            school_matches = query_lower in school_name.lower()
            program_matches = []

            for program in school_data.get("data_school", []):
                program_name = program.get("ten_nganh", "")
                if query_lower in program_name.lower():
                    program_matches.append(program)

            if school_matches or program_matches:
                programs_to_include = school_data.get("data_school", []) if school_matches else program_matches
                for program in programs_to_include:
                    results.append({
                        "nhom_nganh": data.get("nhom_nganh", ""),
                        "nganh": nganh.get("ten_nganh", ""),
                        "truong": school_name,
                        "chuyen_nganh": program.get("ten_nganh", ""),
                        "to_hop_mon": program.get("to_hop_mon", ""),
                        "diem_chuan_2024": program.get("diem_chuan_2024", ""),
                        "diem_chuan_2023": program.get("diem_chuan_2023", ""),
                        "match_type": "school" if school_matches else "program"
                    })

    return results

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

# Run with:
# uvicorn services.list_major:app --reload --port 8001