import {
  Building2,
  Users,
  Award,
  Target,
  ArrowLeft,
  Hammer,
  PaintBucket,
  Zap,
  Flame,
  Wrench,
  LayoutGrid,
  ClipboardCheck,
  FileSearch,
  CalendarClock,
  HardHat,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { FaInstagram } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── Sección reutilizable ── */
function Section({ children, className = '', id, bgImage }) {
  return (
    <section id={id} className={`py-20 relative overflow-hidden ${className}`}>
      {bgImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: `url('${bgImage}')` }}
          />
          <div className="absolute inset-0 bg-zinc-950/80 pointer-events-none" />
        </>
      )}
      <div className="max-w-6xl mx-auto px-5 md:px-8 relative z-10">{children}</div>
    </section>
  );
}

function SectionTitle({ label, title, light = false }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={fadeUp}
      className="mb-14"
    >
      {label && (
        <span className="inline-block text-xs font-semibold tracking-[0.25em] uppercase text-orange-500 mb-3">
          {label}
        </span>
      )}
      <h2 className={`text-3xl md:text-4xl font-bold leading-tight ${light ? 'text-zinc-900' : 'text-white'}`}>
        {title}
      </h2>
      <div className="mt-4 w-16 h-[3px] bg-orange-500 rounded-full" />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ══════════════════════════════════════════════════════════ */
export default function Proyectos() {
  /* ── Datos ── */
  const stats = [
    { icon: Building2, value: '50+', label: 'Proyectos ejecutados' },
    { icon: Award, value: '7+', label: 'Años de experiencia' },
    { icon: Target, value: '100%', label: 'Satisfacción del cliente' },
  ];

  const equipo = [
    {
      nombre: 'Julián Gómez Montoya',
      cargo: 'Director',
      desc: 'Constructor Civil dedicado al desarrollo y gestión de proyectos de construcción.',
    },
    {
      nombre: 'Manuel Enrique Rojas',
      cargo: 'Arquitecto',
      desc: 'Vasta experiencia en diseño, construcción y planificación de obras. Más de 25.000 m² construidos.',
    },
    {
      nombre: 'Evelyn Carreño González',
      cargo: 'Directora',
      desc: 'Profesional en Construcción Civil con experiencia en obras industriales y proyectos de menor envergadura.',
    },
    {
      nombre: 'Fernando Navarro',
      cargo: 'Electricista certificado SEC',
      desc: 'Representante de Energía Costa Sol. Especialista en instalaciones eléctricas certificadas.',
    },
    {
      nombre: 'Roberto Necochea Aspillaga',
      cargo: 'Técnico en Construcción',
      desc: 'Certificado en instalaciones de gas ante la SEC.',
    },
  ];

  const servicios = [
    {
      icon: Hammer,
      titulo: 'Construcción de Viviendas',
      desc: 'Proyectos habitacionales desde obra gruesa hasta terminaciones, adaptados a las necesidades y presupuesto de cada cliente.',
      link: 'https://www.instagram.com/p/DW7ugEYkQmg/',
    },
    {
      icon: PaintBucket,
      titulo: 'Remodelaciones y Ampliaciones',
      desc: 'Transformamos espacios existentes para mejorar funcionalidad, estética y confort en viviendas y espacios comerciales.',
      link: 'https://www.instagram.com/p/DN9vcxmjbqH/',
    },
    {
      icon: LayoutGrid,
      titulo: 'Terminaciones Interiores',
      desc: 'Yeso cartón, pintura, porcelanatos, pisos, puertas, molduras, iluminación y detalles de terminación de alto nivel.',
    },
    {
      icon: HardHat,
      titulo: 'Estructuras Metálicas',
      desc: 'Fabricación e instalación de estructuras metálicas, techumbres, galpones, refuerzos y soluciones estructurales.',
      link: 'https://www.instagram.com/stories/highlights/18098021983604855/',
    },
    {
      icon: Flame,
      titulo: 'Instalaciones Sanitarias y Gas',
      desc: 'Agua potable, alcantarillado, agua caliente y gas, cumpliendo normativa chilena vigente.',
    },
    {
      icon: Zap,
      titulo: 'Instalaciones Eléctricas',
      desc: 'Instalaciones eléctricas certificadas bajo normativa SEC, garantizando seguridad y eficiencia.',
    },
    {
      icon: Wrench,
      titulo: 'Mantenciones Generales',
      desc: 'Mantenimiento preventivo y correctivo para viviendas, edificios y empresas.',
      link: 'https://www.instagram.com/p/DMrMdT0xONA/',
    },
  ];

  const proceso = [
    {
      step: '01',
      icon: ClipboardCheck,
      titulo: 'Reunión y Asesoría',
      desc: 'Escuchamos tus necesidades, ideas y objetivos para desarrollar la mejor solución para tu proyecto.',
      imagen: 'https://sensible-spoonbill-485.convex.cloud/api/storage/5ba0f1a0-8ff4-4b22-a597-1bafd5994f32',
    },
    {
      step: '02',
      icon: FileSearch,
      titulo: 'Evaluación y Presupuesto',
      desc: 'Analizamos técnicamente el proyecto y entregamos una propuesta clara, transparente y ajustada a tus requerimientos.',
      imagen: 'https://sensible-spoonbill-485.convex.cloud/api/storage/a180a2c4-f2af-4e92-b5c4-aae4b35909dc',
    },
    {
      step: '03',
      icon: CalendarClock,
      titulo: 'Planificación',
      desc: 'Organizamos cada etapa definiendo tiempos, materiales y procesos constructivos.',
      imagen: 'https://sensible-spoonbill-485.convex.cloud/api/storage/0cc871d9-a1c0-4ccf-8285-7ffe91e24252',
    },
    {
      step: '04',
      icon: HardHat,
      titulo: 'Ejecución de la Obra',
      desc: 'Supervisión constante, control de calidad, comunicación permanente y reportes diarios mediante nuestro sistema de gestión.',
      imagen: 'https://sensible-spoonbill-485.convex.cloud/api/storage/bfbd7263-494e-4dfa-a79c-77bbbb430c79',
    },
    {
      step: '05',
      icon: CheckCircle2,
      titulo: 'Entrega Final',
      desc: 'Revisión completa del trabajo para asegurar un resultado profesional y la satisfacción del cliente.',
      imagen: 'https://sensible-spoonbill-485.convex.cloud/api/storage/0964c63c-72fb-4818-a269-63b95c03b3a3',
    },
  ];

  const proyectos = [
    {
      id: 1,
      nombre: 'Vivienda en ejecución',
      descripcion: 'Proyecto habitacional desarrollado con planificación integral y terminaciones de alto nivel.',
      estado: 'En progreso',
      año: 2024,
      imagen:
        'https://sensible-spoonbill-485.convex.cloud/api/storage/63dcf2d0-4600-4e42-8124-bc74cb1bec11',
    },
    {
      id: 2,
      nombre: 'Remodelación interior',
      descripcion: 'Transformación completa de espacios interiores con enfoque en funcionalidad y estética.',
      estado: 'Completado',
      año: 2023,
      imagen:
        'https://sensible-spoonbill-485.convex.cloud/api/storage/82d25407-4bb5-450f-94e8-97ffbe3522a9',
    },
    {
      id: 3,
      nombre: 'Vivienda moderna',
      descripcion: 'Construcción residencial con diseño contemporáneo y materiales de primera calidad.',
      estado: 'Completado',
      año: 2023,
      imagen:
        'https://sensible-spoonbill-485.convex.cloud/api/storage/45ab079a-83c6-467c-8d47-578c761367d1',
    },
    {
      id: 4,
      nombre: 'Estructura y metalcon',
      descripcion: 'Solución estructural metálica diseñada y ejecutada según requerimientos específicos del proyecto.',
      estado: 'Completado',
      año: 2024,
      imagen:
        'https://sensible-spoonbill-485.convex.cloud/api/storage/7812168b-058b-40fe-8d95-67100a6f6b4c',
    },
    {
      id: 5,
      nombre: 'Remodelación exterior',
      descripcion: 'Mejoramiento integral de fachada y espacios exteriores con terminaciones duraderas.',
      estado: 'Completado',
      año: 2022,
      imagen:
        'https://sensible-spoonbill-485.convex.cloud/api/storage/fe952a51-a6a5-4e44-a94c-583c090856cd',
    },
    {
      id: 6,
      nombre: 'Ampliación vivienda',
      descripcion: 'Ampliación planificada que maximiza el uso del espacio disponible sin comprometer la estética.',
      estado: 'Completado',
      año: 2024,
      imagen:
        'https://sensible-spoonbill-485.convex.cloud/api/storage/bcd81ff7-98aa-4dc5-b98d-6b9249fba396',
    },
  ];

  const destacados = [
    'Cumplimiento de plazos y presupuestos',
    'Asesoría personalizada en cada proyecto',
    'Comunicación constante con el cliente',
    'Reportes diarios mediante sistema de gestión',
    'Soluciones modernas y eficientes',
    'Compromiso con la calidad y seguridad',
    'Capacidad de ejecución en distintas regiones de Chile',
  ];

  /* ══════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════ */
  return (
    <div className="bg-zinc-950 text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');`}</style>

      {/* ─── HERO ─── */}
      <header className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('https://sensible-spoonbill-485.convex.cloud/api/storage/85c2c915-0868-4fe2-9f6b-e49e9526e47b')` }}
        />
        <div className="absolute inset-0 bg-zinc-950/80 bg-gradient-to-b from-zinc-950/40 via-zinc-950/80 to-zinc-950 pointer-events-none" />
        
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 pt-8 pb-24">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-300 hover:text-orange-400 transition-colors mb-16"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Inicio
          </Link>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.img
              variants={fadeUp}
              src="https://sensible-spoonbill-485.convex.cloud/api/storage/998944bd-6182-44af-9d7e-84f624902489"
              alt="Grupo Lithia"
              className="h-16 md:h-20 w-auto object-contain mb-8"
            />
            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-6 text-white drop-shadow-lg"
            >
              Construimos confianza,{' '}
              <span className="text-orange-500 drop-shadow-md">construimos futuro.</span>
            </motion.h1>
            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg text-zinc-300 leading-relaxed max-w-2xl drop-shadow-md"
            >
              Somos una empresa dedicada al desarrollo de proyectos de construcción, remodelación y
              mantenimiento, entregando soluciones integrales con altos estándares de calidad,
              compromiso y responsabilidad.
            </motion.p>
          </motion.div>
        </div>
      </header>

      {/* ─── STATS ─── */}
      <div className="border-y border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-5 md:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-3 divide-x divide-zinc-800/60"
          >
            {stats.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="py-10 text-center">
                <s.icon className="w-6 h-6 text-orange-500 mx-auto mb-3 opacity-70" />
                <p className="text-2xl md:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-zinc-500 mt-1 font-medium">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* ─── QUIÉNES SOMOS ─── */}
      <Section id="nosotros" bgImage="https://sensible-spoonbill-485.convex.cloud/api/storage/4f6c4283-bf40-4ef9-92b6-2482195cf5a3">
        <div className="grid lg:grid-cols-5 gap-16">
          <div className="lg:col-span-3">
            <SectionTitle label="Quiénes somos" title="Experiencia, calidad y compromiso en cada obra" />
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="space-y-5 text-zinc-400 leading-relaxed text-[15px]"
            >
              <motion.p variants={fadeUp}>
                Grupo Lithia es una empresa constructora especializada en proyectos residenciales y
                remodelaciones, comprometida con la excelencia, la calidad y la innovación en cada
                proyecto que ejecutamos. Con más de 7 años de experiencia en el mercado, contamos con
                un equipo profesional dedicado a entregar proyectos dentro de plazo y presupuesto.
              </motion.p>
              <motion.p variants={fadeUp} custom={1}>
                Contamos con experiencia en viviendas unifamiliares, ampliaciones, terminaciones,
                estructuras metálicas, instalaciones y obras menores, trabajando siempre bajo
                normativas vigentes y enfocados en la satisfacción de cada cliente.
              </motion.p>
              <motion.p variants={fadeUp} custom={2}>
                Nuestro equipo combina experiencia técnica, planificación y ejecución eficiente,
                permitiéndonos desarrollar proyectos funcionales, estéticos y duraderos. Creemos en
                la construcción como una herramienta para mejorar la calidad de vida de las personas.
              </motion.p>
              <motion.p variants={fadeUp} custom={3}>
                Somos los únicos que ofrecemos{' '}
                <span className="text-orange-400 font-medium">reportes diarios del avance de obra</span>{' '}
                mediante nuestro sistema de gestión, permitiendo a cada cliente conocer en tiempo real
                el estado de su proyecto.
              </motion.p>
            </motion.div>
          </div>

          {/* Destacados */}
          <div className="lg:col-span-2">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
              className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-8"
            >
              <h3 className="text-sm font-semibold tracking-widest uppercase text-orange-500 mb-6">
                Nos destacamos por
              </h3>
              <ul className="space-y-4">
                {destacados.map((d, i) => (
                  <motion.li
                    key={i}
                    variants={fadeUp}
                    custom={i}
                    className="flex items-start gap-3 text-sm text-zinc-300"
                  >
                    <ChevronRight className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    {d}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ─── EQUIPO ─── */}
      <Section className="bg-zinc-900/30" id="equipo">
        <SectionTitle label="Nuestro equipo" title="Profesionales con experiencia y dedicación" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {equipo.map((m, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              custom={i}
              className="border border-zinc-800/60 rounded-xl p-6 hover:border-orange-500/30 transition-colors"
            >
              <p className="font-semibold text-white text-[15px]">{m.nombre}</p>
              <p className="text-xs text-orange-500 font-medium mt-1 mb-3">{m.cargo}</p>
              <p className="text-sm text-zinc-500 leading-relaxed">{m.desc}</p>
            </motion.div>
          ))}
        </motion.div>
        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-sm text-zinc-500 mt-8 leading-relaxed max-w-3xl"
        >
          Además, contamos con un sólido grupo de colaboradores y alianzas estratégicas junto a{' '}
          <span className="text-zinc-300">Taller del Escocés</span> y nuestro aliado{' '}
          <span className="text-zinc-300">Doorwin</span>, reconocidos por ofrecer algunas de las
          mejores ventanas y puertas de PVC de Chile.
        </motion.p>
      </Section>

      {/* ─── SERVICIOS ─── */}
      <Section id="servicios" bgImage="https://sensible-spoonbill-485.convex.cloud/api/storage/72ad1371-9bf2-4d4d-8143-c57a04b35dfc">
        <SectionTitle label="Servicios" title="Soluciones integrales para tu proyecto" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {servicios.map((s, i) => {
            const CardContent = (
              <>
                <s.icon className="w-7 h-7 text-orange-500 mb-4 opacity-80 group-hover:opacity-100 transition-opacity" />
                <h3 className="font-semibold text-white text-[15px] mb-2">{s.titulo}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </>
            );

            return s.link ? (
              <motion.a
                key={i}
                href={s.link}
                target="_blank"
                rel="noopener noreferrer"
                variants={fadeUp}
                custom={i}
                className="group block border border-zinc-800/60 rounded-xl p-6 hover:border-orange-500/30 transition-all cursor-pointer"
              >
                {CardContent}
              </motion.a>
            ) : (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group border border-zinc-800/60 rounded-xl p-6 hover:border-orange-500/30 transition-all"
              >
                {CardContent}
              </motion.div>
            );
          })}
        </motion.div>
      </Section>

      {/* ─── PROCESO ─── */}
      <Section className="bg-zinc-900/30" id="proceso">
        <SectionTitle label="Nuestro proceso" title="De la idea a la entrega, paso a paso" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid md:grid-cols-5 gap-6"
        >
          {proceso.map((p, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} className="relative overflow-hidden p-6 rounded-xl border border-zinc-800/60 bg-zinc-900/50 group hover:border-orange-500/30 transition-colors">
              {p.imagen && (
                <>
                  <div className="absolute inset-0 z-0">
                    <img src={p.imagen} alt={p.titulo} className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/90 via-zinc-900/80 to-zinc-900/40" />
                  </div>
                </>
              )}
              <div className="relative z-10">
                <span className="text-[40px] font-bold text-zinc-700/50 group-hover:text-zinc-600/50 transition-colors leading-none block mb-4">
                  {p.step}
                </span>
                <p.icon className="w-6 h-6 text-orange-500 mb-4 opacity-90" />
                <h3 className="font-semibold text-white text-[15px] mb-2">{p.titulo}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ─── PROYECTOS ─── */}
      <Section id="proyectos" bgImage="https://sensible-spoonbill-485.convex.cloud/api/storage/f20a63a0-16c8-4bc5-a8d5-910a6978b92d">
        <SectionTitle
          label="Proyectos"
          title="Cada proyecto refleja nuestro compromiso con la excelencia"
        />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {proyectos.map((p, i) => (
            <motion.div
              key={p.id}
              variants={fadeUp}
              custom={i}
              className="group rounded-xl overflow-hidden border border-zinc-800/60 hover:border-orange-500/30 transition-colors"
            >
              <a
                href="https://www.instagram.com/lithiaconstructores"
                target="_blank"
                rel="noopener noreferrer"
                className="block relative h-52 overflow-hidden bg-zinc-900"
              >
                <img
                  src={p.imagen}
                  alt={p.nombre}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-transparent to-transparent" />
                <span
                  className={`absolute top-3 right-3 text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full ${
                    p.estado === 'Completado'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {p.estado}
                </span>
              </a>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-[15px]">{p.nombre}</h3>
                  <span className="text-[11px] text-zinc-600 font-medium">{p.año}</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed">{p.descripcion}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mt-10 text-center"
        >
          <a
            href="https://www.instagram.com/lithiaconstructores"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-orange-500 hover:text-orange-400 transition-colors font-medium"
          >
            <FaInstagram className="w-4 h-4" />
            Ver más proyectos en Instagram
          </a>
        </motion.div>
      </Section>

      {/* ─── ZONA DE TRABAJO ─── */}
      <Section className="bg-zinc-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.p
              variants={fadeUp}
              className="text-xs font-semibold tracking-[0.3em] uppercase text-orange-500 mb-4"
            >
              Cobertura
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold mb-6">
              Donde nos necesites
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-zinc-400 leading-relaxed">
              Desarrollamos proyectos principalmente en la Quinta Región, zona del Litoral Central y
              Santiago. Sin embargo, contamos con la capacidad operativa y logística para ejecutar
              obras en cualquier lugar de Chile.
            </motion.p>
          </motion.div>
        </div>
      </Section>

      {/* ─── CONTACTO ─── */}
      <Section id="contacto" bgImage="https://sensible-spoonbill-485.convex.cloud/api/storage/a1c6f8e6-a0c3-425a-adcf-e07b2bf5fa3c">
        <SectionTitle label="Contacto" title="¿Tienes un proyecto en mente?" />
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-zinc-400 leading-relaxed max-w-lg"
          >
            Estamos preparados para ayudarte a construir, remodelar o mejorar tus espacios con
            soluciones profesionales, eficientes y con seguimiento diario de obra. Contáctanos y
            conversemos sobre tu proyecto.
          </motion.p>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-5"
          >
            {[
              { icon: MapPin, text: 'Ruta 66 Km 2, Santo Domingo — Región de Valparaíso, Chile' },
              { icon: Phone, text: '+56 9 8368 1545', href: 'tel:+56983681545' },
              { icon: Mail, text: 'contacto@grupolithia.cl', href: 'mailto:contacto@grupolithia.cl' },
              { icon: Globe, text: 'www.grupolithia.cl', href: 'https://www.grupolithia.cl' },
            ].map((c, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="flex items-start gap-4">
                <c.icon className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                {c.href ? (
                  <a
                    href={c.href}
                    target={c.href.startsWith('http') ? '_blank' : undefined}
                    rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="text-sm text-zinc-300 hover:text-orange-400 transition-colors"
                  >
                    {c.text}
                  </a>
                ) : (
                  <span className="text-sm text-zinc-300">{c.text}</span>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-zinc-800/60 py-8">
        <div className="max-w-6xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} Grupo Lithia Constructores. Todos los derechos reservados.
          </p>
          <p className="text-xs text-zinc-700">
            Construimos confianza, construimos futuro.
          </p>
        </div>
      </footer>
    </div>
  );
}
