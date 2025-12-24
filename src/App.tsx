import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Toaster } from '@/components/ui/sonner';
import { Dashboard } from '@/pages/Dashboard';
import { NovoAtendimento } from '@/pages/NovoAtendimento';
import { Recebiveis } from '@/pages/Recebiveis';
import { Despesas } from '@/pages/Despesas';
import { ProLabore } from '@/pages/ProLabore';
import { Relatorios } from '@/pages/Relatorios';
import { Configuracoes } from '@/pages/Configuracoes';
import { Login } from '@/pages/Login';
import { Admin } from '@/pages/Admin';
import ProceduresList from '@/pages/ProceduresList';
import PatientsList from '@/pages/PatientsList';
import PatientDetails from '@/pages/PatientDetails';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/novo-atendimento" element={
            <PrivateRoute>
              <Layout>
                <NovoAtendimento />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/recebiveis" element={
            <PrivateRoute>
              <Layout>
                <Recebiveis />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/procedimentos" element={
            <PrivateRoute>
              <Layout>
                <ProceduresList />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/pacientes" element={
            <PrivateRoute>
              <Layout>
                <PatientsList />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/pacientes/:id" element={
            <PrivateRoute>
              <Layout>
                <PatientDetails />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/despesas" element={
            <PrivateRoute>
              <Layout>
                <Despesas />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/pro-labore" element={
            <PrivateRoute>
              <Layout>
                <ProLabore />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/relatorios" element={
            <PrivateRoute>
              <Layout>
                <Relatorios />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/configuracoes" element={
            <PrivateRoute>
              <Layout>
                <Configuracoes />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/admin" element={
            <AdminRoute>
              <Layout>
                <Admin />
              </Layout>
            </AdminRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
