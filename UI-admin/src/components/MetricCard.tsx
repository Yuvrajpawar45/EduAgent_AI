import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: string; direction: 'up' | 'down' | 'flat' };
  color: 'burgundy' | 'gold' | 'success' | 'info';
  delay?: number;
}

const colorMap = {
  burgundy: {
    bg: 'bg-burgundy-50',
    icon: 'bg-burgundy-500 text-white',
    trend: 'text-burgundy-500',
  },
  gold: {
    bg: 'bg-gold-50',
    icon: 'bg-gold-400 text-burgundy-800',
    trend: 'text-gold-500',
  },
  success: {
    bg: 'bg-success-light',
    icon: 'bg-success text-white',
    trend: 'text-success',
  },
  info: {
    bg: 'bg-info-light',
    icon: 'bg-info text-white',
    trend: 'text-info',
  },
};

export default function MetricCard({ label, value, icon: Icon, trend, color, delay = 0 }: MetricCardProps) {
  const c = colorMap[color];
  const TrendIcon = trend?.direction === 'up' ? TrendingUp : trend?.direction === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-white rounded-xl border border-slate-200/80 p-5 hover:shadow-md transition-shadow duration-300 group"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${c.trend}`}>
              <TrendIcon size={12} />
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg ${c.icon} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}
