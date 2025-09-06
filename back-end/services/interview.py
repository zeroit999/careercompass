from flask import Flask, request, jsonify
import json
import os
import random
import datetime
import speech_recognition as sr
from flask_cors import CORS
import google.generativeai as genai
import re
import sys

# Add parent directory to path for config/auth imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import config
try:
    from config.config import Config
except ImportError:
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from config.config import Config

# Import custom decorators
from auth.auth import firebase_required
from auth.rate_limiter import rate_limit
from auth.auth_routes import auth_bp
# Flask setup
app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
from flask_cors import CORS

app = Flask(__name__)
CORS(app,
     origins=Config.ALLOWED_ORIGINS,
     supports_credentials=True)

app.register_blueprint(auth_bp)

# Configure Gemini
USE_GEMINI = bool(Config.GEMINI_API_KEY)
if USE_GEMINI:
    genai.configure(api_key=Config.GEMINI_API_KEY)

# Load data
def load_data():
    data_path = os.path.join(os.path.dirname(__file__), 'data', 'interview')
    with open(os.path.join(data_path, 'interview.json'), 'r', encoding='utf-8') as f:
        career_data = json.load(f)
    with open(os.path.join(data_path, 'model.json'), 'r', encoding='utf-8') as f:
        model_data = json.load(f)
    return career_data, model_data

career_data, model_data = load_data()
sessions = {}

@app.route('/')
def api_root():
    return jsonify({
        "message": "Welcome to the Interview API",
        "status": "OK",
        "version": "1.0.0"
    })

@app.route('/api/careers', methods=['GET'])
def get_careers():
    careers = [{"id": career["id"], "name": career["name"]} for career in career_data["careers"]]
    return jsonify(careers)

@app.route('/api/start-interview', methods=['POST'])
@firebase_required
# @premium_required
@rate_limit(limit=5, window=3600, per_user=True)
def start_interview():
    data = request.json
    name = data.get('name', '').strip()
    age = data.get('age')
    job = data.get('job', '').strip()

    if not name or len(name) > 100:
        return jsonify({"error": "Tên không hợp lệ (tối đa 100 ký tự)"}), 400
    if not isinstance(age, int) or age < 16 or age > 100:
        return jsonify({"error": "Tuổi không hợp lệ (16-100)"}), 400
    if not job or len(job) > 200:
        return jsonify({"error": "Công việc không hợp lệ (tối đa 200 ký tự)"}), 400

    selected_career = next((c for c in career_data["careers"] if c["name"] == job), None)
    if not selected_career:
        return jsonify({"error": "Invalid job selection"}), 400

    session_id = f"session_{random.randint(10000, 99999)}_{int(datetime.datetime.now().timestamp())}"
    sessions[session_id] = {
        "candidate": {"name": name, "age": age, "job": job},
        "career": selected_career,
        "current_criteria_index": 0,
        "current_question_index": 0,
        "results": []
    }

    for criteria in selected_career["criteria"]:
        sessions[session_id]["results"].append({
            "criteria_id": criteria["id"],
            "criteria_name": criteria["name"],
            "score": 0,
            "answer": ""
        })

    return get_current_question(session_id)

def get_current_question(session_id):
    if session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400

    session = sessions[session_id]
    c_idx = session["current_criteria_index"]
    q_idx = session["current_question_index"]

    if c_idx >= len(session["career"]["criteria"]):
        return jsonify({"complete": True, "session_id": session_id})

    current_criteria = session["career"]["criteria"][c_idx]
    current_question = current_criteria["questions"][q_idx]

    return jsonify({
        "session_id": session_id,
        "criteria": {
            "id": current_criteria["id"],
            "name": current_criteria["name"]
        },
        "question": current_question,
        "progress": {
            "criteria_index": c_idx,
            "criteria_total": len(session["career"]["criteria"]),
            "question_index": q_idx,
            "question_total": len(current_criteria["questions"])
        }
    })

