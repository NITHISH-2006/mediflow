import { useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { patient_id: '', appointment_id: '', amount: '', status: 'Pending', payment_method: '' };

export default function BillingPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const canManage = user?.role === 'Admin' || user?.role === 'Receptionist';

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsResponse, patientsResponse, appointmentsResponse] = await Promise.all([
        api.get('/bills?limit=100'),
        api.get('/patients?limit=100'),
        api.get('/appointments?limit=100'),
      ]);
      setBills(unwrap(billsResponse)?.data || []);
      setPatients(unwrap(patientsResponse)?.data || []);
      setAppointments(unwrap(appointmentsResponse)?.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load billing');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      toast.error('Only receptionists and admins can create bills');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/bills', {
        patient_id: Number(form.patient_id),
        appointment_id: Number(form.appointment_id),
        amount: Number(form.amount),
        status: form.status,
        payment_method: form.payment_method,
      });
      toast.success('Bill created');
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/bills/${id}/status`, { status, payment_method: 'Card' });
      toast.success('Payment status updated');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to update bill');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Billing</p>
          <h2 className="text-2xl font-semibold text-white">Patient billing and payments</h2>
        </div>
        <div className="rounded-2xl border border-brand-500/20 bg-brand-900/20 px-4 py-3 text-sm text-brand-100">Payment lifecycle</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Invoices</p>
              <h3 className="text-xl font-semibold text-white">Recent bills</h3>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-2">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {loading ? <div className="text-sm text-slate-400">Loading billing data…</div> : bills.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No bills available.</div> : bills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{bill.patient?.name || 'Patient'}</p>
                  <p className="text-sm text-slate-400">${bill.amount} • {bill.payment_method || 'Pending method'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`rounded-full border px-3 py-1 text-sm ${bill.status === 'Paid' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>{bill.status}</div>
                  <button onClick={() => updateStatus(bill.id, 'Paid')} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">Mark paid</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Create invoice</p>
              <h3 className="text-xl font-semibold text-white">Issue a new bill</h3>
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
                <label className="mb-2 block text-sm text-slate-300">Appointment</label>
                <select required value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                  <option value="">Select appointment</option>
                  {appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.patient?.name || appointment.id}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Amount</label>
                <input required type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Payment method</label>
              <input value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <button type="submit" disabled={submitting || !canManage} className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">{submitting ? 'Creating…' : 'Create bill'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
