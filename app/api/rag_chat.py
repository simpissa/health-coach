from fastapi import FastAPI, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException

import os
import urllib.request
import shutil

from haystack import Pipeline
from haystack.document_stores.in_memory import InMemoryDocumentStore
from haystack.components.retrievers import InMemoryEmbeddingRetriever
from haystack.components.converters import TextFileToDocument
from haystack.components.preprocessors import DocumentCleaner, DocumentSplitter
from haystack.components.embedders import OpenAIDocumentEmbedder, OpenAITextEmbedder
from haystack.components.writers import DocumentWriter
from haystack.components.builders import PromptBuilder
from haystack.components.generators.chat import OpenAIChatGenerator
from haystack.dataclasses import ChatMessage

app = FastAPI()

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (change this in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)


@app.post("/api/rag_chat")
async def rag_chat(request: Request):
    data = await request.json()
    query = data["query"]
    
    urllib.request.urlretrieve("https://archive.org/stream/leonardodavinci00brocrich/leonardodavinci00brocrich_djvu.txt",
                            "davinci.txt")    

    document_store = InMemoryDocumentStore()

    text_file_converter = TextFileToDocument()
    cleaner = DocumentCleaner()
    splitter = DocumentSplitter()
    embedder = OpenAIDocumentEmbedder()
    writer = DocumentWriter(document_store)

    indexing_pipeline = Pipeline()
    indexing_pipeline.add_component("converter", text_file_converter)
    indexing_pipeline.add_component("cleaner", cleaner)
    indexing_pipeline.add_component("splitter", splitter)
    indexing_pipeline.add_component("embedder", embedder)
    indexing_pipeline.add_component("writer", writer)

    indexing_pipeline.connect("converter.documents", "cleaner.documents")
    indexing_pipeline.connect("cleaner.documents", "splitter.documents")
    indexing_pipeline.connect("splitter.documents", "embedder.documents")
    indexing_pipeline.connect("embedder.documents", "writer.documents")
    indexing_pipeline.run(data={"sources": ["davinci.txt"]})

    text_embedder = OpenAITextEmbedder()
    retriever = InMemoryEmbeddingRetriever(document_store)
    prompt_template = [
        ChatMessage.from_user(
        """
        Given these documents, answer the question.
        Documents:
        {% for doc in documents %}
            {{ doc.content }}
        {% endfor %}
        Question: {{query}}
        Answer:
        """
        )
    ]
    prompt_builder = ChatPromptBuilder(template=prompt_template)
    llm = OpenAIChatGenerator()

    rag_pipeline = Pipeline()
    rag_pipeline.add_component("text_embedder", text_embedder)
    rag_pipeline.add_component("retriever", retriever)
    rag_pipeline.add_component("prompt_builder", prompt_builder)
    rag_pipeline.add_component("llm", llm)

    rag_pipeline.connect("text_embedder.embedding", "retriever.query_embedding")
    rag_pipeline.connect("retriever.documents", "prompt_builder.documents")
    rag_pipeline.connect("prompt_builder", "llm")

    result = rag_pipeline.run(
        data={
            "text_embedder": {"text": query},
            "retriever": {"top_k": 3}  # Adjust number of documents as needed
        }
    )
    
    # Extract relevant context from documents
    context = "\n\n".join([doc.content for doc in result["retriever"]["documents"]])
    
    return {"context": context}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Create uploads directory if it doesn't exist
        os.makedirs("uploads", exist_ok=True)
        
        file_path = f"uploads/{file.filename}"
        
        # Save the uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Process the new document
        document_store = InMemoryDocumentStore()
        
        indexing_pipeline = Pipeline()
        indexing_pipeline.add_component("converter", text_file_converter)
        indexing_pipeline.add_component("cleaner", cleaner)
        indexing_pipeline.add_component("splitter", splitter)
        indexing_pipeline.add_component("embedder", embedder)
        indexing_pipeline.add_component("writer", writer)

        indexing_pipeline.connect("converter.documents", "cleaner.documents")
        indexing_pipeline.connect("cleaner.documents", "splitter.documents")
        indexing_pipeline.connect("splitter.documents", "embedder.documents")
        indexing_pipeline.connect("embedder.documents", "writer.documents")
        
        indexing_pipeline.run(data={"sources": [file_path]})
        
        return {"message": "File uploaded and processed successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
