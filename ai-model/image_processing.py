"""
utils/image_processing.py
--------------------------
Utility functions for image validation, saving, and preprocessing
before passing frames to the YOLO model.
"""

import os
import uuid
import logging
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, UnidentifiedImageError

logger = logging.getLogger(__name__)

# Supported image MIME types
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}

# Max upload size: 16 MB
MAX_IMAGE_SIZE_BYTES = 16 * 1024 * 1024


def is_valid_extension(filename: str) -> bool:
    """Return True if the file extension is in the allowed set."""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS


def validate_image_file(file_storage) -> tuple[bool, str]:
    """
    Validate a Werkzeug FileStorage object before saving.

    Args:
        file_storage: The uploaded file object from Flask request.files.

    Returns:
        (is_valid: bool, message: str)
    """
    if file_storage is None or file_storage.filename == "":
        return False, "No image uploaded"

    if not is_valid_extension(file_storage.filename):
        return False, (
            f"Unsupported file type '{Path(file_storage.filename).suffix}'. "
            f"Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Peek at the raw bytes to enforce size limit without consuming the stream
    file_storage.seek(0, os.SEEK_END)
    size = file_storage.tell()
    file_storage.seek(0)

    if size > MAX_IMAGE_SIZE_BYTES:
        return False, f"Image exceeds maximum allowed size of {MAX_IMAGE_SIZE_BYTES // (1024*1024)} MB"

    return True, "OK"


def save_upload(file_storage, upload_dir: str) -> str:
    """
    Persist an uploaded FileStorage to disk with a unique filename.

    Args:
        file_storage: Werkzeug FileStorage object.
        upload_dir:   Absolute path to the uploads directory.

    Returns:
        Absolute path of the saved file.

    Raises:
        IOError: If the file cannot be written.
    """
    os.makedirs(upload_dir, exist_ok=True)
    ext = Path(file_storage.filename).suffix.lower()
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(upload_dir, unique_name)

    file_storage.save(save_path)
    logger.debug("Saved upload → %s", save_path)
    return save_path


def load_image_cv2(image_path: str) -> np.ndarray:
    """
    Load an image from disk using OpenCV.

    Args:
        image_path: Path to the image file.

    Returns:
        BGR NumPy array.

    Raises:
        ValueError: If the image cannot be decoded.
    """
    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"OpenCV could not decode image at '{image_path}'. File may be corrupt.")
    return img


def load_image_pil(image_path: str) -> Image.Image:
    """
    Load an image from disk using Pillow (for format verification).

    Args:
        image_path: Path to the image file.

    Returns:
        PIL Image object.

    Raises:
        ValueError: If Pillow cannot identify the image format.
    """
    try:
        img = Image.open(image_path)
        img.verify()          # Raises if file is truncated / corrupt
        # Re-open after verify() – PIL resets the file pointer
        return Image.open(image_path)
    except (UnidentifiedImageError, Exception) as exc:
        raise ValueError(f"Corrupt or unsupported image: {exc}") from exc


def decode_frame_bytes(frame_bytes: bytes) -> np.ndarray:
    """
    Decode raw image bytes (e.g., from a webcam capture) into a BGR NumPy array.

    Args:
        frame_bytes: Raw bytes of the image.

    Returns:
        BGR NumPy array.

    Raises:
        ValueError: If the bytes cannot be decoded as an image.
    """
    np_arr = np.frombuffer(frame_bytes, dtype=np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Failed to decode frame bytes. Data may not be a valid image.")
    return img


def save_annotated_image(img_bgr: np.ndarray, predictions_dir: str) -> str:
    """
    Save an annotated (bounding-box) BGR image to the predictions directory.

    Args:
        img_bgr:         BGR NumPy array with bounding boxes already drawn.
        predictions_dir: Absolute path to the predictions directory.

    Returns:
        Relative URL path suitable for serving (e.g. '/predictions/result_abc.jpg').
    """
    os.makedirs(predictions_dir, exist_ok=True)
    filename = f"result_{uuid.uuid4().hex[:12]}.jpg"
    out_path = os.path.join(predictions_dir, filename)
    cv2.imwrite(out_path, img_bgr)
    logger.debug("Saved annotated image → %s", out_path)
    # Return a URL-style path the frontend can use
    return f"/predictions/{filename}"


def cleanup_file(path: str) -> None:
    """
    Silently delete a temporary file after processing.

    Args:
        path: Absolute path of the file to remove.
    """
    try:
        if os.path.isfile(path):
            os.remove(path)
            logger.debug("Cleaned up temp file: %s", path)
    except OSError as exc:
        logger.warning("Could not delete temp file '%s': %s", path, exc)
