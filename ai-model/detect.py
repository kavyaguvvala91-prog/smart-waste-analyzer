"""
detect.py
----------
Core detection pipeline functions consumed by the Flask route handlers in app.py.

Each function follows the pattern:
  1. Validate input
  2. Persist / decode the image
  3. Delegate inference to utils/predictor.py
  4. Optionally save annotated output via utils/image_processing.py
  5. Return a structured result dict (serialisable to JSON)
"""

import logging
import os

from utils.image_processing import (
    validate_image_file,
    save_upload,
    load_image_cv2,
    decode_frame_bytes,
    save_annotated_image,
    cleanup_file,
)
from utils.predictor import run_inference, run_inference_with_annotated_image

logger = logging.getLogger(__name__)

# Directories resolved from app config at runtime
UPLOAD_DIR      = os.path.join(os.path.dirname(__file__), "uploads")
PREDICTIONS_DIR = os.path.join(os.path.dirname(__file__), "predictions")


# ---------------------------------------------------------------------------
# Public pipeline functions
# ---------------------------------------------------------------------------

def detect_from_upload(file_storage, conf_threshold: float = 0.25) -> dict:
    """
    Full detection pipeline for a multipart file upload.

    Steps:
        1. Validate the uploaded FileStorage object.
        2. Save it to the uploads/ directory.
        3. Run YOLO inference.
        4. Clean up the temp file.
        5. Return detection results.

    Args:
        file_storage:   Werkzeug FileStorage from request.files['image'].
        conf_threshold: YOLO confidence threshold (default 0.25).

    Returns:
        {
            "success":    bool,
            "detections": list[{"class": str, "confidence": float}],
            "message":    str  # only present on failure
        }
    """
    # --- 1. Validate ---
    valid, msg = validate_image_file(file_storage)
    if not valid:
        logger.warning("Upload validation failed: %s", msg)
        return {"success": False, "message": msg}

    # --- 2. Save ---
    try:
        image_path = save_upload(file_storage, UPLOAD_DIR)
    except IOError as exc:
        logger.error("Could not save uploaded file: %s", exc)
        return {"success": False, "message": "Failed to save uploaded image."}

    # --- 3. Infer ---
    try:
        detections = run_inference(image_path, conf_threshold=conf_threshold)
    except Exception as exc:
        logger.error("Inference error: %s", exc)
        cleanup_file(image_path)
        return {"success": False, "message": f"Model inference failed: {exc}"}

    # --- 4. Cleanup ---
    cleanup_file(image_path)

    # --- 5. Return ---
    return {"success": True, "detections": detections}


def detect_from_upload_with_image(
    file_storage,
    conf_threshold: float = 0.25,
) -> dict:
    """
    Detection pipeline that also returns the path to the annotated image.

    Same steps as detect_from_upload(), but the annotated frame is saved
    to predictions/ and its URL is included in the response.

    Returns:
        {
            "success":        bool,
            "detections":     list[{"class": str, "confidence": float}],
            "annotatedImage": str,  # e.g. "/predictions/result_abc123.jpg"
            "message":        str   # only present on failure
        }
    """
    # --- Validate ---
    valid, msg = validate_image_file(file_storage)
    if not valid:
        logger.warning("Upload validation failed: %s", msg)
        return {"success": False, "message": msg}

    # --- Save ---
    try:
        image_path = save_upload(file_storage, UPLOAD_DIR)
    except IOError as exc:
        logger.error("Could not save uploaded file: %s", exc)
        return {"success": False, "message": "Failed to save uploaded image."}

    # --- Infer with annotation ---
    try:
        detections, annotated_bgr = run_inference_with_annotated_image(
            image_path, conf_threshold=conf_threshold
        )
    except Exception as exc:
        logger.error("Inference error: %s", exc)
        cleanup_file(image_path)
        return {"success": False, "message": f"Model inference failed: {exc}"}

    # --- Cleanup upload ---
    cleanup_file(image_path)

    # --- Save annotated image ---
    try:
        annotated_url = save_annotated_image(annotated_bgr, PREDICTIONS_DIR)
    except Exception as exc:
        logger.error("Could not save annotated image: %s", exc)
        return {
            "success":    False,
            "message":    f"Detection succeeded but annotated image could not be saved: {exc}",
            "detections": detections,
        }

    return {
        "success":        True,
        "detections":     detections,
        "annotatedImage": annotated_url,
    }


def detect_from_webcam_frame(file_storage, conf_threshold: float = 0.25) -> dict:
    """
    Detection pipeline for a single webcam frame sent as a file upload.

    Webcam frames are ephemeral – the raw bytes are decoded in memory,
    inference is run directly on the NumPy array, and nothing is persisted.

    Args:
        file_storage:   Werkzeug FileStorage carrying the frame bytes.
        conf_threshold: YOLO confidence threshold (default 0.25).

    Returns:
        {
            "success":    bool,
            "detections": list[{"class": str, "confidence": float}],
            "message":    str  # only present on failure
        }
    """
    # --- Validate ---
    if file_storage is None or file_storage.filename == "":
        return {"success": False, "message": "No frame received"}

    # --- Decode bytes in memory (no disk I/O) ---
    try:
        frame_bytes = file_storage.read()
        frame_bgr   = decode_frame_bytes(frame_bytes)
    except ValueError as exc:
        logger.warning("Frame decode error: %s", exc)
        return {"success": False, "message": str(exc)}

    # --- Infer directly on numpy array ---
    try:
        detections = run_inference(frame_bgr, conf_threshold=conf_threshold)
    except Exception as exc:
        logger.error("Webcam inference error: %s", exc)
        return {"success": False, "message": f"Model inference failed: {exc}"}

    return {"success": True, "detections": detections}
