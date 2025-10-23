# 🚀 Google Cloud Run Deployment Guide

**Project:** calex-live-v1  
**Project Number:** 206563848551  
**Backend Service:** nda-backend

---

## Prerequisites

1. **Install Google Cloud SDK**
   - Windows: https://cloud.google.com/sdk/docs/install
   - Already installed? Verify: `gcloud --version`

2. **Authenticate**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   ```

3. **Gather Your Credentials**
   
   From Supabase Dashboard (https://supabase.com/dashboard):
   - Settings → API
   - Copy **Project URL**: `https://gjgdoxdishalglrdmucb.supabase.co`
   - Copy **anon public** key (for frontend)
   - Copy **service_role** key (for backend - keep secret!)
   
   From Supabase Dashboard:
   - Settings → API → JWT Settings
   - Copy **JWT Secret**

---

## Step 1: Configure GCP Project

```bash
# Set active project
gcloud config set project calex-live-v1

# Enable required services
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

---

## Step 2: Create Artifact Registry Repository

```bash
# Create Docker registry (safe to re-run)
gcloud artifacts repositories create nda-backend \
  --repository-format=docker \
  --location=us \
  --description="NDA backend Docker images"
```

---

## Step 3: Build & Push Docker Image

```bash
# From project root (where backend/ folder is)
cd C:\Users\ezaza\Desktop\calex.live

# Build and push (Cloud Build will handle everything)
gcloud builds submit \
  --tag us-docker.pkg.dev/calex-live-v1/nda-backend/nda:v1 \
  ./backend
```

**Expected output:**
```
Creating temporary tarball archive...
Uploading tarball...
...
DONE
```

---

## Step 4: Generate Secure Lawyer Key

```bash
# Generate a secure random key (run locally)
python -c "import secrets; print(secrets.token_hex(32))"
```

Save this key - you'll need it for deployment and your lawyer portal!

---

## Step 5: Deploy to Cloud Run

**⚠️ Replace these placeholders with your actual values:**

```bash
# Set your values here first
SUPABASE_URL="https://gjgdoxdishalglrdmucb.supabase.co"
SUPABASE_KEY="YOUR_SERVICE_ROLE_KEY_HERE"
SUPABASE_JWT_SECRET="YOUR_JWT_SECRET_HERE"
LAWYER_KEY="YOUR_GENERATED_LAWYER_KEY_HERE"

# Deploy to Cloud Run
gcloud run deploy nda-backend \
  --image us-docker.pkg.dev/calex-live-v1/nda-backend/nda:v1 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --max-instances 5 \
  --port 8080 \
  --set-env-vars "SUPABASE_URL=$SUPABASE_URL" \
  --set-env-vars "SUPABASE_KEY=$SUPABASE_KEY" \
  --set-env-vars "SUPABASE_JWT_SECRET=$SUPABASE_JWT_SECRET" \
  --set-env-vars "LAWYER_KEY=$LAWYER_KEY" \
  --set-env-vars "LOCAL_DOCX_PATH=/app/templates/nda_short_form.docx" \
  --set-env-vars "STORAGE_RENDERS=renders"
```

**Expected output:**
```
Service [nda-backend] revision [nda-backend-00001-xyz] has been deployed and is serving 100% of traffic.
Service URL: https://nda-backend-xxxxxxxxxx-uc.a.run.app
```

**✅ SAVE THIS URL!** You'll need it for the frontend.

---

## Step 6: Verify Deployment

```bash
# Set your Cloud Run URL
BACKEND_URL="https://nda-backend-xxxxxxxxxx-uc.a.run.app"

# Test health check
curl $BACKEND_URL/
# Expected: {"status":"ok","service":"nda-mvp"}

# Test templates endpoint
curl $BACKEND_URL/v1/templates
# Expected: JSON array with template(s)

# Test lawyer endpoint (should require key)
curl -i $BACKEND_URL/v1/lawyer/cases
# Expected: 401 Unauthorized

# Test with lawyer key
curl $BACKEND_URL/v1/lawyer/cases \
  -H "X-Lawyer-Key: YOUR_LAWYER_KEY_HERE"
