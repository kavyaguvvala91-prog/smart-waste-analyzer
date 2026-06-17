# Architecture Diagram

```mermaid
flowchart LR
  U[User Browser] --> F[Frontend React App]
  F --> B[Express Backend API]
  F --> M[AI Model Service]
  B --> DB[(MongoDB)]
  B --> G[Groq AI API]
  B --> GM[Google Maps API]
  B --> P[Pollinations Image Service]
  M --> DB
  M --> F
```

## Components

- Frontend: user interface for detection, reuse guidance, reports, and dashboards
- Backend: authentication, persistence, analytics, and API orchestration
- AI model service: YOLO-based detection and model inference support
- MongoDB: stores users, detections, reports, and dashboard data
- External APIs: AI text generation, maps, and image generation
