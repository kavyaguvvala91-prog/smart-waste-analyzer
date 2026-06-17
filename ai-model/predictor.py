"""
utils/predictor.py
-------------------
Singleton wrapper around the YOLOv8 model.

The model is loaded exactly once at startup and reused across every request,
avoiding the overhead of repeated disk I/O and weight initialisation.
"""

import os
import logging
from typing import Optional

import numpy as np

# Keep Ultralytics config writes inside the project so Windows profile
# permissions do not block model import on startup.
os.environ.setdefault("YOLO_CONFIG_DIR", os.path.join(os.path.dirname(__file__), ".yolo"))
os.makedirs(os.environ["YOLO_CONFIG_DIR"], exist_ok=True)

from ultralytics import YOLO

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Module-level singleton – set by initialise_model() at app startup
# ---------------------------------------------------------------------------
_model: Optional[YOLO] = None


def initialise_model(model_path: str = "best.pt") -> None:
    """
    Load the YOLOv8 model from disk and store it in the module-level singleton.

    Call this once during Flask app startup (e.g. inside create_app()).

    Args:
        model_path: Path to the trained YOLO weights file (default: 'best.pt').

    Raises:
        FileNotFoundError: If the weights file does not exist.
        RuntimeError:      If the model fails to load for any other reason.
    """
    global _model
    logger.info("Loading YOLOv8 model from '%s' …", model_path)
    try:
        _model = YOLO(model_path)
        logger.info("Model loaded successfully. Classes: %s", list(_model.names.values()))
    except FileNotFoundError:
        logger.critical("Model file not found: '%s'", model_path)
        raise
    except Exception as exc:
        logger.critical("Failed to load model: %s", exc)
        raise RuntimeError(f"Model initialisation failed: {exc}") from exc


def is_model_loaded() -> bool:
    """Return True if the model singleton has been initialised."""
    return _model is not None


def run_inference(image_input, conf_threshold: float = 0.25) -> list[dict]:
    """
    Run YOLO inference on a single image and return structured detections.

    Args:
        image_input:    File path (str) **or** BGR NumPy array accepted by
                        ultralytics YOLO.predict().
        conf_threshold: Minimum confidence to include a detection (0–1).

    Returns:
        List of detection dicts, each with keys:
            - "class"      (str)   – human-readable class label
            - "confidence" (float) – rounded to 2 decimal places

    Raises:
        RuntimeError: If the model has not been initialised.
        Exception:    Propagates any inference-level error for the caller to handle.
    """
    if _model is None:
        raise RuntimeError(
            "Model is not loaded. Call initialise_model() before run_inference()."
        )

    logger.debug("Running inference (conf≥%.2f) …", conf_threshold)

    # ultralytics predict() accepts paths, PIL images, np arrays, etc.
    results = _model.predict(
        source=image_input,
        conf=conf_threshold,
        verbose=False,   # suppress per-frame console spam in production
    )

    detections: list[dict] = []

    for result in results:
        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            cls_id = int(box.cls[0])
            conf   = float(box.conf[0])
            label  = _model.names.get(cls_id, f"class_{cls_id}")

            detections.append({
                "class":      label,
                "confidence": round(conf, 2),
            })

    logger.debug("Detections found: %d", len(detections))
    return detections


def run_inference_with_annotated_image(
    image_input,
    conf_threshold: float = 0.25,
) -> tuple[list[dict], np.ndarray]:
    """
    Run YOLO inference and return both detections and the annotated BGR image.

    The annotated image has bounding boxes and labels drawn by ultralytics'
    built-in plotting method.

    Args:
        image_input:    File path (str) or BGR NumPy array.
        conf_threshold: Minimum confidence threshold.

    Returns:
        (detections, annotated_bgr)
            detections    – same structure as run_inference()
            annotated_bgr – BGR NumPy array with drawn bounding boxes

    Raises:
        RuntimeError: If the model has not been initialised.
    """
    if _model is None:
        raise RuntimeError(
            "Model is not loaded. Call initialise_model() before run_inference_with_annotated_image()."
        )

    logger.debug("Running inference with annotation (conf≥%.2f) …", conf_threshold)

    results = _model.predict(
        source=image_input,
        conf=conf_threshold,
        verbose=False,
    )

    detections: list[dict] = []
    annotated_bgr: Optional[np.ndarray] = None

    for result in results:
        # plot() returns a BGR NumPy array with boxes drawn
        annotated_bgr = result.plot()

        boxes = result.boxes
        if boxes is None:
            continue

        for box in boxes:
            cls_id = int(box.cls[0])
            conf   = float(box.conf[0])
            label  = _model.names.get(cls_id, f"class_{cls_id}")

            detections.append({
                "class":      label,
                "confidence": round(conf, 2),
            })

    # Fallback: if no results were returned, load the original as numpy array
    if annotated_bgr is None:
        import cv2
        if isinstance(image_input, str):
            annotated_bgr = cv2.imread(image_input)
        else:
            annotated_bgr = image_input  # already a numpy array

    logger.debug("Detections found: %d", len(detections))
    return detections, annotated_bgr
