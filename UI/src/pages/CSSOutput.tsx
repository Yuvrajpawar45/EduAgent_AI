import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Code2 } from 'lucide-react';

const cssBlocks = [
  {
    title: 'Streamlit Page Config & Container',
    description: 'Add to the top of admin_panel.py — centers content and sets max-width',
    language: 'python',
    code: `# pages/admin_panel.py — Top of file
import streamlit as st

st.set_page_config(
    page_title="EduAgent AI · Admin",
    page_icon="🎓",
    layout="wide"
)

# Inject the complete CSS theme
st.markdown("""
<style>
/* ===== LAYOUT CONTAINER ===== */
section.main > div.block-container {
    max-width: 1400px !important;
    padding: 2rem 2.5rem !important;
    margin: 0 auto;
}

@media (max-width: 768px) {
    section.main > div.block-container {
        padding: 1rem 1rem !important;
    }
}

@media (min-width: 769px) and (max-width: 1024px) {
    section.main > div.block-container {
        padding: 1.5rem 1.5rem !important;
    }
}
</style>
""", unsafe_allow_html=True)`,
  },
  {
    title: 'Typography & Base Styles',
    description: 'Font imports and base text styles',
    language: 'css',
    code: `/* ===== TYPOGRAPHY ===== */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

html, body, [class*="css"] {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
    -webkit-font-smoothing: antialiased;
}

/* Page background */
.stApp {
    background-color: #FFF9F0 !important;
}

/* Headings */
h1 {
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: #1E293B !important;
    letter-spacing: -0.01em;
    margin-bottom: 0.25rem !important;
}

h2 {
    font-size: 1.125rem !important;
    font-weight: 700 !important;
    color: #1E293B !important;
}

h3 {
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #1E293B !important;
}

p, li, span, div {
    color: #334155;
    line-height: 1.6;
}`,
  },
  {
    title: 'Sticky Header',
    description: 'Frosted glass sticky header with branding',
    language: 'css',
    code: `/* ===== STICKY HEADER ===== */
/* Wrap your header in: st.markdown('<div class="ea-header">...</div>') */
.ea-header {
    position: sticky;
    top: 0;
    z-index: 999;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.6);
    padding: 0.75rem 0;
    margin: -2rem -2.5rem 2rem -2.5rem;
    padding-left: 2.5rem;
    padding-right: 2.5rem;
}

.ea-header h1 {
    font-size: 1.125rem !important;
    margin: 0 !important;
    padding: 0 !important;
}

.ea-header p {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0;
}`,
  },
  {
    title: 'Metric Cards Row',
    description: 'st.columns() metric cards with hover elevation',
    language: 'css',
    code: `/* ===== METRIC CARDS ===== */
/* Use with: st.metric() inside st.columns() */
[data-testid="stMetric"] {
    background: #FFFFFF;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    padding: 1.25rem;
    transition: box-shadow 0.3s ease, transform 0.2s ease;
}

[data-testid="stMetric"]:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07),
                0 2px 4px -2px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
}

[data-testid="stMetric"] label {
    font-size: 0.75rem !important;
    font-weight: 500 !important;
    color: #64748B !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

[data-testid="stMetric"] [data-testid="stMetricValue"] {
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: #1E293B !important;
}

[data-testid="stMetric"] [data-testid="stMetricDelta"] {
    font-size: 0.75rem !important;
    font-weight: 500 !important;
}`,
  },
  {
    title: 'Tab Styling',
    description: 'Modern pill-style tabs replacing default Streamlit tabs',
    language: 'css',
    code: `/* ===== TABS ===== */
.stTabs [data-baseweb="tab-list"] {
    background: #F1F5F9;
    border-radius: 12px;
    padding: 4px;
    gap: 4px;
    border: none;
}

.stTabs [data-baseweb="tab"] {
    border-radius: 8px;
    padding: 0.625rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748B;
    border: none;
    background: transparent;
    transition: all 0.2s ease;
}

.stTabs [data-baseweb="tab"]:hover {
    color: #334155;
    background: rgba(255, 255, 255, 0.5);
}

.stTabs [aria-selected="true"] {
    background: #FFFFFF !important;
    color: #6B1D3A !important;
    font-weight: 600 !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Remove default tab indicator line */
.stTabs [data-baseweb="tab-highlight"] {
    display: none;
}

.stTabs [data-baseweb="tab-border"] {
    display: none;
}`,
  },
  {
    title: 'Card System',
    description: 'Reusable card wrapper for content sections',
    language: 'css',
    code: `/* ===== CARDS ===== */
/* Usage: st.markdown('<div class="ea-card">', unsafe_allow_html=True) */
.ea-card {
    background: #FFFFFF;
    border: 1px solid rgba(226, 232, 240, 0.8);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    margin-bottom: 1.5rem;
}

.ea-card-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #F1F5F9;
}

.ea-card-header h3 {
    font-size: 1rem !important;
    font-weight: 600 !important;
    color: #1E293B;
    margin: 0 !important;
}

.ea-card-header p {
    font-size: 0.75rem;
    color: #94A3B8;
    margin: 0.125rem 0 0 0;
}

.ea-card-body {
    padding: 1.5rem;
}`,
  },
  {
    title: 'Status Badges',
    description: 'Colored pill badges for escalation statuses',
    language: 'css',
    code: `/* ===== STATUS BADGES ===== */
/* Usage: st.markdown('<span class="ea-badge ea-badge-pending">Pending</span>') */
.ea-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1;
}

.ea-badge::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: 50%;
}

/* Pending */
.ea-badge-pending {
    background: #FEF3C7;
    color: #D97706;
    border: 1px solid #FDE68A;
}
.ea-badge-pending::before { background: #D97706; }

/* In Progress */
.ea-badge-progress {
    background: #DBEAFE;
    color: #2563EB;
    border: 1px solid #BFDBFE;
}
.ea-badge-progress::before { background: #2563EB; }

/* Resolved */
.ea-badge-resolved {
    background: #D1FAE5;
    color: #059669;
    border: 1px solid #A7F3D0;
}
.ea-badge-resolved::before { background: #059669; }

/* Escalated */
.ea-badge-escalated {
    background: #FEE2E2;
    color: #DC2626;
    border: 1px solid #FECACA;
}
.ea-badge-escalated::before { background: #DC2626; }`,
  },
  {
    title: 'Tables & Data Display',
    description: 'Clean table styling with row hover and zebra-free design',
    language: 'css',
    code: `/* ===== TABLES ===== */
[data-testid="stDataFrame"],
.ea-table {
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    overflow: hidden;
}

[data-testid="stDataFrame"] table {
    font-size: 0.875rem;
}

[data-testid="stDataFrame"] thead th {
    background: #F8FAFC !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    color: #64748B !important;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.75rem 1rem !important;
    border-bottom: 1px solid #E2E8F0;
}

[data-testid="stDataFrame"] tbody td {
    padding: 0.875rem 1rem !important;
    color: #334155;
    border-bottom: 1px solid #F1F5F9;
}

[data-testid="stDataFrame"] tbody tr:hover {
    background: #FFF9F0 !important;
}

[data-testid="stDataFrame"] tbody tr:last-child td {
    border-bottom: none;
}`,
  },
  {
    title: 'Form Controls',
    description: 'Input, select, textarea, and button overrides',
    language: 'css',
    code: `/* ===== FORM CONTROLS ===== */
[data-testid="stTextInput"] input,
[data-testid="stTextArea"] textarea,
[data-testid="stSelectbox"] > div > div,
[data-testid="stDateInput"] input {
    border: 1px solid #E2E8F0 !important;
    border-radius: 8px !important;
    padding: 0.625rem 0.875rem !important;
    font-size: 0.875rem !important;
    color: #1E293B !important;
    background: #FFFFFF !important;
    transition: all 0.2s ease;
}

[data-testid="stTextInput"] input:focus,
[data-testid="stTextArea"] textarea:focus {
    border-color: #9E3A5E !important;
    box-shadow: 0 0 0 3px rgba(107, 29, 58, 0.12) !important;
}

/* Labels */
[data-testid="stTextInput"] label,
[data-testid="stTextArea"] label,
[data-testid="stSelectbox"] label,
[data-testid="stDateInput"] label {
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    color: #334155 !important;
}

/* Primary Button */
.stButton > button[kind="primary"],
.stButton > button {
    background: #6B1D3A !important;
    color: #FFFFFF !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0.625rem 1rem !important;
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.stButton > button:hover {
    background: #541530 !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stButton > button:active {
    transform: scale(0.98);
}

/* Secondary / outline buttons */
.stButton > button[kind="secondary"] {
    background: #FFFFFF !important;
    color: #334155 !important;
    border: 1px solid #E2E8F0 !important;
}

.stButton > button[kind="secondary"]:hover {
    background: #F8FAFC !important;
}`,
  },
  {
    title: 'Sidebar Styling',
    description: 'Burgundy sidebar matching the brand',
    language: 'css',
    code: `/* ===== SIDEBAR ===== */
section[data-testid="stSidebar"] {
    background: #3D0F23 !important;
    border-right: none !important;
}

section[data-testid="stSidebar"] .stMarkdown p,
section[data-testid="stSidebar"] .stMarkdown li,
section[data-testid="stSidebar"] label {
    color: #F0B8C8 !important;
}

section[data-testid="stSidebar"] h1,
section[data-testid="stSidebar"] h2,
section[data-testid="stSidebar"] h3 {
    color: #FFFFFF !important;
}

section[data-testid="stSidebar"] [data-testid="stSidebarNav"] a {
    color: #F0B8C8 !important;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    transition: all 0.2s ease;
}

section[data-testid="stSidebar"] [data-testid="stSidebarNav"] a:hover {
    background: rgba(107, 29, 58, 0.4);
    color: #FFFFFF !important;
}

section[data-testid="stSidebar"] [data-testid="stSidebarNav"] a[aria-selected="true"] {
    background: rgba(107, 29, 58, 0.6);
    color: #FFFFFF !important;
}`,
  },
  {
    title: 'File Uploader',
    description: 'Styled drag-and-drop zone for PDF uploads',
    language: 'css',
    code: `/* ===== FILE UPLOADER ===== */
[data-testid="stFileUploader"] {
    border: 2px dashed #E2E8F0 !important;
    border-radius: 12px !important;
    padding: 2rem !important;
    text-align: center;
    transition: all 0.3s ease;
}

[data-testid="stFileUploader"]:hover {
    border-color: #D4789A !important;
    background: rgba(253, 242, 245, 0.3) !important;
}

[data-testid="stFileUploader"] p {
    color: #64748B;
}`,
  },
  {
    title: 'Scrollbar & Misc',
    description: 'Custom scrollbar and utility overrides',
    language: 'css',
    code: `/* ===== SCROLLBAR ===== */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: transparent;
}

::-webkit-scrollbar-thumb {
    background: #CBD5E1;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #94A3B8;
}

/* ===== EXPANDER ===== */
[data-testid="stExpander"] {
    border: 1px solid #E2E8F0 !important;
    border-radius: 12px !important;
    overflow: hidden;
}

[data-testid="stExpander"] summary {
    font-weight: 600;
    color: #1E293B;
}

/* ===== DIVIDERS ===== */
hr {
    border-color: #F1F5F9 !important;
    margin: 1.5rem 0 !important;
}

/* ===== TOAST / ALERTS ===== */
[data-testid="stAlert"] {
    border-radius: 12px !important;
    border: none !important;
}`,
  },
];

