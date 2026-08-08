import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', age: '', gender: 'Male', phone: '', address: '' };

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canManage = user?.role === 'Admin' || user?.role === 'Receptionist';

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/patients?search=${encodeURIComponent(search)}`);
      const payload = unwrap(response);
      setPatients(payload?.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      toast.error('You do not have permission to manage patients');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone,
        address: form.address,
      };
      if (editingId) {
        await api.put(`/patients/${editingId}`, payload);
        toast.success('Patient updated');
      } else {
        await api.post('/patients', payload);
        toast.success('Patient created');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadPatients();
    } catch (error) {
      toast.error(error.message || 'Unable to save patient');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) return;
    try {
      await api.delete(`/patients/${id}`);
      toast.success('Patient deleted');
      await loadPatients();
    } catch (error) {
      toast.error(error.message || 'Unable to delete patient');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Patients</p>
          <h2 className="text-2xl font-semibold text-white">Patient directory</h2>
        </div>
        {canManage && (
          <div className="rounded-2xl border border-brand-500/20 bg-brand-900/20 px-4 py-3 text-sm text-brand-100">
            Manage patient records
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Search patient records</p>
              <h3 className="text-xl font-semibold text-white">Find a patient</h3>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-2">
              <Search size={18} />
            </div>
          </div>
          <div className="mt-4">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3 text-slate-100" placeholder="Search by name or phone" />
          </div>
          <div className="mt-6 space-y-3">
            {loading ? <div className="text-sm text-slate-400">Loading patients…</div> : patients.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No patients match your search.</div> : patients.map((patient) => (
              <div key={patient.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{patient.name}</p>
                  <p className="text-sm text-slate-400">{patient.phone || 'No phone on file'} • {patient.age} years</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setEditingId(patient.id);
                    setForm({ name: patient.name, age: patient.age, gender: patient.gender, phone: patient.phone || '', address: patient.address || '' });
                  }} className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-slate-700">
                    <PencilLine size={16} />
                  </button>
                  {canManage && <button onClick={() => handleDelete(patient.id)} className="rounded-xl border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Registration form</p>
              <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit patient' : 'Create patient'}</h3>
            </div>
            <div className="rounded-2xl bg-brand-600/20 p-2 text-brand-200">
              <Plus size={18} />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Age</label>
                <input required type="number" min="0" max="150" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Gender</label>
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Address</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">{submitting ? 'Saving…' : editingId ? 'Update patient' : 'Create patient'}</button>
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-300">Reset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
