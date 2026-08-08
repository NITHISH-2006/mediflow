import { useEffect, useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import api, { unwrap } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { patient_id: '', doctor_id: '', appointment_id: '', notes: '', diagnosis: '', prescription: '' };

export default function EmrPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    loadData();
  }, []);

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
        appointment_id: Number(form.appointment_id),
        notes: form.notes,
        diagnosis: form.diagnosis,
        prescription: form.prescription,
      });
      toast.success('EMR note created');
      setForm(emptyForm);
      await loadData();
    } catch (error) {
      toast.error(error.message || 'Unable to create note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-300">EMR Notes</p>
          <h2 className="text-2xl font-semibold text-white">Clinical documentation</h2>
        </div>
        <div className="rounded-2xl border border-brand-500/20 bg-brand-900/20 px-4 py-3 text-sm text-brand-100">Doctor-focused records</div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Recent notes</p>
              <h3 className="text-xl font-semibold text-white">Clinical history</h3>
            </div>
            <div className="rounded-2xl bg-slate-800/70 p-2">
              <FileText size={18} />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {loading ? <div className="text-sm text-slate-400">Loading notes…</div> : notes.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No EMR notes yet.</div> : notes.map((note) => (
              <div key={note.id} className="rounded-2xl border border-white/10 bg-slate-800/60 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-white">{note.patient?.name || 'Patient'}</p>
                    <p className="text-sm text-slate-400">Dr. {note.doctor?.name || 'Doctor'} • {note.appointment?.date || 'N/A'}</p>
                  </div>
                  <div className="rounded-full border border-brand-500/20 bg-brand-900/20 px-3 py-1 text-sm text-brand-200">{note.diagnosis || 'Assessment'}</div>
                </div>
                <p className="mt-3 text-sm text-slate-300">{note.notes}</p>
                {note.prescription ? <p className="mt-2 text-sm text-brand-200">Prescription: {note.prescription}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Create note</p>
              <h3 className="text-xl font-semibold text-white">Document assessment</h3>
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
                <input required type="number" value={form.doctor_id} onChange={(e) => setForm({ ...form, doctor_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Appointment</label>
              <select required value={form.appointment_id} onChange={(e) => setForm({ ...form, appointment_id: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3">
                <option value="">Select appointment</option>
                {appointments.map((appointment) => <option key={appointment.id} value={appointment.id}>{appointment.patient?.name || appointment.id}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Diagnosis</label>
              <input value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} className="w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Notes</label>
              <textarea required value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">Prescription</label>
              <textarea value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} className="min-h-24 w-full rounded-2xl border border-white/10 bg-slate-800/70 px-4 py-3" />
            </div>
            <button type="submit" disabled={submitting || !isDoctor} className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-500 disabled:opacity-60">{submitting ? 'Saving…' : 'Save note'}</button>
          </form>
        </div>
      </div>
    </div>
  );
}
