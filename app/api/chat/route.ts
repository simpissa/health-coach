import { NextResponse } from 'next/server';

const RAG_SERVICE_URL = 'http://localhost:3001/api/rag_chat';
const VLLM_SERVICE_URL = 'http://localhost:8000/v1/completions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = body.messages[body.messages.length - 1].content;

    // Get relevant context from RAG service
    const ragResponse = await fetch(RAG_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!ragResponse.ok) {
      throw new Error(`RAG service error! status: ${ragResponse.status}`);
    }

    const { context } = await ragResponse.json();

    // Create augmented prompt with context
    const augmentedPrompt = `Given this context:
${context}

Previous conversation:
${formatMessages(body.messages.slice(0, -1))}

Answer this question:
User: ${query}
Assistant: `;

    // Get completion from VLLM
    const vllmResponse = await fetch(VLLM_SERVICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "meta-llama/Llama-3.2-1B-Instruct",
        prompt: augmentedPrompt,
        max_tokens: 200,
        temperature: 0
      }),
    });

    if (!vllmResponse.ok) {
      throw new Error(`VLLM error! status: ${vllmResponse.status}`);
    }

    const data = await vllmResponse.json();
    return NextResponse.json({ response: data.choices[0].text.trim() });

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