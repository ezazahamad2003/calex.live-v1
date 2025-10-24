# 💳 Enable Billing for Google Cloud Run

Your project `calex-live-v1` needs billing enabled to use Cloud Run.

---

## ⚡ Quick Fix (2 minutes)

### Step 1: Open Billing Console

Click this link to go directly to billing setup:
```
https://console.cloud.google.com/billing/linkedaccount?project=calex-live-v1
```

Or manually:
1. Go to: https://console.cloud.google.com
2. Select project: **calex-live-v1**
3. Open menu (☰) → **Billing**

### Step 2: Link Billing Account

**Option A: You have a billing account**
- Click "Link a billing account"
- Select your existing billing account
- Click "Set account"

**Option B: Create new billing account**
- Click "Create billing account"
- Enter payment method (credit card)
- Click "Start my free trial" or "Submit"

---

## 💰 Don't Worry About Cost

**Cloud Run Free Tier (MONTHLY):**
- ✅ 2 million requests FREE
- ✅ 360,000 GiB-seconds memory FREE
- ✅ 180,000 vCPU-seconds FREE
- ✅ 1 GiB network egress FREE

**Your NDA MVP usage:**
- Estimated: ~100 requests/day = 3,000/month
- **Expected cost: $0.00** (well within free tier)

Even with moderate usage:
- ~1,000 requests/day = **~$2-5/month**

---

## ✅ After Enabling Billing

Come back here and run:
```powershell
# Resume deployment
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

Then we'll continue with the deployment!

---

## 🆘 Need Help?

**Having trouble?**
1. Check if you have billing permissions on the account
2. Make sure you're signed in to the correct Google account
3. Contact GCP support if needed

**Alternative:** Use a different GCP project that already has billing enabled

---

## 📋 Quick Links

- **Billing Console**: https://console.cloud.google.com/billing?project=calex-live-v1
- **Cloud Run Pricing**: https://cloud.google.com/run/pricing
- **Free Tier Details**: https://cloud.google.com/free

---

**Once billing is enabled, run this to continue:**
```bash
./deploy-to-gcp.ps1
```

