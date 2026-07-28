export default function Field({ label, required, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
        {label} {required && <span className="text-orange-500 normal-case tracking-normal">*</span>}
      </label>
      {children}
    </div>
  );
}
