import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronDown,
  CreditCard,
  Download,
  FileText,
  Filter,
  GraduationCap,
  HelpCircle,
  Loader2,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import FormField, { Button, Input, Select, TextArea } from '../components/FormField';
import {
  addExam,
  addFaq,
  adminLogin,
  clearAdminToken,
  deleteExam,
  deleteFaq,
  deletePdf,
  getEscalations,
  getExams,
  getFaqs,
  getFeeLedger,
  getDownloadEvents,
  getPdfs,
  getStats,
  getStudents,
  updateEscalation,
  upsertFeeLedger,
  uploadPdf,
  recordFaqFeedback,
  sendFeeReminder,
} from '../lib/api';
import type { DownloadEvent, Escalation, Exam, FAQ, PDFDoc, Stats, Student, StudentFeeLedger } from '../lib/api';

type TabId = 'faqs' | 'escalations' | 'pdfs' | 'exams' | 'fees';

const tabConfig: { id: TabId; label: string; icon: React.ComponentType<{ size?: number }>; getCount: (ctx: CountsCtx) => number }[] = [
  { id: 'faqs', label: 'FAQs', icon: HelpCircle, getCount: (ctx) => ctx.faqs },
  { id: 'escalations', label: 'Escalations', icon: ShieldAlert, getCount: (ctx) => ctx.escalations },
  { id: 'pdfs', label: 'PDFs', icon: FileText, getCount: (ctx) => ctx.pdfs },
  { id: 'exams', label: 'Exams', icon: GraduationCap, getCount: (ctx) => ctx.exams },
  { id: 'fees', label: 'Fees', icon: CreditCard, getCount: (ctx) => ctx.fees },
];

interface CountsCtx {
  faqs: number;
  escalations: number;
  pdfs: number;
  exams: number;
  fees: number;
}

