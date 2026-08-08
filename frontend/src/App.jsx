import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import MainLayout from './components/MainLayout';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import DoctorsPage from './pages/DoctorsPage';
import EmrPage from './pages/EmrPage';
import BillingPage from './pages/BillingPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-slate-300">Loading MediFlow…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PageTransition = ({ children }) => {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      {children}
    </motion.div>
  );
};

function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PageTransition><DashboardPage /></PageTransition>} />
          <Route path="patients" element={<PageTransition><PatientsPage /></PageTransition>} />
          <Route path="appointments" element={<PageTransition><AppointmentsPage /></PageTransition>} />
          <Route path="doctors" element={<PageTransition><DoctorsPage /></PageTransition>} />
          <Route path="emr" element={<PageTransition><EmrPage /></PageTransition>} />
          <Route path="billing" element={<PageTransition><BillingPage /></PageTransition>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default App;
