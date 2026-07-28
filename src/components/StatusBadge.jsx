export default function StatusBadge({ status }) {
  const map = {
    'New Client':      { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
    'Existing Client': { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    'Follow-up':       { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500' },
    'Competition':     { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500' },
  };
  const style = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${style.bg} ${style.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}
