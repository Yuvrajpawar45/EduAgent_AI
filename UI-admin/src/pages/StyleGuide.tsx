import { motion } from 'framer-motion';
import StatusBadge from '../components/StatusBadge';
import { Button } from '../components/FormField';
import { Plus, Download, Trash2 } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

export default function StyleGuide() {
  return (
    <div className="min-h-screen bg-cream-50">
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="flex items-center h-16">
            <h1 className="text-lg font-bold text-slate-800">UI Style Guide</h1>
            <span className="ml-3 text-xs bg-gold-100 text-gold-600 px-2 py-0.5 rounded-full font-semibold">v1.0</span>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-10 space-y-14">
        {/* Colors */}
        <motion.section {...fadeUp}>
          <SectionTitle title="Color Palette" description="Brand colors refined for modern dashboard UI" />
          <div className="space-y-6">
            <ColorRow label="Burgundy (Primary)" colors={[
              { name: '50', hex: '#FDF2F5', className: 'bg-burgundy-50' },
              { name: '100', hex: '#F9E0E7', className: 'bg-burgundy-100' },
              { name: '200', hex: '#F0B8C8', className: 'bg-burgundy-200' },
              { name: '300', hex: '#D4789A', className: 'bg-burgundy-300' },
              { name: '400', hex: '#9E3A5E', className: 'bg-burgundy-400' },
              { name: '500', hex: '#6B1D3A', className: 'bg-burgundy-500' },
              { name: '600', hex: '#541530', className: 'bg-burgundy-600' },
              { name: '700', hex: '#3D0F23', className: 'bg-burgundy-700' },
              { name: '800', hex: '#2A0A18', className: 'bg-burgundy-800' },
            ]} />
            <ColorRow label="Gold (Accent)" colors={[
              { name: '50', hex: '#FFFDF5', className: 'bg-gold-50' },
              { name: '100', hex: '#FFF8E1', className: 'bg-gold-100' },
              { name: '200', hex: '#FFECB3', className: 'bg-gold-200' },
              { name: '300', hex: '#FFD54F', className: 'bg-gold-300' },
              { name: '400', hex: '#C9A84C', className: 'bg-gold-400' },
              { name: '500', hex: '#A68A3E', className: 'bg-gold-500' },
              { name: '600', hex: '#7D6730', className: 'bg-gold-600' },
            ]} />
            <ColorRow label="Cream (Background)" colors={[
              { name: '50', hex: '#FFF9F0', className: 'bg-cream-50' },
              { name: '100', hex: '#FFF3E0', className: 'bg-cream-100' },
              { name: '200', hex: '#FFE8C8', className: 'bg-cream-200' },
              { name: '300', hex: '#FFD9A8', className: 'bg-cream-300' },
            ]} />
            <ColorRow label="Semantic" colors={[
              { name: 'Success', hex: '#059669', className: 'bg-success' },
              { name: 'Warning', hex: '#D97706', className: 'bg-warning' },
              { name: 'Danger', hex: '#DC2626', className: 'bg-danger' },
              { name: 'Info', hex: '#2563EB', className: 'bg-info' },
            ]} />
          </div>
        </motion.section>

        {/* Typography */}
        <motion.section {...fadeUp} transition={{ delay: 0.1 }}>
          <SectionTitle title="Typography" description="DM Sans for UI, JetBrains Mono for data" />
          <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden">
            {[
              { label: 'Page Title', className: 'text-2xl font-bold text-slate-800', text: 'Admin Dashboard', spec: 'DM Sans · 24px · Bold · slate-800' },
              { label: 'Section Title', className: 'text-lg font-bold text-slate-800', text: 'Escalated Queries', spec: 'DM Sans · 18px · Bold · slate-800' },
              { label: 'Card Title', className: 'text-base font-semibold text-slate-800', text: 'FAQ Management', spec: 'DM Sans · 16px · SemiBold · slate-800' },
              { label: 'Body', className: 'text-sm text-slate-700', text: 'Fee payment not reflected in portal', spec: 'DM Sans · 14px · Regular · slate-700' },
              { label: 'Caption / Label', className: 'text-xs font-medium text-slate-500 uppercase tracking-wider', text: 'ACTIVE FAQS', spec: 'DM Sans · 12px · Medium · slate-500 · uppercase · tracking-wider' },
              { label: 'Monospace Data', className: 'text-xs font-mono text-slate-400', text: 'ESC-001 · 2024-12-18', spec: 'JetBrains Mono · 12px · Regular · slate-400' },
              { label: 'Metric Value', className: 'text-2xl font-bold text-slate-800', text: '₹4.2L', spec: 'DM Sans · 24px · Bold · slate-800' },
            ].map((item, i) => (
              <div key={i} className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 px-6 py-4 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="text-xs font-semibold text-burgundy-400 w-32 shrink-0">{item.label}</span>
                <span className={item.className}>{item.text}</span>
                <span className="text-[10px] text-slate-300 ml-auto font-mono hidden lg:block">{item.spec}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Spacing Scale */}
        <motion.section {...fadeUp} transition={{ delay: 0.15 }}>
          <SectionTitle title="Spacing Scale" description="Consistent 4px base unit system" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="space-y-3">
              {[
                { name: 'xs', value: '4px', tw: 'p-1', use: 'Icon gaps, tight spacing' },
                { name: 'sm', value: '8px', tw: 'p-2', use: 'Inner element padding' },
                { name: 'md', value: '12px', tw: 'p-3', use: 'Form field gaps' },
                { name: 'lg', value: '16px', tw: 'p-4', use: 'Card inner padding, list items' },
                { name: 'xl', value: '24px', tw: 'p-6', use: 'Card padding, section gaps' },
                { name: '2xl', value: '32px', tw: 'p-8', use: 'Page vertical rhythm' },
                { name: '3xl', value: '40px', tw: 'p-10', use: 'Page horizontal padding (desktop)' },
              ].map((s) => (
                <div key={s.name} className="flex items-center gap-4">
                  <span className="text-xs font-mono text-slate-400 w-10">{s.name}</span>
                  <div className="w-48 flex items-center">
                    <div className="h-3 bg-burgundy-200 rounded" style={{ width: s.value }} />
                    <span className="text-xs text-slate-500 ml-2">{s.value}</span>
                  </div>
                  <span className="text-xs font-mono text-burgundy-400">{s.tw}</span>
                  <span className="text-xs text-slate-400 hidden sm:block">{s.use}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Shadows & Radii */}
        <motion.section {...fadeUp} transition={{ delay: 0.2 }}>
          <SectionTitle title="Shadows & Radii" description="Subtle elevation for card hierarchy" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Card Default', shadow: 'shadow-sm', radius: 'rounded-xl', desc: '0 1px 2px rgba(0,0,0,0.05)' },
              { label: 'Card Hover', shadow: 'shadow-md', radius: 'rounded-xl', desc: '0 4px 6px rgba(0,0,0,0.07)' },
              { label: 'Dropdown', shadow: 'shadow-lg', radius: 'rounded-xl', desc: '0 10px 15px rgba(0,0,0,0.1)' },
              { label: 'Modal', shadow: 'shadow-xl', radius: 'rounded-2xl', desc: '0 20px 25px rgba(0,0,0,0.1)' },
            ].map((s) => (
              <div key={s.label} className={`bg-white ${s.shadow} ${s.radius} border border-slate-200/80 p-6 text-center`}>
                <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                <p className="text-xs text-slate-400 mt-1">{s.radius}</p>
                <p className="text-[10px] text-slate-300 mt-1 font-mono">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Status Badges */}
        <motion.section {...fadeUp} transition={{ delay: 0.25 }}>
          <SectionTitle title="Status Badges" description="Consistent status indicators across all tabs" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex flex-wrap gap-3">
              {['Pending', 'In-Progress', 'Resolved', 'Escalated', 'Active', 'Inactive'].map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>
            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Badge Anatomy</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Colored dot indicator (1.5×1.5) for quick scan</li>
                <li>• Pill shape with subtle border matching the status color</li>
                <li>• Font: 12px · SemiBold · Capitalized first letter</li>
                <li>• Padding: px-2.5 py-1 (horizontal emphasis)</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Buttons */}
        <motion.section {...fadeUp} transition={{ delay: 0.3 }}>
          <SectionTitle title="Buttons" description="Action hierarchy: Primary → Secondary → Ghost → Danger" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="flex flex-wrap gap-3">
              <Button variant="primary"><Plus size={14} />Add New</Button>
              <Button variant="secondary"><Download size={14} />Export</Button>
              <Button variant="ghost">Cancel</Button>
              <Button variant="danger"><Trash2 size={14} />Delete</Button>
            </div>
            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Button Specs</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Padding: px-4 py-2.5 (comfortable click target)</li>
                <li>• Border-radius: rounded-lg (8px)</li>
                <li>• Font: 14px · Medium</li>
                <li>• Micro-interaction: active:scale-[0.98] for tactile feedback</li>
                <li>• Icon + text gap: gap-2 (8px)</li>
              </ul>
            </div>
          </div>
        </motion.section>

        {/* Form Fields */}
        <motion.section {...fadeUp} transition={{ delay: 0.35 }}>
          <SectionTitle title="Form Controls" description="Input, textarea, select with consistent focus states" />
          <div className="bg-white rounded-xl border border-slate-200/80 p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Text Input</label>
                <input
                  type="text"
                  placeholder="Enter value..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-burgundy-400/30 focus:border-burgundy-400 transition-all duration-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Select</label>
                <select className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-burgundy-400/30 focus:border-burgundy-400 transition-all duration-200">
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700">Date Input</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-burgundy-400/30 focus:border-burgundy-400 transition-all duration-200"
                />
              </div>
            </div>
            <div className="mt-6 bg-slate-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-slate-600 mb-2">Focus State</p>
              <ul className="text-xs text-slate-500 space-y-1">
                <li>• Ring: 2px burgundy-400 at 30% opacity</li>
                <li>• Border: solid burgundy-400</li>
                <li>• Transition: 200ms ease for smooth focus/blur</li>
              </ul>
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

function ColorRow({ label, colors }: { label: string; colors: { name: string; hex: string; className: string }[] }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <div key={c.name} className="group">
            <div className={`w-16 h-16 rounded-lg ${c.className} border border-slate-200/50 shadow-sm group-hover:scale-105 transition-transform duration-200`} />
            <p className="text-[10px] font-semibold text-slate-600 mt-1.5">{c.name}</p>
            <p className="text-[10px] text-slate-400 font-mono">{c.hex}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
