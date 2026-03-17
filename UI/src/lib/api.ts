const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const STUDENT_TOKEN_KEY = 'eduagent_student_token';

function getStudentToken(): string {
  return localStorage.getItem(STUDENT_TOKEN_KEY) || '';
}

function setStudentToken(token: string): void {
  localStorage.setItem(STUDENT_TOKEN_KEY, token);
}

export function clearStudentToken(): void {
  localStorage.removeItem(STUDENT_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}, withStudentAuth = false): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }
  if (withStudentAuth) {
    const token = getStudentToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

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

export interface StudentLoginResponse {
  ok: boolean;
  token: string;
  token_type: string;
  expires_at: string;
  student_id: string;
  name: string;
}

export interface StudentProfile {
  student_id: string;
  enrollment_no?: string;
  full_name: string;
  program: string;
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

export interface StudentDocument {
  _id: string;
  filename: string;
  original_name: string;
  title?: string;
  category?: string;
  pages: number;
  chunks: number;
  uploaded_at: string;
  download_count?: number;
}

export interface StudentReminder {
  _id: string;
  ledger_id: string;
  student_id: string;
  fee_type: string;
  message: string;
  is_read: boolean;
  sent_by: string;
  sent_at: string;
}

export async function studentLogin(studentId: string, password: string) {
  const res = await request<StudentLoginResponse>('/api/student/login', {
    method: 'POST',
    body: JSON.stringify({ identifier: studentId, password }),
  });
  if (res.token) setStudentToken(res.token);
  return res;
}

export function getStudentMe() {
  return request<StudentProfile>('/api/student/me', {}, true);
}

export function getStudentFees() {
  return request<{ items: StudentFeeLedger[] }>('/api/student/fees', {}, true);
}

export function requestStudentFeeReminder(ledgerId: string) {
  return request<{ ok: boolean }>(`/api/student/fees/${ledgerId}/reminder`, { method: 'POST' }, true);
}

export function getStudentReminders() {
  return request<{ items: StudentReminder[]; unread_count: number }>('/api/student/reminders', {}, true);
}

export function markStudentRemindersRead() {
  return request<{ ok: boolean }>('/api/student/reminders/read', { method: 'POST' }, true);
}

export function getStudentDocuments() {
  return request<{ items: StudentDocument[] }>('/api/student/documents', {}, true);
}

export function buildStudentDocumentDownloadUrl(pdfId: string): string {
  const token = getStudentToken();
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  return `${API_BASE}/api/student/documents/${pdfId}/download${query}`;
}

export function sendChat(message: string) {
  return request<{
    answer: string;
    escalated: boolean;
    meta: {
      faq_ids?: string[];
      downloads?: Array<{ id: string; name: string; url: string }>;
      [key: string]: unknown;
    };
  }>('/api/chat', {
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

// Backward-compatible admin exports used by non-routed legacy pages in this project.
export interface Stats {
  total_faqs: number;
  total_escalated: number;
  pending_escalated: number;
  uploaded_pdfs: number;
  exam_entries: number;
  fee_entries: number;
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

export interface PDFDoc {
  _id: string;
  filename: string;
  original_name: string;
  pages: number;
  chunks: number;
  uploaded_at: string;
  download_count?: number;
}

async function adminRequest<T>(path: string, options: RequestInit = {}, adminPassword = ''): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json');
  }
  if (adminPassword) headers.set('X-Admin-Password', adminPassword);

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function adminLogin(adminPassword: string) {
  return adminRequest<{ ok: boolean }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password: adminPassword }) }, adminPassword);
}

export function getStats(adminPassword = '') {
  return adminRequest<Stats>('/api/admin/stats', {}, adminPassword);
}

export function getEscalations(adminPassword = '', status = 'all') {
  return adminRequest<{ items: Escalation[] }>(`/api/admin/escalations?status=${encodeURIComponent(status)}`, {}, adminPassword);
}

export function updateEscalation(adminPassword: string, id: string, status: string, admin_notes: string) {
  return adminRequest<{ ok: boolean }>(
    `/api/admin/escalations/${id}`,
    { method: 'PUT', body: JSON.stringify({ status, admin_notes }) },
    adminPassword,
  );
}

export function getFaqs(adminPassword = '') {
  return adminRequest<{ items: FAQ[] }>('/api/admin/faqs', {}, adminPassword);
}

export function addFaq(adminPassword: string, payload: { category: string; question: string; answer: string; keywords: string }) {
  return adminRequest<{ ok: boolean }>('/api/admin/faqs', { method: 'POST', body: JSON.stringify(payload) }, adminPassword);
}

export function updateFaq(adminPassword: string, id: string, payload: { answer: string; keywords: string }) {
  return adminRequest<{ ok: boolean }>(`/api/admin/faqs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }, adminPassword);
}

export function deleteFaq(adminPassword: string, id: string) {
  return adminRequest<{ ok: boolean }>(`/api/admin/faqs/${id}`, { method: 'DELETE' }, adminPassword);
}

export function getExams(adminPassword = '') {
  return adminRequest<{ items: Exam[] }>('/api/admin/exams', {}, adminPassword);
}

export function addExam(adminPassword: string, payload: { subject: string; exam_date: string; exam_time: string; venue: string; semester: number }) {
  return adminRequest<{ ok: boolean }>('/api/admin/exams', { method: 'POST', body: JSON.stringify(payload) }, adminPassword);
}

export function deleteExam(adminPassword: string, id: string) {
  return adminRequest<{ ok: boolean }>(`/api/admin/exams/${id}`, { method: 'DELETE' }, adminPassword);
}

export function getFees(adminPassword = '') {
  return adminRequest<{ items: Fee[] }>('/api/admin/fees', {}, adminPassword);
}

export function addFee(adminPassword: string, payload: { fee_type: string; amount: number; due_date: string; description: string }) {
  return adminRequest<{ ok: boolean }>('/api/admin/fees', { method: 'POST', body: JSON.stringify(payload) }, adminPassword);
}

export function deleteFee(adminPassword: string, id: string) {
  return adminRequest<{ ok: boolean }>(`/api/admin/fees/${id}`, { method: 'DELETE' }, adminPassword);
}

export function getPdfs(adminPassword = '') {
  return adminRequest<{ items: PDFDoc[] }>('/api/admin/pdfs', {}, adminPassword);
}

export async function uploadPdf(adminPassword: string, file: File) {
  const form = new FormData();
  form.append('file', file);
  return adminRequest('/api/admin/pdfs', { method: 'POST', body: form }, adminPassword);
}

export function deletePdf(adminPassword: string, id: string, filename: string) {
  return adminRequest<{ ok: boolean }>(
    `/api/admin/pdfs/${id}?filename=${encodeURIComponent(filename)}`,
    { method: 'DELETE' },
    adminPassword,
  );
}