def evaluate_answer_with_gemini(answer, criteria_name, question, job_position, levels):
    if not USE_GEMINI:
        return {
            "score": random.randint(1, 4),
            "reasoning": "Đánh giá tự động không khả dụng. Đây là đánh giá ngẫu nhiên."
        }

    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        levels_text = "\n".join([f"Level {l['score']}: {l['description']}" for l in levels])

        prompt = f"""
        Bạn là chuyên gia đánh giá các buổi phỏng vấn. Hãy đánh giá câu trả lời dưới đây cho một câu hỏi phỏng vấn cho vị trí {job_position}.

        Tiêu chí đánh giá: {criteria_name}

        Câu hỏi: {question}

        Câu trả lời của ứng viên: {answer}

        Dựa trên các cấp độ đánh giá sau:
        {levels_text}

        Trả lời theo định dạng:
        ĐÁNH GIÁ: [1-4]
        LÝ DO: [giải thích chi tiết]
        """

        response = model.generate_content(prompt)
        score_match = re.search(r'ĐÁNH GIÁ:\s*(\d+)', response.text, re.IGNORECASE)
        score = int(score_match.group(1)) if score_match else 2
        score = max(1, min(score, 4))

        reason_match = re.search(r'LÝ DO:\s*(.*?)(?=$|\n\n)', response.text, re.IGNORECASE | re.DOTALL)
        reason = reason_match.group(1).strip() if reason_match else "Không có giải thích cụ thể."

        return {"score": score, "reasoning": reason}
    except Exception as e:
        print(f"[Gemini Error] {e}")
        return {
            "score": random.randint(1, 4),
            "reasoning": "Đánh giá tự động không khả dụng. Đây là đánh giá ngẫu nhiên."
        }

@app.route('/api/submit-answer', methods=['POST'])
def submit_answer():
    data = request.json
    session_id = data.get('session_id')
    answer = data.get('answer')

    if not session_id or not answer:
        return jsonify({"error": "Missing required fields"}), 400
    if session_id not in sessions:
        return jsonify({"error": "Invalid session"}), 400

    session = sessions[session_id]
    c_idx = session["current_criteria_index"]
    q_idx = session["current_question_index"]

    current_criteria = session["career"]["criteria"][c_idx]
    current_question = current_criteria["questions"][q_idx]

    session["results"][c_idx]["answer"] += answer + "\n\n"

    if q_idx == len(current_criteria["questions"]) - 1:
        eval_result = evaluate_answer_with_gemini(
            session["results"][c_idx]["answer"],
            current_criteria["name"],
            current_question,
            session["candidate"]["job"],
            current_criteria["levels"]
        )
        session["results"][c_idx]["score"] = eval_result["score"]
        session["results"][c_idx]["reasoning"] = eval_result["reasoning"]

    if q_idx < len(current_criteria["questions"]) - 1:
        session["current_question_index"] += 1
    else:
        session["current_criteria_index"] += 1
        session["current_question_index"] = 0

    return get_current_question(session_id)

@app.route('/api/finish-interview', methods=['POST'])
def finish_interview():
    data = request.json
    session_id = data.get('session_id')

    if not session_id or session_id not in sessions:
        return jsonify({"error": "Invalid session ID"}), 400

    session = sessions[session_id]
    total_score = sum(r["score"] for r in session["results"])
    max_score = len(session["career"]["criteria"]) * 4
    percentage = (total_score / max_score) * 100

    try:
        if USE_GEMINI:
            model = genai.GenerativeModel('gemini-1.5-flash')
            results_text = ""
            for i, r in enumerate(session["results"]):
                results_text += f"{i+1}. {r['criteria_name']}: {r['score']}/4\n"
                if "reasoning" in r:
                    results_text += f"   Nhận xét: {r['reasoning']}\n\n"

            prompt = f"""
            Đánh giá tổng quan ứng viên:

            - Họ tên: {session['candidate']['name']}
            - Tuổi: {session['candidate']['age']}
            - Vị trí: {session['candidate']['job']}

            Kết quả:
            {results_text}

            Tổng điểm: {total_score}/{max_score} ({percentage:.1f}%)

            Hãy viết một đánh giá 3-5 đoạn, chuyên nghiệp và có tính xây dựng.
            """
            response = model.generate_content(prompt)
            evaluation = response.text.strip()
        else:
            raise Exception("Gemini not available")
    except Exception as e:
        print(f"[Final Eval Error] {e}")
        if percentage >= 80:
            evaluation = f"Ứng viên {session['candidate']['name']} thể hiện rất xuất sắc..."
        elif percentage >= 60:
            evaluation = f"Ứng viên {session['candidate']['name']} thể hiện tốt..."
        elif percentage >= 40:
            evaluation = f"Ứng viên {session['candidate']['name']} ở mức trung bình..."
        else:
            evaluation = f"Ứng viên {session['candidate']['name']} chưa đáp ứng yêu cầu..."

    return jsonify({
        "candidate": session["candidate"],
        "total_score": total_score,
        "max_score": max_score,
        "score_percentage": percentage,
        "evaluation": evaluation,
        "detailed_results": session["results"]
    })

@app.route('/api/listen', methods=['POST'])
def listen():
    try:
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source)
            audio = r.listen(source, timeout=5)
            text = r.recognize_google(audio, language='vi-VN')
            return jsonify({"success": True, "text": text})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "interview",
        "timestamp": datetime.datetime.now().isoformat(),
        "version": "1.0.0"
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5005)
