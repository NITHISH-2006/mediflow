import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Plus, Search, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';

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
      toast.success('Appointment booked');
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

  const badgeClass = (status) => {
    switch (status) {
      case 'Completed': return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
      case 'Cancelled': return 'border-rose-500/20 bg-rose-500/10 text-rose-300';
      case 'Scheduled': return 'border-brand-500/20 bg-brand-500/10 text-brand-200';
      default: return 'border-slate-500/20 bg-slate-500/10 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Appointments</p>
          <h2 className="text-2xl font-semibold text-white">Book and manage care visits</h2>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">Role-aware scheduling</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Appointment queue</p>
              <h3 className="text-xl font-semibold text-white">Current appointments</h3>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-2">
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-800/60 p-2">
            <Search size={16} className="ml-2 text-slate-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full rounded-xl border border-transparent bg-transparent px-2 py-2 text-slate-100 outline-none">
              <option value="">All statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div className="mt-6 space-y-3">
            {loading ? <div className="text-sm text-slate-400">Loading appointments…</div> : appointments.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No appointments available.</div> : appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-white">{appointment.patient?.name || 'Patient'}</p>
                    <p className="text-sm text-slate-400">{appointment.doctor?.name || 'Doctor'} • {appointment.date} {appointment.time}</p>
                    {appointment.reason ? <p className="mt-2 text-sm text-slate-400">Reason: {appointment.reason}</p> : null}
                  </div>
                  <Badge variant={appointment.status === 'Completed' ? 'success' : appointment.status === 'Cancelled' ? 'danger' : 'default'}>{appointment.status}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => updateStatus(appointment.id, 'Completed')} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Complete</button>
                  <button onClick={() => cancelAppointment(appointment.id)} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">Cancel</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">New booking</p>
              <h3 className="text-xl font-semibold text-white">Book an appointment</h3>
            </div>
            <div className="rounded-2xl bg-brand-600/20 p-2 text-brand-200">
              <Plus size={18} />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Patient</label>
                <select required value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                  <option value="">Select patient</option>
                  {patients.map((patient) => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Doctor</label>
                <select required value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                  <option value="">Select doctor</option>
                  {doctors.map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Date</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Time</label>
                <input required type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Reason</label>
              <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <button type="submit" disabled={submitting} className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">{submitting ? 'Booking…' : 'Book appointment'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
