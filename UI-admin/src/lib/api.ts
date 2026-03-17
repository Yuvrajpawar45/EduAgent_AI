const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const ADMIN_TOKEN_KEY = 'eduagent_admin_token';

function getAdminToken(): string {
  return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
}

function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, adminPassword?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }

  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (adminPassword) headers.set('X-Admin-Password', adminPassword);

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface Stats {
  total_faqs: number;
  total_escalated: number;
  pending_escalated: number;
  uploaded_pdfs: number;
  exam_entries: number;
  fee_entries: number;
  students?: number;
  ledger_entries?: number;
}

export interface Escalation {
  _id: string;
  student_query: string;
  reason: string;
  status: string;
  timestamp: string;
  admin_notes?: string;
}

export interface FAQ {
  _id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string;
  views?: number;
  helpful_yes?: number;
  helpful_total?: number;
}

export interface Exam {
  _id: string;
  subject: string;
  exam_date: string;
  exam_time: string;
  venue: string;
  semester: number;
}

export interface Fee {
  _id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  description: string;
}

export interface Student {
  _id: string;
  student_id: string;
  enrollment_no?: string;
  full_name: string;
  program?: string;
}

export interface StudentFeeLedger {
  _id: string;
  student_id: string;
  fee_type: string;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  due_date: string;
  status: string;
  reminder_count?: number;
  last_reminder_at?: string;
}

export interface PDFDoc {
  _id: string;
  filename: string;
  original_name: string;
  pages: number;
  chunks: number;
  uploaded_at: string;
  download_count?: number;
}

export interface DownloadEvent {
  _id: string;
  pdf_id: string;
  student_id: string;
  filename: string;
  source: string;
  downloaded_at: string;
}

export interface AdminLoginResponse {
  ok: boolean;
  token: string;
  token_type: string;
  expires_at: string;
}

export async function adminLogin(adminPassword: string) {
  const res = await request<AdminLoginResponse>(
    '/api/admin/login',
    { method: 'POST', body: JSON.stringify({ password: adminPassword }) },
  );
  if (res.token) setAdminToken(res.token);
  return res;
}

export function getStats() {
  return request<Stats>('/api/admin/stats');
}

export function getEscalations(status = 'all') {
  return request<{ items: Escalation[] }>(`/api/admin/escalations?status=${encodeURIComponent(status)}`);
}

export function updateEscalation(id: string, status: string, admin_notes: string) {
  return request<{ ok: boolean }>(`/api/admin/escalations/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ status, admin_notes }),
  });
}

export function getFaqs() {
  return request<{ items: FAQ[] }>('/api/admin/faqs');
}

export function addFaq(payload: { category: string; question: string; answer: string; keywords: string }) {
  return request<{ ok: boolean }>('/api/admin/faqs', { method: 'POST', body: JSON.stringify(payload) });
}

export function updateFaq(id: string, payload: { answer: string; keywords: string }) {
  return request<{ ok: boolean }>(`/api/admin/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export function deleteFaq(id: string) {
  return request<{ ok: boolean }>(`/api/admin/faqs/${id}`, { method: 'DELETE' });
}

export function getExams() {
  return request<{ items: Exam[] }>('/api/admin/exams');
}

export function addExam(payload: { subject: string; exam_date: string; exam_time: string; venue: string; semester: number }) {
  return request<{ ok: boolean }>('/api/admin/exams', { method: 'POST', body: JSON.stringify(payload) });
}

export function deleteExam(id: string) {
  return request<{ ok: boolean }>(`/api/admin/exams/${id}`, { method: 'DELETE' });
}

export function getFees() {
  return request<{ items: Fee[] }>('/api/admin/fees');
}

export function addFee(payload: { fee_type: string; amount: number; due_date: string; description: string }) {
  return request<{ ok: boolean }>('/api/admin/fees', { method: 'POST', body: JSON.stringify(payload) });
}

export function deleteFee(id: string) {
  return request<{ ok: boolean }>(`/api/admin/fees/${id}`, { method: 'DELETE' });
}

export function getStudents() {
  return request<{ items: Student[] }>('/api/admin/students');
}

export function getFeeLedger(studentId = '') {
  const query = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
  return request<{ items: StudentFeeLedger[] }>(`/api/admin/fees/ledger${query}`);
}

export function upsertFeeLedger(payload: {
  student_id: string;
  fee_type: string;
  total_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
}) {
  return request<{ ok: boolean }>('/api/admin/fees/ledger', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendFeeReminder(ledgerId: string) {
  return request<{ ok: boolean }>(`/api/admin/fees/ledger/${ledgerId}/reminder`, { method: 'POST' });
}

export function getPdfs() {
  return request<{ items: PDFDoc[] }>('/api/admin/pdfs');
}

export function getDownloadEvents() {
  return request<{ items: DownloadEvent[] }>('/api/admin/downloads');
}

export async function uploadPdf(file: File) {
  const form = new FormData();
  form.append('file', file);

  const token = getAdminToken();
  const response = await fetch(`${API_BASE}/api/admin/pdfs`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export function deletePdf(id: string, filename: string) {
  return request<{ ok: boolean }>(`/api/admin/pdfs/${id}?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
}

export function sendChat(message: string) {
  return request<{ answer: string; escalated: boolean; meta: Record<string, unknown> }>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

export function recordFaqFeedback(faqId: string, isHelpful: boolean) {
  return request<{ ok: boolean }>(`/api/faqs/${faqId}/feedback`, {
    method: 'POST',
    body: JSON.stringify({ is_helpful: isHelpful }),
  });
}
