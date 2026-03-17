import { NavLink } from 'react-router-dom';
import { ExternalLink, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const CHAT_APP_URL = import.meta.env.VITE_CHAT_APP_URL || 'http://localhost:5173';

export default function SideNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-burgundy-500 text-white p-2 rounded-lg shadow-lg"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-burgundy-700 z-40 transform transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="p-6 border-b border-burgundy-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gold-400 flex items-center justify-center">
              <span className="text-burgundy-800 font-bold text-sm">EA</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-tight">EduAgent AI</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <NavLink
            to="/admin"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-burgundy-500/60 text-white shadow-sm'
                  : 'text-burgundy-200 hover:bg-burgundy-600/50 hover:text-white'
              }`
            }
          >
            <Shield size={18} />
            Admin Panel
          </NavLink>
          <a
            href={`${CHAT_APP_URL}/`}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-burgundy-200 hover:bg-burgundy-600/50 hover:text-white transition-all duration-200"
          >
            <ExternalLink size={18} />
            Open Student Site
          </a>
        </nav>

        <div className="p-4 border-t border-burgundy-600">
          <p className="text-burgundy-300 text-xs text-center">Admin Site</p>
        </div>
      </aside>
    </>
  );
}
