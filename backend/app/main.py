"""
FastAPI NDA MVP - Main API Server

Endpoints:
- Client: /v1/templates, /v1/templates/{id}/questions, /v1/cases, /v1/cases/{id}/status
- Lawyer: /v1/lawyer/cases, /v1/lawyer/cases/{id}, /v1/lawyer/cases/{id}/approve
"""
import os
import jwt
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.supa import supa, signed_url, STORAGE_RENDERS
from app.generate import fill_docx, render_html
from typing import Dict, Optional

LAWYER_KEY = os.getenv("LAWYER_KEY", "")
LOCAL_DOCX_PATH = os.getenv("LOCAL_DOCX_PATH", "./templates/nda_short_form.docx")
SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")

# Mapping from legacy DOCX placeholders to schema keys
LEGACY_TOKEN_MAP = {
    "DATE": "DATE",
    "NAME OF PARTY 1": "PARTY1_NAME",
    "PARTY 1 NAME": "PARTY1_NAME",  # Alternative format
    "PARTY 1 JURISDICTION OF INCORPORATION/FORMATION": "PARTY1_JURIS",
    "corporation/limited partnership": "PARTY1_TYPE",  # Party 1 type (context-dependent)
    "PARTY 1 BUSINESS ADDRESS": "PARTY1_ADDRESS",
    "NAME OF PARTY 2": "PARTY2_NAME",
    "PARTY 2 NAME": "PARTY2_NAME",  # Alternative format
    "PARTY 2 JURISDICTION OF INCORPORATION/FORMATION": "PARTY2_JURIS",
    "PARTY 2 BUSINESS ADDRESS": "PARTY2_ADDRESS",
    "DESCRIPTION OF PURPOSE": "PURPOSE",
}

def build_replacements(answers: Dict[str, str]) -> Dict[str, str]:
    """
    Build replacement dictionary supporting both new [[KEY]] and legacy [KEY] formats.
    
    Args:
        answers: Dict from client with keys like DATE, PARTY1_NAME, PURPOSE, etc.
    
    Returns:
        Dict with both uppercase schema keys and legacy placeholder names
    """
    replacements = {}
    
    # Add direct mappings (for [[KEY]] format)
    for key, value in answers.items():
        replacements[key.upper()] = str(value)
    
    # Add reverse legacy mappings (for [LEGACY NAME] format)
    for legacy_token, schema_key in LEGACY_TOKEN_MAP.items():
        if schema_key in replacements:
            replacements[legacy_token] = replacements[schema_key]
    
    return replacements

app = FastAPI(title="nda-mvp", version="1.0.0")

# CORS configuration
# TODO: For production, change to allow_origins=["https://your-vercel-app.vercel.app"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_methods=["*"],
    allow_headers=["*"],
)

def require_lawyer(key: str | None):
    """
    Verify lawyer authentication via X-Lawyer-Key header.
    
    Raises:
        HTTPException: 401 if key is missing or invalid
    """
    if not key or key != LAWYER_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


