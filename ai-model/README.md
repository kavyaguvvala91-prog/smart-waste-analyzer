# Smart Waste Analyzer — AI Model Microservice

A production-ready Flask microservice that runs YOLOv8 object detection on waste images uploaded by the MERN stack frontend or backend.

---

## Project Structure

```
ai-model/
├── best.pt                   # Trained YOLOv8 weights (you supply this)
├── app.py                    # Flask app factory + route definitions
├── detect.py                 # Detection pipeline functions
├── requirements.txt
├── uploads/                  # Temp storage for incoming images (auto-created)
├── predictions/              # Annotated output images (auto-created)
└── utils/
    ├── __init__.py
    ├── image_processing.py   # Validation, save, decode, annotate helpers
    └── predictor.py          # YOLOv8 singleton wrapper
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11 or 3.12 |
| pip | 23+ |
| (Optional) CUDA | 11.8 or 12.1 for GPU inference |

---

## Installation

### 1 — Clone / copy the project

```bash
cd ai-model
```

### 2 — Create and activate a virtual environment

```bash
# macOS / Linux
python3 -m venv venv
source venv/bin/activate

# Windows (PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 3 — Install dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

> **GPU users:** replace the `torch` and `torchvision` lines in `requirements.txt` with the appropriate CUDA wheel, then re-run `pip install -r requirements.txt`.
>
> Example (CUDA 12.1):
> ```
> --index-url https://download.pytorch.org/whl/cu121
> torch==2.3.1+cu121
> torchvision==0.18.1+cu121
> ```

### 4 — Place your trained weights

Copy your `best.pt` file to the root of the `ai-model/` directory:

```
ai-model/
└── best.pt   ← here
```

---

## Running the Service

### Development

```bash
python app.py
```

The service starts on **http://0.0.0.0:8000** by default.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `FLASK_HOST` | `0.0.0.0` | Bind address |
| `FLASK_PORT` | `8000` | Listen port |
| `FLASK_DEBUG` | `false` | Enable Flask debug mode |

```bash
FLASK_PORT=9000 python app.py
```

### Production (gunicorn)

```bash
gunicorn -w 2 -b 0.0.0.0:8000 "app:create_app()"
```

> Use 1–2 workers for GPU inference (GPU memory is not shared between worker processes).

---

## API Reference

### GET `/health`

Check that the service is running and the model is loaded.

**Response**

```json
{
  "status": "running",
  "model": "loaded"
}
```

---

### POST `/predict`

Detect waste items in an uploaded image. Returns detections only (no image).

**Request**

```
Content-Type: multipart/form-data
Field name:   image
```

**cURL example**

```bash
curl -X POST http://localhost:8000/predict \
  -F "image=@/path/to/waste.jpg"
```

**Success response (200)**

```json
{
  "success": true,
  "detections": [
    { "class": "plastic bottle", "confidence": 0.94 },
    { "class": "aluminium can",  "confidence": 0.81 }
  ]
}
```

**Error response (400 / 422)**

```json
{
  "success": false,
  "message": "No image uploaded"
}
```

---

### POST `/predict-with-image`

Same as `/predict` but also saves and returns the annotated image with bounding boxes.

**cURL example**

```bash
curl -X POST http://localhost:8000/predict-with-image \
  -F "image=@/path/to/waste.jpg"
```

**Success response (200)**

```json
{
  "success": true,
  "annotatedImage": "/predictions/result_3f2a1b4c8d9e.jpg",
  "detections": [
    { "class": "plastic bottle", "confidence": 0.94 }
  ]
}
```

Fetch the annotated image:

```
GET http://localhost:8000/predictions/result_3f2a1b4c8d9e.jpg
```

---

### POST `/webcam-detect`

Accept a single webcam frame and return detections. The frame is processed entirely in memory — nothing is written to disk.

**cURL example**

```bash
curl -X POST http://localhost:8000/webcam-detect \
  -F "image=@/path/to/frame.jpg"
```

**Success response (200)**

```json
{
  "success": true,
  "detections": [
    { "class": "cardboard", "confidence": 0.87 }
  ]
}
```

---

## Node.js / Axios Integration Example

```js
const axios   = require('axios');
const FormData = require('form-data');
const fs      = require('fs');

async function detectWaste(imagePath) {
  const form = new FormData();
  form.append('image', fs.createReadStream(imagePath));

  const { data } = await axios.post(
    'http://localhost:8000/predict',
    form,
    { headers: form.getHeaders() }
  );

  if (data.success) {
    console.log('Detections:', data.detections);
  }
}
```

---

## Error Codes

| HTTP Code | Meaning |
|-----------|---------|
| 200 | Request processed successfully |
| 400 | Missing required field (e.g. no image) |
| 404 | Endpoint not found |
| 405 | Wrong HTTP method |
| 413 | Uploaded file exceeds size limit (16 MB) |
| 422 | Validation or inference failure |
| 500 | Unexpected server error |

---

## Notes

- The model is loaded **once** at startup and shared across all requests.
- Uploaded images are automatically deleted after inference.
- Annotated images in `predictions/` are **not** automatically cleaned up — add a cron job or scheduled task if disk space is a concern.
- Set `FLASK_DEBUG=false` in production.
