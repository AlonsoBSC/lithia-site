import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Building2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const emailNormalizado = email.toLowerCase().trim();
      // 1. Autenticar con Supabase Auth
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: emailNormalizado,
  password: password,
});

if (authError) {
  setError('❌ Correo o contraseña incorrectos');
  setLoading(false);
  return;
}

// 2. Buscar datos del usuario en la tabla
const { data: usuarioExistente, error: errorBusqueda } = await supabase
  .from('usuarios')
  .select('*')
  .eq('email', emailNormalizado)
  .single();

if (errorBusqueda || !usuarioExistente) {
  setError('❌ Usuario no encontrado en el sistema');
  setLoading(false);
  return;
}

onLogin(usuarioExistente);
    } catch (err) {
      setError('Error al iniciar sesión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage('');

    try {
      const emailNormalizado = resetEmail.toLowerCase().trim();
      const { data: usuario, error: errorBusqueda } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', emailNormalizado)
        .single();

      if (errorBusqueda || !usuario) {
        setResetMessage('❌ Este correo no está registrado en el sistema');
        setLoading(false);
        return;
      }

      setResetMessage('✅ Se ha enviado un enlace de recuperación a tu correo. Revisa tu bandeja de entrada.');
      setResetEmail('');

      setTimeout(() => {
        setShowReset(false);
        setResetMessage('');
      }, 5000);
    } catch (err) {
      setResetMessage('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
  navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-black border border-orange-500 rounded-2xl shadow-[0_0_15px_rgba(249,115,22,0.5)] p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="bg-orange-500 p-4 rounded-xl">
              <Building2 className="w-12 h-12 text-black" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2">
            <span className="text-white">GRUPO</span> <span className="text-orange-500">LITHIA</span>
          </h1>
          <p className="text-center text-white mb-8">
            Sistema de Gestión de Obras
          </p>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Inputs */}
            <div>
              <label className="block text-sm font-medium text-orange-500 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                className={`w-full px-4 py-3 bg-black text-white border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  error
                    ? 'border-red-500 focus:ring-red-600 bg-red-900/20'
                    : 'border-orange-500 focus:ring-orange-500 placeholder-white/30'
                }`}
                placeholder="usuario@grupolithia.cl"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-orange-500 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 bg-black text-white border rounded-lg focus:ring-2 focus:border-transparent transition ${
                  error
                    ? 'border-red-500 focus:ring-red-600 bg-red-900/20'
                    : 'border-orange-500 focus:ring-orange-500 placeholder-white/30'
                }`}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Botón login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 text-black py-3 rounded-lg font-bold hover:bg-orange-600 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>

            {/* Botón volver atrás */}
            <button
              type="button"
              onClick={handleBack}
              className="w-full mt-2 border border-orange-500 text-orange-500 bg-black py-3 rounded-lg font-bold hover:bg-orange-500 hover:text-black transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver Atrás
            </button>

            <p
              className="text-sm text-center text-white hover:text-orange-500 cursor-pointer transition-colors"
              onClick={() => setShowReset(true)}
            >
              ¿Olvidaste tu contraseña?
            </p>
          </form>
        </div>

        {/* Modal de Recuperación */}
        {showReset && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50">
            <div className="bg-black border border-orange-500 rounded-2xl shadow-[0_0_15px_rgba(249,115,22,0.5)] p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold text-orange-500 mb-2">
                Recuperar Contraseña
              </h2>
              <p className="text-white text-sm mb-6">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-orange-500 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    autoFocus
                    className="w-full px-4 py-3 bg-black text-white border border-orange-500 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition placeholder-white/30"
                    placeholder="usuario@grupolithia.cl"
                    required
                  />
                </div>

                {resetMessage && (
                  <div
                    className={`px-4 py-3 rounded-lg text-sm font-medium ${
                      resetMessage.includes('✅')
                        ? 'bg-green-900/50 border border-green-500 text-green-400'
                        : 'bg-red-900/50 border border-red-500 text-red-400'
                    }`}
                  >
                    {resetMessage}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-orange-500 text-black py-3 rounded-lg font-bold hover:bg-orange-600 transition disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowReset(false);
                      setResetMessage('');
                      setResetEmail('');
                    }}
                    className="flex-1 border border-orange-500 text-orange-500 bg-black py-3 rounded-lg font-bold hover:bg-orange-500 hover:text-black transition"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}