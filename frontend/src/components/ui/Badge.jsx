export function Badge({ className = '', children, variant = 'default' }) {
  const variants = {
    default: 'border-brand-500/20 bg-brand-500/10 text-brand-200',
    success: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    danger: 'border-rose-500/20 bg-rose-500/10 text-rose-300',
    warning: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  };

  return <span className={`rounded-full border px-3 py-1 text-sm ${variants[variant] || variants.default} ${className}`}>{children}</span>;
}
