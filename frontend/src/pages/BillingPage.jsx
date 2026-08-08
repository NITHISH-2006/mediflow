import { useEffect, useState } from 'react';
import { CreditCard, Plus, DollarSign, CheckCircle2, Clock, Search } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const emptyForm = { patient_id: '', appointment_id: '', amount: '', status: 'Pending', payment_method: '' };

const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Insurance', 'UPI', 'Bank Transfer'];

export default function BillingPage() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
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
      toast.error(error.message || 'Unable to load billing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) { toast.error('Only receptionists and admins can create bills'); return; }
    setSubmitting(true);
    try {
      await api.post('/bills', {
        patient_id: Number(form.patient_id),
        appointment_id: form.appointment_id ? Number(form.appointment_id) : undefined,
        amount: parseFloat(form.amount),
        status: form.status,
        payment_method: form.payment_method,
      });
      toast.success('Invoice created successfully');
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const markPaid = async (id, paymentMethod) => {
    try {
      await api.put(`/bills/${id}/status`, { status: 'Paid', payment_method: paymentMethod || 'Cash' });
      toast.success('Invoice marked as Paid');
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to update bill status');
    }
  };

  const totalRevenue = bills.filter(b => b.status === 'Paid').reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const totalPending = bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const filtered = filterStatus ? bills.filter(b => b.status === filterStatus) : bills;

  return (
    <div className="space-y-8">
      {/* Header with Revenue Summary */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
              <CreditCard size={16} /> Finance & Billing
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Hospital Revenue & Invoices</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage patient billing, payment settlements, and financial ledgers.</p>
          </div>

          {/* Revenue KPIs */}
          <div className="flex flex-wrap gap-3">
            <div className="glass-pill rounded-2xl px-4 py-2.5 border border-emerald-500/30 bg-emerald-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">Collected Revenue</p>
              <p className="text-xl font-extrabold text-white">${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="glass-pill rounded-2xl px-4 py-2.5 border border-amber-500/30 bg-amber-500/10">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Outstanding</p>
              <p className="text-xl font-extrabold text-white">${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Bills List */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Ledger</p>
              <h3 className="text-xl font-bold text-white">Invoice Registry</h3>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 glass-pill p-1 rounded-2xl text-xs">
              {['', 'Pending', 'Paid'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`rounded-xl px-3 py-1.5 font-medium transition ${
                    filterStatus === st ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st || 'All'} {st && `(${bills.filter(b => b.status === st).length})`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3.5 max-h-[580px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading invoices...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No invoices found.
              </div>
            ) : (
              filtered.map((bill) => (
                <div
                  key={bill.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3 hover:border-cyan-500/30 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-white text-base">{bill.patient?.name || 'Patient'}</p>
                      <p className="text-xs text-slate-400">
                        Invoice #{bill.id} {bill.payment_method && <>• <span className="text-slate-300">{bill.payment_method}</span></>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-white">${Number(bill.amount || 0).toFixed(2)}</p>
                      <Badge variant={bill.status === 'Paid' ? 'success' : 'warning'}>
                        {bill.status}
                      </Badge>
                    </div>
                  </div>

                  {bill.status === 'Pending' && canManage && (
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => markPaid(bill.id, 'Cash')}
                        className="flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition"
                      >
                        <CheckCircle2 size={13} /> Mark Paid
                      </button>
                      <div className="flex items-center gap-1 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
                        <Clock size={13} /> Pending Settlement
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* New Invoice Form */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Issue Invoice</p>
              <h3 className="text-xl font-bold text-white">Create New Bill</h3>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-400 border border-emerald-500/20">
              <DollarSign size={20} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Patient</label>
              <select
                required value={form.patient_id}
                onChange={(e) => setForm({ ...form, patient_id: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Select patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Linked Appointment</label>
              <select
                value={form.appointment_id}
                onChange={(e) => setForm({ ...form, appointment_id: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">None</option>
                {appointments.map(a => <option key={a.id} value={a.id}>{a.date} – {a.patient?.name}</option>)}
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Amount ($)</label>
                <input
                  required type="number" step="0.01" min="0" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Payment Method</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
              >
                <option value="">Select method...</option>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating Invoice…' : 'Issue Invoice'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
