import { motion } from 'framer-motion';
import { Monitor, Tablet, Smartphone, ArrowRight, Layers, Grid3x3, AlignVerticalSpaceAround } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function LayoutGuide() {
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center h-16">
            <h1 className="text-lg font-bold text-slate-800">Layout & Structure Guide</h1>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 space-y-14">
        {/* Recommended Layout Order */}
        <motion.section {...fadeUp}>
          <SectionTitle title="Recommended Layout Order" description="Optimal visual hierarchy for the admin dashboard" />
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            {[
              { num: '01', label: 'Sticky Header', desc: 'Logo, title, search, notifications, avatar — frosted glass bg, h-16', icon: '🔒', color: 'bg-burgundy-50 text-burgundy-600 border-burgundy-200' },
              { num: '02', label: 'Metrics Row', desc: '4-column grid of st.metric() cards — key KPIs at a glance', icon: '📊', color: 'bg-gold-50 text-gold-600 border-gold-200' },
              { num: '03', label: 'Tab Bar', desc: 'FAQs | Escalations | PDFs | Exams | Fees — pill-style tabs', icon: '📑', color: 'bg-info-light text-info border-blue-200' },
              { num: '04', label: 'Action Bar', desc: 'Filter, Export, Add New buttons — right-aligned below tabs', icon: '⚡', color: 'bg-success-light text-success border-emerald-200' },
              { num: '05', label: 'Tab Content', desc: 'Cards with data tables, forms, lists — main working area', icon: '📋', color: 'bg-cream-100 text-slate-600 border-cream-200' },
            ].map((item, i) => (
              <div key={i} className={`flex items-start gap-5 px-6 py-5 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-xs font-mono font-bold text-slate-300 mt-1">{item.num}</span>
                <div className={`shrink-0 w-10 h-10 rounded-lg ${item.color} border flex items-center justify-center text-lg`}>
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800">{item.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Layout Diagram */}
        <motion.section {...fadeUp} transition={{ delay: 0.1 }}>
          <SectionTitle title="Page Layout Diagram" description="Visual representation of the dashboard structure" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-8">
            <div className="max-w-3xl mx-auto space-y-3">
              {/* Header */}
              <div className="bg-burgundy-500 rounded-lg p-3 text-center">
                <span className="text-xs font-semibold text-white">STICKY HEADER — max-width: 1400px, h-16, backdrop-blur</span>
              </div>
              {/* Metrics */}
              <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="bg-gold-100 rounded-lg p-3 text-center">
                    <span className="text-[10px] font-semibold text-gold-600">METRIC {n}</span>
                  </div>
                ))}
              </div>
              {/* Tabs */}
              <div className="bg-slate-100 rounded-lg p-3">
                <div className="flex gap-2 justify-center">
                  {['FAQs', 'Escalations', 'PDFs', 'Exams', 'Fees'].map((t, i) => (
                    <span key={t} className={`text-[10px] font-semibold px-3 py-1.5 rounded-md ${
                      i === 1 ? 'bg-white text-burgundy-600 shadow-sm' : 'text-slate-500'
                    }`}>{t}</span>
                  ))}
                </div>
              </div>
              {/* Action bar */}
              <div className="flex justify-end gap-2 py-1">
                <span className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-md text-slate-500 font-medium">Filter</span>
                <span className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-md text-slate-500 font-medium">Export</span>
                <span className="text-[10px] bg-burgundy-500 px-3 py-1.5 rounded-md text-white font-medium">+ Add New</span>
              </div>
              {/* Content */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 bg-cream-100 rounded-lg p-6 text-center border-2 border-dashed border-cream-300">
                  <span className="text-xs font-semibold text-slate-500">DATA TABLE / LIST</span>
                  <p className="text-[10px] text-slate-400 mt-1">2/3 width on desktop</p>
                </div>
                <div className="bg-cream-100 rounded-lg p-6 text-center border-2 border-dashed border-cream-300">
                  <span className="text-xs font-semibold text-slate-500">FORM / SIDEBAR</span>
                  <p className="text-[10px] text-slate-400 mt-1">1/3 width on desktop</p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Responsive Breakpoints */}
        <motion.section {...fadeUp} transition={{ delay: 0.15 }}>
          <SectionTitle title="Responsive Breakpoints" description="Behavior at each screen size" />
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Monitor,
                label: 'Desktop',
                breakpoint: '≥ 1024px',
                specs: [
                  'max-width: 1400px, centered',
                  'Padding: 2.5rem (40px) horizontal',
                  'Metrics: 4-column grid',
                  'Tab content: 2/3 + 1/3 split',
                  'Full tab labels with counts',
                  'Sidebar visible',
                ],
              },
              {
                icon: Tablet,
                label: 'Tablet',
                breakpoint: '768px – 1023px',
                specs: [
                  'Padding: 1.5rem (24px) horizontal',
                  'Metrics: 2-column grid',
                  'Tab content: full width, stacked',
                  'Form moves below data table',
                  'Tab labels with icons',
                  'Sidebar collapsed / hamburger',
                ],
              },
              {
                icon: Smartphone,
                label: 'Mobile',
                breakpoint: '< 768px',
                specs: [
                  'Padding: 1rem (16px) horizontal',
                  'Metrics: 2-column grid, compact',
                  'Tabs: icon-only, horizontal scroll',
                  'Content: single column, full width',
                  'Tables: horizontal scroll',
                  'Sidebar: overlay with hamburger',
                ],
              },
            ].map((bp, i) => (
              <motion.div
                key={bp.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                className="bg-white rounded-xl border border-slate-200/80 p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-burgundy-50 flex items-center justify-center">
                    <bp.icon size={18} className="text-burgundy-500" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">{bp.label}</h4>
                    <p className="text-xs font-mono text-slate-400">{bp.breakpoint}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {bp.specs.map((spec, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                      <ArrowRight size={10} className="text-burgundy-300 mt-0.5 shrink-0" />
                      {spec}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Structural Adjustments */}
        <motion.section {...fadeUp} transition={{ delay: 0.2 }}>
          <SectionTitle title="Structural Adjustments" description="Recommended changes to layout grouping in admin_panel.py" />
          <div className="space-y-4">
            {[
              {
                icon: Layers,
                title: 'Group Header Elements',
                before: 'st.title() and st.write() with separate st.columns() for search',
                after: 'Single st.markdown() with .ea-header class containing title, subtitle, and search in a flex row',
                reason: 'Eliminates awkward blank space, creates unified header band',
              },
              {
                icon: Grid3x3,
                title: 'Wrap Metrics in Consistent Columns',
                before: 'st.columns(4) with varying padding per metric',
                after: 'st.columns([1,1,1,1], gap="medium") with CSS-styled [data-testid="stMetric"]',
                reason: 'Ensures equal sizing and consistent card appearance',
              },
              {
                icon: AlignVerticalSpaceAround,
                title: 'Standardize Section Spacing',
                before: 'Mixed st.write("") and st.markdown("<br>") for vertical gaps',
                after: 'Use st.markdown(\'<div style="margin-top: 2rem;"></div>\') or CSS margin on .ea-card',
                reason: 'Creates predictable vertical rhythm throughout the page',
              },
              {
                icon: Layers,
                title: 'Card-Wrap All Tab Content',
                before: 'Raw st.dataframe() and st.form() without visual containers',
                after: 'Wrap in .ea-card with .ea-card-header and .ea-card-body divs',
                reason: 'Unifies visual treatment, creates clear content boundaries',
              },
              {
                icon: Grid3x3,
                title: 'Use 2/3 + 1/3 Split for Form Tabs',
                before: 'Full-width table then full-width form below',
                after: 'col1, col2 = st.columns([2, 1]) — table left, form right',
                reason: 'Better use of horizontal space on desktop, reduces scrolling',
              },
            ].map((adj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.06 }}
                className="bg-white rounded-xl border border-slate-200/80 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center shrink-0">
                    <adj.icon size={18} className="text-gold-500" />
                  </div>
                  <div className="space-y-3 flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800">{adj.title}</h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-danger-light/50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-danger uppercase tracking-wider mb-1">Before</p>
                        <p className="text-xs text-slate-600">{adj.before}</p>
                      </div>
                      <div className="bg-success-light/50 rounded-lg p-3">
                        <p className="text-[10px] font-semibold text-success uppercase tracking-wider mb-1">After</p>
                        <p className="text-xs text-slate-600">{adj.after}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500"><strong className="text-slate-700">Why:</strong> {adj.reason}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Micro-interactions */}
        <motion.section {...fadeUp} transition={{ delay: 0.3 }}>
          <SectionTitle title="Micro-Interactions" description="Subtle hover/focus/active states — CSS only, no heavy animation" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Element</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Trigger</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Effect</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { el: 'Metric Cards', trigger: 'hover', effect: 'translateY(-1px) + shadow-md', dur: '300ms' },
                    { el: 'Table Rows', trigger: 'hover', effect: 'background → cream-50', dur: '150ms' },
                    { el: 'Buttons (Primary)', trigger: 'hover / active', effect: 'darken bg + translateY(-1px) / scale(0.98)', dur: '200ms' },
                    { el: 'Form Inputs', trigger: 'focus', effect: 'ring-2 burgundy-400/30 + border change', dur: '200ms' },
                    { el: 'Tab Items', trigger: 'click', effect: 'spring layout animation (bg pill)', dur: '~300ms spring' },
                    { el: 'FAQ List Items', trigger: 'hover', effect: 'bg cream-50 + reveal Edit button', dur: '150ms' },
                    { el: 'File Upload Zone', trigger: 'hover', effect: 'border-color → burgundy-300 + subtle bg tint', dur: '300ms' },
                    { el: 'Status Badges', trigger: 'static', effect: 'Animated dot pulse (optional)', dur: '2s loop' },
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-medium text-slate-800">{row.el}</td>
                      <td className="px-4 py-3"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">{row.trigger}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{row.effect}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{row.dur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      <p className="text-sm text-slate-500 mt-0.5">{description}</p>
    </div>
  );
}
