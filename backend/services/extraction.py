import fitz  # PyMuPDF
import docx
import pandas as pd
import json

def extract_text_from_pdf(file_path: str) -> str:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

def extract_text_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    text = "\n".join([para.text for para in doc.paragraphs])
    return text

def _clean_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Strip whitespace from column names and string values, coerce numeric columns."""
    # Strip column name whitespace
    df.columns = [str(c).strip() for c in df.columns]
    
    # Strip whitespace from all string/object columns
    for col in df.columns:
        if df[col].dtype == object or str(df[col].dtype) == 'string':
            df[col] = df[col].astype(str).str.strip()
    
    # Drop rows where ALL values are empty or NaN (separator rows between regions)
    df.replace('', pd.NA, inplace=True)
    df.dropna(how='all', inplace=True)
    
    # Drop rows that look like repeated headers embedded in data
    # (e.g. a row whose first cell equals the column name)
    first_col = df.columns[0]
    df = df[df[first_col] != first_col]
    
    # Coerce every column that looks numeric into a proper numeric type
    for col in df.columns:
        converted = pd.to_numeric(df[col], errors='coerce')
        # If at least 50% of non-null values converted successfully, keep the numeric version
        if converted.notna().sum() >= len(df) * 0.5:
            df[col] = converted
    
    df.reset_index(drop=True, inplace=True)
    return df


def extract_from_tabular(file_path: str, filename: str) -> tuple[str, list]:
    # Returns text representation (for embeddings) and raw list of dicts (for analytics)
    if filename.endswith(".csv"):
        df = pd.read_csv(file_path)
        # Handle cases where the first row is a title and not actual headers
        if len(df.columns) <= 1 and len(df) > 1:
            df = pd.read_csv(file_path, skiprows=1)
    else:
        df = pd.read_excel(file_path)
    
    # Clean the dataframe: strip whitespace, drop junk rows, coerce numerics
    df = _clean_dataframe(df)
    
    # Drop any fully empty columns
    df.dropna(axis=1, how='all', inplace=True)
    
    # Text representation
    text = df.to_string()
    
    # Structured data
    # convert NaNs to None for JSON compliance
    data = df.where(pd.notnull(df), None).to_dict(orient="records")
    return text, data

def extract_data(file_path: str, filename: str) -> tuple[str, list]:
    ext = filename.lower().split('.')[-1]
    if ext == 'pdf':
        return extract_text_from_pdf(file_path), []
    elif ext == 'docx':
        return extract_text_from_docx(file_path), []
    elif ext in ['csv', 'xls', 'xlsx']:
        return extract_from_tabular(file_path, filename)
    elif ext == 'txt':
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read(), []
    else:
        raise ValueError(f"Unsupported file type: {ext}")
