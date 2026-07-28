import { useState, useRef, useEffect } from 'react';
import { X, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import Field from './Field';
import { CLIENT_STATUS, MEETING_PLACE } from '../constants';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-slate-400 transition-all duration-200 shadow-xs';
const selectCls = inputCls + ' appearance-none cursor-pointer pr-9';

function SuggestInput({ value, onChange, suggestions = [], placeholder, id }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = value.trim()
    ? suggestions.filter((s) => s.toLowerCase().includes(value.trim().toLowerCase()) && s.toLowerCase() !== value.trim().toLowerCase())
    : [];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        id={id}
        className={inputCls}
        placeholder={placeholder}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl shadow-card-md mt-1.5 max-h-44 overflow-y-auto animate-slide-down">
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false); }}
              className="px-4 py-2.5 text-sm text-slate-700 hover:bg-orange-50 hover:text-orange-700 cursor-pointer first:rounded-t-xl last:rounded-b-xl transition-colors"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select className={selectCls} value={value} onChange={onChange}>
        {options.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default function FormView({
  form, setForm, onSubmit, editing, onCancel,
  firmSuggestions = [], ownerSuggestions = [], saveAndAdd, setSaveAndAdd, duplicateWarning,
}) {
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }));

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{editing ? 'Edit Visit' : "Log Today's Visit"}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{editing ? 'Update the entry details below' : 'Fill in the visit details'}</p>
        </div>
        {editing && (
          <button onClick={onCancel} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors">
            <X size={13} /> Cancel
          </button>
        )}
      </div>

      {duplicateWarning && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-2xl px-4 py-3 mb-4 animate-fade-in">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-500" />
          <span>You already logged this firm and phone number today. Saving again will add a second entry.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 space-y-0">
        <Field label="Date" required>
          <input type="date" className={inputCls} value={form.date} onChange={set('date')} />
        </Field>

        <Field label="Firm Name" required>
          <SuggestInput value={form.firmName} onChange={set('firmName')} suggestions={firmSuggestions} placeholder="e.g. Pintu Tyres" />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Owner / Contact Person" required>
            <SuggestInput value={form.owner} onChange={set('owner')} suggestions={ownerSuggestions} placeholder="e.g. Pratul Yadav" />
          </Field>
          <Field label="Phone" required>
            <input className={inputCls} placeholder="10-digit number" inputMode="numeric" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        <Field label="Designation">
          <input className={inputCls} placeholder="e.g. Owner, Manager, Purchase Head" value={form.designation} onChange={set('designation')} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Client Status">
            <SelectField value={form.clientStatus} onChange={set('clientStatus')} options={CLIENT_STATUS} />
          </Field>
          <Field label="Meeting Place">
            <SelectField value={form.meetingPlace} onChange={set('meetingPlace')} options={MEETING_PLACE} />
          </Field>
        </div>

        <Field label="Location">
          <input className={inputCls} placeholder="e.g. Near Naveen Mandi, Rustampur" value={form.location} onChange={set('location')} />
        </Field>

        <Field label="Remarks">
          <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What happened in the visit, next steps..." value={form.remarks} onChange={set('remarks')} />
        </Field>

        {!editing && (
          <label className="flex items-center gap-2.5 py-1 text-sm text-slate-600 select-none cursor-pointer group">
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition-colors ${saveAndAdd ? 'bg-orange-500 border-orange-500' : 'border-slate-300 group-hover:border-orange-400'}`}>
              {saveAndAdd && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <input type="checkbox" className="sr-only" checked={saveAndAdd} onChange={(e) => setSaveAndAdd(e.target.checked)} />
            Keep adding after save
          </label>
        )}

        <div className="pt-2">
          <button
            onClick={onSubmit}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-card-md"
          >
            <Save size={16} />
            {editing ? 'Update Entry' : saveAndAdd ? 'Save & Add Next' : 'Save Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