# Expected: JSON array of cases
```

---

## Step 7: Update Frontend Environment

Once backend is deployed, update your frontend:

**For local development** (`frontend/.env.local`):
```bash
NEXT_PUBLIC_API_BASE=https://nda-backend-xxxxxxxxxx-uc.a.run.app
NEXT_PUBLIC_SUPABASE_URL=https://gjgdoxdishalglrdmucb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

**For Vercel deployment** (Environment Variables):
- Add the same three variables above
- Deploy or redeploy

---

## Step 8: Update CORS (Important!)

The backend needs to allow your frontend domain. Update `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Local development
        "https://your-app.vercel.app",     # Vercel production
        "https://calex.live",              # Custom domain (if any)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

After updating CORS:
```bash
# Build new version
gcloud builds submit \
  --tag us-docker.pkg.dev/calex-live-v1/nda-backend/nda:v2 \
  ./backend

# Deploy new version
gcloud run deploy nda-backend \
  --image us-docker.pkg.dev/calex-live-v1/nda-backend/nda:v2 \
  --region us-central1
```

---

## 📊 Monitoring & Logs

### View Logs
```bash
# Real-time logs
gcloud logs tail --region=us-central1 --service=nda-backend

# Filter errors only
gcloud logs read --region=us-central1 \
  --service=nda-backend \
  --filter="severity>=ERROR" \
  --limit=50
```

### View Metrics
```bash
# Open Cloud Run console
gcloud run services describe nda-backend \
  --region us-central1 \
  --format="value(status.url)"
```

Or visit: https://console.cloud.google.com/run?project=calex-live-v1

---

## 🔧 Common Issues & Solutions

### Issue: Build fails with "requirements.txt not found"

**Solution:** Make sure you're in the project root and running:
```bash
gcloud builds submit --tag [...] ./backend
```
(Note the `./backend` at the end)

### Issue: Service responds with 500 errors

**Solution:** Check logs and verify environment variables:
```bash
gcloud logs tail --service=nda-backend --region=us-central1
gcloud run services describe nda-backend --region=us-central1 --format=yaml
```

### Issue: CORS errors in browser

**Solution:** Add your frontend domain to CORS origins in `backend/app/main.py` and redeploy.

### Issue: Supabase connection fails

**Solution:** Verify environment variables are set correctly:
```bash
gcloud run services describe nda-backend \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

---

## 🔄 Update Deployment

To deploy a new version after code changes:

```bash
# Increment version tag
gcloud builds submit \
  --tag us-docker.pkg.dev/calex-live-v1/nda-backend/nda:v2 \
  ./backend

# Deploy new version (keeps same env vars)
gcloud run deploy nda-backend \
  --image us-docker.pkg.dev/calex-live-v1/nda-backend/nda:v2 \
  --region us-central1
```

**Or use a script:**

```bash
#!/bin/bash
VERSION=$(date +%Y%m%d-%H%M%S)
IMAGE="us-docker.pkg.dev/calex-live-v1/nda-backend/nda:$VERSION"

echo "Building $IMAGE..."
gcloud builds submit --tag $IMAGE ./backend

echo "Deploying $IMAGE..."
gcloud run deploy nda-backend \
  --image $IMAGE \
  --region us-central1
```

---

## 💰 Cost Estimation

**Cloud Run Pricing (us-central1):**
- Free tier: 2M requests/month
- After free tier: $0.00002400/request
- Memory: $0.00000250/GiB-second
- CPU: $0.00002400/vCPU-second

**Estimated cost for MVP:**
- ~100 requests/day = 3,000/month → **Free**
- With modest usage: **$5-10/month**

---

## 🚀 Production Checklist

Before going live:

- [ ] Update CORS to include production domains only
- [ ] Enable Cloud Armor for DDoS protection
- [ ] Set up custom domain (Cloud Run → Load Balancer → DNS)
- [ ] Configure secrets in Secret Manager (instead of env vars)
- [ ] Set up monitoring alerts
- [ ] Configure backup for Supabase
- [ ] Add rate limiting middleware
- [ ] Enable Cloud CDN
- [ ] Set up CI/CD with GitHub Actions

---

## 📞 Support

- **Cloud Run Docs:** https://cloud.google.com/run/docs
- **GCP Console:** https://console.cloud.google.com/run?project=calex-live-v1
- **Pricing:** https://cloud.google.com/run/pricing

---

**Next Step:** Deploy frontend to Vercel! 🎯

