from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import os
import asyncio
import aiofiles
from pathlib import Path
import logging
from datetime import datetime

# Thiết lập logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Hệ thống Tư vấn Tuyển sinh Đại học API",
    description="API backend cho hệ thống tư vấn tuyển sinh đại học",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UNIVERSITY_CODES = [
    'BKA', 'KHA', "GTS", "HYD", "CSH", "DKK", "DCT", "LAH", "HQH", "HHK", 
    "PKA", "PKH", "CSS", "TTH", "NHF", "KQH", "YTC", "HQT", "ANS", "YCT", 
    "TDM", "TYS", "DTL", "TLA", "QST", "VHH", "DTT", "HVN", "QHX", "LPH",
    "QHF", "HBT", "QHT", "QHE", "QSX", "DTS", "LCH", "TCT", "DKS", "BPH",
    "QHL", "DHS", "QSC", "SGD", "NQH", "NTS", "HTA", "DDS", "SP2", "QHS",
    "VHS", "SPK", "HTN", "YQH", "QSK", "HEH", "LPS", "DDF", "KSA", "QHY",
    "DDK", "DHF", "DMS", "GSA", "TSN", "LBH", "BVS", "YKV", "YDN", "DTY",
    "DHY", "DDY", "KTS", "HCA", "QSY", "QSQ", "THV", "THP", "HCP", "MHN",
    "LDA", "HHA", "KTA", "TDV", "QSA", "HCH", "SPD", "QHK", "TTN", "DQN",
    "DHC", "GNT", "DDQ", "DTF", "HLU", "DKT", "DQB", "DPQ", "HHT", "DMT",
    "HCS", "NHS", "DLX", "DBL", "DQU", "DLS", "DPY", "DDP", "TDH", "KCC",
    "QHQ", "KCN", "DCV", "DVT", "NLS", "HVC", "XDA", "SKH", "MBS", "FBU",
    "GTA", "MDA", "DDL", "TDS", "DPD", "VLU", "KTD", "DQK", "DTK", "STS",
    "UKH", "DSK", "NHB", "DHI", "CMC", "NTT", "DHK", "DHD", "KGH", "DTC",
    "HGH", "TGH", "HVQ", "DDT", "DNC", "HIU", "TTU", "TTD", "DCL", "DVL",
    "DPC", "UKB", "ETU", "DDN", "VTT", "DAD", "SNH", "DCH", "HCB", "HCN",
    "PBH", "KSV", "QHD", "VGU", "TLS", "SDU", "PCS", "PCH", "NLN", "DTD",
    "DKC", "DDU", "DLH", "DDB", "DHA", "DYD", "TDD", "DBD", "DTV", "VJU",
    "BVU", "DHN", "MIT", "FPT", "DKB", "UEF", "DFA", "TTG", "DTE", "PVU",
    "DNT", "SKV", "CEA", "LNH", "DVH", "DQT", "HSU", "DPT", "DVP", "YDD",
    "THU", "DCD", "EIU", "DDV", "TDB", "DHE", "DTB", "HVD", "DHT", "DTZ",
    "HDT", "DNU", "LNS", "DTM", "CCM", "NTU", "VUI", "QSP", "DHL", "DTQ",
    "SIU", "DCA", "DLA", "DBH", "SKN", "NLG", "DTN", "UMT", "DCQ", "DHQ",
    "TBD", "DHV", "DVB", "DPX", "HPU", "MTU", "VHD", "LNA", "NHP", "UFA",
    "GDU", "DDM", "XDT", "DSG", "XDN", "DBG", "TTB", "TDL", "DTP", "TQU",
    "TKG", "DVD", "DTG", "DNB", "LBS", "HVA", "NVH", "NVS", "DVX", "DHH",
    "MTC", "MTS", "MTH", "YHT", "RMU", "RHM", "SKD", "CIV", "ZNH", "LCDF",
    "DNV", "VPH", "DSD", "DDA", "BUV", "BMU", "DDG", "CDD0209"
]

# Cache dữ liệu trong memory
universities_cache: Dict[str, Any] = {}
all_universities_cache: List[Dict] = []
cache_loaded = False
load_time = None

# Models
class UniversityBrief(BaseModel):
    code: str
    school_name: Optional[str]
    location: Optional[str]
    type: Optional[str]
    major_count: int

