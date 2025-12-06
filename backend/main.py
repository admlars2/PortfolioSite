import os
import logging
from enum import StrEnum
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import httpx

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Configuration from environment variables
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:latest")
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "120.0"))
SYSTEM_PROMPT = "You are a helpful assistant."

app = FastAPI(
    title="Tiny Chat Wrapper",
    description="A tiny chat wrapper for character conversations",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Role(StrEnum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    role: Role
    content: str


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="User message to send to the chat model")
    system_prompt: Optional[str] = Field(None, description="Optional system prompt override")


class ChatResponse(BaseModel):
    message: str


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "tiny-chat-wrapper"}


@app.get("/api/models")
async def list_models():
    """
    List available models in Ollama.
    
    Returns:
        List of available model names
    """
    try:
        # Extract base URL from OLLAMA_URL
        base_url = OLLAMA_URL.replace("/api/chat", "")
        models_url = f"{base_url}/api/tags"
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(models_url)
            
        if response.status_code != 200:
            logger.error(f"Failed to fetch models: {response.status_code}")
            raise HTTPException(
                status_code=502,
                detail="Failed to fetch models from Ollama"
            )
        
        data = response.json()
        models = [model.get("name", "") for model in data.get("models", [])]
        
        return {
            "models": models,
            "configured_model": OLLAMA_MODEL,
            "model_available": OLLAMA_MODEL in models
        }
        
    except httpx.RequestError as e:
        logger.error(f"Request error connecting to Ollama: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Ollama service: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Send a chat message to Ollama and return the response.
    
    Args:
        request: ChatRequest containing the user message and optional system prompt
        
    Returns:
        ChatResponse with the assistant's message
        
    Raises:
        HTTPException: If the message is invalid or Ollama request fails
    """
    try:
        # Prepare messages
        messages = [
            {
                "role": "system",
                "content": request.system_prompt or SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": request.message
            }
        ]
        
        logger.info(f"Sending chat request to Ollama (model: {OLLAMA_MODEL})")
        
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                OLLAMA_URL,
                json={
                    "model": OLLAMA_MODEL,
                    "messages": messages,
                    "stream": False
                }
            )
            
        if response.status_code == 404:
            # Model not found - provide helpful error message
            try:
                error_data = response.json()
                error_msg = error_data.get("error", "Model not found")
            except Exception:
                error_msg = "Model not found"
            
            logger.error(f"Model '{OLLAMA_MODEL}' not found in Ollama. Error: {error_msg}")
            raise HTTPException(
                status_code=404,
                detail=f"Model '{OLLAMA_MODEL}' not found. Please pull the model first: docker exec ollama ollama pull {OLLAMA_MODEL}"
            )
        elif response.status_code != 200:
            logger.error(f"Ollama API returned status {response.status_code}: {response.text}")
            try:
                error_data = response.json()
                error_msg = error_data.get("error", f"HTTP {response.status_code}")
            except Exception:
                error_msg = f"HTTP {response.status_code}"
            
            raise HTTPException(
                status_code=502,
                detail=f"Ollama API error: {error_msg}"
            )
        
        data = response.json()
        message_content = data.get("message", {}).get("content", "")
        
        if not message_content:
            logger.error("Empty message content received from Ollama")
            raise HTTPException(
                status_code=502,
                detail="No message content received from Ollama"
            )
        
        logger.info("Successfully received response from Ollama")
        return ChatResponse(message=message_content)
        
    except httpx.TimeoutException:
        logger.error(f"Timeout waiting for Ollama response (timeout: {OLLAMA_TIMEOUT}s)")
        raise HTTPException(
            status_code=504,
            detail=f"Request to Ollama timed out after {OLLAMA_TIMEOUT} seconds"
        )
    except httpx.RequestError as e:
        logger.error(f"Request error connecting to Ollama: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Ollama service: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An unexpected error occurred"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)