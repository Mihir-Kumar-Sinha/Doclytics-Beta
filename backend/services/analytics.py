import pandas as pd
import numpy as np

def compute_kpis(classification: str, data: list) -> dict:
    if not data:
        return {}
        
    df = pd.DataFrame(data)
    
    # Generic numeric columns
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
    
    # Filter out low-information numeric columns
    skip_words = {'day', 'month', 'year', 'id', 'index', 'unnamed'}
    meaningful_numeric = [c for c in numeric_cols if c.lower().strip() not in skip_words]
    if not meaningful_numeric:
        meaningful_numeric = numeric_cols
    
    kpis = {}
    
    # Always show record count
    kpis["Total Records"] = f"{len(df):,}"
    kpis["Total Columns"] = str(len(df.columns))
    
    # Compute KPIs from actual numeric data (up to 4 most interesting columns)
    for col in meaningful_numeric[:4]:
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue
        
        col_label = col.replace('_', ' ').title()
        
        # Check if column looks like a percentage or ratio (0-1 or 0-100 range)
        col_max = col_data.max()
        col_min = col_data.min()
        col_mean = col_data.mean()
        col_std = col_data.std()
        
        if col_max <= 1 and col_min >= 0:
            kpis[f"Avg {col_label}"] = f"{col_mean:.2%}"
        elif col_max <= 100 and col_min >= 0 and ('rate' in col.lower() or 'score' in col.lower() or 'pct' in col.lower() or 'percent' in col.lower()):
            kpis[f"Avg {col_label}"] = f"{col_mean:.1f}%"
        else:
            # Format large numbers nicely
            if abs(col_mean) >= 1000:
                kpis[f"Avg {col_label}"] = f"{col_mean:,.1f}"
            else:
                kpis[f"Avg {col_label}"] = f"{col_mean:.2f}"
        
        # Add range info for the first meaningful column
        if col == meaningful_numeric[0]:
            kpis[f"Min {col_label}"] = f"{col_min:,.2f}" if abs(col_min) < 1000 else f"{col_min:,.0f}"
            kpis[f"Max {col_label}"] = f"{col_max:,.2f}" if abs(col_max) < 1000 else f"{col_max:,.0f}"
    
    # Add categorical column info
    for col in categorical_cols[:2]:
        col_label = col.replace('_', ' ').title()
        nunique = df[col].nunique()
        if 2 <= nunique <= 20:
            kpis[f"{col_label} Categories"] = str(nunique)
            # Show most common value
            most_common = df[col].value_counts().index[0]
            kpis[f"Most Common {col_label}"] = str(most_common)
    
    # Add data completeness
    total_cells = len(df) * len(df.columns)
    non_null = df.count().sum()
    completeness = (non_null / total_cells) * 100 if total_cells > 0 else 0
    kpis["Data Completeness"] = f"{completeness:.1f}%"
    
    return kpis


def compute_dataset_overview(data: list) -> dict:
    """Compute a detailed dataset overview for the frontend."""
    if not data:
        return {}
    
    df = pd.DataFrame(data)
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
    
    overview = {
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "columns": [],
        "numeric_summary": [],
        "categorical_summary": [],
    }
    
    # Column info
    for col in df.columns:
        dtype = str(df[col].dtype)
        null_count = int(df[col].isnull().sum())
        overview["columns"].append({
            "name": col,
            "type": "numeric" if col in numeric_cols else "categorical",
            "dtype": dtype,
            "null_count": null_count,
            "unique_count": int(df[col].nunique())
        })
    
    # Numeric stats
    skip_words = {'day', 'month', 'year', 'id', 'index', 'unnamed'}
    for col in numeric_cols:
        if col.lower().strip() in skip_words:
            continue
        col_data = df[col].dropna()
        if len(col_data) == 0:
            continue
        overview["numeric_summary"].append({
            "column": col,
            "mean": round(float(col_data.mean()), 2),
            "median": round(float(col_data.median()), 2),
            "std": round(float(col_data.std()), 2),
            "min": round(float(col_data.min()), 2),
            "max": round(float(col_data.max()), 2),
            "q25": round(float(col_data.quantile(0.25)), 2),
            "q75": round(float(col_data.quantile(0.75)), 2),
        })
    
    # Categorical stats
    for col in categorical_cols:
        val_counts = df[col].value_counts().head(5)
        overview["categorical_summary"].append({
            "column": col,
            "unique_count": int(df[col].nunique()),
            "top_values": [{"value": str(k), "count": int(v)} for k, v in val_counts.items()]
        })
    
    return overview


