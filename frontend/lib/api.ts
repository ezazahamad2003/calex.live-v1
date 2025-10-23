/**
 * API Client for NDA MVP Backend
 * Handles all communication with FastAPI backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';

// ============================================================================
// Types
// ============================================================================

export interface Template {
  id: string;
  name: string;
}

export interface Question {
  key: string;
  type: 'text' | 'date' | 'select';
  label: string;
  required: boolean;
  options?: string[];
}

export interface CaseSubmission {
  template_id: string;
  client_name: string;
  client_email: string;
  answers: Record<string, string>;
}

export interface CaseResponse {
  case_id: string;
  status: 'submitted' | 'approved';
}

export interface CaseStatus {
  status: 'submitted' | 'approved';
  approved_download_url: string | null;
}

export interface LawyerCase {
  id: string;
  client_name: string;
  client_email: string;
  status: 'submitted' | 'approved';
  created_at: string;
}

export interface CaseDetail {
  case: {
    id: string;
    template_id: string;
    client_name: string;
    client_email: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  answers: Array<{ key: string; value: string }>;
  preview_html_url?: string;
  docx_url?: string;
  preview_url?: string;  // For client endpoints
  download_url?: string; // For client endpoints
}

// ============================================================================
// Client API Functions
// ============================================================================

export async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${API_BASE}/v1/templates`);
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function getTemplateQuestions(templateId: string): Promise<Question[]> {
  const res = await fetch(`${API_BASE}/v1/templates/${templateId}/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function submitCase(
  submission: CaseSubmission,
  token?: string
): Promise<CaseResponse> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  
  // Add Authorization header if token provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(`${API_BASE}/v1/cases`, {
    method: 'POST',
    headers,
    body: JSON.stringify(submission),
  });
  if (!res.ok) throw new Error('Failed to submit case');
  return res.json();
}

export async function getCaseStatus(caseId: string): Promise<CaseStatus> {
  const res = await fetch(`${API_BASE}/v1/cases/${caseId}/status`);
  if (!res.ok) throw new Error('Failed to fetch case status');
  return res.json();
}

// ============================================================================
// Authenticated Client API Functions
// ============================================================================

export async function getMyCase(token: string): Promise<LawyerCase[]> {
  const res = await fetch(`${API_BASE}/v1/me/cases`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch your cases');
  return res.json();
}

export async function getMyCaseDetail(
  caseId: string,
  token: string
): Promise<CaseDetail> {
  const res = await fetch(`${API_BASE}/v1/me/cases/${caseId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch case detail');
  return res.json();
}

// ============================================================================
// Lawyer API Functions
// ============================================================================

export async function getLawyerCases(lawyerKey: string): Promise<LawyerCase[]> {
  const res = await fetch(`${API_BASE}/v1/lawyer/cases`, {
    headers: { 'X-Lawyer-Key': lawyerKey },
  });
  if (!res.ok) throw new Error('Failed to fetch lawyer cases');
  return res.json();
}

export async function getLawyerCaseDetail(
  caseId: string,
  lawyerKey: string
): Promise<CaseDetail> {
  const res = await fetch(`${API_BASE}/v1/lawyer/cases/${caseId}`, {
    headers: { 'X-Lawyer-Key': lawyerKey },
  });
  if (!res.ok) throw new Error('Failed to fetch case detail');
  return res.json();
}

export async function approveCase(
  caseId: string,
  lawyerKey: string
): Promise<{ ok: boolean; client_docx_url: string }> {
  const res = await fetch(`${API_BASE}/v1/lawyer/cases/${caseId}/approve`, {
    method: 'POST',
    headers: { 'X-Lawyer-Key': lawyerKey },
  });
  if (!res.ok) throw new Error('Failed to approve case');
  return res.json();
}

