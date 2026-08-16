import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      <Navbar />

      {/* Contenido principal */}
      <main className="flex-grow flex flex-col bg-black p-0">
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
