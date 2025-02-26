import { NextResponse } from 'next/server';

const RAG_SERVICE_URL = 'http://localhost:3001/api/rag_chat';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.messages[body.messages.length - 1].content;

    // Get response from RAG service
    const ragResponse = await fetch(RAG_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        chat_history: formatMessages(body.messages.slice(0, -1))
      })
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG service error! status: ${ragResponse.status}`);
    }

    const { response } = await ragResponse.json();
    return NextResponse.json({ response });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

function formatMessages(messages: Array<{ role: string, content: string }>) {
  let prompt = "";
  for (const msg of messages) {
    if (msg.role === "user") {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === "assistant") {
      prompt += `Assistant: ${msg.content}\n`;
    }
  }
  return prompt;
} 