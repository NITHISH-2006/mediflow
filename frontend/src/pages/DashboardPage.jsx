import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CreditCard, HeartPulse, Users, Stethoscope, ArrowUpRight, DollarSign, Activity, PlusCircle, UserPlus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api, { unwrap } from '../lib/api';
import { toast } from 'sonner';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useCountUp } from '../lib/useCountUp';

const statCards = [
  { key: 'total_patients', label: 'Registered Patients', icon: Users, color: 'from-cyan-500 to-teal-400', desc: 'Active clinical records' },
  { key: 'total_doctors', label: 'Attending Physicians', icon: Stethoscope, color: 'from-emerald-500 to-teal-500', desc: 'Active medical staff' },
  { key: 'today_appointments', label: "Today's Consultations", icon: CalendarDays, color: 'from-blue-500 to-cyan-400', desc: 'Scheduled for today' },
  { key: 'pending_bills', label: 'Pending Invoices', icon: CreditCard, color: 'from-amber-500 to-orange-400', desc: 'Awaiting settlement' },
];

function StatCard({ statKey, label, icon: Icon, color, desc, index, value }) {
  const animated = useCountUp(value, 1000, value > 0);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="glass-card glass-card-hover p-5 rounded-3xl relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className={`rounded-2xl bg-gradient-to-br ${color} p-3 text-slate-950 shadow-md`}>
          <Icon size={20} className="stroke-[2.5]" />
        </div>
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{statKey.replace(/_/g, ' ')}</span>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-extrabold text-white tracking-tight tabular-nums">{animated}</p>
        <p className="text-sm font-medium text-slate-300 mt-1">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [statsResponse, appointmentsResponse] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/appointments?date=' + new Date().toISOString().slice(0, 10)),
        ]);
        setStats(unwrap(statsResponse));
        setAppointments(unwrap(appointmentsResponse)?.data || []);
      } catch (error) {
        toast.error(error.message || 'Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const revenue = useMemo(() => Number(stats?.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), [stats]);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-widest">
            <Activity size={16} /> Clinical Command Center
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h2>
          <p className="mt-1.5 text-sm text-slate-300 max-w-xl">
            Real-time overview of hospital admissions, doctor schedules, patient visits, and revenue stream.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <div className="glass-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 border border-emerald-500/30 bg-emerald-500/10">
            <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-400">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Total Revenue</p>
              <p className="text-xl font-bold text-white">${revenue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/patients')}
          className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 text-left group"
        >
          <div className="rounded-xl bg-cyan-500/15 p-2.5 text-cyan-400 group-hover:scale-110 transition">
            <UserPlus size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Patients</p>
            <p className="text-[11px] text-slate-400">Manage Directory</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/appointments')}
          className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 text-left group"
        >
          <div className="rounded-xl bg-teal-500/15 p-2.5 text-teal-400 group-hover:scale-110 transition">
            <PlusCircle size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Appointments</p>
            <p className="text-[11px] text-slate-400">Schedule Visit</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/emr')}
          className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 text-left group"
        >
          <div className="rounded-xl bg-emerald-500/15 p-2.5 text-emerald-400 group-hover:scale-110 transition">
            <HeartPulse size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">EMR Notes</p>
            <p className="text-[11px] text-slate-400">Clinical History</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/billing')}
          className="glass-card glass-card-hover p-4 rounded-2xl flex items-center gap-3 text-left group"
        >
          <div className="rounded-xl bg-amber-500/15 p-2.5 text-amber-400 group-hover:scale-110 transition">
            <CreditCard size={18} />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">Billing</p>
            <p className="text-[11px] text-slate-400">Invoices & Fees</p>
          </div>
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center text-slate-400 rounded-3xl border border-white/10">
          <Clock size={28} className="mx-auto mb-3 animate-spin text-cyan-400" />
          <p className="text-sm font-medium">Loading clinical metrics...</p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map(({ key, label, icon: Icon, color, desc }, index) => (
              <StatCard key={key} statKey={key} label={label} icon={Icon} color={color} desc={desc} index={index} value={stats?.[key] ?? 0} />
            ))}
          </div>

          {/* Schedule & Highlights Grid */}
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            {/* Today's Consultations Timeline */}
            <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Care Timeline</p>
                  <h3 className="text-xl font-bold text-white">Today's Appointments</h3>
                </div>
                <button
                  onClick={() => navigate('/appointments')}
                  className="flex items-center gap-1 text-xs text-cyan-300 hover:text-cyan-200 font-semibold transition"
                >
                  View All <ArrowUpRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {appointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">
                    No consultations scheduled for today.
                  </div>
                ) : (
                  appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3.5 hover:border-cyan-500/30 transition"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300 font-bold text-xs">
                          {appointment.time || '09:00'}
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{appointment.patient?.name || 'Patient'}</p>
                          <p className="text-xs text-slate-400">
                            Dr. {appointment.doctor?.name || 'Doctor'} • <span className="text-slate-300">{appointment.reason || 'General Consultation'}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant={appointment.status === 'Completed' ? 'success' : appointment.status === 'Cancelled' ? 'danger' : 'default'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Column Highlights & Stats */}
            <div className="space-y-6">
              {/* Completed Consultations Card */}
              <div className="glass-card p-6 rounded-3xl border border-white/10">
                <div className="flex items-center gap-2.5 text-emerald-400 mb-4">
                  <HeartPulse size={20} />
                  <h4 className="font-bold text-white">Daily Operational Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400">Completed Visits</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">{stats?.completed_appointments_today ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs text-slate-400">DB Status</p>
                    <p className="mt-1 text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" /> Active Postgres
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & System Info Card */}
              <div className="glass-card p-6 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-cyan-950/30">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Activity size={14} /> Hospital Infrastructure
                </div>
                <h4 className="text-sm font-semibold text-white">Encrypted & Audited Workspace</h4>
                <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                  All medical health records (EMR), doctor schedules, and billing ledgers are encrypted with JWT authentication and RBAC controls.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
