import { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import Field from './Field';
import { CLIENT_STATUS, MEETING_PLACE } from '../constants';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400';

export default function FormView({
  form, setForm, onSubmit, editing, onCancel,
  firmSuggestions = [], ownerSuggestions = [], saveAndAdd, setSaveAndAdd, duplicateWarning,
}) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{editing ? 'Edit visit' : "Log today's visit"}</h2>
        {editing && (
          <button onClick={onCancel} className="text-xs text-neutral-500 flex items-center gap-1 hover:text-neutral-700">
            <X size={13} /> Cancel edit
          </button>
        )}
      </div>

      {duplicateWarning && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 mb-3">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          You already logged this firm and phone number today. Saving again will add a second entry.
        </div>
      )}

      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <Field label="Date" required>
          <input type="date" className={inputCls} value={form.date} onChange={set('date')} />
        </Field>

        <Field label="Firm name" required>
          <input list="firm-suggestions" className={inputCls} placeholder="e.g. Pintu Tyres" value={form.firmName} onChange={set('firmName')} />
          <datalist id="firm-suggestions">{firmSuggestions.map((f) => <option key={f} value={f} />)}</datalist>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner / contact person" required>
            <input list="owner-suggestions" className={inputCls} placeholder="e.g. Pratul Yadav" value={form.owner} onChange={set('owner')} />
            <datalist id="owner-suggestions">{ownerSuggestions.map((o) => <option key={o} value={o} />)}</datalist>
          </Field>
          <Field label="Phone" required>
            <input className={inputCls} placeholder="10-digit number" inputMode="numeric" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        <Field label="Designation">
          <input className={inputCls} placeholder="e.g. Owner, Manager, Purchase Head" value={form.designation} onChange={set('designation')} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Client status">
            <select className={inputCls} value={form.clientStatus} onChange={set('clientStatus')}>
              {CLIENT_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Meeting place">
            <select className={inputCls} value={form.meetingPlace} onChange={set('meetingPlace')}>
              {MEETING_PLACE.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Location">
          <input className={inputCls} placeholder="e.g. Near Naveen Mandi, Rustampur" value={form.location} onChange={set('location')} />
        </Field>

        <Field label="Remarks">
          <textarea className={inputCls + ' resize-none'} rows={3} placeholder="What happened in the visit, next steps..." value={form.remarks} onChange={set('remarks')} />
        </Field>

        {!editing && (
          <label className="flex items-center gap-2 mb-3 text-xs text-neutral-600 select-none">
            <input type="checkbox" className="w-3.5 h-3.5 accent-orange-600" checked={saveAndAdd} onChange={(e) => setSaveAndAdd(e.target.checked)} />
            Keep adding — stay here after saving for the next visit
          </label>
        )}

        <button onClick={onSubmit} className="w-full mt-1 bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform">
          <Save size={15} />
          {editing ? 'Update entry' : saveAndAdd ? 'Save & add next' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
