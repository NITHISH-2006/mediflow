const base = 'inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:cursor-not-allowed disabled:opacity-60';
const variants = {
  default: 'border-transparent bg-brand-600 text-white hover:bg-brand-500',
  secondary: 'border-white/10 bg-slate-800/70 text-slate-100 hover:bg-slate-700',
  ghost: 'border-transparent bg-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white',
  destructive: 'border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
};

export function Button({ className = '', variant = 'default', ...props }) {
  return <button className={`${base} ${variants[variant] || variants.default} ${className}`} {...props} />;
}
