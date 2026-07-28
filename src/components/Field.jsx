export default function Field({ label, required, children }) {
  return (
    <div className="mb-3.5">
      <label className="block text-xs font-medium text-neutral-600 mb-1.5">
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      {children}
    </div>
  );
}
