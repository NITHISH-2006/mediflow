import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success('Welcome back to MediFlow');
      navigate('/');
    } catch (error) {
      toast.error(error.message || 'Unable to sign in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(31,158,163,0.2),_transparent_45%)] px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-soft backdrop-blur">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden bg-gradient-to-br from-brand-700 via-brand-600 to-slate-800 p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-100">
                <Stethoscope size={24} />
                <span className="text-lg font-semibold">MediFlow</span>
              </div>
              <h1 className="mt-10 text-3xl font-semibold text-white">Connected care for every patient journey.</h1>
              <p className="mt-4 max-w-md text-sm text-brand-50/90">Manage appointments, clinical notes, patients, and billing in one calm, secure workspace.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-brand-50">
              <div className="flex items-center gap-2"><ShieldCheck size={16} /> Secure JWT access</div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            <p className="text-sm uppercase tracking-[0.25em] text-brand-300">Sign in</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Access your hospital workspace</h2>
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label className="mb-2 block text-sm text-slate-300">Email</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="doctor@mediflow.io" />
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">Password</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-6 text-sm text-slate-400">Use any valid backend credential created through the API or register flow.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
