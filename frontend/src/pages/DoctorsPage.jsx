import { useEffect, useState } from 'react';
import { Plus, Stethoscope, Trash2, PencilLine, Phone, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

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
      toast.error('Only admins can manage doctor profiles');
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
        toast.success('Doctor profile updated');
      } else {
        await api.post('/doctors', payload);
        toast.success('Doctor profile created');
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadDoctors();
    } catch (error) {
      toast.error(error.message || 'Unable to save doctor profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) return;
    try {
      await api.delete(`/doctors/${id}`);
      toast.success('Doctor record deleted');
      await loadDoctors();
    } catch (error) {
      toast.error(error.message || 'Unable to delete doctor profile');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Stethoscope size={16} /> Attending Staff
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Medical Specialist Roster</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage attending physicians, medical specialties, and contact extension info.</p>
        </div>

        <div className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-cyan-300 border border-cyan-500/30">
          Active Doctors: <span className="text-white font-bold">{doctors.length}</span>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Doctor Roster Grid */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Directory</p>
            <h3 className="text-xl font-bold text-white">Attending Physicians</h3>
          </div>

          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading physician roster...</div>
            ) : doctors.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No doctors registered in the database.
              </div>
            ) : (
              doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4 hover:border-cyan-500/30 transition gap-3"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-slate-950 font-extrabold text-sm shadow-md">
                      {doctor.name.replace('Dr. ', '').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white text-base">{doctor.name}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/20 flex items-center gap-1">
                          <Award size={12} /> {doctor.specialization || 'General Medicine'}
                        </span>
                        {doctor.phone && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Phone size={12} className="text-slate-500" /> {doctor.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {canManage && (
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => {
                          setEditingId(doctor.id);
                          setForm({ name: doctor.name, specialization: doctor.specialization || '', phone: doctor.phone || '', user_id: doctor.user_id || '' });
                        }}
                        className="rounded-xl border border-white/10 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        title="Edit profile"
                      >
                        <PencilLine size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 transition"
                        title="Delete profile"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Doctor Form Column */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Admin Control</p>
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Doctor Profile' : 'Register Doctor Profile'}</h3>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
              <Plus size={20} />
            </div>
          </div>

          {!canManage ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-300 text-xs flex items-center gap-3">
              <ShieldAlert size={20} />
              <span>Only System Administrators can create or modify doctor profiles.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Doctor Full Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="Dr. Sarah Connor"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Specialization</label>
                <input
                  required
                  value={form.specialization}
                  onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="Cardiology / Neurosurgery"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Phone Extension</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    placeholder="555-0101"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Linked User Account ID</label>
                  <input
                    required
                    type="number"
                    value={form.user_id}
                    onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? 'Saving…' : editingId ? 'Update Profile' : 'Save Doctor'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setForm(emptyForm); }}
                  className="rounded-2xl border border-white/10 bg-slate-800 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition"
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
