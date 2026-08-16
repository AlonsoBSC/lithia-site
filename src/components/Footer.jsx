import { Mail, MapPin, Phone } from 'lucide-react';
import { FaFacebook, FaInstagram, FaWhatsapp } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-black text-orange-500 py-8 border-t border-neutral-800">
      <div className="container mx-auto px-6 grid md:grid-cols-3 gap-8">
        
        {/* Sección empresa */}
        <div>
          <h2 className="text-2xl font-bold mb-4">
            <span className="text-white">Grupo</span>
            <span className="text-orange-500">Lithia</span>
          </h2>
          <p className="text-sm">
            Construyendo proyectos con calidad, innovación y compromiso.
          </p>
        </div>

        {/* Sección contacto */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-white">Contacto</h3>
          <p className="text-sm flex items-center gap-2 mb-2 hover:text-white transition">
            <MapPin size={16} /> Santo Domingo, Valparaíso, Chile
          </p>
          <p className="text-sm flex items-center gap-2 mb-2 hover:text-white transition">
            <Phone size={16} /> +56 9 8368 1545
          </p>
          <p className="text-sm flex items-center gap-2 hover:text-white transition">
            <Mail size={16} /> contacto@grupolithia.cl
          </p>
        </div>

        {/* Redes sociales */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-white">Síguenos</h3>
          <div className="flex space-x-4">
            <a
              href="https://wa.me/56983681545"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
              aria-label="WhatsApp"
            >
              <FaWhatsapp size={24} />
            </a>
            <a
              href="https://www.facebook.com/LithiaConstructores"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
              aria-label="Facebook"
            >
              <FaFacebook size={24} />
            </a>
            <a
              href="https://www.instagram.com/lithiaconstructores"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
              aria-label="Instagram"
            >
              <FaInstagram size={24} />
            </a>
          </div>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="text-center text-sm mt-8 border-t border-neutral-800 pt-4 text-white">
        © {new Date().getFullYear()} GrupoLithia. Todos los derechos reservados.
      </div>
    </footer>
  );
}
