# Backend Document Generation Flow Analysis

## 🚨 CRITICAL MISMATCH DISCOVERED

### Token Format Mismatch
- **Backend expects:** `[[DATE]]`, `[[PARTY1_NAME]]`, `[[PURPOSE]]` etc.
- **DOCX template uses:** `[DATE]`, `[NAME OF PARTY 1]`, `[DESCRIPTION OF PURPOSE]` etc.

**Result:** Replacements DON'T work! All placeholders remain unchanged in generated documents.

---

## Step-by-Step Flow Trace

### 1. POST /v1/cases Request

**Payload Structure:**
```python
{
  "template_id": "761c6656-a865-4f0c-927d-0d375df37d62",
  "client_name": "Alice Founder",
  "client_email": "alice@example.com",
  "answers": {
    "DATE": "2025-10-21",
    "PARTY1_NAME": "Alpha Inc.",
    "PARTY1_JURIS": "Ontario",
    "PARTY1_TYPE": "corporation",
    "PARTY1_ADDRESS": "123 Queen St, Toronto, ON",
    "PARTY2_NAME": "Beta LP",
    "PARTY2_JURIS": "British Columbia",
    "PARTY2_TYPE": "limited partnership",
    "PARTY2_ADDRESS": "456 King St, Vancouver, BC",
    "PURPOSE": "Evaluate a potential JV"
  }
}
```

---

### 2. Answers → Replacements Dict (Line 97 in main.py)

```python
replacements = {k.upper(): str(v) for k, v in payload["answers"].items()}
```

**Result:**
```python
{
  "DATE": "2025-10-21",
  "PARTY1_NAME": "Alpha Inc.",
  "PARTY1_JURIS": "Ontario",
  # ... all keys already uppercase
}
```

**Location:** This happens locally in backend, not from Supabase.

---

### 3. Document Generation (Lines 100-107)

#### DOCX Generation:
```python
fill_docx(LOCAL_DOCX_PATH, out_docx, replacements)
```

**Process:**
1. `LOCAL_DOCX_PATH = "./templates/nda_short_form.docx"` (local file, NOT from Supabase)
2. Opens local DOCX template
3. Searches for pattern: `r"\[\[([A-Z0-9_]+)\]\]"` (double brackets)
4. Tries to replace with values from `replacements` dict

**PROBLEM:** 
- Template has: `[DATE]`, `[NAME OF PARTY 1]`, `[PARTY 1 JURISDICTION OF INCORPORATION/FORMATION]`
- Code looks for: `[[DATE]]`, `[[PARTY1_NAME]]`, `[[PARTY1_JURIS]]`
- **NO MATCHES FOUND** → Original placeholders left unchanged

#### HTML Generation:
```python
with open(out_html, "w", encoding="utf-8") as f:
    f.write(render_html(tpl["html_template"], replacements))
```

**Process:**
1. Gets `html_template` from Supabase template row
2. Same regex pattern: `r"\[\[([A-Z0-9_]+)\]\]"`
3. Wraps replacements in `<mark>` tags
4. Saves to local file

**PROBLEM:** Same - if HTML template has single brackets, no replacements happen.

---

### 4. Storage Upload (Lines 110-125)

```python
# Upload DOCX
with open(out_docx, "rb") as f:
    supa().storage.from_(STORAGE_RENDERS).upload(
        f"cases/{cid}/nda.docx",
        f,
        {"upsert": "true"}
    )

# Upload HTML
with open(out_html, "rb") as f:
    supa().storage.from_(STORAGE_RENDERS).upload(
        f"cases/{cid}/nda.html",
        f,
        {"upsert": "true"}
    )
```

**Process:**
1. Reads locally generated files
2. Uploads to Supabase Storage bucket `renders`
3. Path: `cases/{case_id}/nda.docx` and `cases/{case_id}/nda.html`

**Result:** Uploads files with UNFILLED placeholders to Supabase.

---

### 5. Document Path Storage (Lines 128-132)

```python
supa().table("case_documents").insert({
    "case_id": cid,
    "filled_docx_path": f"cases/{cid}/nda.docx",
    "filled_html_path": f"cases/{cid}/nda.html"
}).execute()
```

