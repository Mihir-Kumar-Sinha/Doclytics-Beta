import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

from storage.storage_manager import get_document_dir, write_chunks, get_chunks

# Initialize local embeddings (all-MiniLM-L6-v2)
# Downloaded on first run
_embeddings_model = None

def get_embeddings_model():
    global _embeddings_model
    if _embeddings_model is None:
        _embeddings_model = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    return _embeddings_model

def create_and_store_embeddings(doc_id: str, text: str):
    # Chunking: 500-token chunks with 50-token overlap
    # We'll use character approximation for tokens (e.g. 1 token ~ 4 chars)
    # 500 tokens ~ 2000 chars, 50 overlap ~ 200 chars
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200,
        length_function=len
    )
    
    chunks = text_splitter.split_text(text)
    
    # Store chunks locally as dicts with index
    chunks_data = [{"id": i, "text": chunk} for i, chunk in enumerate(chunks)]
    write_chunks(doc_id, chunks_data)
    
    # Generate FAISS index
    embeddings = get_embeddings_model()
    
    # Create FAISS vector store
    if chunks:
        vectorstore = FAISS.from_texts(chunks, embeddings)
        
        # Save FAISS index
        faiss_path = os.path.join(get_document_dir(doc_id), "faiss_index")
        vectorstore.save_local(faiss_path)

def query_faiss(doc_id: str, query: str, k: int = 4):
    faiss_path = os.path.join(get_document_dir(doc_id), "faiss_index")
    if not os.path.exists(faiss_path):
        return []
    
    embeddings = get_embeddings_model()
    vectorstore = FAISS.load_local(faiss_path, embeddings, allow_dangerous_deserialization=True)
    
    # Retrieve top k documents
    results = vectorstore.similarity_search(query, k=k)
    return [doc.page_content for doc in results]
