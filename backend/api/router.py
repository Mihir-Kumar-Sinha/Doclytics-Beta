import os
import json
import uuid
import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional

from storage.storage_manager import (
    save_uploaded_file, write_extracted_text, write_structured_data,
    write_metadata, get_metadata, list_all_documents, delete_document, get_document_dir,
    STORAGE_DIR
)
from services.extraction import extract_data
from services.rag import create_and_store_embeddings, query_faiss
from services.llm import classify_document, generate_summary, generate_insights, answer_question, general_chat, analytics_chat
from services.analytics import compute_kpis, generate_chart_datasets, compute_dataset_overview

router = APIRouter()

# --- Stats helpers (use STORAGE_DIR so path works on cloud too) ---
def _stats_file_path():
    return os.path.join(STORAGE_DIR, "global_stats.json")

def _get_stats() -> dict:
    stats = {"documents": 0, "insights": 0, "visualizations": 0, "queries": 0}
    path = _stats_file_path()
    if os.path.exists(path):
        try:
            with open(path, "r") as f:
                stats.update(json.load(f))
        except Exception:
            pass
    return stats

def _write_stats(stats: dict):
    path = _stats_file_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(stats, f)

class QueryRequest(BaseModel):
    question: str
    preferred_model: Optional[str] = "auto"

def process_document_bg(doc_id: str, filename: str, file_path: str):
    try:
        # 1. Extraction
        text, structured_data = extract_data(file_path, filename)
        write_extracted_text(doc_id, text)
        if structured_data:
            write_structured_data(doc_id, structured_data)
        
        # 2. Classification
        classification = classify_document(text)
        
        # 3. Summary
        summary = generate_summary(text)
        
        # 4. KPIs
        kpis = compute_kpis(classification, structured_data)
        
        # 5. Dataset Overview
        dataset_overview = compute_dataset_overview(structured_data)
        
        # 6. Insights
        insights = generate_insights(kpis, summary)
        
        # 7. Charts
        charts = generate_chart_datasets(classification, structured_data)
        
        # 8. Embeddings & FAISS
        create_and_store_embeddings(doc_id, text)
        
        # 9. Update Metadata
        write_metadata(doc_id, {
            "status": "Ready",
            "classification": classification,
            "summary": summary,
            "kpis": kpis,
            "dataset_overview": dataset_overview,
            "insights": insights,
            "charts": charts,
            "processed_at": datetime.datetime.now().isoformat()
        })
        
        # Increment global continuous stats
        stats = _get_stats()
        stats["documents"] += 1
        stats["insights"] += len(insights)
        stats["visualizations"] += 6 if charts and any(charts.values()) else 0
        _write_stats(stats)

        
    except Exception as e:
        print(f"Error processing document {doc_id}: {e}")
        import traceback
        traceback.print_exc()
        write_metadata(doc_id, {
            "status": "Failed",
            "error_message": str(e)
        })

@router.post("/upload")
async def upload_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    doc_id = str(uuid.uuid4())
    content = await file.read()
    
    # Save file
    file_path = save_uploaded_file(doc_id, file.filename, content)
    
    # Initial Metadata
    metadata = {
        "id": doc_id,
        "name": file.filename,
        "type": file.filename.split(".")[-1].lower(),
        "status": "Processing",
        "upload_date": datetime.datetime.now().isoformat()
    }
    write_metadata(doc_id, metadata)
    
    # Process in background
    background_tasks.add_task(process_document_bg, doc_id, file.filename, file_path)
    
    return {"message": "Upload successful, processing started.", "doc_id": doc_id}

@router.get("/documents")
async def get_documents():
    docs = list_all_documents()
    # Sort by upload_date descending
    docs.sort(key=lambda x: x.get("upload_date", ""), reverse=True)
    return docs

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    meta = get_metadata(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
    return meta

@router.delete("/documents/{doc_id}")
async def delete_doc(doc_id: str):
    delete_document(doc_id)
    return {"message": "Deleted successfully"}

@router.post("/documents/{doc_id}/query")
async def query_document(doc_id: str, req: QueryRequest):
    # 1. RAG retrieval
    context = query_faiss(doc_id, req.question)
    
    # 2. LLM answering (pass preferred model)
    result = answer_question(context, req.question, preferred_model=req.preferred_model)
    
    # Increment query count globally
    stats = _get_stats()
    stats["queries"] += 1
    _write_stats(stats)
        
    return result

@router.post("/documents/{doc_id}/analytics_query")
async def analytics_query_document(doc_id: str, req: QueryRequest):
    meta = get_metadata(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
        
    result = analytics_chat(meta, req.question, preferred_model=req.preferred_model)
    
    # Increment query count globally
    stats = _get_stats()
    stats["queries"] = stats.get("queries", 0) + 1
    _write_stats(stats)
        
    return result


@router.post("/chat")
async def chat_general(req: QueryRequest):
    """General AI chat endpoint - not document-specific."""
    result = general_chat(req.question, preferred_model=req.preferred_model)
    
    # Increment query count
    stats = _get_stats()
    stats["queries"] = stats.get("queries", 0) + 1
    _write_stats(stats)
    
    return result

@router.get("/documents/{doc_id}/charts")
async def get_document_charts(doc_id: str):
    meta = get_metadata(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
    return meta.get("charts", {})

@router.get("/documents/{doc_id}/export")
async def export_analysis(doc_id: str):
    meta = get_metadata(doc_id)
    if not meta:
        raise HTTPException(status_code=404, detail="Document not found")
    # Return JSON as simple export
    return JSONResponse(content=meta)

@router.get("/stats")
async def get_stats():
    return _get_stats()

@router.post("/stats/simulate")
async def simulate_stats(action: str):
    import random
    stats = _get_stats()
            
    if action == "upload":
        stats["documents"] += 1
        stats["insights"] += random.randint(4, 9)
        stats["visualizations"] += random.randint(1, 3)
    elif action == "query":
        stats["queries"] += random.randint(1, 3)
    elif action == "bulk":
        stats["documents"] += 5
        stats["insights"] += random.randint(14, 32)
        stats["visualizations"] += random.randint(5, 11)
        stats["queries"] += random.randint(6, 15)
        
    _write_stats(stats)
    return {"message": "ok"}

