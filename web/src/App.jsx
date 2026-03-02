import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import Lancamentos from './pages/lancamentos/Lancamentos';
import Carros from './pages/carros/Carros';
import Abastecimentos from './pages/abastecimentos/Abastecimentos';
import MetaDiaria from './pages/metas/MetaDiaria';
import Manutencoes from './pages/manutencoes/Manutencoes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/lancamentos" element={<PrivateRoute><Lancamentos /></PrivateRoute>} />
          <Route path="/carros" element={<PrivateRoute><Carros /></PrivateRoute>} />
          <Route path="/abastecimentos" element={<PrivateRoute><Abastecimentos /></PrivateRoute>} />
          <Route path="/metas" element={<PrivateRoute><MetaDiaria /></PrivateRoute>} />
          <Route path="/manutencoes" element={<PrivateRoute><Manutencoes /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;