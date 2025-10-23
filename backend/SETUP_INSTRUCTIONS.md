# Backend Setup Instructions

Follow these steps to get the backend running locally.

## Step 1: Create Your `.env` File

Since `.env` files are gitignored, you need to create one manually. 

**Windows Command Prompt:**
```cmd
cd backend
copy .env.example .env
```

**PowerShell:**
```powershell
cd backend
Copy-Item .env.example .env
```

## Step 2: Fill in Supabase Credentials

Open `backend/.env` in a text editor and replace the placeholder values:

```env
# Supabase Configuration
# Get these from: Supabase Dashboard → Project Settings → API
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=YOUR_SERVICE_ROLE_KEY_HERE

# Security - Already set to a secure random key
LAWYER_KEY=7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b

# Storage Buckets (should match your Supabase storage bucket names)
STORAGE_BUCKET_TEMPLATES=templates
STORAGE_BUCKET_RENDERS=renders

# Local Template Path (relative to backend directory)
LOCAL_DOCX_PATH=./templates/nda_short_form.docx
```

### Where to Find Your Supabase Credentials:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Project Settings** (gear icon in sidebar)
4. Click **API** tab
5. Copy:
   - **Project URL** → use as `SUPABASE_URL`
   - **service_role secret** → use as `SUPABASE_SERVICE_KEY` ⚠️ Keep this secret!

## Step 3: Verify Template File

Make sure the NDA template was copied successfully:

```powershell
# Should show: nda_short_form.docx
dir backend\templates\
```

## Step 4: Create Python Virtual Environment

**PowerShell:**
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
```

**Command Prompt:**
```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate.bat
```

You should see `(.venv)` appear in your terminal prompt.

## Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- python-docx (document generation)
- supabase (database client)
- python-dotenv (environment variables)

## Step 6: Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 7: Test the API

Open your browser and visit:

**http://localhost:8000/docs**

This will show FastAPI's interactive API documentation where you can test all endpoints.

### Quick curl test:

**PowerShell:**
```powershell
# Test health check
Invoke-WebRequest -Uri http://localhost:8000/ | Select-Object -ExpandProperty Content

# List templates
Invoke-WebRequest -Uri http://localhost:8000/v1/templates | Select-Object -ExpandProperty Content
```

**Command Prompt (with curl):**
```cmd
curl http://localhost:8000/
curl http://localhost:8000/v1/templates
```

## Troubleshooting

### "No module named 'dotenv'"
Make sure you activated the virtual environment:
```powershell
.venv\Scripts\Activate.ps1
```

### "Connection refused" or "SUPABASE_URL is None"
Check that:
1. Your `.env` file exists in the `backend/` folder
2. You filled in the correct `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
3. You're running `uvicorn` from the `backend/` directory

### "File not found: ./templates/nda_short_form.docx"
Make sure you're in the `backend/` directory when running uvicorn:
```powershell
cd backend
uvicorn app.main:app --reload --port 8000
```

## Next Steps

Once the backend is running successfully:

1. ✅ Test the client flow (create a case)
2. ✅ Test the lawyer flow (review and approve)
3. ✅ Build the frontend (Next.js app)
4. ✅ Deploy to production (Cloud Run + Vercel)

See `backend/README.md` for detailed API testing examples.

