"""
app.py
-------
Smart Waste Analyzer – AI Microservice Entry Point

Flask application factory that:
  • Loads the YOLOv8 model once at startup
  • Registers all REST API routes
  • Enables CORS for MERN stack integration
  • Serves annotated prediction images as static files

Run:
    python app.py
"""

import logging
import os

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from utils.predictor import initialise_model, is_model_loaded
from detect import (
    detect_from_upload,
    detect_from_upload_with_image,
    detect_from_webcam_frame,
)

# ---------------------------------------------------------------------------
# Logging configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR      = os.path.join(BASE_DIR, "uploads")
PREDICTIONS_DIR = os.path.join(BASE_DIR, "predictions")
MODEL_PATH      = os.path.join(BASE_DIR, "best.pt")

# Ensure directories exist
os.makedirs(UPLOAD_DIR,      exist_ok=True)
os.makedirs(PREDICTIONS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Application factory
# ---------------------------------------------------------------------------
def create_app() -> Flask:
    """Create and configure the Flask application."""
    app = Flask(__name__)

    # ── CORS ────────────────────────────────────────────────────────────────
    # Allow all origins so both the React frontend (e.g. localhost:3000) and
    # the Node/Express backend (e.g. localhost:5000) can call this service.
    # Restrict origins to specific hosts in production via the `origins` kwarg.
    CORS(app, resources={r"/*": {"origins": "*"}})

    # ── Model load ──────────────────────────────────────────────────────────
    try:
        initialise_model(MODEL_PATH)
    except FileNotFoundError:
        logger.warning(
            "best.pt not found at '%s'. "
            "Place your trained weights there before making prediction requests.",
            MODEL_PATH,
        )
    except RuntimeError as exc:
        logger.error("Model failed to load: %s", exc)

    # ── Static file serving for annotated images ─────────────────────────────
    @app.route("/predictions/<path:filename>")
    def serve_prediction(filename: str):
        """Serve annotated output images stored in predictions/."""
        return send_from_directory(PREDICTIONS_DIR, filename)

    # ── Health check ─────────────────────────────────────────────────────────
    @app.route("/health", methods=["GET"])
    def health():
        """
        GET /health
        Returns the service status and model load state.
        """
        return jsonify({
            "status": "running",
            "model":  "loaded" if is_model_loaded() else "not loaded",
        })

    # ── Image detection (detections only) ────────────────────────────────────
    @app.route("/predict", methods=["POST"])
    def predict():
        """
        POST /predict
        Accepts a multipart/form-data upload with field name 'image'.
        Returns JSON detections without a visualised image.

        Request:
            Content-Type: multipart/form-data
            Body field:   image=<file>

        Response 200:
            {
                "success": true,
                "detections": [{"class": "plastic bottle", "confidence": 0.94}]
            }

        Response 400 / 500:
            {"success": false, "message": "<reason>"}
        """
        file = request.files.get("image")
        if file is None:
            return jsonify({"success": False, "message": "No image uploaded"}), 400

        result = detect_from_upload(file)
        status_code = 200 if result["success"] else 422
        return jsonify(result), status_code

    # ── Image detection with annotated image ─────────────────────────────────
    @app.route("/predict-with-image", methods=["POST"])
    def predict_with_image():
        """
        POST /predict-with-image
        Same as /predict but also returns the URL of the annotated image.

        Response 200:
            {
                "success": true,
                "annotatedImage": "/predictions/result_abc123.jpg",
                "detections": [{"class": "plastic bottle", "confidence": 0.94}]
            }
        """
        file = request.files.get("image")
        if file is None:
            return jsonify({"success": False, "message": "No image uploaded"}), 400

        result = detect_from_upload_with_image(file)
        status_code = 200 if result["success"] else 422
        return jsonify(result), status_code

    # ── Webcam frame detection ────────────────────────────────────────────────
    @app.route("/webcam-detect", methods=["POST"])
    def webcam_detect():
        """
        POST /webcam-detect
        Accepts a single webcam frame as a multipart upload (field: 'image').
        Processes entirely in memory – nothing is persisted to disk.

        Response 200:
            {
                "success": true,
                "detections": [{"class": "cardboard", "confidence": 0.87}]
            }
        """
        file = request.files.get("image")
        if file is None:
            return jsonify({"success": False, "message": "No frame received"}), 400

        result = detect_from_webcam_frame(file)
        status_code = 200 if result["success"] else 422
        return jsonify(result), status_code

    # ── Global error handlers ─────────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(_err):
        return jsonify({"success": False, "message": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(_err):
        return jsonify({"success": False, "message": "Method not allowed"}), 405

    @app.errorhandler(413)
    def request_entity_too_large(_err):
        return jsonify({"success": False, "message": "Uploaded file is too large"}), 413

    @app.errorhandler(500)
    def internal_error(err):
        logger.exception("Unhandled server error: %s", err)
        return jsonify({"success": False, "message": "Internal server error"}), 500

    return app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    flask_app = create_app()

    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", 8000))
    debug = os.getenv("FLASK_DEBUG", "false").lower() == "true"

    logger.info("Starting Smart Waste Analyzer AI service on %s:%d (debug=%s)", host, port, debug)
    flask_app.run(host=host, port=port, debug=debug)