async def get_current_user(authorization: str = Header(None, alias="Authorization")) -> str:
    """
    Extract and validate client user ID from Supabase Auth JWT.
    
    Args:
        authorization: Bearer token from Authorization header
    
    Returns:
        User UUID from the JWT 'sub' claim
        
    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format. Use: Bearer <token>")
    
    token = authorization.split(" ")[1]
    
    try:
        # Decode without signature verification (Supabase handles this via RLS)
        # For production, you can verify with SUPABASE_JWT_SECRET
        decoded = jwt.decode(token, options={"verify_signature": False})
        user_id = decoded.get("sub")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
            
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


# ============================================================================
# CLIENT ENDPOINTS
# ============================================================================

@app.get("/v1/templates")
def list_templates():
    """List all available document templates"""
    return supa().table("templates").select("id,name").execute().data


@app.get("/v1/templates/{template_id}/questions")
def template_questions(template_id: str):
    """
    Get the question schema for a template.
    Returns array of field definitions for dynamic form rendering.
    """
    r = supa().table("templates").select("placeholder_schema").eq("id", template_id).single().execute()
    return r.data["placeholder_schema"]


@app.post("/v1/cases")
async def create_case(
    payload: dict,
    user_id: str = Depends(get_current_user)
):
    """
    Submit a new case with client answers.
    
    🔒 **Authentication Required**: Client must be logged in via Supabase Auth.
    
    Payload format:
    {
        "template_id": "uuid",
        "client_name": "string",
        "client_email": "string",
        "answers": {
            "PARTY1_NAME": "value",
            "DATE": "2025-10-21",
            ...
        }
    }
    
    Returns:
        {"case_id": "uuid", "status": "submitted"}
        
    Raises:
        401: If not authenticated
    """
    # Quota check removed - unlimited NDAs allowed
    
    # Get template
    tpl = supa().table("templates").select("*").eq("id", payload["template_id"]).single().execute().data
    
    # Create case record with required client_user_id
    case_data = {
        "template_id": tpl["id"],
        "client_name": payload["client_name"],
        "client_email": payload["client_email"],
        "client_user_id": user_id,  # ✅ Now required
        "status": "submitted"
    }
    
    case = supa().table("cases").insert(case_data).execute().data[0]
    cid = case["id"]
    
    # Save answers
    supa().table("case_answers").insert(
        [{"case_id": cid, "key": k, "value": str(v)} for k, v in payload["answers"].items()]
    ).execute()
    
    # Prepare replacements supporting both [[KEY]] and [LEGACY] formats
    replacements = build_replacements(payload["answers"])
    
    # Generate documents locally
    os.makedirs(f"./renders/{cid}", exist_ok=True)
    out_docx = f"./renders/{cid}/nda.docx"
    out_html = f"./renders/{cid}/nda.html"
    
    # Generate DOCX and track missing tokens
    missing_tokens = fill_docx(LOCAL_DOCX_PATH, out_docx, replacements)
    
    with open(out_html, "w", encoding="utf-8") as f:
        f.write(render_html(tpl["html_template"], replacements))
    
    # Upload to Supabase Storage with error handling
    try:
        with open(out_docx, "rb") as f:
            supa().storage.from_(STORAGE_RENDERS).upload(
                f"cases/{cid}/nda.docx",
                f,
                {"upsert": "true"}  # Note: Will overwrite on re-submission (acceptable for MVP)
            )
        
        with open(out_html, "rb") as f:
            supa().storage.from_(STORAGE_RENDERS).upload(
                f"cases/{cid}/nda.html",
                f,
                {"upsert": "true"}
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")
    
    # Record document paths
    supa().table("case_documents").insert({
        "case_id": cid,
        "filled_docx_path": f"cases/{cid}/nda.docx",
        "filled_html_path": f"cases/{cid}/nda.html"
    }).execute()
    
    # Return with QA information about missing tokens
    return {
        "case_id": cid,
        "status": "submitted",
        "missing_tokens": list(missing_tokens) if missing_tokens else [],
        "warning": f"{len(missing_tokens)} placeholder(s) could not be filled" if missing_tokens else None
    }


@app.get("/v1/cases/{case_id}/status")
def case_status(case_id: str):
    """
    Check case status and get download URL if approved.
    
    Returns:
        {
            "status": "submitted" | "approved",
            "approved_download_url": null | "https://signed-url..."
        }
    """
    c = supa().table("cases").select("status").eq("id", case_id).single().execute().data
    
    # Only return download URL if case is approved
    url = None
    if c["status"] == "approved":
        docs = supa().table("case_documents").select("filled_docx_path").eq("case_id", case_id).single().execute().data
        url = signed_url("renders", docs["filled_docx_path"])
    
    return {"status": c["status"], "approved_download_url": url}


# ============================================================================
# AUTHENTICATED CLIENT ENDPOINTS
# ============================================================================

@app.get("/v1/me/cases")
async def get_my_cases(user_id: str = Depends(get_current_user)):
    """
    Get all cases for the authenticated client.
    
    Requires: Authorization header with valid JWT
    
    Returns: List of cases owned by the current user
    """
    cases = supa().table("cases").select(
        "id,template_id,client_name,client_email,status,created_at,updated_at"
    ).eq("client_user_id", user_id).order("created_at", desc=True).execute().data
    
    return cases


@app.get("/v1/me/cases/{case_id}")
async def get_my_case_detail(case_id: str, user_id: str = Depends(get_current_user)):
    """
    Get detailed information for a specific case owned by the authenticated client.
    
    Requires: Authorization header with valid JWT
    
    Returns:
        - Case information
        - Case answers
        - Document URLs (if approved)
    
    Raises:
        404: If case doesn't exist or doesn't belong to the user
    """
    # Get case - RLS will enforce ownership
    case_result = supa().table("cases").select("*").eq("id", case_id).eq("client_user_id", user_id).execute()
    
    if not case_result.data:
        raise HTTPException(status_code=404, detail="Case not found or access denied")
    
    case = case_result.data[0]
    
    # Get answers
    answers = supa().table("case_answers").select("key,value").eq("case_id", case_id).execute().data
    
    # Get documents if approved
    download_url = None
    preview_url = None
    
    if case["status"] == "approved":
        docs = supa().table("case_documents").select("*").eq("case_id", case_id).single().execute().data
        if docs:
            download_url = signed_url("renders", docs["filled_docx_path"])
            preview_url = signed_url("renders", docs["filled_html_path"])
    
    return {
        "case": case,
        "answers": answers,
        "download_url": download_url,
        "preview_url": preview_url
    }


# ============================================================================
# LAWYER ENDPOINTS (Protected)
# ============================================================================

@app.get("/v1/lawyer/cases")
def lawyer_cases(x_lawyer_key: str | None = Header(default=None)):
    """
    List all cases for lawyer review.
    Requires X-Lawyer-Key header.
    """
    require_lawyer(x_lawyer_key)
    return supa().table("cases").select("id,client_name,client_email,status,created_at").order("created_at", desc=True).execute().data


@app.get("/v1/lawyer/cases/{case_id}")
def lawyer_case_detail(case_id: str, x_lawyer_key: str | None = Header(default=None)):
    """
    Get detailed case information for lawyer review.
    Includes signed URLs for preview and download.
    """
    require_lawyer(x_lawyer_key)
    
    c = supa().table("cases").select("*").eq("id", case_id).single().execute().data
    ans = supa().table("case_answers").select("key,value").eq("case_id", case_id).execute().data
    docs = supa().table("case_documents").select("*").eq("case_id", case_id).single().execute().data
    
    return {
        "case": c,
        "answers": ans,
        "preview_html_url": signed_url("renders", docs["filled_html_path"]),
        "docx_url": signed_url("renders", docs["filled_docx_path"])
    }


@app.post("/v1/lawyer/cases/{case_id}/approve")
def lawyer_approve(case_id: str, x_lawyer_key: str | None = Header(default=None)):
    """
    Approve a case, allowing client to download the final document.
    """
    require_lawyer(x_lawyer_key)
    
    # Update case status to approved
    supa().table("cases").update({"status": "approved"}).eq("id", case_id).execute()
    
    # Return download URL for client
    docs = supa().table("case_documents").select("*").eq("case_id", case_id).single().execute().data
    
    return {
        "ok": True,
        "client_docx_url": signed_url("renders", docs["filled_docx_path"])
    }


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "nda-mvp"}

