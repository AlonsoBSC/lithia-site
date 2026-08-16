import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';


const IMG_HERO       = "https://sensible-spoonbill-485.convex.cloud/api/storage/945a923f-2e35-4740-8a50-f0e2880ce5b8";
const IMG_LOGO       = "https://sensible-spoonbill-485.convex.cloud/api/storage/998944bd-6182-44af-9d7e-84f624902489";
const IMG_NOSOTROS   = "https://sensible-spoonbill-485.convex.cloud/api/storage/dd235b49-8d53-4dc7-8367-8301690b20e9";
const IMG_CONTACT_BG = "/images/contact-bg.jpg";

const PROJ_IMGS = [
  { src: "https://sensible-spoonbill-485.convex.cloud/api/storage/63dcf2d0-4600-4e42-8124-bc74cb1bec11", title: "Vivienda en ejecución",    desc: "Obra desarrollada con planificación, calidad y terminaciones cuidadas." },
  { src: "https://sensible-spoonbill-485.convex.cloud/api/storage/82d25407-4bb5-450f-94e8-97ffbe3522a9", title: "Remodelación interior",    desc: "Obra desarrollada con planificación, calidad y terminaciones cuidadas." },
  { src: "https://sensible-spoonbill-485.convex.cloud/api/storage/45ab079a-83c6-467c-8d47-578c761367d1", title: "Vivienda moderna",         desc: "Obra desarrollada con planificación, calidad y terminaciones cuidadas." },
  { src: "https://sensible-spoonbill-485.convex.cloud/api/storage/7812168b-058b-40fe-8d95-67100a6f6b4c", title: "Estructura y metalcon",    desc: "Obra desarrollada con planificación, calidad y terminaciones cuidadas." },
  { src: "https://sensible-spoonbill-485.convex.cloud/api/storage/fe952a51-a6a5-4e44-a94c-583c090856cd", title: "Remodelación exterior",    desc: "Obra desarrollada con planificación, calidad y terminaciones cuidadas." },
  { src: "https://sensible-spoonbill-485.convex.cloud/api/storage/bcd81ff7-98aa-4dc5-b98d-6b9249fba396", title: "Ampliación vivienda",      desc: "Obra desarrollada con planificación, calidad y terminaciones cuidadas." },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const MenuIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const CloseIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const ArrowRight = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 transition-all duration-200 group-hover:translate-x-1"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>;
const WhatsApp   = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.868l6.168-1.448A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.002-1.368l-.36-.214-3.717.873.933-3.619-.234-.372A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>;


// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 80); }, []);

  return (
    <section id="inicio" className="relative min-h-screen flex items-center overflow-hidden">
      <img src={IMG_HERO} alt="" className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[2s] ${loaded ? 'scale-100' : 'scale-105'}`}
        style={{ filter: 'brightness(0.35)' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-20">
        <div className={`transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-4xl md:text-6xl font-black mb-2 drop-shadow-md uppercase" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            <span className="text-white">Grupo</span> <span className="text-orange-500">Lithia</span> <span className="text-white">Constructores</span>
          </h1>
        </div>
        <p className={`text-orange-500 text-xs tracking-[0.3em] uppercase font-semibold mb-5 transition-all duration-700 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Construimos con calidad, compromiso y respaldo técnico
        </p>
        <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 max-w-3xl transition-all duration-700 delay-150 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}>
          Construimos, remodelamos y mantenemos espacios<br />
          <span className="text-orange-500 italic" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>que mejoran tu vida.</span>
        </h1>
        <p className={`text-zinc-300 text-sm md:text-base leading-relaxed max-w-xl mb-10 transition-all duration-700 delay-300 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          Desarrollamos proyectos de construcción, remodelación, ampliaciones, mantenciones y soluciones técnicas para viviendas, locales y obras menores.
        </p>
        <div className={`flex flex-wrap gap-4 transition-all duration-700 delay-500 ${loaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <a href="https://wa.me/56983681545" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200">
            <WhatsApp /> Cotizar mi Proyecto
          </a>
          <Link to="/Proyectos"
            className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/30 hover:border-white text-white text-xs font-medium tracking-widest uppercase transition-all duration-200 group">
            Ver Trabajos Realizados <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Values Strip ──────────────────────────────────────────────────────────────
const VALUES = [
  { icon: '🛡', label: 'Compromiso',   desc: 'Nos comprometemos con cada proyecto como si fuera propio.' },
  { icon: '⚙',  label: 'Experiencia',  desc: 'Contamos con experiencia técnica y práctica en distintos tipos de obras.' },
  { icon: '✓',  label: 'Calidad',      desc: 'Cuidamos los detalles, los materiales y los procesos de trabajo.' },
  { icon: '💬', label: 'Comunicación', desc: 'Mantenemos informado al cliente en cada etapa del proyecto.' },
  { icon: '🤝', label: 'Confianza',    desc: 'Trabajamos con honestidad, transparencia y responsabilidad.' },
];

function ValuesStrip() {
  return (
    <div className="bg-[#111] border-y border-orange-500/10">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-orange-500/10">
          {VALUES.map(v => (
            <div key={v.label} className="p-6 md:p-8 text-center hover:bg-orange-500/5 transition-colors duration-200">
              <div className="text-orange-500 text-2xl mb-3">{v.icon}</div>
              <h3 className="text-white text-xs font-bold tracking-widest uppercase mb-2">{v.label}</h3>
              <p className="text-zinc-500 text-xs leading-relaxed hidden md:block">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Nosotros ──────────────────────────────────────────────────────────────────
function Nosotros() {
  return (
    <section id="nosotros" className="bg-[#0a0a0a] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
        <div className="relative">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={IMG_NOSOTROS} alt="Nosotros" className="w-full h-full object-cover" />
          </div>
          <div className="absolute bottom-4 right-4 bg-orange-500 p-6 text-center">
            <div className="text-4xl font-black text-white" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>+50</div>
            <div className="text-white text-xs font-semibold tracking-widest uppercase leading-tight mt-1">Proyectos<br />Realizados</div>
          </div>
        </div>

        <div>
          <p className="text-orange-500 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Nosotros</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            Construimos relaciones basadas en confianza
          </h2>
          <h2 className="text-3xl md:text-4xl font-bold text-orange-500 mb-6 italic" style={{ fontFamily: "'Georgia', serif", fontWeight: 400 }}>
            y buenos resultados.
          </h2>
          <div className="w-10 h-0.5 bg-orange-500 mb-6" />
          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
            Grupo Lithia Constructores es una empresa en crecimiento, liderada por profesionales del área de la construcción, con experiencia en viviendas unifamiliares, remodelaciones, ampliaciones, mantenciones y obras especializadas.
          </p>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            Nuestro objetivo es entregar soluciones constructivas claras, responsables y bien ejecutadas, cuidando cada etapa del proyecto: planificación, presupuesto, ejecución, control de calidad y entrega final.
          </p>
          <Link to="/Proyectos"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a1a1a] border border-orange-500/30 text-orange-400 text-xs tracking-widest uppercase font-medium hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-200 group">
            Conoce más sobre nosotros <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Servicios ─────────────────────────────────────────────────────────────────
const SERVICIOS = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    img: 'https://sensible-spoonbill-485.convex.cloud/api/storage/63dcf2d0-4600-4e42-8124-bc74cb1bec11',
    title: 'Construcción de Viviendas',
    desc: 'Construcción de viviendas nuevas en sistemas tradicionales, madera, metalcon, SIP y soluciones mixtas.',
    link: 'https://www.instagram.com/p/DW7ugEYkQmg/',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    img: 'https://sensible-spoonbill-485.convex.cloud/api/storage/82d25407-4bb5-450f-94e8-97ffbe3522a9',
    title: 'Remodelaciones y Ampliaciones',
    desc: 'Transformamos espacios existentes, mejorando distribución, terminaciones, funcionalidad y valor de la propiedad.',
    link: 'https://www.instagram.com/p/DN9vcxmjbqH/',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    img: 'https://sensible-spoonbill-485.convex.cloud/api/storage/7abc351b-73aa-49d2-bc1a-a0dcc602d2f5',
    title: 'Mantenciones y Reparaciones',
    desc: 'Soluciones para filtraciones, pinturas, sellos, revestimientos, terminaciones, cielos, tabiques, baños, cocinas y reparaciones generales.',
    link: 'https://www.instagram.com/p/DMrMdT0xONA/',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
    img: 'https://sensible-spoonbill-485.convex.cloud/api/storage/7812168b-058b-40fe-8d95-67100a6f6b4c',
    title: 'Estructuras y Techumbres',
    desc: 'Estructuras metálicas, cubiertas, pavimentos, instalaciones, revestimientos, techumbres y soluciones específicas.',
    link: 'https://www.instagram.com/stories/highlights/18098021983604855/',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    img: 'https://sensible-spoonbill-485.convex.cloud/api/storage/16702e3c-2716-4eee-9de2-d52b0b654158',
    title: 'Proyectos Técnicos y Presupuestos',
    desc: 'Elaboración de presupuestos detallados, cubicaciones, planificación de obra, control de avances y asesoría constructiva.',
    link: 'https://www.instagram.com/stories/highlights/18365186584176379/',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>,
    img: 'https://sensible-spoonbill-485.convex.cloud/api/storage/f75d9844-cc9d-4b87-af0b-3a511c1f68ab',
    title: 'Asesoría Constructiva',
    desc: 'Acompañamiento técnico para tomar las mejores decisiones en cada etapa de tu proyecto.',
    link: 'https://www.instagram.com/stories/highlights/17852826942473138/',
  },
];

function Servicios() {
  return (
    <section id="servicios" className="bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5">
        <div className="text-center mb-14">
          <p className="text-orange-500 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Servicios</p>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a0a0a]" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            Soluciones constructivas para cada necesidad
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200">
          {SERVICIOS.map(s => {
            const CardContent = (
              <>
                {s.img && (
                  <div className="relative w-full h-48 overflow-hidden shrink-0">
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
                    <div className="absolute top-4 left-4 bg-white/95 p-2.5 text-orange-500 rounded-sm shadow-sm">
                      {s.icon}
                    </div>
                  </div>
                )}
                <div className={`p-8 flex flex-col flex-1 ${s.img ? 'pt-6' : ''}`}>
                  {!s.img && <div className="text-orange-500 mb-5 group-hover:scale-110 transition-transform duration-200">{s.icon}</div>}
                  <h3 className="font-bold text-[#0a0a0a] group-hover:text-white text-sm tracking-wide uppercase mb-3 transition-colors duration-300"
                    style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1rem', letterSpacing: '0.08em' }}>
                    {s.title}
                  </h3>
                  <p className="text-zinc-500 group-hover:text-zinc-400 text-xs leading-relaxed mb-5 transition-colors duration-300 flex-1">{s.desc}</p>
                  <div className="inline-flex items-center gap-1.5 text-orange-500 text-xs tracking-widest uppercase font-semibold group-hover:gap-3 transition-all duration-200 mt-auto self-start">
                    Ver más <ArrowRight />
                  </div>
                </div>
              </>
            );

            return s.link ? (
              <a href={s.link} target="_blank" rel="noopener noreferrer" key={s.title} className="bg-white group hover:bg-[#0a0a0a] transition-colors duration-300 flex flex-col h-full cursor-pointer block">
                {CardContent}
              </a>
            ) : (
              <div key={s.title} className="bg-white group hover:bg-[#0a0a0a] transition-colors duration-300 flex flex-col h-full">
                {CardContent}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Proyectos ─────────────────────────────────────────────────────────────────
function Proyectos() {
  return (
    <section id="proyectos" className="bg-[#0a0a0a] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-5">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-orange-500 text-xs tracking-[0.3em] uppercase font-semibold mb-2">Proyectos</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
              Trabajos que reflejan<br />nuestro compromiso
            </h2>
          </div>
          <Link to="/Proyectos"
            className="hidden md:inline-flex items-center gap-2 text-orange-500 text-xs tracking-widest uppercase font-semibold hover:gap-3 transition-all duration-200 group whitespace-nowrap">
            Ver todos <ArrowRight />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
          {PROJ_IMGS.map((p, i) => (
            <Link to="/Proyectos" key={i} className="relative overflow-hidden aspect-video group cursor-pointer block">
              <img src={p.src} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <h3 className="text-white font-bold text-sm">{p.title}</h3>
                <p className="text-zinc-300 text-xs mt-1">{p.desc}</p>
                <div className="inline-flex items-center gap-1.5 text-orange-400 text-xs tracking-widest uppercase font-semibold mt-2 group hover:gap-2.5 transition-all duration-200">
                  Ver proyecto <ArrowRight />
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link to="/Proyectos"
            className="inline-flex items-center gap-2 border border-orange-500/40 text-orange-500 px-6 py-3 text-xs tracking-widest uppercase font-semibold hover:bg-orange-500 hover:text-white transition-all duration-200 group">
            Ver todos los proyectos <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Proceso ───────────────────────────────────────────────────────────────────
const PASOS = [
  { num: '01', title: 'Contacto inicial',  desc: 'Escuchamos la necesidad del cliente y revisamos la idea general del proyecto.' },
  { num: '02', title: 'Visita técnica',    desc: 'Evaluamos en terreno las condiciones reales de la obra.' },
  { num: '03', title: 'Presupuesto claro', desc: 'Entregamos una propuesta detallada con partidas, materiales y alcance definido.' },
  { num: '04', title: 'Planificación',     desc: 'Organizamos tiempos, etapas de trabajo y recursos necesarios.' },
  { num: '05', title: 'Ejecución',         desc: 'Desarrollamos la obra con control, comunicación y supervisión.' },
  { num: '06', title: 'Entrega final',     desc: 'Revisamos detalles, entregamos el trabajo terminado y cerramos el proyecto.' },
];

function Proceso() {
  return (
    <section id="proceso" className="bg-[#111] py-20 md:py-28 border-y border-orange-500/10">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid md:grid-cols-4 gap-10 items-start">
          <div>
            <p className="text-orange-500 text-xs tracking-[0.3em] uppercase font-semibold mb-3">Proceso de trabajo</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
              Así trabajamos<br />contigo en<br />cada proyecto.
            </h2>
          </div>
          <div className="md:col-span-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PASOS.map((p) => (
              <div key={p.num} className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-xs font-bold">{p.num}</span>
                  </div>
                  {p.img && (
                    <img src={p.img} alt={p.title} className="h-10 w-16 object-cover rounded-md border border-orange-500/20" />
                  )}
                </div>
                <h3 className="text-white font-bold text-sm mb-2">{p.title}</h3>
                <p className="text-zinc-500 text-xs leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── CTA Banner ────────────────────────────────────────────────────────────────
function CTABanner() {
  return (
    <section className="relative py-20 overflow-hidden">
      <img src={IMG_CONTACT_BG} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ filter: 'brightness(0.2)' }} />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-8">
        <div>
          <p className="text-orange-500 text-xs tracking-[0.3em] uppercase font-semibold mb-2">¿Tienes un proyecto en mente?</p>
          <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight" style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}>
            Conversemos y revisemos<br />
            <span className="text-orange-500">la mejor forma de hacerlo realidad.</span>
          </h2>
        </div>
        <a href="https://wa.me/56983681545" target="_blank" rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200">
          <WhatsApp /> Cotizar por WhatsApp
        </a>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer id="contacto" className="bg-[#0a0a0a] border-t border-orange-500/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <img src="https://sensible-spoonbill-485.convex.cloud/api/storage/998944bd-6182-44af-9d7e-84f624902489" alt="Grupo Lithia" className="h-24 mb-4 object-contain" />
            <p className="text-zinc-500 text-xs leading-relaxed mb-6">
              Construcción, remodelaciones y mantenciones con calidad, compromiso y respaldo técnico.
            </p>
            <div className="flex gap-3">
              {['f', 'in', 'ig'].map(s => (
                <a key={s} href="#" className="w-8 h-8 border border-zinc-700 flex items-center justify-center text-zinc-500 hover:border-orange-500 hover:text-orange-500 transition-all duration-200 text-xs font-bold uppercase">
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-5">Contacto</h3>
            <div className="space-y-3 text-xs text-zinc-400">
              <p>📧 julian.gomez@grupolithia.cl</p>
              <p>🌐 www.grupolithia.cl</p>
              <p>📞 +56 9 8368 1545</p>
              <p>📍 Kilómetro 3 Ruta 66 PC29, Santo Domingo<br />&nbsp;&nbsp;&nbsp;&nbsp;Región de Valparaíso y alrededores</p>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-xs tracking-widest uppercase mb-5">Escríbenos</h3>
            <div className="space-y-3">
              {[['Nombre', 'text'], ['Teléfono', 'tel'], ['Correo electrónico', 'email'], ['Tipo de proyecto', 'text']].map(([ph, type]) => (
                <input key={ph} type={type} placeholder={ph}
                  className="w-full bg-[#111] border border-zinc-800 text-white text-xs px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors" />
              ))}
              <textarea rows={3} placeholder="Mensaje"
                className="w-full bg-[#111] border border-zinc-800 text-white text-xs px-4 py-2.5 placeholder-zinc-600 focus:outline-none focus:border-orange-500 transition-colors resize-none" />
              <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold tracking-widest uppercase transition-colors duration-200">
                Enviar solicitud
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-zinc-600 text-xs">© 2025 Grupo Lithia Constructores — Todos los derechos reservados</p>
          <div className="flex gap-6">
            <Link to="/Proyectos" className="text-zinc-600 hover:text-orange-500 text-xs transition-colors">Proyectos</Link>
            <Link to="/contacto"  className="text-zinc-600 hover:text-orange-500 text-xs transition-colors">Contacto</Link>
            <Link to="/login"     className="text-zinc-600 hover:text-orange-500 text-xs transition-colors">Iniciar Sesión</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Floating WhatsApp ─────────────────────────────────────────────────────────
function FloatingWA() {
  return (
    <a href="https://wa.me/56983681545" target="_blank" rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all duration-200 hover:scale-110">
      <WhatsApp />
    </a>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="bg-[#0a0a0a]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap');
      `}</style>
      <Hero />
      <ValuesStrip />
      <Nosotros />
      <Servicios />
      <Proyectos />
      <Proceso />
      <CTABanner />
      <Footer />
      <FloatingWA />
    </div>
  );
}