"""
Supabase client and storage helpers
"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
STORAGE_TEMPLATES = os.getenv("STORAGE_BUCKET_TEMPLATES", "templates")
STORAGE_RENDERS = os.getenv("STORAGE_BUCKET_RENDERS", "renders")

def supa() -> Client:
    """Get authenticated Supabase client with service role"""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def signed_url(bucket: str, path: str, expires: int = 3600) -> str:
    """
    Generate a signed URL for accessing private storage files
    
    Args:
        bucket: Storage bucket name (e.g., 'renders')
        path: File path within bucket (e.g., 'cases/uuid/nda.docx')
        expires: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Signed URL string
    """
    return supa().storage.from_(bucket).create_signed_url(path, expires)["signedURL"]

