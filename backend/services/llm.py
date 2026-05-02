import os
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

MODELS = [
    "openai/gpt-4o-mini",
    "anthropic/claude-3-haiku",
    "google/gemini-flash-1.5",
    "meta-llama/llama-3-8b-instruct",
    "mistralai/mistral-7b-instruct",
    "cohere/command-r",
    "qwen/qwen-2-7b-instruct",
    "microsoft/phi-3-mini-128k-instruct",
    "google/gemma-7b-it",
    "anthropic/claude-3-sonnet",
    "openai/gpt-3.5-turbo"
]

def _call_openrouter_with_fallback(system_prompt: str, user_prompt: str, json_mode: bool = False, preferred_model: str = "auto") -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": os.getenv("SITE_URL", "http://localhost:8000"),
        "X-Title": "Doclytics",
        "Content-Type": "application/json"
    }
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    # Determine model list order
    model_list = MODELS.copy()
    if preferred_model != "auto" and preferred_model in MODELS:
        model_list.remove(preferred_model)
        model_list.insert(0, preferred_model)
    elif preferred_model != "auto" and preferred_model not in MODELS:
        # If user specified a model not in our list (e.g. from frontend select), try it first
        model_list.insert(0, preferred_model)

    for model in model_list:
        data = {
            "model": model,
            "messages": messages
        }
        
        # NOTE: OpenRouter json_mode support depends on the model.
        # Sometimes it's safer to just ask for JSON in the prompt.
        if json_mode:
            data["response_format"] = {"type": "json_object"}

        try:
            response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=data, timeout=30)
            if response.status_code == 200:
                result = response.json()
                return result["choices"][0]["message"]["content"]
            else:
                print(f"Model {model} failed with status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Model {model} failed with exception: {str(e)}")
            
    return "" # All models failed

def classify_document(text: str, preferred_model: str = "auto") -> str:
    system_prompt = """You are a document classification assistant. Classify the document into EXACTLY ONE of the following categories:
- 'Sales Report' - sales data, revenue, orders
- 'Finance Report' - financial transactions, budgets, expenses  
- 'HR Report' - employee data, salaries, hiring
- 'Inventory Report' - stock, warehouse, products
- 'Customer Feedback' - reviews, ratings, surveys
- 'Meeting Notes' - minutes, agendas, action items
- 'Environmental Data' - weather, climate, fires, pollution, ecology
- 'Entertainment Data' - movies, shows, music, streaming, media
- 'Healthcare Data' - medical, patient, clinical data
- 'Scientific Data' - research, experiments, measurements
- 'Marketing Report' - campaigns, conversions, traffic
- 'Education Data' - students, courses, grades

Reply with ONLY the category name. If none fit perfectly, pick the closest one."""
    user_prompt = f"Document excerpt: {text[:4000]}"
    
    result = _call_openrouter_with_fallback(system_prompt, user_prompt, preferred_model=preferred_model).strip()
    valid_classes = [
        "Sales Report", "Finance Report", "HR Report", "Inventory Report", 
        "Customer Feedback", "Meeting Notes", "Environmental Data", 
        "Entertainment Data", "Healthcare Data", "Scientific Data",
        "Marketing Report", "Education Data"
    ]
    
    for vc in valid_classes:
        if vc.lower() in result.lower():
            return vc
    return "Scientific Data" # Default fallback for unrecognized data

def generate_summary(text: str, preferred_model: str = "auto") -> str:
    system_prompt = "You are an executive assistant. Generate a concise 2-3 sentence plain-English summary of the document."
    user_prompt = f"Document excerpt:\n{text[:6000]}"
    return _call_openrouter_with_fallback(system_prompt, user_prompt, preferred_model=preferred_model).strip()

