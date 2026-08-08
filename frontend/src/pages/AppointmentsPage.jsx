import { useEffect, useState } from 'react';
import { CalendarDays, Plus, Search, CheckCircle2, XCircle, Clock, User, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const emptyForm = { patient_id: '', doctor_id: '', date: '', time: '', reason: '' };

export default function AppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const canManage = user?.role === 'Admin' || user?.role === 'Receptionist';

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsResponse, patientsResponse, doctorsResponse] = await Promise.all([
        api.get(`/appointments${statusFilter ? `?status=${statusFilter}` : ''}`),
        api.get('/patients?limit=100'),
        api.get('/doctors?limit=100'),
      ]);
      const appointmentsPayload = unwrap(appointmentsResponse);
      setAppointments(appointmentsPayload?.data || []);
      setPatients(unwrap(patientsResponse)?.data || []);
      setDoctors(unwrap(doctorsResponse)?.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      toast.error('Only receptionists and admins can book appointments');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/appointments', { ...form, patient_id: Number(form.patient_id), doctor_id: Number(form.doctor_id) });
      toast.success('Appointment booked successfully');
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success(`Appointment marked ${status}`);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to update appointment status');
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await api.put(`/appointments/${id}/cancel`);
      toast.success('Appointment cancelled');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to cancel appointment');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <CalendarDays size={16} /> Scheduling Desk
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Care Consultations & Visits</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage patient bookings, consultation statuses, and doctor schedules.</p>
        </div>

        <div className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-cyan-300 border border-cyan-500/30">
          Scheduled Appointments: <span className="text-white font-bold">{appointments.length}</span>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Appointments List Column */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Care Queue</p>
              <h3 className="text-xl font-bold text-white">Consultation Timeline</h3>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 glass-pill p-1 rounded-2xl text-xs">
              {['', 'Scheduled', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-xl px-3 py-1.5 font-medium transition ${
                    statusFilter === st ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st || 'All'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading appointments queue...</div>
            ) : appointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No appointments found for the selected filter.
              </div>
            ) : (
              appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="group rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3 hover:border-cyan-500/30 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User size={15} className="text-cyan-400" />
                        <p className="font-bold text-white text-base">{appointment.patient?.name || 'Patient'}</p>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="flex items-center gap-1"><Stethoscope size={13} className="text-slate-500" /> Dr. {appointment.doctor?.name || 'Doctor'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock size={13} className="text-slate-500" /> {appointment.date} @ {appointment.time}</span>
                      </p>
                    </div>

                    <Badge variant={appointment.status === 'Completed' ? 'success' : appointment.status === 'Cancelled' ? 'danger' : 'default'}>
                      {appointment.status}
                    </Badge>
                  </div>

                  {appointment.reason && (
                    <div className="rounded-xl bg-slate-950/60 p-2.5 text-xs text-slate-300 border border-white/5">
                      <span className="text-slate-400 font-medium">Reason:</span> {appointment.reason}
                    </div>
                  )}

                  {appointment.status === 'Scheduled' && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => updateStatus(appointment.id, 'Completed')}
                        className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                      >
                        <CheckCircle2 size={13} /> Mark Completed
                      </button>
                      <button
                        onClick={() => cancelAppointment(appointment.id)}
                        className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                      >
                        <XCircle size={13} /> Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Appointment Form Column */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">New Booking</p>
              <h3 className="text-xl font-bold text-white">Schedule Appointment</h3>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
              <Plus size={20} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Select Patient</label>
                <select
                  required
                  value={form.patient_id}
                  onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Choose patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.phone || 'No phone'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Select Doctor</label>
                <select
                  required
                  value={form.doctor_id}
                  onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="">Choose physician...</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Consultation Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Time Slot</label>
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Reason for Visit</label>
              <textarea
                rows={3}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. Annual cardiology review..."
              />
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Booking Visit…' : 'Book Appointment'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
