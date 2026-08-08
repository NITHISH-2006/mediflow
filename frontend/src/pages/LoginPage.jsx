import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Stethoscope, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import ParticleBg from '../components/ui/ParticleBg';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Doctor');
  const [submitting, setSubmitting] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(name, email, password, role);
        toast.success('Account created successfully! Welcome to MediFlow');
      } else {
        await login(email, password);
        toast.success('Welcome back to MediFlow');
      }
      navigate('/');
    } catch (error) {
      toast.error(error.message || (isRegister ? 'Registration failed' : 'Unable to sign in'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8">
      <ParticleBg />
      <div className="absolute inset-0 bg-gradient-radial from-cyan-950/40 via-slate-950/80 to-slate-950 z-[1] pointer-events-none" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="relative z-10 w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 shadow-soft backdrop-blur">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Hero Panel */}
          <div className="hidden bg-gradient-to-br from-brand-700 via-brand-600 to-slate-800 p-8 lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-brand-100">
                <Stethoscope size={24} />
                <span className="text-lg font-semibold">MediFlow</span>
              </div>
              <h1 className="mt-10 text-3xl font-semibold text-white">Connected care for every patient journey.</h1>
              <p className="mt-4 max-w-md text-sm text-brand-50/90">Manage appointments, clinical notes, patients, and billing in one calm, secure workspace.</p>
            </div>

            {/* Quick Demo Credentials */}
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-brand-50">
              <p className="font-medium text-white mb-2">⚡ Quick Demo Accounts:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fillDemoAccount('admin@mediflow.com', 'admin123')}
                  className="rounded-lg bg-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/30 transition"
                >
                  Admin (admin@mediflow.com)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('sarah@mediflow.com', 'doctor123')}
                  className="rounded-lg bg-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/30 transition"
                >
                  Doctor (sarah@mediflow.com)
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoAccount('joe@mediflow.com', 'recep123')}
                  className="rounded-lg bg-white/20 px-2.5 py-1 text-xs text-white hover:bg-white/30 transition"
                >
                  Receptionist (joe@mediflow.com)
                </button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs text-brand-100/80">
                <ShieldCheck size={14} /> Password for all demo accounts: <code>admin123</code>, <code>doctor123</code>, or <code>recep123</code>
              </div>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="p-8 sm:p-10">
            <div className="flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.25em] text-brand-300">
                {isRegister ? 'Create Account' : 'Sign In'}
              </p>
              <button
                type="button"
                onClick={() => setIsRegister(!isRegister)}
                className="flex items-center gap-1.5 text-xs text-brand-300 hover:text-brand-200 underline font-medium transition"
              >
                {isRegister ? (
                  <><LogIn size={14} /> Already have an account? Sign in</>
                ) : (
                  <><UserPlus size={14} /> Need an account? Create one</>
                )}
              </button>
            </div>

            <h2 className="mt-2 text-2xl font-semibold text-white">
              {isRegister ? 'Register your MediFlow account' : 'Access your hospital workspace'}
            </h2>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Full Name</label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Dr. Jane Doe"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm text-slate-300">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="user@mediflow.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-300">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="mb-2 block text-sm text-slate-300">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2.5 text-sm text-white focus:border-brand-400 focus:outline-none"
                  >
                    <option value="Doctor">Doctor</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              )}

              <Button type="submit" className="w-full mt-2" disabled={submitting}>
                {submitting
                  ? (isRegister ? 'Creating Account…' : 'Signing in…')
                  : (isRegister ? 'Create Account' : 'Sign in')}
              </Button>
            </form>

            <div className="mt-6 flex flex-col gap-2">
              {!isRegister && (
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="w-full rounded-xl border border-brand-500/30 bg-brand-500/10 py-2.5 text-sm font-medium text-brand-300 hover:bg-brand-500/20 transition flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} /> Create New Account
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
