Chatbot powered by local LLM running with vLLM, supporting Retrieval-Augmented Generation (RAG) with any personal health or fitness documents. 

To use, run the development server:

```bash
npm run dev
```

Run the backend:

```bash
uvicorn app.api.rag_chat:app --reload --port 3001
```

Finally, start the vLLM server (you can replace with any supported model from HuggingFace):

```bash
vllm serve meta-llama/Llama-3.2-1B-Instruct
```


