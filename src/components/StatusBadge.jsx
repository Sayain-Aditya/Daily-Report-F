export default function StatusBadge({ status }) {
  const map = {
    'New Client': 'bg-blue-50 text-blue-700',
    'Existing Client': 'bg-emerald-50 text-emerald-700',
    'Follow-up': 'bg-amber-50 text-amber-700',
    'Competition': 'bg-rose-50 text-rose-700',
  };

  return (
    <span className={`text-[10px] font-medium px-2 py-1 rounded-full whitespace-nowrap ${map[status] || 'bg-neutral-100 text-neutral-600'}`}>
      {status}
    </span>
  );
}