export default function CSSOutput() {
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-lg font-bold text-slate-800">Streamlit CSS Output</h1>
              <p className="text-xs text-slate-400 -mt-0.5">Copy-paste ready for admin_panel.py</p>
            </div>
            <CopyAllButton />
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-burgundy-50 border border-burgundy-200 rounded-xl p-5"
        >
          <h3 className="text-sm font-semibold text-burgundy-600 mb-1">📋 How to Use</h3>
          <ol className="text-xs text-burgundy-500 space-y-1 list-decimal list-inside">
            <li>Copy the <strong>Page Config & Container</strong> block first — it sets up the layout</li>
            <li>Wrap all remaining CSS blocks inside a single <code className="bg-burgundy-100 px-1 py-0.5 rounded font-mono">st.markdown("""&lt;style&gt;...&lt;/style&gt;""", unsafe_allow_html=True)</code></li>
            <li>Place the CSS injection at the top of your <code className="bg-burgundy-100 px-1 py-0.5 rounded font-mono">admin_panel.py</code> file, after <code className="bg-burgundy-100 px-1 py-0.5 rounded font-mono">st.set_page_config()</code></li>
            <li>Use the custom class names (ea-card, ea-badge, etc.) via <code className="bg-burgundy-100 px-1 py-0.5 rounded font-mono">st.markdown()</code> with <code className="bg-burgundy-100 px-1 py-0.5 rounded font-mono">unsafe_allow_html=True</code></li>
          </ol>
        </motion.div>

        {cssBlocks.map((block, i) => (
          <CSSBlock key={i} {...block} index={i} />
        ))}
      </div>
    </div>
  );
}

function CSSBlock({ title, description, code, language, index }: { title: string; description: string; code: string; language: string; index: number }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm"
    >
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
            copied
              ? 'bg-success-light text-success'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="relative">
        <div className="absolute top-3 right-4">
          <span className="text-[10px] font-mono text-slate-300 uppercase">{language}</span>
        </div>
        <pre className="p-5 text-xs leading-relaxed overflow-x-auto bg-slate-900 text-slate-300">
          <code>{code}</code>
        </pre>
      </div>
    </motion.div>
  );
}

function CopyAllButton() {
  const [copied, setCopied] = useState(false);

  const handleCopyAll = () => {
    const allCSS = cssBlocks.map((b) => `/* ${b.title} */\n${b.code}`).join('\n\n');
    navigator.clipboard.writeText(allCSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <button
      onClick={handleCopyAll}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        copied
          ? 'bg-success-light text-success'
          : 'bg-burgundy-500 text-white hover:bg-burgundy-600'
      }`}
    >
      {copied ? <Check size={14} /> : <Code2 size={14} />}
      {copied ? 'All CSS Copied!' : 'Copy All CSS'}
    </button>
  );
}
