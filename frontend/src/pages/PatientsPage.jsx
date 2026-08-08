import { useEffect, useState } from 'react';
import { Plus, Search, Trash2, PencilLine, Users, UserCheck, Phone, MapPin, Calendar, HeartPulse } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

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
        toast.success('Patient record updated');
      } else {
        await api.post('/patients', payload);
        toast.success('New patient registered');
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
      toast.success('Patient record removed');
      await loadPatients();
    } catch (error) {
      toast.error(error.message || 'Unable to delete patient');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <Users size={16} /> Clinical Directory
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Patient Admissions & Profiles</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage electronic patient health profiles, demographics, and emergency contact info.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-cyan-300 border border-cyan-500/30">
            Total Patients: <span className="text-white font-bold">{patients.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Search & Directory Column */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Search Records</p>
              <h3 className="text-xl font-bold text-white">Patient Registry</h3>
            </div>
          </div>

          <div className="relative">
            <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-11 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none transition"
              placeholder="Search patient by name or phone number..."
            />
          </div>

          <div className="space-y-3.5 max-h-[550px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading directory...</div>
            ) : patients.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No patient records match your search query.
              </div>
            ) : (
              patients.map((patient) => (
                <div
                  key={patient.id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 p-4 hover:border-cyan-500/30 transition gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-base">{patient.name}</p>
                      <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-300 border border-cyan-500/20">
                        {patient.gender} • {patient.age} yrs
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Phone size={13} className="text-slate-500" /> {patient.phone || 'No phone'}</span>
                      {patient.address && <span className="flex items-center gap-1"><MapPin size={13} className="text-slate-500" /> {patient.address}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingId(patient.id);
                        setForm({ name: patient.name, age: patient.age, gender: patient.gender, phone: patient.phone || '', address: patient.address || '' });
                      }}
                      className="rounded-xl border border-white/10 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition"
                      title="Edit patient"
                    >
                      <PencilLine size={16} />
                    </button>
                    {canManage && (
                      <button
                        onClick={() => handleDelete(patient.id)}
                        className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 hover:bg-rose-500/20 transition"
                        title="Delete patient"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Registration / Edit Form Column */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Record Entry</p>
              <h3 className="text-xl font-bold text-white">{editingId ? 'Edit Patient File' : 'Register New Patient'}</h3>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
              <Plus size={20} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                placeholder="e.g. John Smith"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Age</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="150"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="35"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Phone Number</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                placeholder="555-0199"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Residential Address</label>
              <textarea
                rows={3}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                placeholder="123 Health Ave, Suite 4..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Saving…' : editingId ? 'Update Record' : 'Save Patient'}
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
        </div>
      </div>
    </div>
  );
}
