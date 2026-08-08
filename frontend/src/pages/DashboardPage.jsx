import { useEffect, useMemo, useState, useRef } from 'react';
import { CalendarDays, CreditCard, HeartPulse, Users, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';
import api, { unwrap } from '../lib/api';
import { toast } from 'sonner';
import { fadeInUp } from '../lib/animations';
import { Badge } from '../components/ui/Badge';

const statCards = [
  { key: 'total_patients', label: 'Patients', icon: Users, color: 'from-cyan-500 to-teal-400' },
  { key: 'total_doctors', label: 'Doctors', icon: Stethoscope, color: 'from-blue-500 to-cyan-400' },
  { key: 'today_appointments', label: 'Appointments Today', icon: CalendarDays, color: 'from-violet-500 to-fuchsia-400' },
  { key: 'pending_bills', label: 'Pending Bills', icon: CreditCard, color: 'from-amber-500 to-orange-400' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const heroRef = useRef(null);

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

  useEffect(() => {
    if (heroRef.current) fadeInUp(heroRef.current);
  }, []);

  const revenue = useMemo(() => Number(stats?.revenue || 0).toLocaleString(), [stats]);

  return (
    <div className="space-y-6" ref={heroRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Overview</p>
          <h2 className="text-2xl font-semibold text-white">Hospital command center</h2>
        </div>
        <div className="rounded-2xl border border-brand-500/20 bg-brand-900/20 px-4 py-3 text-sm text-brand-100">
          Revenue: ${revenue}
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-8 text-slate-300">Loading dashboard metrics…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map(({ key, label, icon: Icon, color }) => (
              <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 shadow-soft">
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br ${color} p-3 text-white`}>
                  <Icon size={18} />
                </div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats?.[key] ?? 0}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Today’s appointments</p>
                  <h3 className="text-xl font-semibold text-white">Scheduled care timeline</h3>
                </div>
                <div className="rounded-2xl bg-brand-600/20 p-2 text-brand-200">
                  <CalendarDays size={18} />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {appointments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No appointments scheduled for today.</div>
                ) : (
                  appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{appointment.patient?.name || 'Patient'}</p>
                        <p className="text-sm text-slate-400">{appointment.doctor?.name || 'Doctor'} • {appointment.time}</p>
                      </div>
                      <Badge variant={appointment.status === 'Completed' ? 'success' : appointment.status === 'Cancelled' ? 'danger' : 'default'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
              <div className="flex items-center gap-2 text-brand-200">
                <HeartPulse size={18} />
                <p className="text-sm">Clinical highlights</p>
              </div>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                  <p className="font-medium text-white">Completed today</p>
                  <p className="mt-2 text-2xl font-semibold text-brand-200">{stats?.completed_appointments_today ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                  <p className="font-medium text-white">Operational health</p>
                  <p className="mt-2">All primary services are online and responding normally.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
