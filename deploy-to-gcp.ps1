# ============================================
# Google Cloud Run Deployment Script
# ============================================
# Project: calex-live-v1
# Usage: ./deploy-to-gcp.ps1

Write-Host "🚀 NDA MVP - Google Cloud Run Deployment" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
if (!(Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: gcloud CLI not found" -ForegroundColor Red
    Write-Host "Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Set project
Write-Host "📋 Setting project..." -ForegroundColor Yellow
gcloud config set project calex-live-v1

# Enable services
Write-Host ""
Write-Host "🔧 Enabling required services..." -ForegroundColor Yellow
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com

# Create Artifact Registry (safe to re-run)
Write-Host ""
Write-Host "📦 Creating Artifact Registry..." -ForegroundColor Yellow
gcloud artifacts repositories create nda-backend `
  --repository-format=docker `
  --location=us `
  --description="NDA backend Docker images" 2>$null

# Get environment variables
Write-Host ""
Write-Host "🔑 Please enter your credentials:" -ForegroundColor Cyan
Write-Host ""

$SUPABASE_URL = Read-Host "Supabase URL (https://xxx.supabase.co)"
$SUPABASE_KEY = Read-Host "Supabase SERVICE ROLE Key" -AsSecureString
$SUPABASE_KEY_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SUPABASE_KEY)
)

$SUPABASE_JWT_SECRET = Read-Host "Supabase JWT Secret" -AsSecureString
$JWT_SECRET_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SUPABASE_JWT_SECRET)
)

$LAWYER_KEY = Read-Host "Lawyer Key (or press Enter to generate)" -AsSecureString
$LAWYER_KEY_PLAIN = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($LAWYER_KEY)
)

# Generate lawyer key if not provided
if ([string]::IsNullOrWhiteSpace($LAWYER_KEY_PLAIN)) {
    Write-Host "🔐 Generating secure lawyer key..." -ForegroundColor Yellow
    $LAWYER_KEY_PLAIN = -join ((48..57) + (97..102) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Host "Generated Lawyer Key: $LAWYER_KEY_PLAIN" -ForegroundColor Green
    Write-Host "⚠️  SAVE THIS KEY - you'll need it for the lawyer portal!" -ForegroundColor Red
}

# Generate version tag
$VERSION = Get-Date -Format "yyyyMMdd-HHmmss"
$IMAGE = "us-docker.pkg.dev/calex-live-v1/nda-backend/nda:$VERSION"

# Build & push
Write-Host ""
Write-Host "🏗️  Building Docker image: $IMAGE" -ForegroundColor Yellow
gcloud builds submit --tag $IMAGE ./backend

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host ""
Write-Host "🚢 Deploying to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy nda-backend `
  --image $IMAGE `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --memory 1Gi `
  --max-instances 5 `
  --port 8080 `
  --set-env-vars "SUPABASE_URL=$SUPABASE_URL" `
  --set-env-vars "SUPABASE_KEY=$SUPABASE_KEY_PLAIN" `
  --set-env-vars "SUPABASE_JWT_SECRET=$JWT_SECRET_PLAIN" `
  --set-env-vars "LAWYER_KEY=$LAWYER_KEY_PLAIN" `
  --set-env-vars "LOCAL_DOCX_PATH=/app/templates/nda_short_form.docx" `
  --set-env-vars "STORAGE_RENDERS=renders"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

# Get service URL
$SERVICE_URL = gcloud run services describe nda-backend `
  --region us-central1 `
  --format="value(status.url)"

Write-Host ""
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "🧪 Testing endpoints:" -ForegroundColor Yellow
Write-Host ""

# Test health check
Write-Host "Testing health check..." -ForegroundColor Gray
$response = Invoke-RestMethod -Uri "$SERVICE_URL/" -Method Get
Write-Host "✅ Health: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green

# Test templates
Write-Host "Testing templates endpoint..." -ForegroundColor Gray
try {
    $templates = Invoke-RestMethod -Uri "$SERVICE_URL/v1/templates" -Method Get
    Write-Host "✅ Templates: Found $($templates.Count) template(s)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Templates: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update frontend/.env.local:" -ForegroundColor White
Write-Host "   NEXT_PUBLIC_API_BASE=$SERVICE_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Update backend CORS to include your frontend domain" -ForegroundColor White
Write-Host ""
Write-Host "3. Save your lawyer key: $LAWYER_KEY_PLAIN" -ForegroundColor White
Write-Host ""
Write-Host "🔍 View logs: gcloud logs tail --service=nda-backend --region=us-central1" -ForegroundColor Gray
Write-Host ""

