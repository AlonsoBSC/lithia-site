import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from "./pages/Home";
import Contacto from "./pages/Contacto";
import Proyectos from "./pages/Proyectos";
import Login from "./components/Login";
import DashboardAdmin from "./components/admin/DashboardAdmin";
import DashboardMaestro from "./components/maestro/DashboardMaestro";
import PortalCliente from "./components/cliente/PortalCliente";

// Componente para proteger rutas
function ProtectedRoute({ children, usuario, allowedRoles }) {
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(usuario.rol)) {
    if (usuario.rol === 'admin' || usuario.rol === 'administrador_obra') {
      return <Navigate to="/admin" replace />;
    } else if (usuario.rol === 'maestro') {
      return <Navigate to="/maestro" replace />;
    } else if (usuario.rol === 'cliente') {
      return <Navigate to="/cliente" replace />;
    }
  }

  return children;
}

// Componente Login con redirección automática
function LoginPage({ onLogin, usuario }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (usuario) {
      if (usuario.rol === 'admin' || usuario.rol === 'administrador_obra') {
        navigate('/admin', { replace: true });
      } else if (usuario.rol === 'maestro') {
        navigate('/maestro', { replace: true });
      } else if (usuario.rol === 'cliente') {
        navigate('/cliente', { replace: true });
      }
    }
  }, [usuario, navigate]);

  return <Login onLogin={onLogin} />;
}

export default function App() {
  const [usuario, setUsuario] = useState(null);

  const handleLogin = (user) => {
    setUsuario(user);
  };

  const handleLogout = () => {
    setUsuario(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/contacto" element={<Contacto />} />
        </Route>
        
        {/* Proyectos tiene su propio layout (sin Navbar ni Footer de Layout) */}
        <Route path="/proyectos" element={<Proyectos />} />

       <Route 
         path="/login" 
          element={<LoginPage onLogin={handleLogin} usuario={usuario} />} 
         />

        <Route
          path="/admin"
          element={
            <ProtectedRoute usuario={usuario} allowedRoles={['admin', 'administrador_obra']}>
              <DashboardAdmin usuario={usuario} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/maestro"
          element={
            <ProtectedRoute usuario={usuario} allowedRoles={['maestro']}>
              <DashboardMaestro usuario={usuario} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cliente"
          element={
            <ProtectedRoute usuario={usuario} allowedRoles={['cliente']}>
              <PortalCliente usuario={usuario} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}