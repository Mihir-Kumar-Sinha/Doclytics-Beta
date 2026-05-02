import os
import json
import shutil

# On cloud platforms (Render, Railway), set STORAGE_PATH env var to a writable directory
# e.g. /tmp/doclytics_storage (ephemeral but functional)
# Locally, defaults to the project's storage/ directory
STORAGE_DIR = os.getenv(
    "STORAGE_PATH",
    os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'storage'))
)

def get_documents_dir():
    docs_dir = os.path.join(STORAGE_DIR, 'documents')
    os.makedirs(docs_dir, exist_ok=True)
    return docs_dir

def get_document_dir(doc_id: str):
    doc_dir = os.path.join(get_documents_dir(), doc_id)
    os.makedirs(doc_dir, exist_ok=True)
    return doc_dir

def save_uploaded_file(doc_id: str, filename: str, content: bytes):
    doc_dir = get_document_dir(doc_id)
    file_path = os.path.join(doc_dir, filename)
    with open(file_path, "wb") as f:
        f.write(content)
    return file_path

def write_extracted_text(doc_id: str, text: str):
    doc_dir = get_document_dir(doc_id)
    with open(os.path.join(doc_dir, "extracted.txt"), "w", encoding="utf-8") as f:
        f.write(text)

def read_extracted_text(doc_id: str) -> str:
    path = os.path.join(get_document_dir(doc_id), "extracted.txt")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def write_structured_data(doc_id: str, data: list):
    doc_dir = get_document_dir(doc_id)
    with open(os.path.join(doc_dir, "structured_data.json"), "w", encoding="utf-8") as f:
        json.dump(data, f)

def get_metadata(doc_id: str) -> dict:
    path = os.path.join(get_document_dir(doc_id), "metadata.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def write_metadata(doc_id: str, metadata: dict):
    doc_dir = get_document_dir(doc_id)
    # Merge existing metadata if exists
    existing = get_metadata(doc_id)
    existing.update(metadata)
    with open(os.path.join(doc_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(existing, f)

def write_chunks(doc_id: str, chunks: list):
    doc_dir = get_document_dir(doc_id)
    with open(os.path.join(doc_dir, "chunks.json"), "w", encoding="utf-8") as f:
        json.dump(chunks, f)

def get_chunks(doc_id: str) -> list:
    path = os.path.join(get_document_dir(doc_id), "chunks.json")
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def delete_document(doc_id: str):
    doc_dir = os.path.join(get_documents_dir(), doc_id)
    if os.path.exists(doc_dir):
        shutil.rmtree(doc_dir)

def list_all_documents():
    docs_dir = get_documents_dir()
    documents = []
    if not os.path.exists(docs_dir):
        return documents
    for doc_id in os.listdir(docs_dir):
        doc_dir = os.path.join(docs_dir, doc_id)
        if os.path.isdir(doc_dir):
            meta = get_metadata(doc_id)
            if meta:
                documents.append(meta)
    return documents
