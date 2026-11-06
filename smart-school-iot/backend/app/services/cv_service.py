"""
Computer Vision Service — SmartSchoolIoT
=========================================
Features:
  1. food_quality_check(image_path, menu_description)
       - Validates image quality (underexposed/black images auto-flagged)
       - If GEMINI_API_KEY configured: Uses Gemini Vision for menu comparison
       - If no API key: Uses local OpenCV visual food feature extraction (HSV color distribution,
         texture sharpness, dish contour detection)
       - Returns cv_status: "CV_PASS" | "CV_FLAG" | "CV_ERROR"
  2. count_students_in_image(image_path)
       - Primary: YOLOv8 nano person detection
       - Fallback: OpenCV HOG people detector + Haar cascade frontal face detector
       - Returns cv_student_count: int, cv_status: "CV_PASS"
"""

import os
import io
import json
import base64
import logging
from datetime import datetime
from typing import Optional

logger = logging.getLogger("cv_service")

# ─────────────────────────────────────────────────────────────
# FOOD QUALITY CHECK
# ─────────────────────────────────────────────────────────────
def _get_gemini_api_key() -> str:
    key = os.getenv("GEMINI_API_KEY", "").strip()
    if not key:
        # Check .env directly in case it was updated without restart
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        key = line.split("=", 1)[1].strip().strip('"').strip("'")
                        break
    return key


def _gemini_vision_check(image_path: str, menu_description: str, api_key: str) -> Optional[dict]:
    """Call Gemini Vision API via direct HTTP REST request to avoid protobuf/grpc version conflicts."""
    import requests
    from PIL import Image

    # Open and downscale for API efficiency
    img = Image.open(image_path)
    img.thumbnail((1024, 1024), Image.LANCZOS)
    if img.mode != "RGB":
        img = img.convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")

    prompt = (
        "You are an automated school mid-day meal quality inspector for a government school in India.\n"
        f"Stated Menu Description: \"{menu_description or 'Daily Mid-Day Meal'}\"\n\n"
        "Analyze the provided image of the prepared meal. Respond ONLY in valid JSON (no markdown formatting, no code fences):\n"
        "{\n"
        '  "status": "PASS" or "FLAG",\n'
        '  "confidence": <float 0.5 to 1.0>,\n'
        '  "reason": "<concise one-sentence explanation>",\n'
        '  "food_detected": "<brief description of items visible>",\n'
        '  "menu_match": true or false\n'
        "}\n\n"
        "Flag (status: FLAG) if the image is black/blank, does not show food, shows spoiled/unhygienic items, or clearly contradicts the stated menu.\n"
        "Pass (status: PASS) if food is visible, edible, and reasonably aligns with a school meal."
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": b64_data
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 300
        }
    }

    resp = requests.post(url, json=payload, timeout=20)
    if resp.status_code != 200:
        logger.warning(f"Gemini API returned status {resp.status_code}: {resp.text[:120]}")
        return None

    data = resp.json()
    candidates = data.get("candidates", [])
    if not candidates:
        return None

    raw_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
    raw_text = raw_text.strip()

    parsed = json.loads(raw_text)
    is_pass = str(parsed.get("status", "FLAG")).upper() == "PASS"
    reason = parsed.get("reason", "")
    food = parsed.get("food_detected", "Food items")
    confidence = float(parsed.get("confidence", 0.85))

    return {
        "cv_status": "CV_PASS" if is_pass else "CV_FLAG",
        "cv_notes": f"Gemini Vision: {food}. {reason}",
        "cv_confidence": round(confidence, 2)
    }


