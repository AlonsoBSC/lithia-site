import Navbar from './Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Navbar fijo arriba */}
      <Navbar />

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        {children}
      </main>

      {/* Footer opcional */}
      <footer className="bg-blue-900 text-white text-center py-4">
        <p className="text-sm">© {new Date().getFullYear()} GrupoLithia. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}