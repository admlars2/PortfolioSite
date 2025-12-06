# Tiny Chat Wrapper

A tiny chat wrapper service for character conversations in games. Provides a simple REST API for interacting with local LLM models via Ollama.

## Features

- FastAPI-based REST API
- Docker and Docker Compose support
- Health check endpoints
- Configurable via environment variables
- Comprehensive error handling and logging
- CORS support

## Prerequisites

- Docker and Docker Compose
- (Optional) Poetry for local development

## Quick Start

### Using Docker Compose (Recommended)

1. Start all services:
```bash
docker compose up -d
```

2. The backend will be available at `http://localhost:8000`
3. Ollama will be available at `http://localhost:11434`

### Manual Setup

1. Install dependencies:
```bash
poetry install
```

2. Start Ollama service (if not already running):
```bash
docker run -d -v ollama_data:/root/.ollama -p 11434:11434 ollama/ollama
```

3. Pull the model:
```bash
curl http://localhost:11434/api/pull -d '{"name": "phi3:latest"}'
```

4. Run the backend:
```bash
poetry run uvicorn main:app --host 0.0.0.0 --port 8000
```

## Configuration

Environment variables:

- `OLLAMA_URL`: Ollama API endpoint (default: `http://ollama:11434/api/chat`)
- `OLLAMA_MODEL`: Model to use (default: `phi3:latest`)
- `OLLAMA_TIMEOUT`: Request timeout in seconds (default: `30.0`)
- `SYSTEM_PROMPT`: Default system prompt (default: `You are a helpful assistant.`)

## API Endpoints

### POST /api/chat

Send a chat message to the model.

**Request:**
```json
{
  "message": "Hello, how are you?",
  "system_prompt": "You are a helpful assistant." // optional
}
```

**Response:**
```json
{
  "message": "Hello! I'm doing well, thank you for asking..."
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "tiny-chat-wrapper"
}
```

## Development

1. Install dependencies:
```bash
poetry install
```

2. Run with auto-reload:
```bash
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. Run tests (if available):
```bash
poetry run pytest
```

## Notes

- The first time you start Ollama, you'll need to pull the model. This can be done via:
  ```bash
  curl http://localhost:11434/api/pull -d '{"name": "phi3:latest"}'
  ```
- Model data is persisted in the `ollama_data` Docker volume
- Adjust CORS settings in `main.py` for production use
