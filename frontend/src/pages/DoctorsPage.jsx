import { useEffect, useState } from 'react';
import { Plus, Stethoscope, Trash2, PencilLine } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', specialization: '', phone: '', user_id: '' };

export default function DoctorsPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const canManage = user?.role === 'Admin';

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors?limit=100');
      const payload = unwrap(response);
      setDoctors(payload?.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canManage) {
      toast.error('Only admins can manage doctors');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        specialization: form.specialization,
        phone: form.phone,
        user_id: Number(form.user_id),
      };
      if (editingId) {
        await api.put(`/doctors/${editingId}`, payload);
        toast.success('Doctor updated');
      } else {
        await api.post('/doctors', payload);
        toast.success('Doctor created');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadDoctors();
    } catch (error) {
      toast.error(error.message || 'Unable to save doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/doctors/${id}`);
      toast.success('Doctor deleted');
      await loadDoctors();
    } catch (error) {
      toast.error(error.message || 'Unable to delete doctor');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Doctors</p>
          <h2 className="text-2xl font-semibold text-white">Doctor roster</h2>
        </div>
        <div className="rounded-2xl border border-brand-500/20 bg-brand-900/20 px-4 py-3 text-sm text-brand-100">Admin-managed directory</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Care team</p>
              <h3 className="text-xl font-semibold text-white">Current physicians</h3>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-2">
              <Stethoscope size={18} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {loading ? <div className="text-sm text-slate-400">Loading doctors…</div> : doctors.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No doctors available.</div> : doctors.map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/60 px-4 py-3">
                <div>
                  <p className="font-medium text-white">{doctor.name}</p>
                  <p className="text-sm text-slate-400">{doctor.specialization || 'Specialty pending'} • {doctor.phone || 'No phone on file'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setEditingId(doctor.id);
                    setForm({ name: doctor.name, specialization: doctor.specialization || '', phone: doctor.phone || '', user_id: doctor.user_id || '' });
                  }} className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-slate-700"><PencilLine size={16} /></button>
                  <button onClick={() => handleDelete(doctor.id)} className="rounded-xl border border-rose-500/20 p-2 text-rose-300 hover:bg-rose-500/10"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Doctor profile</p>
              <h3 className="text-xl font-semibold text-white">{editingId ? 'Edit doctor' : 'Create doctor'}</h3>
            </div>
            <div className="rounded-2xl bg-brand-600/20 p-2 text-brand-200">
              <Plus size={18} />
            </div>
          </div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Specialization</label>
              <input required value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Linked User ID</label>
                <input required type="number" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">{submitting ? 'Saving…' : editingId ? 'Update doctor' : 'Create doctor'}</button>
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm); }} className="rounded-2xl border border-white/10 px-4 py-3 text-slate-300">Reset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