function formatInrLakh(amount: number): string {
  const lakh = amount / 100000;
  return `Rs. ${lakh.toFixed(1)}L`;
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('faqs');
  const [adminPassword, setAdminPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [faqCategoryFilter, setFaqCategoryFilter] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [feeLedger, setFeeLedger] = useState<StudentFeeLedger[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [pdfs, setPdfs] = useState<PDFDoc[]>([]);
  const [downloadEvents, setDownloadEvents] = useState<DownloadEvent[]>([]);

  const [newFaq, setNewFaq] = useState({ question: '', answer: '', category: 'General', keywords: '' });
  const [newExam, setNewExam] = useState({ subject: '', exam_date: '', exam_time: '', venue: '', semester: 1 });
  const [newLedger, setNewLedger] = useState({
    student_id: '',
    fee_type: 'Semester Tuition',
    total_amount: 45000,
    paid_amount: 0,
    due_date: '',
    status: 'pending',
  });
  const [ledgerStudentFilter, setLedgerStudentFilter] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfMessage, setPdfMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faqFormRef = useRef<HTMLDivElement | null>(null);
  const pdfFormRef = useRef<HTMLDivElement | null>(null);
  const examFormRef = useRef<HTMLDivElement | null>(null);
  const feeFormRef = useRef<HTMLDivElement | null>(null);

  const counts: CountsCtx = {
    faqs: faqs.length,
    escalations: escalations.length,
    pdfs: pdfs.length,
    exams: exams.length,
    fees: feeLedger.length,
  };

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = faqs;
    if (faqCategoryFilter !== 'all') {
      filtered = filtered.filter((f) => f.category?.toLowerCase() === faqCategoryFilter);
    }
    if (!q) return filtered;
    return filtered.filter((f) =>
      `${f.question} ${f.answer} ${f.category} ${f.keywords}`.toLowerCase().includes(q)
    );
  }, [faqs, search, faqCategoryFilter]);

  const pendingEscalations = escalations.filter((e) => e.status === 'pending').length;
  const totalFeeAmount = feeLedger.reduce((sum, row) => sum + (row.balance_amount || 0), 0);

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, faqData, escalationData, examData, pdfData, ledgerData, studentData, downloadData] = await Promise.all([
        getStats(),
        getFaqs(),
        getEscalations(statusFilter),
        getExams(),
        getPdfs(),
        getFeeLedger(ledgerStudentFilter),
        getStudents(),
        getDownloadEvents(),
      ]);
      setStats(statsData);
      setFaqs(faqData.items);
      setEscalations(escalationData.items);
      setExams(examData.items);
      setPdfs(pdfData.items);
      setFeeLedger(ledgerData.items);
      setStudents(studentData.items);
      setDownloadEvents(downloadData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated) {
      void loadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, statusFilter, ledgerStudentFilter]);

  useEffect(() => {
    if (!authenticated) return;
    const id = setInterval(() => {
      void loadAll();
    }, 300000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, statusFilter, ledgerStudentFilter]);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await adminLogin(adminPassword);
      setAuthenticated(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminToken();
    setAuthenticated(false);
    setAdminPassword('');
  };

  const handleExport = () => {
    if (activeTab === 'faqs') downloadJson('faqs.json', filteredFaqs);
    if (activeTab === 'escalations') downloadJson('escalations.json', escalations);
    if (activeTab === 'pdfs') downloadJson('pdfs.json', pdfs);
    if (activeTab === 'exams') downloadJson('exams.json', exams);
    if (activeTab === 'fees') downloadJson('fees-ledger.json', feeLedger);
  };

  const handleAddNew = () => {
    if (activeTab === 'faqs') faqFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (activeTab === 'pdfs') pdfFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (activeTab === 'exams') examFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (activeTab === 'fees') feeFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (activeTab === 'escalations') setShowFilters(true);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-8">
        <Card title="Admin Login" subtitle="Secure admin access only" className="w-full max-w-md">
          <div className="space-y-4">
            <FormField label="Admin Password" required>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleLogin();
                }}
              />
            </FormField>
            <Button variant="primary" className="w-full" onClick={handleLogin} disabled={!adminPassword || loading}>
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
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-200/70">
        <div className="max-w-[1450px] mx-auto px-8 py-4 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-[28px] font-bold text-slate-800 leading-tight">Admin Dashboard</h1>
            <p className="text-slate-400 text-[16px] mt-0.5">EduAgent AI Operations</p>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 min-w-[420px]">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search records..."
                className="bg-transparent text-[15px] text-slate-700 placeholder:text-slate-400 focus:outline-none w-full"
              />
            </div>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Bell size={20} className="text-slate-600" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full" />
            </button>
            <div className="relative flex items-center gap-3 pl-4 border-l border-slate-200">
              <button
                onClick={() => setShowProfileMenu((v) => !v)}
                className="w-11 h-11 rounded-full bg-burgundy-500 text-white text-xl font-bold flex items-center justify-center"
              >
                AD
              </button>
              <button onClick={() => setShowProfileMenu((v) => !v)}>
                <ChevronDown size={17} className="text-slate-400" />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 top-14 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-30">
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await loadAll();
                    }}
                  >
                    Refresh Data
                  </button>
                  <button
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-md"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        {showNotifications && (
          <div className="max-w-[1450px] mx-auto px-8 pb-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3 text-sm text-slate-600">
              Pending escalations: {pendingEscalations} • PDFs uploaded: {pdfs.length}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-[1450px] mx-auto px-8 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <MetricTile
            label="ACTIVE FAQS"
            value={(stats?.total_faqs ?? counts.faqs).toString()}
            note="+12% this month"
            color="burgundy"
            onClick={() => setActiveTab('faqs')}
          />
          <MetricTile
            label="OPEN ESCALATIONS"
            value={(stats?.pending_escalated ?? pendingEscalations).toString()}
            note="-3 from last week"
            color="gold"
            onClick={() => setActiveTab('escalations')}
          />
          <MetricTile
            label="PENDING FEES"
            value={formatInrLakh(totalFeeAmount)}
            note={`${students.length} students`}
            color="blue"
            onClick={() => setActiveTab('fees')}
          />
          <MetricTile
            label="UPCOMING EXAMS"
            value={(stats?.exam_entries ?? counts.exams).toString()}
            note="Next: Dec 22"
            color="green"
            onClick={() => setActiveTab('exams')}
          />
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="bg-slate-100 rounded-2xl p-1.5 flex flex-wrap gap-1.5">
              {tabConfig.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-3 rounded-xl text-[15px] font-semibold inline-flex items-center gap-2.5 transition-all ${
                      isActive ? 'bg-white text-burgundy-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Icon size={19} />
                    {tab.label}
                    <span className="text-[12px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">{tab.getCount(counts)}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-700 hover:text-slate-900"
              >
                <Filter size={19} /> Filter
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-700 hover:text-slate-900"
              >
                <Download size={19} /> Export
              </button>
              <Button variant="primary" className="text-[14px] px-6 py-3" onClick={handleAddNew}>
                <Plus size={18} /> Add New
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap gap-3">
              <Input
                className="max-w-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Global search..."
              />
              {activeTab === 'faqs' && (
                <Select
                  className="max-w-xs"
                  value={faqCategoryFilter}
                  onChange={(e) => setFaqCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  <option value="account">Account</option>
                  <option value="exam">Exam</option>
                  <option value="fees">Fees</option>
                  <option value="library">Library</option>
                  <option value="scholarship">Scholarship</option>
                  <option value="general">General</option>
                </Select>
              )}
              {activeTab === 'escalations' && (
                <Select className="max-w-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </Select>
              )}
              {activeTab === 'fees' && (
                <Select className="max-w-xs" value={ledgerStudentFilter} onChange={(e) => setLedgerStudentFilter(e.target.value)}>
                  <option value="">All students</option>
                  {students.map((s) => (
                    <option key={s._id} value={s.student_id}>
                      {(s.enrollment_no || s.student_id)} - {s.full_name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}
          {info && <p className="text-sm text-success">{info}</p>}
          {loading && <p className="text-sm text-slate-500">Loading data...</p>}

          {activeTab === 'faqs' && (
            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-7">
              <Card title="FAQ Management" subtitle={`${filteredFaqs.length} active questions`} noPadding>
                <div className="divide-y divide-slate-100">
                  {filteredFaqs.map((faq) => (
                    <div key={faq._id} className="px-8 py-6 space-y-2.5 hover:bg-cream-50 transition-colors">
                      <p className="text-[15px] font-semibold text-slate-800 leading-snug">{faq.question}</p>
                      <div className="flex items-center gap-4 text-slate-400 text-[13px]">
                        <span className="bg-slate-100 text-slate-500 rounded-xl px-3 py-1 text-[14px]">{faq.category}</span>
                        <span>{faq.views ?? 0} views</span>
                        <span>
                          Helpful {faq.helpful_yes ?? 0} ({Math.round(((faq.helpful_yes ?? 0) / Math.max(faq.helpful_total ?? 0, 1)) * 100)}%)
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-600">{faq.answer}</p>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          onClick={async () => {
                            setError('');
                            setInfo('');
                            try {
                              await recordFaqFeedback(faq._id, true);
                              setInfo('Helpful feedback saved.');
                              await loadAll();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Could not save helpful feedback.');
                            }
                          }}
                        >
                          Mark Helpful
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={async () => {
                            await deleteFaq(faq._id);
                            await loadAll();
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Add New FAQ">
                <div className="space-y-5" ref={faqFormRef}>
                  <FormField label="Question" required>
                    <Input
                      placeholder="Enter the FAQ question"
                      value={newFaq.question}
                      onChange={(e) => setNewFaq((v) => ({ ...v, question: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Answer" required>
                    <TextArea
                      placeholder="Write the answer..."
                      value={newFaq.answer}
                      onChange={(e) => setNewFaq((v) => ({ ...v, answer: e.target.value }))}
                    />
                  </FormField>

                  <FormField label="Category">
                    <Select
                      value={newFaq.category}
                      onChange={(e) => setNewFaq((v) => ({ ...v, category: e.target.value }))}
                    >
                      <option>General</option>
                      <option>Exam</option>
                      <option>Fees</option>
                      <option>Attendance</option>
                      <option>Scholarship</option>
                      <option>Admission</option>
                      <option>Library</option>
                    </Select>
                  </FormField>

                  <FormField label="Keywords">
                    <Input
                      placeholder="comma,separated,keywords"
                      value={newFaq.keywords}
                      onChange={(e) => setNewFaq((v) => ({ ...v, keywords: e.target.value }))}
                    />
                  </FormField>

                  <Button
                    variant="primary"
                    className="w-full text-[14px] py-3"
                    onClick={async () => {
                      if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
                      await addFaq(newFaq);
                      setNewFaq({ question: '', answer: '', category: 'General', keywords: '' });
                      await loadAll();
                    }}
                  >
                    <Plus size={16} /> Add FAQ
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'escalations' && (
            <Card title="Escalated Queries" subtitle="Review and update sensitive student issues" noPadding>
              <div className="px-8 py-4 border-b border-slate-100 flex items-center gap-3">
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="max-w-[220px]">
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </Select>
              </div>
              <div className="divide-y divide-slate-100">
                {escalations.map((item) => (
                  <div key={item._id} className="px-8 py-6 grid grid-cols-1 xl:grid-cols-[1.8fr,1fr,1fr,auto] gap-4 items-center">
                    <div>
                      <p className="text-[15px] font-semibold text-slate-800">{item.student_query}</p>
                      <p className="text-sm text-slate-500 mt-1">{item.reason} - {item.timestamp.slice(0, 16)}</p>
                    </div>
                    <StatusBadge status={item.status} />
                    <Select
                      value={item.status}
                      onChange={async (e) => {
                        await updateEscalation(item._id, e.target.value, item.admin_notes || '');
                        await loadAll();
                      }}
                    >
                      <option value="pending">pending</option>
                      <option value="in-progress">in-progress</option>
                      <option value="resolved">resolved</option>
                    </Select>
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        await updateEscalation(item._id, 'resolved', 'Resolved by admin');
                        await loadAll();
                      }}
                    >
                      Resolve
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'pdfs' && (
            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-7">
              <Card title="Document Library" subtitle={`${pdfs.length} uploaded documents`} noPadding>
                <div className="divide-y divide-slate-100">
                  {pdfs.map((pdf) => (
                    <div key={pdf._id} className="px-8 py-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[15px] font-semibold text-slate-800">{pdf.original_name || pdf.filename}</p>
                        <p className="text-slate-500 text-sm">
                          {pdf.uploaded_at.slice(0, 16)} - Pages: {pdf.pages} - Chunks: {pdf.chunks} - Downloads: {pdf.download_count ?? 0}
                        </p>
                      </div>
                      <Button variant="danger" onClick={async () => { await deletePdf(pdf._id, pdf.filename); await loadAll(); }}>
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Upload Document">
                <div className="space-y-4" ref={pdfFormRef}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 rounded-xl p-7 text-center hover:border-burgundy-300 transition-colors"
                  >
                    <Upload size={24} className="mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600">Choose a PDF file</p>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      setPdfMessage('');
                      setPdfFile(e.target.files?.[0] || null);
                    }}
                  />
                  <p className="text-sm text-slate-500">{pdfFile ? `Selected: ${pdfFile.name}` : 'No file selected.'}</p>
                  <Button
                    variant="primary"
                    className="w-full"
                    disabled={!pdfFile}
                    onClick={async () => {
                      if (!pdfFile) return;
                      try {
                        setPdfMessage('Uploading...');
                        await uploadPdf(pdfFile);
                        setPdfMessage('PDF uploaded and processed successfully.');
                        setPdfFile(null);
                        await loadAll();
                      } catch (err) {
                        setPdfMessage(err instanceof Error ? err.message : 'PDF upload failed.');
                      }
                    }}
                  >
                    <Upload size={14} /> Upload PDF
                  </Button>
                  {pdfMessage && <p className="text-sm text-slate-600">{pdfMessage}</p>}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'pdfs' && (
            <Card title="Recent Downloads" subtitle="Real document download tracking" noPadding>
              <div className="divide-y divide-slate-100">
                {downloadEvents.slice(0, 20).map((event) => (
                  <div key={event._id} className="px-8 py-4 text-sm text-slate-700 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{event.filename}</p>
                      <p className="text-slate-500 text-xs">
                        Student: {event.student_id || 'anonymous'} | Source: {event.source}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">{event.downloaded_at.slice(0, 16)}</p>
                  </div>
                ))}
                {downloadEvents.length === 0 && <p className="px-8 py-4 text-sm text-slate-500">No downloads yet.</p>}
              </div>
            </Card>
          )}

          {activeTab === 'exams' && (
            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-7">
              <Card title="Exam Schedule" subtitle={`${exams.length} exam entries`} noPadding>
                <div className="divide-y divide-slate-100">
                  {exams.map((exam) => (
                    <div key={exam._id} className="px-8 py-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[15px] font-semibold text-slate-800">{exam.subject}</p>
                        <p className="text-slate-500 text-sm">{exam.exam_date} {exam.exam_time} - {exam.venue} - Semester {exam.semester}</p>
                      </div>
                      <Button variant="danger" onClick={async () => { await deleteExam(exam._id); await loadAll(); }}>
                        <Trash2 size={14} /> Delete
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Add Exam">
                <div className="space-y-4" ref={examFormRef}>
                  <FormField label="Subject" required><Input value={newExam.subject} onChange={(e) => setNewExam((v) => ({ ...v, subject: e.target.value }))} /></FormField>
                  <FormField label="Date" required><Input type="date" value={newExam.exam_date} onChange={(e) => setNewExam((v) => ({ ...v, exam_date: e.target.value }))} /></FormField>
                  <FormField label="Time" required><Input type="time" value={newExam.exam_time} onChange={(e) => setNewExam((v) => ({ ...v, exam_time: e.target.value }))} /></FormField>
                  <FormField label="Venue"><Input value={newExam.venue} onChange={(e) => setNewExam((v) => ({ ...v, venue: e.target.value }))} /></FormField>
                  <FormField label="Semester"><Input type="number" min={1} max={8} value={newExam.semester} onChange={(e) => setNewExam((v) => ({ ...v, semester: Number(e.target.value || 1) }))} /></FormField>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={async () => {
                      if (!newExam.subject.trim() || !newExam.exam_date || !newExam.exam_time) return;
                      await addExam(newExam);
                      setNewExam({ subject: '', exam_date: '', exam_time: '', venue: '', semester: 1 });
                      await loadAll();
                    }}
                  >
                    <Plus size={14} /> Add Exam
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'fees' && (
            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-7">
              <Card title="Student Fee Ledger" subtitle={`${feeLedger.length} ledger rows`} noPadding>
                <div className="divide-y divide-slate-100">
                  {feeLedger.map((row) => (
                    <div key={row._id} className="px-8 py-5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[15px] font-semibold text-slate-800">
                          {row.student_id} - {row.fee_type}
                        </p>
                        <p className="text-slate-500 text-sm">
                          Total: Rs. {row.total_amount.toLocaleString()} | Paid: Rs. {row.paid_amount.toLocaleString()} | Balance: Rs.{' '}
                          {row.balance_amount.toLocaleString()} | Due: {row.due_date}
                        </p>
                        <p className="text-slate-400 text-xs">Status: {row.status} | Reminders: {row.reminder_count ?? 0}</p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await sendFeeReminder(row._id);
                          setInfo(`Reminder sent for ${row.student_id}`);
                          await loadAll();
                        }}
                      >
                        Send Reminder
                      </Button>
                    </div>
                  ))}
                  {feeLedger.length === 0 && <p className="px-8 py-4 text-sm text-slate-500">No ledger entries available.</p>}
                </div>
              </Card>

              <Card title="Add / Update Ledger Row">
                <div className="space-y-4" ref={feeFormRef}>
                  <FormField label="Student" required>
                    <Select value={newLedger.student_id} onChange={(e) => setNewLedger((v) => ({ ...v, student_id: e.target.value }))}>
                      <option value="">Select student</option>
                      {students.map((s) => (
                        <option key={s._id} value={s.student_id}>
                          {(s.enrollment_no || s.student_id)} - {s.full_name}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Fee Type" required>
                    <Input value={newLedger.fee_type} onChange={(e) => setNewLedger((v) => ({ ...v, fee_type: e.target.value }))} />
                  </FormField>
                  <FormField label="Total Amount" required>
                    <Input
                      type="number"
                      min={0}
                      value={newLedger.total_amount}
                      onChange={(e) => setNewLedger((v) => ({ ...v, total_amount: Number(e.target.value || 0) }))}
                    />
                  </FormField>
                  <FormField label="Paid Amount">
                    <Input
                      type="number"
                      min={0}
                      value={newLedger.paid_amount}
                      onChange={(e) => setNewLedger((v) => ({ ...v, paid_amount: Number(e.target.value || 0) }))}
                    />
                  </FormField>
                  <FormField label="Due Date">
                    <Input type="date" value={newLedger.due_date} onChange={(e) => setNewLedger((v) => ({ ...v, due_date: e.target.value }))} />
                  </FormField>
                  <FormField label="Status">
                    <Select value={newLedger.status} onChange={(e) => setNewLedger((v) => ({ ...v, status: e.target.value }))}>
                      <option value="pending">pending</option>
                      <option value="in-progress">in-progress</option>
                      <option value="resolved">resolved</option>
                    </Select>
                  </FormField>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={async () => {
                      if (!newLedger.student_id || !newLedger.fee_type.trim() || !newLedger.due_date) return;
                      await upsertFeeLedger(newLedger);
                      setNewLedger({
                        student_id: '',
                        fee_type: 'Semester Tuition',
                        total_amount: 45000,
                        paid_amount: 0,
                        due_date: '',
                        status: 'pending',
                      });
                      await loadAll();
                    }}
                  >
                    <Plus size={14} /> Save Ledger
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </section>

        <div className="pt-2">
          <Button variant="ghost" onClick={handleLogout}>Logout</Button>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  note,
  color,
  onClick,
}: {
  label: string;
  value: string;
  note: string;
  color: 'burgundy' | 'gold' | 'blue' | 'green';
  onClick?: () => void;
}) {
  const iconStyles = {
    burgundy: 'bg-burgundy-500 text-white',
    gold: 'bg-gold-400 text-burgundy-800',
    blue: 'bg-info text-white',
    green: 'bg-success text-white',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between shadow-sm text-left w-full hover:shadow-md transition-shadow"
    >
      <div className="space-y-2">
        <p className="text-slate-500 tracking-[0.16em] text-[11px] font-semibold">{label}</p>
        <p className="text-[26px] leading-tight font-bold text-slate-800 whitespace-nowrap">{value}</p>
        <p className="text-[12px] text-slate-500">{note}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow ${iconStyles[color]}`}>
        {color === 'burgundy' && <HelpCircle size={20} />}
        {color === 'gold' && <AlertTriangle size={20} />}
        {color === 'blue' && <CreditCard size={20} />}
        {color === 'green' && <Calendar size={20} />}
      </div>
    </button>
  );
}