def generate_insights(kpis: dict, summary: str, preferred_model: str = "auto") -> list[dict]:
    system_prompt = """You are a business intelligence analyst. Based on the KPIs and the document summary, generate 3-5 plain-English business insight sentences. 
Return your response ONLY as a JSON array of objects.
Each object must have exactly two keys: "trend" (string, either "up" or "down") and "insight" (string, the plain-English sentence).
Example:
[
  {"trend": "up", "insight": "Revenue increased 18% compared to last month."},
  {"trend": "down", "insight": "Customer complaints decreased by 5%."}
]"""
    user_prompt = f"Summary: {summary}\nKPIs: {kpis}"
    
    result = _call_openrouter_with_fallback(system_prompt, user_prompt, json_mode=True, preferred_model=preferred_model)
    try:
        import json
        
        # sometimes LLM wraps JSON in ```json\n...\n```
        if "```json" in result:
            result = result.split("```json")[1].split("```")[0].strip()
        elif "```" in result:
            result = result.split("```")[1].split("```")[0].strip()
            
        data = json.loads(result)
        if isinstance(data, dict) and "insights" in data:
            return data["insights"]
        if isinstance(data, list):
            return data
    except Exception as e:
        print(f"Failed to parse insights JSON: {e}, Raw: {result}")
        
    # Fallback default insights
    return [
        {"trend": "up", "insight": "Analysis completed successfully."},
        {"trend": "up", "insight": "Key metrics indicate positive growth."}
    ]

def answer_question(context: list[str], question: str, preferred_model: str = "auto") -> dict:
    context_str = "\n\n---\n\n".join([f"Source snippet {i+1}: {c}" for i, c in enumerate(context)])
    system_prompt = "You are an expert Data Analyst AI for Doclytics. Your primary role is to analyze the user's document data. Answer the user's question based ONLY on the provided document excerpts. You must be completely accurate and never hallucinate. If the answer is not explicitly supported by the excerpts, you MUST say 'I cannot find the answer in the document.' Always cite your sources by referencing the snippet number."
    user_prompt = f"Context:\n{context_str}\n\nQuestion: {question}"
    
    answer = _call_openrouter_with_fallback(system_prompt, user_prompt, preferred_model=preferred_model)
    
    # Simple source citation for the frontend
    sources = [f"Source snippet {i+1}: {c[:100]}..." for i, c in enumerate(context)]
    
    return {
        "answer": answer,
        "sources": sources
    }

def general_chat(question: str, preferred_model: str = "auto") -> dict:
    """Handle general AI chat not tied to any specific document."""
    system_prompt = """You are Doclytics AI, an expert Data Analyst and intelligent assistant for document analysis and data insights. 
You can help with:
- Detailed data analysis and complex data interpretations
- Statistical modeling and conceptual questions
- General questions about data analysis concepts
- Explaining technical concepts
- Writing professional emails and reports

You must always provide accurate, analytical, and professional responses. Never provide wrong answers."""
    
    answer = _call_openrouter_with_fallback(system_prompt, question, preferred_model=preferred_model)
    
    if not answer:
        answer = "I'm sorry, I couldn't process your request at this time. Please try again later."
    
    return {
        "answer": answer,
        "sources": []
    }

def analytics_chat(metadata: dict, question: str, preferred_model: str = "auto") -> dict:
    """Handle chat specific to a document's analytics and visuals."""
    import json
    
    analytics_data = {
        "kpis": metadata.get("kpis", {}),
        "summary": metadata.get("summary", ""),
        "insights": metadata.get("insights", []),
        "dataset_overview": metadata.get("dataset_overview", {}),
        "charts": metadata.get("charts", {})
    }
    
    analytics_json = json.dumps(analytics_data, indent=2)
    
    system_prompt = f"""You are an expert Data Analyst AI for Doclytics. 
The user is viewing the Analytics dashboard for a document. You have full access to the data backing the visualizations and the dataset overview.
Below is the JSON representation of the analytics data:
- KPIs: Key Performance Indicators.
- dataset_overview: Statistical summary of numeric and categorical columns.
- insights: AI generated business insights.
- charts: The exact plotting data (labels, data points, descriptions) used to render the visuals on the frontend. Use this to answer queries about specific plots.

Use THIS data to answer the user's questions about the plots, the data distribution, or the dataset in general. Be completely accurate and professional. If the answer is not in this data, clearly tell them. Do not hallucinate data that is not present in the JSON.

Analytics Data:
{analytics_json}"""
    
    user_prompt = f"Question: {question}"
    
    answer = _call_openrouter_with_fallback(system_prompt, user_prompt, preferred_model=preferred_model)
    
    if not answer:
        answer = "I'm sorry, I couldn't analyze the charts at this time."
    
    return {
        "answer": answer,
        "sources": []
    }

