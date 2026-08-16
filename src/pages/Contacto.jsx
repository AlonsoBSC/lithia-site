import { Mail, Phone, MapPin, Send, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Contacto() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    asunto: '',
    mensaje: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Aquí puedes agregar lógica para enviar el email
    console.log('Formulario enviado:', formData);
    setFormData({ nombre: '', email: '', asunto: '', mensaje: '' });
    alert('Gracias por tu mensaje. Te contactaremos pronto.');
  };

  return (
    <div className="bg-black">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Botón volver */}
        <Link 
          to="/"
          className="inline-flex items-center gap-2 mb-8 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver al Inicio
        </Link>

        {/* Encabezado */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-orange-500 mb-4">
            Contacto <span className="text-white">Grupo</span> <span className="text-orange-500">Lithia</span>
          </h1>
          <p className="text-xl text-white">
            Estamos aquí para ayudarte. Contáctanos para cualquier consulta
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Información de contacto */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-orange-500 mb-6">
                Información de Contacto
              </h2>
            </div>

            <div className="flex gap-4">
              <MapPin className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-orange-500">Ubicación</h3>
                <p className="text-white">Santo Domingo, Valparaíso, Chile</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-orange-500">Teléfono</h3>
                <p className="text-white">+56 9 8368 1545</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg text-orange-500">Email</h3>
                <p className="text-white">contacto@grupolithia.cl</p>
              </div>
            </div>

            <div className="pt-6">
              <a
                href="https://wa.me/56983681545"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition"
              >
                💬 Enviar por WhatsApp
              </a>
            </div>
          </div>

          {/* Formulario de contacto */}
          <div>
            <form onSubmit={handleSubmit} className="bg-zinc-900 p-8 rounded-lg shadow border border-orange-500/20">
              <div className="mb-6">
                <label className="block text-sm font-semibold text-orange-500 mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-black border border-orange-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Tu nombre"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-orange-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-black border border-orange-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="tu@email.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-orange-500 mb-2">
                  Asunto
                </label>
                <input
                  type="text"
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 bg-black border border-orange-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Asunto del mensaje"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-orange-500 mb-2">
                  Mensaje
                </label>
                <textarea
                  name="mensaje"
                  value={formData.mensaje}
                  onChange={handleChange}
                  required
                  rows="5"
                  className="w-full px-4 py-2 bg-black border border-orange-500/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Tu mensaje aquí..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                <Send className="w-5 h-5" />
                Enviar Mensaje
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