def _format_chart_title(y_col: str, x_col: str, chart_type: str) -> str:
    """Create descriptive chart titles."""
    y_label = y_col.replace('_', ' ').title()
    x_label = x_col.replace('_', ' ').title()
    
    if chart_type == "bar":
        return f"Average {y_label} by {x_label}"
    elif chart_type == "pie":
        return f"Distribution of {x_label}"
    elif chart_type == "line":
        return f"{y_label} Trend Across Records"
    elif chart_type == "area":
        return f"{y_label} Over Records (Cumulative View)"
    elif chart_type == "scatter":
        return f"{y_label} vs {x_label} Correlation"
    elif chart_type == "histogram":
        return f"{y_label} Value Distribution"
    return y_label


def generate_chart_datasets(classification: str, data: list) -> dict:
    empty = {"labels": [], "datasets": [], "description": ""}
    if not data:
        return {k: dict(empty) for k in ["Bar", "Pie", "Line", "Area", "Scatter", "Histogram"]}
        
    df = pd.DataFrame(data)
    numeric_cols = df.select_dtypes(include='number').columns.tolist()
    categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
    
    # Filter out low-information numeric columns like day, month, year
    skip_words = {'day', 'month', 'year', 'id', 'index'}
    meaningful_numeric = [c for c in numeric_cols if c.lower().strip() not in skip_words]
    if not meaningful_numeric:
        meaningful_numeric = numeric_cols  # fallback to all if nothing left
    
    charts = {}
    
    if meaningful_numeric and categorical_cols:
        # Pick the best categorical column: prefer one with fewer unique values
        best_cat = None
        best_nunique = float('inf')
        for col in categorical_cols:
            nunique = df[col].nunique()
            if 2 <= nunique <= 20:
                if nunique < best_nunique:
                    best_nunique = nunique
                    best_cat = col
        
        if best_cat is None:
            best_cat = categorical_cols[-1]
        
        x_col = best_cat
        y_col = meaningful_numeric[0]
        
        x_label = x_col.replace('_', ' ').title()
        y_label = y_col.replace('_', ' ').title()
        
        # Group by category
        grouped = df.groupby(x_col)[y_col].mean().head(10)
        labels = [str(l) for l in grouped.index.tolist()]
        values = [round(v, 2) for v in grouped.values.tolist()]
        
        # 1. Bar Chart
        charts["Bar"] = {
            "labels": labels,
            "datasets": [{"label": f"Avg {y_label} by {x_label}", "data": values, "backgroundColor": "#3b82f6"}],
            "title": _format_chart_title(y_col, x_col, "bar"),
            "description": f"Shows how the average {y_label} varies across different {x_label} categories. Higher bars indicate higher mean values for that category."
        }
        
        # 2. Pie Chart
        count_grouped = df[x_col].value_counts().head(10)
        pie_labels = [str(l) for l in count_grouped.index.tolist()]
        pie_values = count_grouped.values.tolist()
        colors = ["#3b82f6", "#8b5cf6", "#14b8a6", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#f43f5e", "#84cc16"]
        charts["Pie"] = {
            "labels": pie_labels,
            "datasets": [{"label": f"{x_label} Distribution", "data": pie_values, "backgroundColor": colors[:len(pie_labels)]}],
            "title": _format_chart_title(y_col, x_col, "pie"),
            "description": f"Shows the proportion of records in each {x_label} category. Larger slices represent categories with more data points."
        }
        
        # 3. Line Chart
        line_data = df[y_col].dropna().head(50).tolist()
        line_labels = [str(i+1) for i in range(len(line_data))]
        charts["Line"] = {
            "labels": line_labels,
            "datasets": [{"label": y_label, "data": [round(v, 2) for v in line_data], "borderColor": "#3b82f6", "tension": 0.4}],
            "title": _format_chart_title(y_col, x_col, "line"),
            "description": f"Tracks how {y_label} changes across the first 50 records. Peaks and valleys reveal patterns, seasonality, or anomalies in the data."
        }
        
        # 4. Area Chart - second meaningful numeric col if available
        area_col = meaningful_numeric[1] if len(meaningful_numeric) > 1 else y_col
        area_label = area_col.replace('_', ' ').title()
        area_data = df[area_col].dropna().head(50).tolist()
        area_labels = [str(i+1) for i in range(len(area_data))]
        charts["Area"] = {
            "labels": area_labels,
            "datasets": [{"label": area_label, "data": [round(v, 2) for v in area_data], "borderColor": "#8b5cf6", "backgroundColor": "rgba(139, 92, 246, 0.2)", "fill": True, "tension": 0.4}],
            "title": f"{area_label} Over Records (Cumulative View)",
            "description": f"Displays the {area_label} values with a filled area to highlight the magnitude and trends. The shaded region emphasizes the cumulative impact."
        }
        
        # 5. Scatter Plot
        if len(meaningful_numeric) > 1:
            y2_col = meaningful_numeric[1]
            y2_label = y2_col.replace('_', ' ').title()
            scatter_data = [{"x": round(float(row[y_col]), 2), "y": round(float(row[y2_col]), 2)} for _, row in df.head(100).iterrows() if pd.notna(row[y_col]) and pd.notna(row[y2_col])]
            scatter_desc = f"Each dot represents a record plotted with {y_label} on X-axis and {y2_label} on Y-axis. Clusters reveal correlations; scattered points suggest independence."
            scatter_title = f"{y_label} vs {y2_label} Correlation"
        else:
            scatter_data = [{"x": i, "y": round(float(val), 2)} for i, val in enumerate(df[y_col].dropna().head(100))]
            y2_label = "Index"
            scatter_desc = f"Each dot plots record index against {y_label}. Useful for identifying outliers and understanding data spread."
            scatter_title = f"{y_label} vs Index"
            
        charts["Scatter"] = {
            "datasets": [{"label": f"{y_label} vs {y2_label}", "data": scatter_data, "backgroundColor": "#14b8a6"}],
            "title": scatter_title,
            "description": scatter_desc
        }
        
        # 6. Histogram
        hist_values = df[y_col].dropna()
        try:
            counts, bin_edges = pd.cut(hist_values, bins=10, retbins=True)
            hist_counts = counts.value_counts().sort_index()
            hist_labels = [f"{round(interval.left, 1)}-{round(interval.right, 1)}" for interval in hist_counts.index]
            hist_data = hist_counts.values.tolist()
        except Exception:
            hist_data = hist_values.head(50).tolist()
            hist_labels = [f"Item {i+1}" for i in range(len(hist_data))]
        
        charts["Histogram"] = {
            "labels": hist_labels,
            "datasets": [{"label": f"{y_label} Distribution", "data": hist_data, "backgroundColor": "#f59e0b"}],
            "title": _format_chart_title(y_col, x_col, "histogram"),
            "description": f"Groups {y_label} into 10 equal bins showing how frequently each range appears. Bell-shaped distributions indicate normality; skewed shapes suggest outliers."
        }
        
    elif meaningful_numeric:
        # No categorical columns, but we have numeric data
        y_col = meaningful_numeric[0]
        y_label = y_col.replace('_', ' ').title()
        line_data = df[y_col].dropna().head(50).tolist()
        labels = [str(i+1) for i in range(len(line_data))]
        
        charts["Bar"] = {"labels": labels, "datasets": [{"label": y_label, "data": [round(v, 2) for v in line_data], "backgroundColor": "#3b82f6"}], "title": f"{y_label} Values", "description": f"Bar representation of {y_label} across records."}
        charts["Line"] = {"labels": labels, "datasets": [{"label": y_label, "data": [round(v, 2) for v in line_data], "borderColor": "#3b82f6", "tension": 0.4}], "title": f"{y_label} Trend", "description": f"Line trend of {y_label} across records."}
        charts["Area"] = {"labels": labels, "datasets": [{"label": y_label, "data": [round(v, 2) for v in line_data], "borderColor": "#8b5cf6", "backgroundColor": "rgba(139, 92, 246, 0.2)", "fill": True, "tension": 0.4}], "title": f"{y_label} Area View", "description": f"Area view of {y_label} across records."}
        charts["Pie"] = dict(empty)
        charts["Scatter"] = dict(empty)
        charts["Histogram"] = dict(empty)
    else:
        charts = {k: dict(empty) for k in ["Bar", "Pie", "Line", "Area", "Scatter", "Histogram"]}
        
    return charts
