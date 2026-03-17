import StatusBadge from './StatusBadge';
import { motion } from 'framer-motion';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'status' | 'action' | 'date';
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  onAction?: (row: Record<string, any>, action: string) => void;
}

export default function DataTable({ columns, data, onAction }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-${col.align || 'left'}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className="hover:bg-cream-50 transition-colors duration-150"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3.5 text-${col.align || 'left'} ${
                    col.type === 'date' ? 'text-slate-400 font-mono text-xs' : 'text-slate-700'
                  }`}
                >
                  {col.type === 'status' ? (
                    <StatusBadge status={row[col.key]} />
                  ) : col.type === 'action' ? (
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => onAction?.(row, 'view')}
                        className="px-3 py-1.5 text-xs font-medium text-burgundy-500 bg-burgundy-50 rounded-lg hover:bg-burgundy-100 transition-colors duration-200"
                      >
                        View
                      </button>
                      <button
                        onClick={() => onAction?.(row, 'resolve')}
                        className="px-3 py-1.5 text-xs font-medium text-success bg-success-light rounded-lg hover:bg-emerald-100 transition-colors duration-200"
                      >
                        Resolve
                      </button>
                    </div>
                  ) : (
                    <span>{row[col.key]}</span>
                  )}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
