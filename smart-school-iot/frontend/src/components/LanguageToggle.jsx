import React, { useState, useRef, useEffect } from 'react';
import { useLang } from '../context/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageToggle = () => {
  const { lang, setLanguage, languages } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 hover:text-white transition-all text-xs font-medium"
        title="Change language"
      >
        <Globe className="w-3.5 h-3.5 text-teal-400" />
        <span className="hidden sm:inline">{current.flag} {current.nativeLabel}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Select Language</p>
          </div>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code); setOpen(false); }}
              className={`w-full flex items-center space-x-2.5 px-3 py-2.5 text-left hover:bg-slate-800 transition-colors ${
                lang === l.code ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300'
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <div>
                <p className="text-xs font-semibold leading-none">{l.nativeLabel}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{l.label}</p>
              </div>
              {lang === l.code && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400"></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
