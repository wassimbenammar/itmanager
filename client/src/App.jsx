import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EquipementsPage from './pages/EquipementsPage';
import EquipementFormPage from './pages/EquipementFormPage';
import EquipementDetailPage from './pages/EquipementDetailPage';
import LogicielsPage from './pages/LogicielsPage';
import LogicielFormPage from './pages/LogicielFormPage';
import LogicielDetailPage from './pages/LogicielDetailPage';
import ComptesPage from './pages/ComptesPage';
import CompteFormPage from './pages/CompteFormPage';
import UtilisateursPage from './pages/UtilisateursPage';
import UtilisateurDetailPage from './pages/UtilisateurDetailPage';
import AuditPage from './pages/AuditPage';
import ParametresPage from './pages/ParametresPage';
import FournisseursPage from './pages/FournisseursPage';
import FournisseurFormPage from './pages/FournisseurFormPage';
import ReportsPage from './pages/ReportsPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">Chargement...</div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route element={<PrivateRoute><AppShell /></PrivateRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="equipements" element={<EquipementsPage />} />
              <Route path="equipements/nouveau" element={<EquipementFormPage />} />
              <Route path="equipements/:id" element={<EquipementDetailPage />} />
              <Route path="equipements/:id/modifier" element={<EquipementFormPage />} />
              <Route path="logiciels" element={<LogicielsPage />} />
              <Route path="logiciels/nouveau" element={<LogicielFormPage />} />
              <Route path="logiciels/:id" element={<LogicielDetailPage />} />
              <Route path="logiciels/:id/modifier" element={<LogicielFormPage />} />
              <Route path="comptes" element={<ComptesPage />} />
              <Route path="comptes/nouveau" element={<CompteFormPage />} />
              <Route path="comptes/:id/modifier" element={<CompteFormPage />} />
              <Route path="utilisateurs" element={<UtilisateursPage />} />
              <Route path="utilisateurs/:id" element={<UtilisateurDetailPage />} />
              <Route path="fournisseurs" element={<FournisseursPage />} />
              <Route path="fournisseurs/nouveau" element={<FournisseurFormPage />} />
              <Route path="fournisseurs/:id/modifier" element={<FournisseurFormPage />} />
              <Route path="rapports" element={<ReportsPage />} />
              <Route path="audit" element={<AuditPage />} />
              <Route path="parametres" element={<ParametresPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
