# NDA MVP Backend

FastAPI backend for automated NDA document generation and lawyer review.

## Quick Start

### 1. Setup Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

Edit `.env` and add:
- `SUPABASE_URL` - from Supabase Dashboard → Project Settings → API
- `SUPABASE_SERVICE_KEY` - from Supabase Dashboard → Project Settings → API → service_role

### 2. Install Dependencies

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Run Development Server

```bash
uvicorn app.main:app --reload --port 8000
```

Visit http://localhost:8000/docs for interactive API documentation.

## API Endpoints

### Client Endpoints

- `GET /v1/templates` - List available templates
- `GET /v1/templates/{id}/questions` - Get form questions for template
- `POST /v1/cases` - Submit new case with answers
- `GET /v1/cases/{id}/status` - Check case status and get download URL (if approved)

### Lawyer Endpoints (Require `X-Lawyer-Key` header)

- `GET /v1/lawyer/cases` - List all submitted cases
- `GET /v1/lawyer/cases/{id}` - Get case details with preview URLs
- `POST /v1/lawyer/cases/{id}/approve` - Approve case for client download

## Testing

### Smoke Test with curl

```bash
# List templates
curl http://localhost:8000/v1/templates

# Get questions (replace <TEMPLATE_ID> with actual ID from above)
curl http://localhost:8000/v1/templates/<TEMPLATE_ID>/questions

# Submit a case
curl -X POST http://localhost:8000/v1/cases \
  -H "Content-Type: application/json" \
  -d '{
    "template_id":"<TEMPLATE_ID>",
    "client_name":"Alice Smith",
    "client_email":"alice@example.com",
    "answers":{
      "date":"2025-10-21",
      "party1_name":"Alpha Inc.",
      "party1_juris":"Ontario",
      "party1_type":"corporation",
      "party1_address":"123 Queen St, Toronto, ON",
      "party2_name":"Beta LLC",
      "party2_juris":"British Columbia",
      "party2_type":"limited partnership",
      "party2_address":"456 King St, Vancouver, BC",
      "purpose":"Discuss potential JV"
    }
  }'

# Check case status (replace <CASE_ID>)
curl http://localhost:8000/v1/cases/<CASE_ID>/status

# Lawyer: List cases
curl http://localhost:8000/v1/lawyer/cases \
  -H "X-Lawyer-Key: 7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b"

# Lawyer: Get case detail
curl http://localhost:8000/v1/lawyer/cases/<CASE_ID> \
  -H "X-Lawyer-Key: 7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b"

# Lawyer: Approve case
curl -X POST http://localhost:8000/v1/lawyer/cases/<CASE_ID>/approve \
  -H "X-Lawyer-Key: 7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b"
```

## Docker Build & Test

```bash
# Build image
docker build -t nda-backend .

# Run container
docker run -p 8080:8080 --env-file .env nda-backend

# Test
curl http://localhost:8080/v1/templates
```

## Deployment (Google Cloud Run)

1. Build and push to Container Registry:
```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/nda-backend
```

2. Deploy to Cloud Run:
```bash
gcloud run deploy nda-backend \
  --image gcr.io/YOUR_PROJECT_ID/nda-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

3. Set environment variables in Cloud Run console:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `LAWYER_KEY`
   - `STORAGE_BUCKET_TEMPLATES=templates`
   - `STORAGE_BUCKET_RENDERS=renders`
   - `LOCAL_DOCX_PATH=/app/templates/nda_short_form.docx`

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI app & endpoints
│   ├── supa.py          # Supabase client
│   └── generate.py      # Document generation
├── templates/
│   └── nda_short_form.docx  # Master template
├── renders/             # Generated docs (local only)
├── requirements.txt
├── .env                 # Your local config (gitignored)
├── .env.example         # Template for .env
├── Dockerfile
└── README.md
```

## Security Notes

- Never commit `.env` file
- `SUPABASE_SERVICE_KEY` has full admin access - keep it secure
- Change `LAWYER_KEY` to a strong random value for production
- Update CORS settings in `main.py` for production (restrict origins)

