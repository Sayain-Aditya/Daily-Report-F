import { useState } from 'react';
import { ChevronLeft, Save, Users } from 'lucide-react';
import Field from './Field';

const inputCls = 'w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 placeholder:text-neutral-400';

export default function SettingsView({ settings, onSave, onBack }) {
  const [officer, setOfficer] = useState(settings.salesOfficer || '');

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-xs text-neutral-500 mb-3 hover:text-neutral-700">
        <ChevronLeft size={14} /> Back to reports
      </button>
      <h2 className="text-base font-semibold mb-3">Settings</h2>
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <Field label="Your name (Sales Officer)">
          <input className={inputCls} placeholder="Shown on reports and WhatsApp messages" value={officer} onChange={(e) => setOfficer(e.target.value)} />
        </Field>
        <button onClick={() => onSave({ salesOfficer: officer })} className="w-full mt-1 bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-1.5">
          <Save size={15} /> Save settings
        </button>
      </div>
      <div className="bg-white rounded-xl border border-neutral-200 p-4 mt-3">
        <p className="text-xs text-neutral-500 leading-relaxed flex items-start gap-2">
          <Users size={14} className="text-neutral-400 shrink-0 mt-0.5" />
          Your visit data is saved on this device/account only. Use "Export Excel" from the Reports tab any time to back it up or share it.
        </p>
      </div>
    </div>
  );
}