class UniversityDetail(BaseModel):
    school_code: str
    school_name: Optional[str]
    location: Optional[str]
    type: Optional[str]
    website: Optional[str]
    tables: List[Dict]
    major_count: int

class Major(BaseModel):
    ten_nganh: Optional[str]
    ma_nganh: Optional[str]
    diem_chuan: Optional[str]
    to_hop_mon: Optional[str]
    chi_tieu: Optional[str]
    ghi_chu: Optional[str]

class StatsResponse(BaseModel):
    total_universities: int
    total_majors: int
    cache_loaded: bool
    load_time: Optional[str]

# Hàm đếm số ngành
def count_majors(university_data: Dict) -> int:
    majors = set()
    if "tables" in university_data and isinstance(university_data["tables"], list):
        for table in university_data["tables"]:
            if "data" in table and isinstance(table["data"], list):
                for row in table["data"]:
                    if row and row.get("Tên ngành"):
                        majors.add(row["Tên ngành"])
    return len(majors)

# Hàm extract ngành từ tables
def extract_majors(university_data: Dict) -> List[Dict]:
    majors = []
    if "tables" in university_data and isinstance(university_data["tables"], list):
        for table in university_data["tables"]:
            if "data" in table and isinstance(table["data"], list):
                for row in table["data"]:
                    if row and row.get("Tên ngành"):
                        majors.append(row)
    return majors

# Load dữ liệu async
async def load_university_data(code: str) -> Optional[Dict]:
    """Load dữ liệu một trường từ file JSON"""
    try:
        file_path = Path(os.path.dirname(__file__)) / "data" / "school" / f"{code}.json"
        if not file_path.exists():
            logger.warning(f"File không tồn tại: {file_path}")
            return None
            
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            content = await f.read()
            data = json.loads(content)
            return data
    except Exception as e:
        logger.error(f"Lỗi load dữ liệu {code}: {str(e)}")
        return None

async def load_all_data():
    """Load tất cả dữ liệu trường đại học vào cache"""
    global cache_loaded, load_time, universities_cache, all_universities_cache
    
    start_time = datetime.now()
    logger.info("Bắt đầu load dữ liệu...")
    
    # Load song song tất cả file
    tasks = [load_university_data(code) for code in UNIVERSITY_CODES]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    universities_cache.clear()
    all_universities_cache.clear()
    
    loaded_count = 0
    error_count = 0
    
    for code, result in zip(UNIVERSITY_CODES, results):
        if isinstance(result, Exception):
            logger.error(f"Lỗi load {code}: {str(result)}")
            error_count += 1
            continue
            
        if result is None:
            error_count += 1
            continue
            
        universities_cache[code] = result
        
        # Tạo brief info cho all_universities_cache
        major_count = count_majors(result)
        brief_info = {
            "code": code,
            "school_name": result.get("school_name"),
            "location": result.get("location"),
            "type": result.get("type", "công lập"),
            "major_count": major_count,
            "data": result  # Giữ nguyên data để tương thích với frontend hiện tại
        }
        all_universities_cache.append(brief_info)
        loaded_count += 1
    
    load_time = datetime.now()
    cache_loaded = True
    
    logger.info(f"Load hoàn thành: {loaded_count} trường thành công, {error_count} lỗi")
    logger.info(f"Thời gian load: {(load_time - start_time).total_seconds():.2f} giây")

# Startup event
@app.on_event("startup")
async def startup_event():
    """Load dữ liệu khi khởi động server"""
    await load_all_data()

# Endpoints
@app.get("/", response_class=JSONResponse)
async def root():
    return {
        "message": "Hệ thống Tư vấn Tuyển sinh Đại học API",
        "version": "1.0.0",
        "status": "active",
        "cache_loaded": cache_loaded,
        "total_universities": len(universities_cache)
    }

@app.get("/stats", response_model=StatsResponse)
async def get_stats():
    """Lấy thống kê tổng quan"""
    total_majors = sum(count_majors(data) for data in universities_cache.values())
    
    return StatsResponse(
        total_universities=len(universities_cache),
        total_majors=total_majors,
        cache_loaded=cache_loaded,
        load_time=load_time.isoformat() if load_time else None
    )