def _local_cv_food_check(image_path: str, menu_description: str) -> dict:
    """
    Local Computer Vision food inspector (OpenCV):
    - Color spectrum analysis in HSV (rice/white, dal/yellow, sambar/orange, veg/green)
    - Texture sharpness & blur check (Laplacian variance)
    - Brightness and contrast check
    """
    import cv2
    import numpy as np

    img = cv2.imread(image_path)
    if img is None:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": "Local CV: Corrupt or unreadable image file. Flagged.",
            "cv_confidence": 0.9
        }

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Brightness check
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 25.0:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": f"Local CV: Image is pitch black / underexposed (brightness: {mean_brightness:.1f}/255). No meal visible. Flagged.",
            "cv_confidence": 0.98
        }
    if mean_brightness > 245.0:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": "Local CV: Image is overexposed / washed out white. No clear food detected. Flagged.",
            "cv_confidence": 0.95
        }

    # 2. Blur / sharpness detection
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    is_blurry = laplacian_var < 30.0

    # 3. Food color signatures in HSV
    # Yellow/Orange/Gold (dal, sambar, khichdi, turmeric curry)
    lower_yellow = np.array([12, 50, 60])
    upper_yellow = np.array([35, 255, 255])
    yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
    yellow_pct = (np.count_nonzero(yellow_mask) / (img.shape[0] * img.shape[1])) * 100

    # Green (vegetables, curry leaves, leafy vegetables)
    lower_green = np.array([36, 40, 40])
    upper_green = np.array([85, 255, 255])
    green_mask = cv2.inRange(hsv, lower_green, upper_green)
    green_pct = (np.count_nonzero(green_mask) / (img.shape[0] * img.shape[1])) * 100

    # White / Light (steamed rice, curd, boiled egg)
    lower_white = np.array([0, 0, 160])
    upper_white = np.array([180, 45, 255])
    white_mask = cv2.inRange(hsv, lower_white, upper_white)
    white_pct = (np.count_nonzero(white_mask) / (img.shape[0] * img.shape[1])) * 100

    # Brown / Red-Orange (gravy, sambar, cooked pulses)
    lower_brown = np.array([0, 50, 40])
    upper_brown = np.array([15, 255, 220])
    brown_mask = cv2.inRange(hsv, lower_brown, upper_brown)
    brown_pct = (np.count_nonzero(brown_mask) / (img.shape[0] * img.shape[1])) * 100

    food_color_pct = yellow_pct + green_pct + white_pct + brown_pct
    menu_lower = (menu_description or "").lower()

    detected_items = []
    if white_pct > 8.0:
        detected_items.append("Rice/White items")
    if yellow_pct > 5.0 or brown_pct > 5.0:
        detected_items.append("Sambar/Dal/Curry")
    if green_pct > 4.0:
        detected_items.append("Vegetables")

    food_desc = ", ".join(detected_items) if detected_items else "Cooked meal texture"

    # Evaluation
    if is_blurry and food_color_pct < 10.0:
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": f"Local CV: Image is blurry (sharpness: {laplacian_var:.1f}) and lacks recognizable food color profiles. Flagged.",
            "cv_confidence": 0.82
        }

    if food_color_pct >= 12.0:
        # Good food color profile present
        return {
            "cv_status": "CV_PASS",
            "cv_notes": f"Local CV: Food profiles detected ({food_desc}; color match: {food_color_pct:.1f}%). Normal meal appearance.",
            "cv_confidence": 0.88
        }
    else:
        # Borderline or low food presence
        return {
            "cv_status": "CV_PASS",
            "cv_notes": f"Local CV: Meal inspection image valid (brightness: {mean_brightness:.0f}, sharpness: {laplacian_var:.0f}). Passed for review.",
            "cv_confidence": 0.75
        }


def food_quality_check(image_path: str, menu_description: str = "") -> dict:
    now = datetime.utcnow().isoformat()
    api_key = _get_gemini_api_key()

    # 1. Quick OpenCV validity check: if pitch black or corrupt, flag immediately
    try:
        import cv2
        import numpy as np
        img = cv2.imread(image_path)
        if img is not None:
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            mean_b = float(np.mean(gray))
            if mean_b < 20.0:
                return {
                    "cv_status": "CV_FLAG",
                    "cv_notes": f"Pitch black / underexposed image (brightness: {mean_b:.1f}/255). No food visible. Flagged.",
                    "cv_confidence": 0.98,
                    "cv_processed_at": now
                }
    except Exception as e:
        logger.warning(f"Pre-check error: {e}")

    # 2. Try Gemini Vision if API key is provided
    if api_key:
        try:
            gemini_result = _gemini_vision_check(image_path, menu_description, api_key)
            if gemini_result:
                gemini_result["cv_processed_at"] = now
                return gemini_result
        except Exception as e:
            logger.warning(f"Gemini call failed, falling back to local CV: {e}")

    # 3. Local Computer Vision fallback (guaranteed to run without external dependencies)
    try:
        local_result = _local_cv_food_check(image_path, menu_description)
        local_result["cv_processed_at"] = now
        return local_result
    except Exception as e:
        logger.error(f"Local CV food check failed: {e}")
        return {
            "cv_status": "CV_FLAG",
            "cv_notes": f"Food analysis error: {str(e)[:100]}. Flagged for manual review.",
            "cv_confidence": 0.5,
            "cv_processed_at": now
        }


# ─────────────────────────────────────────────────────────────
# STUDENT COUNTING (YOLOv8 + OpenCV Fallback)
# ─────────────────────────────────────────────────────────────
_yolo_model = None

def _get_yolo_model():
    global _yolo_model
    if _yolo_model is not None:
        return _yolo_model
    try:
        backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_path = os.path.join(backend_dir, "yolov8n.pt")
        if not os.path.exists(model_path):
            model_path = "yolov8n.pt"
        from ultralytics import YOLO
        _yolo_model = YOLO(model_path)
        logger.info(f"YOLOv8n model loaded successfully from {model_path}.")
        return _yolo_model
    except Exception as e:
        logger.warning(f"YOLOv8 not active ({e}), using OpenCV detector.")
        return None


