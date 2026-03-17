import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Bell, Bot, Download, Loader2, Send, ThumbsUp, User } from 'lucide-react';
import Card from '../components/Card';
import { Button, Input } from '../components/FormField';
import {
  buildStudentDocumentDownloadUrl,
  clearStudentToken,
  getStudentDocuments,
  getStudentFees,
  getStudentMe,
  getStudentReminders,
  markStudentRemindersRead,
  recordFaqFeedback,
  sendChat,
  studentLogin,
} from '../lib/api';
import type { StudentDocument, StudentFeeLedger, StudentProfile, StudentReminder } from '../lib/api';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  faqIds?: string[];
  helpfulMarked?: boolean;
  downloads?: Array<{ id: string; name: string; url: string }>;
}

const quickPrompts = [
  'When are the upcoming semester exams?',
  'What is the complete fee structure?',
  'What is the minimum attendance requirement?',
  'What scholarships are available for students?',
];

export default function StudentChat() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [student, setStudent] = useState<StudentProfile | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am EduAgent AI. Ask me anything about exams, fees, attendance, scholarships, admissions, or policies.',
    },
  ]);
  const [fees, setFees] = useState<StudentFeeLedger[]>([]);
  const [documents, setDocuments] = useState<StudentDocument[]>([]);
  const [reminders, setReminders] = useState<StudentReminder[]>([]);
  const [unreadReminders, setUnreadReminders] = useState(0);
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const loadStudentData = async () => {
    const [me, feeRes, docRes, reminderRes] = await Promise.all([
      getStudentMe(),
      getStudentFees(),
      getStudentDocuments(),
      getStudentReminders(),
    ]);
    setStudent(me);
    setFees(feeRes.items);
    setDocuments(docRes.items);
    setReminders(reminderRes.items);
    setUnreadReminders(reminderRes.unread_count);
  };

  useEffect(() => {
    const init = async () => {
      try {
        await loadStudentData();
        setAuthenticated(true);
      } catch {
        setAuthenticated(false);
      }
    };
    void init();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await studentLogin(studentId, password);
      await loadStudentData();
      setAuthenticated(true);
      setPassword('');
      setInfo('Logged in successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearStudentToken();
    setAuthenticated(false);
    setStudent(null);
    setFees([]);
    setDocuments([]);
    setReminders([]);
    setUnreadReminders(0);
    setStudentId('');
    setPassword('');
  };

  const submit = async (raw?: string) => {
    const message = (raw ?? input).trim();
    if (!message || loading) return;

    setError('');
    setInfo('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');

    try {
      const result = await sendChat(message);
      const faqIds = Array.isArray(result.meta?.faq_ids)
        ? result.meta.faq_ids.filter((id): id is string => typeof id === 'string')
        : [];
      const downloads = Array.isArray(result.meta?.downloads)
        ? result.meta.downloads.filter(
            (d): d is { id: string; name: string; url: string } =>
              !!d && typeof d.id === 'string' && typeof d.name === 'string' && typeof d.url === 'string',
          )
        : [];
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer, faqIds, downloads }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Could not connect to backend. Check API server and try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await submit();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-8">
        <Card title="Student Login" subtitle="Use your student ID and password" className="w-full max-w-md">
          <div className="space-y-4">
            <Input placeholder="Enrollment No / Student ID (e.g. ENR001)" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleLogin();
              }}
            />
            <Button variant="primary" className="w-full" onClick={handleLogin} disabled={!studentId || !password || loading}>
              {loading ? <Loader2 size={14} className="animate-spin" /> : 'Login'}
            </Button>
            <p className="text-xs text-slate-500">Demo: `ENR001` / `stu123` (also works: `STU-2024-001`)</p>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1250px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-800">Student Chat</h1>
            <p className="text-xs text-slate-400 -mt-0.5">
              {student?.full_name} ({student?.enrollment_no || student?.student_id})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                onClick={async () => {
                  const next = !showReminderPanel;
                  setShowReminderPanel(next);
                  if (next && unreadReminders > 0) {
                    await markStudentRemindersRead();
                    setUnreadReminders(0);
                    const refreshed = await getStudentReminders();
                    setReminders(refreshed.items);
                  }
                }}
              >
                <Bell size={18} className="text-slate-700" />
                {unreadReminders > 0 && <span className="absolute -top-1 -right-1 text-[10px] min-w-[16px] h-4 px-1 rounded-full bg-danger text-white">{unreadReminders}</span>}
              </button>
              {showReminderPanel && (
                <div className="absolute right-0 top-11 w-[360px] max-h-[360px] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-30">
                  <p className="text-sm font-semibold text-slate-800 px-1 pb-2 border-b border-slate-100">Fee Reminders</p>
                  <div className="divide-y divide-slate-100">
                    {reminders.slice(0, 20).map((r) => (
                      <div key={r._id} className="py-2.5 px-1">
                        <p className="text-sm text-slate-700">{r.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{r.sent_at.slice(0, 16)}</p>
                      </div>
                    ))}
                    {reminders.length === 0 && <p className="py-3 px-1 text-sm text-slate-500">No reminders yet.</p>}
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1250px] mx-auto px-6 lg:px-10 py-6 space-y-5">
        <Card title="My Fee Ledger" subtitle="Per-student due and payment tracking" noPadding>
          <div className="divide-y divide-slate-100">
            {fees.map((fee) => (
              <div key={fee._id} className="px-6 py-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{fee.fee_type}</p>
                  <p className="text-xs text-slate-500">
                    Total: Rs. {fee.total_amount.toLocaleString()} | Paid: Rs. {fee.paid_amount.toLocaleString()} | Balance: Rs.{' '}
                    {fee.balance_amount.toLocaleString()} | Due: {fee.due_date}
                  </p>
                </div>
              </div>
            ))}
            {fees.length === 0 && <p className="px-6 py-4 text-sm text-slate-500">No fee records found.</p>}
          </div>
        </Card>

        <Card title="Document Center" subtitle="Real download tracking enabled" noPadding>
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc._id} className="px-6 py-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{doc.original_name || doc.filename}</p>
                  <p className="text-xs text-slate-500">Category: {doc.category || 'General'} | Total downloads: {doc.download_count ?? 0}</p>
                </div>
                <a
                  href={buildStudentDocumentDownloadUrl(doc._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-2 rounded-md bg-burgundy-50 text-burgundy-700 hover:bg-burgundy-100"
                >
                  <Download size={12} />
                  Download
                </a>
              </div>
            ))}
            {documents.length === 0 && <p className="px-6 py-4 text-sm text-slate-500">No documents uploaded yet.</p>}
          </div>
        </Card>

        <Card title="Ask EduAgent" subtitle="Chat with the assistant">
          <div className="space-y-4">
            <div className="h-[420px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-burgundy-500 text-white rounded-br-md'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 rounded-bl-md'
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs mb-1 opacity-80">
                      {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                      <span>{msg.role === 'user' ? 'You' : 'EduAgent'}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.role === 'assistant' && msg.faqIds && msg.faqIds.length > 0 && (
                      <div className="mt-2">
                        <button
                          type="button"
                          disabled={!!msg.helpfulMarked}
                          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-burgundy-600 disabled:opacity-60"
                          onClick={async () => {
                            try {
                              await Promise.all(msg.faqIds!.map((id) => recordFaqFeedback(id, true)));
                              setMessages((prev) => prev.map((m, idx) => (idx === i ? { ...m, helpfulMarked: true } : m)));
                              setInfo('Thanks, feedback saved.');
                            } catch {
                              setError('Could not save feedback.');
                            }
                          }}
                        >
                          <ThumbsUp size={12} />
                          {msg.helpfulMarked ? 'Marked Helpful' : 'Helpful'}
                        </button>
                      </div>
                    )}
                    {msg.role === 'assistant' && msg.downloads && msg.downloads.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.downloads.map((doc) => (
                          <a
                            key={doc.id}
                            href={`http://localhost:8000${doc.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-md bg-burgundy-50 text-burgundy-700 hover:bg-burgundy-100"
                          >
                            Download: {doc.name}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-slate-600 inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    EduAgent is thinking...
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => submit(prompt)}
                  className="text-xs px-3 py-2 rounded-lg bg-burgundy-50 text-burgundy-600 hover:bg-burgundy-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>

            <form className="flex gap-2" onSubmit={onSubmit}>
              <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask your academic question..." />
              <Button variant="primary" type="submit" disabled={loading}>
                <Send size={14} />
                Send
              </Button>
            </form>

            {error && <p className="text-sm text-danger">{error}</p>}
            {info && <p className="text-sm text-success">{info}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
