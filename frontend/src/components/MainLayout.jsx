import { NavLink, Outlet } from 'react-router-dom';
import { Activity, CalendarDays, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Stethoscope, Users, X, Sparkles, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const navigation = {
  Admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/doctors', label: 'Doctors', icon: Stethoscope },
    { to: '/emr', label: 'EMR Notes', icon: FileText },
    { to: '/billing', label: 'Billing', icon: CreditCard },
  ],
  Doctor: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/emr', label: 'EMR Notes', icon: FileText },
  ],
  Receptionist: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: 'Patients', icon: Users },
    { to: '/appointments', label: 'Appointments', icon: CalendarDays },
    { to: '/billing', label: 'Billing', icon: CreditCard },
  ],
};

const roleBadgeColors = {
  Admin: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Doctor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Receptionist: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleLinks = navigation[user?.role] || navigation.Receptionist;

  return (
    <div className="min-h-screen bg-transparent text-slate-100 font-sans">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-white/10 bg-slate-950/90 p-6 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 flex flex-col justify-between`}>
          <div>
            {/* Brand Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-emerald-400 p-2.5 text-slate-950 shadow-lg shadow-cyan-500/20">
                  <Activity size={22} className="stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xl font-bold tracking-tight text-white">MediFlow</p>
                    <span className="rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-300">v2.0</span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">Smart Clinical System</p>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-white/10 p-1.5 text-slate-400 hover:text-white lg:hidden"
              >
                <X size={18} />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="mt-6 space-y-1.5">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Navigation</p>
              {roleLinks.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={19} className={`transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                      <span>{label}</span>
                      {isActive && (
                        <motion.span
                          layoutId="activeIndicator"
                          className="absolute right-3 h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* User Profile Footer in Sidebar */}
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-medium text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>PostgreSQL & Engine Online</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                </div>
                <span className={`rounded-xl border px-2 py-0.5 text-[11px] font-semibold ${roleBadgeColors[user?.role] || roleBadgeColors.Receptionist}`}>
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur-xl lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-300 hover:text-white lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu size={20} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-white tracking-tight sm:text-xl">MediFlow Clinical Operations</h1>
                    <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs text-cyan-300">
                      <Sparkles size={12} /> HIPAA-Ready Architecture
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 hidden sm:block">Real-time hospital management & Electronic Health Records</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-1.5 text-xs font-medium text-slate-300">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <span>Role: <strong className="text-white">{user?.role}</strong></span>
                </div>

                <button
                  onClick={logout}
                  className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 active:scale-[0.98] transition"
                >
                  <LogOut size={15} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Outlet */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
