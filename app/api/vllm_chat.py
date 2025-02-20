from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import httpx

app = FastAPI()

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]

class ChatResponse(BaseModel):
    response: str

API_URL = "http://localhost:8000/v1/completions"

@app.post('/api/chat', response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Format messages into prompt
        prompt = ""
        for msg in request.messages:
            if msg.role == "user":
                prompt += f"User: {msg.content}\n"
            elif msg.role == "assistant":
                prompt += f"Assistant: {msg.content}\n"
        prompt += "Assistant: "

        async with httpx.AsyncClient() as client:
            response = await client.post(
                API_URL,
                json={
                    "model": "meta-llama/Llama-3.2-1B-Instruct",
                    "prompt": prompt,
                    "max_tokens": 100,
                    "temperature": 0.5
                },
                headers={
                    "Content-Type": "application/json"
                }
            )
            
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="VLLM API error")
            
        result = response.json()
        generated_text = result["choices"][0]["text"].strip()
        
        return ChatResponse(response=generated_text)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 