Stores paths to (incorrectly unfilled) documents in database.

---

## Token Pattern Analysis

### Backend Regex (generate.py line 9):
```python
TOKEN = re.compile(r"\[\[([A-Z0-9_]+)\]\]")
```
**Matches:** `[[DATE]]`, `[[PARTY1_NAME]]`, `[[PURPOSE]]`

### Actual DOCX Template Placeholders:
```
[DATE]
[NAME OF PARTY 1]
[PARTY 1 JURISDICTION OF INCORPORATION/FORMATION]
[corporation/limited partnership]
[PARTY 1 BUSINESS ADDRESS]
[NAME OF PARTY 2]
[PARTY 2 JURISDICTION OF INCORPORATION/FORMATION]
[PARTY 2 BUSINESS ADDRESS]
[DESCRIPTION OF PURPOSE]
```

### Schema Keys (from frontend):
```
DATE
PARTY1_NAME
PARTY1_JURIS
PARTY1_TYPE
PARTY1_ADDRESS
PARTY2_NAME
PARTY2_JURIS
PARTY2_TYPE
PARTY2_ADDRESS
PURPOSE
```

---

## Three-Way Mismatch

| Frontend Key | Backend Regex Expects | DOCX Template Has | Match? |
|--------------|----------------------|-------------------|--------|
| `DATE` | `[[DATE]]` | `[DATE]` | ❌ |
| `PARTY1_NAME` | `[[PARTY1_NAME]]` | `[NAME OF PARTY 1]` | ❌❌ (bracket + name) |
| `PARTY1_JURIS` | `[[PARTY1_JURIS]]` | `[PARTY 1 JURISDICTION OF...]` | ❌❌ |
| `PARTY1_TYPE` | `[[PARTY1_TYPE]]` | `[corporation/limited partnership]` | ❌❌ |
| `PARTY1_ADDRESS` | `[[PARTY1_ADDRESS]]` | `[PARTY 1 BUSINESS ADDRESS]` | ❌❌ |
| `PURPOSE` | `[[PURPOSE]]` | `[DESCRIPTION OF PURPOSE]` | ❌❌ |

**ZERO MATCHES!**

---

## Silent Failure

### What happens when no matches found?

From `generate.py` line 27:
```python
new = TOKEN.sub(lambda m: str(replacements.get(m.group(1), m.group(0))), text)
```

If regex doesn't match:
- `.sub()` returns original text unchanged
- No error raised
- No warning logged
- File saved with original placeholders
- **Silently fails**

---

## Fixes Required

### Option 1: Change Regex (Simple)
```python
# generate.py line 9
TOKEN = re.compile(r"\[([A-Z0-9_ ]+)\]")  # Single bracket, allow spaces
```

### Option 2: Update DOCX Template (Better)
Replace all placeholders in `nda_short_form.docx`:
- `[DATE]` → `[[DATE]]`
- `[NAME OF PARTY 1]` → `[[PARTY1_NAME]]`
- `[PARTY 1 JURISDICTION OF INCORPORATION/FORMATION]` → `[[PARTY1_JURIS]]`
- etc.

### Option 3: Update Schema Keys (Most Work)
Change frontend to send:
- `"NAME OF PARTY 1": "Alpha Inc."`
- `"PARTY 1 JURISDICTION OF INCORPORATION/FORMATION": "Ontario"`

**Recommendation:** Option 2 - Update the DOCX template to match the backend regex and schema keys.

---

## Summary

✅ **What Works:**
- Backend receives payload correctly
- Creates case in database
- Generates files locally
- Uploads to Supabase Storage
- Frontend fetches and displays documents

❌ **What Doesn't Work:**
- Token replacement (0 matches due to bracket mismatch)
- DOCX shows unfilled placeholders
- HTML shows unfilled placeholders
- No error or warning raised

🔧 **Root Cause:**
Three-way mismatch between:
1. Backend regex expecting `[[UPPERCASE_UNDERSCORES]]`
2. DOCX template using `[Title Case With Spaces]`
3. Schema keys using `UPPERCASE_UNDERSCORES`

