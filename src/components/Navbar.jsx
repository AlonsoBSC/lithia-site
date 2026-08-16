import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Logo
const IMG_LOGO =
  "https://sensible-spoonbill-485.convex.cloud/api/storage/998944bd-6182-44af-9d7e-84f624902489";

// ── Icons ─────────────────────────────────────────────────────
const MenuIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-6 h-6"
  >
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    className="w-6 h-6"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ── Navbar ───────────────────────────────────────────────────
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);

    window.addEventListener('scroll', fn);

    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Nosotros', href: '#nosotros' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Proyectos', href: '#proyectos' },
    { label: 'Proceso', href: '#proceso' },
    { label: 'Contacto', href: '#contacto' },
  ];

  const scrollToSection = (href) => {
    setOpen(false);

    const section = document.querySelector(href);

    if (section) {
      section.scrollIntoView({
        behavior: 'smooth',
      });
    }
  };

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-orange-500/10 py-3'
          : 'bg-[#0a0a0a] py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={IMG_LOGO}
            alt="Grupo Lithia"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </Link>

        {/* Menu Desktop */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <button
                onClick={() => scrollToSection(link.href)}
                className="text-zinc-400 hover:text-white text-xs tracking-widest uppercase transition-colors duration-200 bg-transparent border-none cursor-pointer font-medium"
              >
                {link.label}
              </button>
            </li>
          ))}

          <li>
            <Link
              to="/login"
              className="text-zinc-400 hover:text-white text-xs tracking-widest uppercase transition-colors duration-200 font-medium"
            >
              Iniciar Sesión
            </Link>
          </li>
        </ul>

        {/* Mobile Button */}
        <button
          className="md:hidden text-white"
          onClick={() => setOpen(!open)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-[#0a0a0a] border-t border-orange-500/10 px-5 py-4 flex flex-col gap-4">

          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => scrollToSection(link.href)}
              className="text-zinc-400 hover:text-orange-500 text-sm text-left transition-colors bg-transparent border-none cursor-pointer"
            >
              {link.label}
            </button>
          ))}

          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-zinc-400 hover:text-orange-500 text-sm transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      )}
    </nav>
  );
}