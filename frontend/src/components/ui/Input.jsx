export function Input({ className = '', ...props }) {
  return <input className={`w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-500 ${className}`} {...props} />;
}

export function Textarea({ className = '', ...props }) {
  return <textarea className={`min-h-24 w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-500 ${className}`} {...props} />;
}

export function Select({ className = '', ...props }) {
  return <select className={`w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-500 ${className}`} {...props} />;
}