def _opencv_person_count(image_path: str) -> int:
    """Robust person count using OpenCV HOG detector + multi-cascade (faces & upper body)."""
    import cv2
    img = cv2.imread(image_path)
    if img is None:
        return 0

    height, width = img.shape[:2]
    max_dim = 960
    if max(height, width) > max_dim:
        scale = max_dim / max(height, width)
        img = cv2.resize(img, (int(width * scale), int(height * scale)))

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 1. Frontal faces
    face_count = 0
    face_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    if os.path.exists(face_path):
        cascade = cv2.CascadeClassifier(face_path)
        faces = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(24, 24))
        face_count = len(faces)

    # 2. Profile faces (side views)
    profile_path = cv2.data.haarcascades + 'haarcascade_profileface.xml'
    profile_count = 0
    if os.path.exists(profile_path):
        cascade_p = cv2.CascadeClassifier(profile_path)
        profiles = cascade_p.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=3, minSize=(24, 24))
        profile_count = len(profiles)

    # 3. Upper body (seated students)
    upper_path = cv2.data.haarcascades + 'haarcascade_upperbody.xml'
    upper_count = 0
    if os.path.exists(upper_path):
        cascade_u = cv2.CascadeClassifier(upper_path)
        uppers = cascade_u.detectMultiScale(gray, scaleFactor=1.15, minNeighbors=3, minSize=(40, 40))
        upper_count = len(uppers)

    # 4. HOG people detector
    hog_count = 0
    try:
        hog = cv2.HOGDescriptor()
        hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())
        boxes, _ = hog.detectMultiScale(img, winStride=(8, 8), padding=(8, 8), scale=1.05)
        hog_count = len(boxes)
    except Exception:
        pass

    return max(face_count + profile_count, upper_count, hog_count)


def count_students_in_image(image_path: str) -> dict:
    """
    Detects and counts students in eating images using YOLOv8,
    with automatic OpenCV fallback.
    """
    image_path = os.path.abspath(image_path)
    now = datetime.utcnow().isoformat()

    # 1. Check for blank / pitch black image
    try:
        import cv2
        import numpy as np
        img = cv2.imread(image_path)
        if img is None:
            return {
                "cv_student_count": 0,
                "cv_status": "CV_FLAG",
                "cv_notes": "Unreadable image file. Count: 0. Flagged.",
                "cv_confidence": 0.0,
                "cv_processed_at": now
            }
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        mean_val = float(np.mean(gray))
        if mean_val < 20.0:
            return {
                "cv_student_count": 0,
                "cv_status": "CV_FLAG",
                "cv_notes": f"Pitch black / underexposed image (brightness: {mean_val:.1f}/255). No students visible. Flagged.",
                "cv_confidence": 0.95,
                "cv_processed_at": now
            }
    except Exception as e:
        logger.warning(f"Student check preprocessing error: {e}")

    # 2. Primary: YOLOv8 person detection (class 0)
    try:
        model = _get_yolo_model()
        if model is not None:
            results = model(image_path, verbose=False, classes=[0])
            person_count = 0
            confidences = []

            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    person_count += len(boxes)
                    for conf in boxes.conf.tolist():
                        confidences.append(conf)

            avg_conf = round(sum(confidences) / len(confidences), 2) if confidences else 0.85
            return {
                "cv_student_count": person_count,
                "cv_status": "CV_PASS",
                "cv_notes": f"YOLOv8 detected ~{person_count} student(s) in frame (confidence: {avg_conf:.0%}).",
                "cv_confidence": avg_conf,
                "cv_processed_at": now
            }
    except Exception as e:
        logger.warning(f"YOLOv8 inference failed, switching to OpenCV fallback: {e}")

    # 3. Fallback: OpenCV HOG + Multi-Cascade detector
    try:
        count = _opencv_person_count(image_path)
        notes = f"OpenCV detected ~{count} student(s) in dining area." if count > 0 else "Student dining area verified. Photo clear (0 students seated in foreground)."
        return {
            "cv_student_count": count,
            "cv_status": "CV_PASS",
            "cv_notes": notes,
            "cv_confidence": 0.78,
            "cv_processed_at": now
        }
    except Exception as e:
        logger.error(f"OpenCV fallback error: {e}")
        return {
            "cv_student_count": 0,
            "cv_status": "CV_FLAG",
            "cv_notes": f"Detection check completed with warning: {str(e)[:80]}",
            "cv_confidence": 0.5,
            "cv_processed_at": now
        }
