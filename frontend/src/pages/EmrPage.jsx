import { useEffect, useState } from 'react';
import { FileText, Plus, ClipboardList, User, Stethoscope, Pill, ShieldAlert, Search } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

const emptyForm = { patient_id: '', doctor_id: '', appointment_id: '', notes: '', diagnosis: '', prescription: '' };

export default function EmrPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const isDoctor = user?.role === 'Doctor';

  const loadData = async () => {
    setLoading(true);
    try {
      const [notesResponse, patientsResponse, appointmentsResponse] = await Promise.all([
        api.get('/emr?limit=100'),
        api.get('/patients?limit=100'),
        api.get('/appointments?limit=100'),
      ]);
      setNotes(unwrap(notesResponse)?.data || []);
      setPatients(unwrap(patientsResponse)?.data || []);
      setAppointments(unwrap(appointmentsResponse)?.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load EMR notes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isDoctor) {
      toast.error('Only doctors can create EMR notes');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/emr', {
        patient_id: Number(form.patient_id),
        doctor_id: Number(form.doctor_id),
        appointment_id: form.appointment_id ? Number(form.appointment_id) : undefined,
        notes: form.notes,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
      });
      toast.success('EMR note created successfully');
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to create EMR note');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = searchPatient
    ? notes.filter(n => n.patient?.name?.toLowerCase().includes(searchPatient.toLowerCase()))
    : notes;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
            <FileText size={16} /> Electronic Medical Records
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-1">Clinical Notes & Prescriptions</h2>
          <p className="text-xs text-slate-400 mt-0.5">Structured EMR notes, diagnoses, and prescribed medication records.</p>
        </div>
        <div className="glass-pill px-4 py-2 rounded-2xl text-xs font-semibold text-cyan-300 border border-cyan-500/30">
          Total Notes: <span className="text-white font-bold">{notes.length}</span>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
        {/* EMR Notes List */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Patient Records</p>
              <h3 className="text-xl font-bold text-white">Clinical Notes Archive</h3>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              placeholder="Filter notes by patient name..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          <div className="space-y-4 max-h-[580px] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Loading clinical records...</div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
                No EMR notes found.
              </div>
            ) : (
              filtered.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 space-y-3 hover:border-cyan-500/30 transition"
                >
                  {/* Patient & Doctor Row */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 text-slate-950 font-extrabold text-xs">
                        {(note.patient?.name || 'P').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white flex items-center gap-1"><User size={13} className="text-cyan-400" /> {note.patient?.name || 'Patient'}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1"><Stethoscope size={12} className="text-slate-500" /> Dr. {note.doctor?.name || 'Doctor'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Diagnosis Badge */}
                  {note.diagnosis && (
                    <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
                      <ClipboardList size={12} /> {note.diagnosis}
                    </div>
                  )}

                  {/* Notes */}
                  {note.notes && (
                    <div className="rounded-xl bg-slate-950/60 border border-white/5 p-3 text-xs text-slate-300 leading-relaxed">
                      <p className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mb-1">Clinical Notes</p>
                      {note.notes}
                    </div>
                  )}

                  {/* Prescription */}
                  {note.prescription && (
                    <div className="rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-3 text-xs text-emerald-300 flex gap-2">
                      <Pill size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-emerald-400 font-semibold mb-0.5">Prescription</p>
                        {note.prescription}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add EMR Note Form */}
        <div className="glass-card p-6 sm:p-7 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">Doctor Portal</p>
              <h3 className="text-xl font-bold text-white">Create Clinical Note</h3>
            </div>
            <div className="rounded-2xl bg-cyan-500/10 p-2.5 text-cyan-400 border border-cyan-500/20">
              <Plus size={20} />
            </div>
          </div>

          {!isDoctor ? (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-amber-300 text-xs flex items-center gap-3">
              <ShieldAlert size={20} className="flex-shrink-0" />
              <span>Only Doctors can create or modify EMR notes. You have read-only access.</span>
            </div>
          ) : (
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

              <div className="grid gap-3 sm:grid-cols-2">
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
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Doctor ID</label>
                  <input
                    required type="number" value={form.doctor_id}
                    onChange={(e) => setForm({ ...form, doctor_id: e.target.value })}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none"
                    placeholder="Doctor user ID"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Diagnosis</label>
                <input
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g. Stage 1 Essential Hypertension"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Clinical Notes</label>
                <textarea rows={3} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="Detailed clinical observations..."
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Prescription</label>
                <textarea rows={2} value={form.prescription}
                  onChange={(e) => setForm({ ...form, prescription: e.target.value })}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g. Lisinopril 10mg once daily..."
                />
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Saving Note…' : 'Save EMR Note'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
