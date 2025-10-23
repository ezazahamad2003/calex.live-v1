# NDA Generator Frontend

Next.js 15 frontend application for the NDA document generation system with lawyer review workflow.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Backend API running on `http://localhost:8000`

### Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   
   The `.env.local` file has been created with:
   ```
   NEXT_PUBLIC_API_BASE=http://localhost:8000
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
frontend/
├── app/                          # Next.js 15 App Router
│   ├── page.tsx                 # Landing page (/)
│   ├── layout.tsx               # Root layout
│   ├── globals.css              # Global styles
│   ├── fill/
│   │   └── nda/
│   │       └── page.tsx         # NDA form page (/fill/nda)
│   ├── submit/
│   │   └── success/
│   │       └── page.tsx         # Success + polling page
│   └── lawyer/
│       ├── page.tsx             # Lawyer login (/lawyer)
│       └── cases/
│           ├── page.tsx         # Cases list (/lawyer/cases)
│           └── [id]/
│               └── page.tsx     # Case detail with preview
├── components/
│   └── SmartForm.tsx            # Schema-driven form component
├── lib/
│   └── api.ts                   # API client & types
├── .env.local                   # Environment variables
└── package.json                 # Dependencies
```

## 🎯 Features

### Client Flow

1. **Landing Page (`/`)**
   - Choose between "Start NDA" or "Lawyer Portal"
   - Responsive design with gradient backgrounds

2. **NDA Form (`/fill/nda`)**
   - Schema-driven form that fetches questions from backend
   - Client information (name, email)
   - Dynamic form fields based on template
   - Validation and error handling

3. **Success Page (`/submit/success`)**
   - Confirmation of submission
   - Auto-polling every 5 seconds for approval
   - Download link appears when approved
   - Case ID tracking

### Lawyer Flow

1. **Login (`/lawyer`)**
   - Secure key-based authentication
   - Stores key in localStorage
   - Test key: `7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b`

2. **Cases List (`/lawyer/cases`)**
   - Table view of all cases
   - Status badges (submitted/approved)
   - Sortable by date
   - Quick access to case details

3. **Case Detail (`/lawyer/cases/[id]`)**
   - Split view: sidebar + preview
   - Client information
   - All NDA field values
   - HTML preview with highlighted values
   - Download DOCX option
   - One-click approval

## 🔌 API Integration

All API calls use the client in `lib/api.ts`:

```typescript
// Client endpoints
getTemplates()
getTemplateQuestions(templateId)
submitCase(submission)
getCaseStatus(caseId)

// Lawyer endpoints
getLawyerCases(lawyerKey)
getLawyerCaseDetail(caseId, lawyerKey)
approveCase(caseId, lawyerKey)
```

## 🎨 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI:** Custom components with Tailwind
- **State:** React hooks (useState, useEffect)
- **Routing:** Next.js App Router
- **API:** Fetch API with typed responses

## 🔐 Security

- Lawyer authentication via localStorage
- API key sent in `X-Lawyer-Key` header
- Signed URLs for document access
- Client-side validation

## 🧪 Testing

### Manual Testing

1. **Test Client Flow:**
   ```
   http://localhost:3000 → Create NDA → Fill form → Submit → Wait for approval
   ```

2. **Test Lawyer Flow:**
   ```
   http://localhost:3000 → Lawyer Portal → Enter key → Review cases → Approve
   ```

3. **Test Full Workflow:**
   - Submit an NDA as a client
   - Log in as lawyer and approve it
   - Client should see download link automatically

## 🚧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables

- `NEXT_PUBLIC_API_BASE` - Backend API URL (default: `http://localhost:8000`)

## 📝 Notes

- The `.env.local` file is gitignored and created locally
- Frontend runs independently on port 3000
- Backend must be running on port 8000 for full functionality
- Polling for case status happens every 5 seconds
- Download links expire after 1 hour (Supabase signed URLs)

## 🎯 Next Steps

- Add error boundaries
- Add loading states
- Implement toast notifications
- Add form persistence (localStorage)
- Add case search/filter functionality
- Add email notifications
- Deploy to Vercel

## 🐛 Troubleshooting

**Frontend won't connect to backend:**
- Ensure backend is running on `http://localhost:8000`
- Check `.env.local` has correct `NEXT_PUBLIC_API_BASE`
- Verify CORS is enabled in backend

**Lawyer key not working:**
- Check key in backend `.env` file
- Ensure key matches: `7f8e9a2b4c6d1e3f5a7b9c0d2e4f6a8b`

**Pages not loading:**
- Clear browser cache
- Restart dev server
- Check for TypeScript errors: `npm run lint`
