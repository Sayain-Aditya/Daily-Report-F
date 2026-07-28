import { useState } from 'react';
import { ChevronLeft, Save, Users, Info } from 'lucide-react';
import Field from './Field';

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400 placeholder:text-slate-400 transition-all duration-200 shadow-xs';

export default function SettingsView({ settings, onSave, onBack }) {
  const [officer, setOfficer] = useState(settings.salesOfficer || '');

  return (
    <div className="animate-slide-up">
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs transition-colors">
        <ChevronLeft size={14} /> Back to Reports
      </button>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">Settings</h2>
        <p className="text-xs text-slate-500 mt-0.5">Manage your profile and preferences</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-5 mb-4">
        <Field label="Sales Officer Name">
          <input
            className={inputCls}
            placeholder="Your name — shown on reports and WhatsApp messages"
            value={officer}
            onChange={(e) => setOfficer(e.target.value)}
          />
        </Field>
        <button
          onClick={() => onSave({ salesOfficer: officer })}
          className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition-all duration-200 shadow-card-md"
        >
          <Save size={16} /> Save Settings
        </button>
      </div>

      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Info size={14} className="text-blue-500" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Your visit data is saved on this device/account only. Use <span className="font-semibold text-slate-600">Export Excel</span> from the Reports tab any time to back it up or share it.
          </p>
        </div>
      </div>
    </div>
  );
}
