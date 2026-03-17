import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Plus,
  Upload,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import TabBar from '../components/TabBar';
import Card from '../components/Card';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import FormField, { Button, Input, Select, TextArea } from '../components/FormField';
import {
  addExam,
  addFaq,
  addFee,
  adminLogin,
  deleteExam,
  deleteFaq,
  deleteFee,
  deletePdf,
  getEscalations,
  getExams,
  getFaqs,
  getFees,
  getPdfs,
  getStats,
  updateEscalation,
  updateFaq,
  uploadPdf,
} from '../lib/api';
import type { Exam, Escalation, FAQ, Fee, PDFDoc, Stats } from '../lib/api';

const tabs = [
  { id: 'escalations', label: 'Escalations', icon: AlertTriangle },
  { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  { id: 'pdfs', label: 'PDFs', icon: FileText },
  { id: 'exams', label: 'Exams', icon: GraduationCap },
  { id: 'fees', label: 'Fees', icon: DollarSign },
];

const escalationColumns = [
  { key: 'timestamp', label: 'Time', type: 'date' as const },
  { key: 'query', label: 'Query', type: 'text' as const },
  { key: 'reason', label: 'Reason', type: 'text' as const },
  { key: 'status', label: 'Status', type: 'status' as const },
  { key: 'actions', label: '', type: 'action' as const, align: 'right' as const },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('escalations');
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [stats, setStats] = useState<Stats | null>(null);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [pdfs, setPdfs] = useState<PDFDoc[]>([]);

  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [escStatus, setEscStatus] = useState('pending');
  const [escNotes, setEscNotes] = useState('');

  const [newFaq, setNewFaq] = useState({ category: 'General', question: '', answer: '', keywords: '' });
  const [newExam, setNewExam] = useState({ subject: '', exam_date: '', exam_time: '', venue: '', semester: 1 });
  const [newFee, setNewFee] = useState({ fee_type: '', amount: 0, due_date: '', description: '' });
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const escalationRows = useMemo(
    () =>
      escalations.map((q) => ({
        ...q,
        timestamp: q.timestamp?.slice(0, 16) || '',
        query: q.student_query,
        reason: q.reason,
        status: q.status,
      })),
    [escalations]
  );

  const loadAll = async (password: string) => {
    setLoading(true);
    setError('');
    try {
      const [s, e, f, ex, fe, p] = await Promise.all([
        getStats(password),
        getEscalations(password, statusFilter),
        getFaqs(password),
        getExams(password),
        getFees(password),
        getPdfs(password),
      ]);
      setStats(s);
      setEscalations(e.items);
      setFaqs(f.items);
      setExams(ex.items);
      setFees(fe.items);
      setPdfs(p.items);
      if (selectedEscalation) {
        const fresh = e.items.find((item) => item._id === selectedEscalation._id) || null;
        setSelectedEscalation(fresh);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      void loadAll(adminPassword);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, authenticated]);

  const onLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await adminLogin(adminPassword);
      setAuthenticated(true);
      await loadAll(adminPassword);
    } catch (err) {
      setError('Invalid admin password.');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const saveEscalation = async () => {
    if (!selectedEscalation) return;
    try {
      await updateEscalation(adminPassword, selectedEscalation._id, escStatus, escNotes);
      await loadAll(adminPassword);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update escalation.');
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream-50 p-6 lg:p-10 flex items-center justify-center">
        <Card title="Admin Login" subtitle="Only admins can view and edit records" className="w-full max-w-md">
          <div className="space-y-4">
            <FormField label="Admin Password" required>
              <Input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />
            </FormField>
            <Button variant="primary" className="w-full" onClick={onLogin} disabled={loading || !adminPassword}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Login'}
            </Button>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-xs text-slate-400 -mt-0.5">EduAgent AI Operations</p>
            </div>
            <Button variant="ghost" onClick={() => setAuthenticated(false)}>Logout</Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-8 space-y-8">
        <section>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Active FAQs" value={stats?.total_faqs ?? 0} icon={HelpCircle} color="burgundy" />
            <MetricCard label="Open Escalations" value={stats?.pending_escalated ?? 0} icon={AlertTriangle} color="gold" />
            <MetricCard label="Fee Entries" value={stats?.fee_entries ?? 0} icon={CreditCard} color="info" />
            <MetricCard label="Exam Entries" value={stats?.exam_entries ?? 0} icon={Calendar} color="success" />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
            <Button variant="secondary" onClick={() => loadAll(adminPassword)} disabled={loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Refresh'}
            </Button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          {activeTab === 'escalations' && (
            <div className="space-y-4">
              <Card title="Escalated Queries" subtitle="Review and resolve sensitive student queries">
                <div className="space-y-4">
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </Select>
                  <DataTable
                    columns={escalationColumns}
                    data={escalationRows}
                    onAction={(row, action) => {
                      const selected = escalations.find((item) => item._id === row._id);
                      if (!selected) return;
                      setSelectedEscalation(selected);
                      if (action === 'resolve') {
                        setEscStatus('resolved');
                        setEscNotes(selected.admin_notes || '');
                      } else {
                        setEscStatus(selected.status || 'pending');
                        setEscNotes(selected.admin_notes || '');
                      }
                    }}
                  />
                </div>
              </Card>

              {selectedEscalation && (
                <Card title="Update Escalation" subtitle={selectedEscalation.student_query.slice(0, 120)}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <FormField label="Status">
                      <Select value={escStatus} onChange={(e) => setEscStatus(e.target.value)}>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                      </Select>
                    </FormField>
                    <FormField label="Reason">
                      <Input value={selectedEscalation.reason} disabled />
                    </FormField>
                    <div className="md:col-span-2">
                      <FormField label="Admin Notes">
                        <TextArea value={escNotes} onChange={(e) => setEscNotes(e.target.value)} />
                      </FormField>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button variant="primary" onClick={saveEscalation}>Save</Button>
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'faqs' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card title="FAQ Management" subtitle={`${faqs.length} records`} noPadding>
                  <div className="divide-y divide-slate-100">
                    {faqs.map((faq) => (
                      <div key={faq._id} className="px-6 py-4 space-y-2">
                        <p className="text-sm font-semibold text-slate-800">[{faq.category}] {faq.question}</p>
                        <TextArea
                          value={faq.answer}
                          onChange={(e) => setFaqs((prev) => prev.map((item) => (item._id === faq._id ? { ...item, answer: e.target.value } : item)))}
                        />
                        <Input
                          value={faq.keywords || ''}
                          onChange={(e) => setFaqs((prev) => prev.map((item) => (item._id === faq._id ? { ...item, keywords: e.target.value } : item)))}
                        />
                        <div className="flex gap-2">
                          <Button variant="primary" onClick={async () => { await updateFaq(adminPassword, faq._id, { answer: faq.answer, keywords: faq.keywords || '' }); await loadAll(adminPassword); }}>
                            Save
                          </Button>
                          <Button variant="danger" onClick={async () => { await deleteFaq(adminPassword, faq._id); await loadAll(adminPassword); }}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <div>
                <Card title="Add FAQ">
                  <div className="space-y-3">
                    <FormField label="Question" required>
                      <Input value={newFaq.question} onChange={(e) => setNewFaq((v) => ({ ...v, question: e.target.value }))} />
                    </FormField>
                    <FormField label="Answer" required>
                      <TextArea value={newFaq.answer} onChange={(e) => setNewFaq((v) => ({ ...v, answer: e.target.value }))} />
                    </FormField>
                    <FormField label="Category">
                      <Select value={newFaq.category} onChange={(e) => setNewFaq((v) => ({ ...v, category: e.target.value }))}>
                        <option>Exam</option><option>Fees</option><option>Attendance</option><option>Scholarship</option><option>Admission</option><option>Library</option><option>General</option>
                      </Select>
                    </FormField>
                    <FormField label="Keywords">
                      <Input value={newFaq.keywords} onChange={(e) => setNewFaq((v) => ({ ...v, keywords: e.target.value }))} />
                    </FormField>
                    <Button variant="primary" className="w-full" onClick={async () => {
                      if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
                      await addFaq(adminPassword, newFaq);
                      setNewFaq({ category: 'General', question: '', answer: '', keywords: '' });
                      await loadAll(adminPassword);
                    }}>
                      <Plus size={14} /> Add FAQ
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'pdfs' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card title="Document Library" subtitle={`${pdfs.length} uploaded`} noPadding>
                  <div className="divide-y divide-slate-100">
                    {pdfs.map((pdf) => (
                      <div key={pdf._id} className="px-6 py-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{pdf.original_name || pdf.filename}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{pdf.uploaded_at?.slice(0, 16)} | Pages: {pdf.pages} | Chunks: {pdf.chunks}</p>
                        </div>
                        <Button variant="danger" onClick={async () => { await deletePdf(adminPassword, pdf._id, pdf.filename); await loadAll(adminPassword); }}>Delete</Button>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
              <div>
                <Card title="Upload PDF">
                  <div className="space-y-3">
                    <input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                    <Button variant="primary" className="w-full" disabled={!pdfFile} onClick={async () => {
                      if (!pdfFile) return;
                      await uploadPdf(adminPassword, pdfFile);
                      setPdfFile(null);
                      await loadAll(adminPassword);
                    }}>
                      <Upload size={14} /> Upload
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'exams' && (
            <div className="space-y-6">
              <Card title="Exam Entries" subtitle={`${exams.length} records`} noPadding>
                <div className="divide-y divide-slate-100">
                  {exams.map((exam) => (
                    <div key={exam._id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{exam.subject}</p>
                        <p className="text-xs text-slate-500">{exam.exam_date} {exam.exam_time} | {exam.venue} | Semester {exam.semester}</p>
                      </div>
                      <Button variant="danger" onClick={async () => { await deleteExam(adminPassword, exam._id); await loadAll(adminPassword); }}>Delete</Button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Add Exam">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <FormField label="Subject" required><Input value={newExam.subject} onChange={(e) => setNewExam((v) => ({ ...v, subject: e.target.value }))} /></FormField>
                  <FormField label="Date" required><Input type="date" value={newExam.exam_date} onChange={(e) => setNewExam((v) => ({ ...v, exam_date: e.target.value }))} /></FormField>
                  <FormField label="Time" required><Input type="time" value={newExam.exam_time} onChange={(e) => setNewExam((v) => ({ ...v, exam_time: e.target.value }))} /></FormField>
                  <FormField label="Venue"><Input value={newExam.venue} onChange={(e) => setNewExam((v) => ({ ...v, venue: e.target.value }))} /></FormField>
                  <FormField label="Semester"><Input type="number" min={1} max={8} value={newExam.semester} onChange={(e) => setNewExam((v) => ({ ...v, semester: Number(e.target.value || 1) }))} /></FormField>
                  <div className="flex items-end">
                    <Button variant="primary" className="w-full" onClick={async () => { await addExam(adminPassword, newExam); setNewExam({ subject: '', exam_date: '', exam_time: '', venue: '', semester: 1 }); await loadAll(adminPassword); }}>
                      <Plus size={14} /> Add Exam
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="space-y-6">
              <Card title="Fee Entries" subtitle={`${fees.length} records`} noPadding>
                <div className="divide-y divide-slate-100">
                  {fees.map((fee) => (
                    <div key={fee._id} className="px-6 py-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{fee.fee_type} - INR {fee.amount.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">Due: {fee.due_date} | {fee.description}</p>
                        <StatusBadge status="active" />
                      </div>
                      <Button variant="danger" onClick={async () => { await deleteFee(adminPassword, fee._id); await loadAll(adminPassword); }}>Delete</Button>
                    </div>
                  ))}
                </div>
              </Card>
              <Card title="Add Fee">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <FormField label="Fee Type" required><Input value={newFee.fee_type} onChange={(e) => setNewFee((v) => ({ ...v, fee_type: e.target.value }))} /></FormField>
                  <FormField label="Amount" required><Input type="number" min={0} value={newFee.amount} onChange={(e) => setNewFee((v) => ({ ...v, amount: Number(e.target.value || 0) }))} /></FormField>
                  <FormField label="Due Date"><Input value={newFee.due_date} onChange={(e) => setNewFee((v) => ({ ...v, due_date: e.target.value }))} /></FormField>
                  <FormField label="Description"><Input value={newFee.description} onChange={(e) => setNewFee((v) => ({ ...v, description: e.target.value }))} /></FormField>
                </div>
                <div className="mt-4">
                  <Button variant="primary" onClick={async () => { await addFee(adminPassword, newFee); setNewFee({ fee_type: '', amount: 0, due_date: '', description: '' }); await loadAll(adminPassword); }}>
                    <Plus size={14} /> Add Fee
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