@app.get("/universities", response_class=JSONResponse)
async def get_all_universities(
    search: Optional[str] = Query(None, description="Tìm kiếm theo tên trường, mã trường, địa điểm"),
    type_filter: Optional[str] = Query(None, description="Lọc theo loại trường (công lập, tư thục, dân lập)"),
    limit: Optional[int] = Query(None, description="Giới hạn số kết quả"),
    offset: Optional[int] = Query(0, description="Bỏ qua số kết quả đầu")
):
    """Lấy danh sách tất cả trường đại học với tùy chọn filter"""
    if not cache_loaded:
        await load_all_data()
    
    result = all_universities_cache.copy()
    
    # Filter theo search term
    if search:
        search_lower = search.lower()
        result = [
            uni for uni in result
            if (search_lower in uni["code"].lower() or
                (uni["school_name"] and search_lower in uni["school_name"].lower()) or
                (uni["location"] and search_lower in uni["location"].lower()))
        ]
    
    # Filter theo type
    if type_filter and type_filter != "all":
        result = [
            uni for uni in result
            if uni["type"] and type_filter.lower() in uni["type"].lower()
        ]
    
    # Pagination
    total = len(result)
    if offset > 0:
        result = result[offset:]
    if limit:
        result = result[:limit]
    
    return {
        "universities": result,
        "total": total,
        "limit": limit,
        "offset": offset,
        "cache_loaded": cache_loaded
    }

@app.get("/universities/{school_code}", response_class=JSONResponse)
async def get_university_detail(school_code: str):
    """Lấy thông tin chi tiết của một trường đại học"""
    if not cache_loaded:
        await load_all_data()
    
    school_code = school_code.upper()
    
    if school_code not in universities_cache:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy trường với mã {school_code}")
    
    data = universities_cache[school_code]
    major_count = count_majors(data)
    
    return {
        "school_code": school_code,
        "school_name": data.get("school_name"),
        "location": data.get("location"),
        "type": data.get("type"),
        "website": data.get("website"),
        "tables": data.get("tables", []),
        "major_count": major_count
    }

@app.get("/universities/{school_code}/majors", response_class=JSONResponse)
async def get_university_majors(
    school_code: str,
    search: Optional[str] = Query(None, description="Tìm kiếm ngành học"),
    score_filter: Optional[str] = Query(None, description="Lọc theo điểm (high/medium/low)")
):
    """Lấy danh sách ngành của một trường đại học"""
    if not cache_loaded:
        await load_all_data()
    
    school_code = school_code.upper()
    
    if school_code not in universities_cache:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy trường với mã {school_code}")
    
    data = universities_cache[school_code]
    majors = extract_majors(data)
    
    # Filter theo search
    if search:
        search_lower = search.lower()
        majors = [
            major for major in majors
            if (major.get("Tên ngành") and search_lower in major["Tên ngành"].lower()) or
               (major.get("Tổ hợp môn") and search_lower in major["Tổ hợp môn"].lower()) or
               (major.get("Mã ngành") and search_lower in major["Mã ngành"].lower())
        ]
    
    # Filter theo score
    if score_filter and score_filter != "all":
        filtered_majors = []
        for major in majors:
            try:
                score = float(major.get("Điểm chuẩn", 0))
                if score_filter == "high" and score > 22:
                    filtered_majors.append(major)
                elif score_filter == "medium" and 18 <= score <= 22:
                    filtered_majors.append(major)
                elif score_filter == "low" and 0 < score < 18:
                    filtered_majors.append(major)
            except (ValueError, TypeError):
                if score_filter == "all":
                    filtered_majors.append(major)
        majors = filtered_majors
    
    return {
        "school_code": school_code,
        "school_name": data.get("school_name"),
        "majors": majors,
        "total_majors": len(majors)
    }

@app.post("/reload-cache")
async def reload_cache():
    """Reload cache dữ liệu"""
    global cache_loaded
    cache_loaded = False
    await load_all_data()
    return {
        "message": "Cache đã được reload thành công",
        "total_universities": len(universities_cache),
        "load_time": load_time.isoformat() if load_time else None
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "cache_loaded": cache_loaded,
        "universities_count": len(universities_cache),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "list_university:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )


# uvicorn list_university:app --port 8000