const statusStyles: Record<string, string> = {
  pending: 'bg-warning-light text-warning border border-amber-200',
  'in-progress': 'bg-info-light text-info border border-blue-200',
  resolved: 'bg-success-light text-success border border-emerald-200',
  escalated: 'bg-danger-light text-danger border border-red-200',
  active: 'bg-success-light text-success border border-emerald-200',
  inactive: 'bg-slate-100 text-slate-500 border border-slate-200',
};

const dotColors: Record<string, string> = {
  pending: 'bg-warning',
  'in-progress': 'bg-info',
  resolved: 'bg-success',
  escalated: 'bg-danger',
  active: 'bg-success',
  inactive: 'bg-slate-400',
};

export default function StatusBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[key] || statusStyles.inactive}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColors[key] || dotColors.inactive}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
