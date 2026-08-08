export function Card({ className = '', children, ...props }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-900/70 shadow-soft backdrop-blur ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return <div className={`p-6 ${className}`} {...props}>{children}</div>;
}

export function CardTitle({ className = '', children, ...props }) {
  return <h3 className={`text-lg font-semibold text-white ${className}`} {...props}>{children}</h3>;
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>;
}
