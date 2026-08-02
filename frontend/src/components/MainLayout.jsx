import { NavLink, Outlet } from 'react-router-dom';
import { Activity, CalendarDays, CreditCard, FileText, LayoutDashboard, LogOut, Menu, Stethoscope, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fadeInUp } from '../lib/animations';

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

export default function MainLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const shellRef = useRef(null);
  const roleLinks = navigation[user?.role] || navigation.Receptionist;

  useEffect(() => {
    if (shellRef.current) fadeInUp(shellRef.current, { duration: 400 });
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-slate-100" ref={shellRef}>
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-30 w-72 border-r border-white/10 bg-slate-950/95 p-5 backdrop-blur transition lg:static lg:translate-x-0`}>
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-cyan-500 p-2 text-white shadow-soft">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-lg font-semibold">MediFlow</p>
              <p className="text-sm text-slate-400">Hospital Management</p>
            </div>
          </div>

          <nav className="mt-6 space-y-2">
            {roleLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-4 py-3 transition ${isActive ? 'bg-brand-600/20 text-brand-200 shadow-soft' : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-900/40 to-slate-900/60 p-4">
            <p className="text-sm text-slate-300">Signed in as</p>
            <p className="font-semibold">{user?.name}</p>
            <p className="text-sm text-slate-400">{user?.role}</p>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-white/10 bg-slate-900/70 px-4 py-4 backdrop-blur lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="rounded-xl border border-white/10 p-2 lg:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu size={18} />
                </button>
                <div>
                  <p className="text-sm text-slate-400">Clinical Operations Portal</p>
                  <h1 className="text-xl font-semibold">MediFlow Overview</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-slate-300 md:block">
                  {user?.email}
                </div>
                <button onClick={logout} className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/70 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-700">
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      {mobileOpen && (
        <button className="fixed inset-0 z-20 bg-slate-950/70 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu">
          <span className="sr-only">Close menu</span>
        </button>
      )}
    </div>
  );
}
