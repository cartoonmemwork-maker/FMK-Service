import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const whatsappUrl =
  'https://wa.me/5491133190913?text=Hola%20FMK%20Service%2C%20quiero%20consultar%20por%20una%20reparaci%C3%B3n.';
const mapsUrl = 'https://maps.app.goo.gl/j4KGtbFLW4RRRVRo7';
const instagramUrl = 'https://www.instagram.com/fmkservice.ok/';

const services = [
  {
    number: '01',
    title: 'Pantallas y módulos',
    copy: 'Cambio de pantalla, vidrio y módulos para recuperar imagen y respuesta táctil.',
  },
  {
    number: '02',
    title: 'Batería y carga',
    copy: 'Baterías, conectores, flex y diagnóstico de fallas de alimentación.',
  },
  {
    number: '03',
    title: 'Cámaras y componentes',
    copy: 'Cámaras, botones, parlantes, micrófonos y componentes internos.',
  },
  {
    number: '04',
    title: 'Placa y microsoldadura',
    copy: 'Reparación a nivel componente, reballing y fallas electrónicas complejas.',
  },
  {
    number: '05',
    title: 'Daño por líquido',
    copy: 'Revisión, limpieza técnica y evaluación para recuperar el equipo cuando es posible.',
  },
  {
    number: '06',
    title: 'Diagnóstico general',
    copy: '¿No sabés qué tiene? Revisamos el equipo y te explicamos la solución antes de avanzar.',
  },
];

const steps = [
  ['Consultás', 'Nos contás qué equipo tenés y cuál es la falla.'],
  ['Diagnosticamos', 'Revisamos el problema y te proponemos la solución adecuada.'],
  ['Reparamos', 'Avanzamos únicamente después de tu aprobación.'],
  ['Probás', 'Verificamos el funcionamiento antes de la entrega.'],
];

const supportedBrands = [
  { name: 'Apple', src: '/brands/apple.png', width: 320, height: 320 },
  { name: 'Samsung', src: '/brands/samsung.png', width: 630, height: 320 },
  { name: 'Motorola', src: '/brands/motorola.png', width: 320, height: 320 },
  { name: 'LG', src: '/brands/lg.png', width: 630, height: 320 },
  { name: 'Android', src: '/brands/android.png', width: 1024, height: 640 },
];

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="FMK Service, inicio">
          <img
            src="/fmk-service-wordmark.png"
            alt="FMK Service"
            width="564"
            height="272"
          />
        </a>

        <nav className="desktop-nav" aria-label="Navegación principal">
          <a href="#servicios">Servicios</a>
          <a href="#proceso">Cómo trabajamos</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <a className="header-cta" href={whatsappUrl} target="_blank" rel="noreferrer">
          Consultar
        </a>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">Técnico certificado · San Martín</p>
            <h1>Servicio técnico</h1>
            <p className="hero-lead">
              Reparamos iPhone, celulares Android y equipos electrónicos con diagnóstico
              preciso, trabajo a nivel componente y calidad garantizada.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                Consultar reparación <ArrowIcon />
              </a>
              <a className="button button-secondary" href={mapsUrl} target="_blank" rel="noreferrer">
                Cómo llegar
              </a>
            </div>
          </div>

          <div className="hero-mark" aria-hidden="true">
            <div className="hero-orbit" />
            <img src="/fmk-service-wordmark.png" alt="" width="564" height="272" />
            <span className="hero-label hero-label-top">Diagnóstico preciso</span>
            <span className="hero-label hero-label-bottom">Reparación profesional</span>
          </div>
        </section>

        <section className="proof-strip" aria-label="Razones para elegir FMK Service">
          <a href={mapsUrl} target="_blank" rel="noreferrer">
            <strong>5.0 ★</strong>
            <span>Calificación en Google</span>
          </a>
          <div>
            <strong>24 h</strong>
            <span>Muchas reparaciones</span>
          </div>
          <div>
            <strong>Certificado</strong>
            <span>Formación técnica</span>
          </div>
          <div>
            <strong>Todos los días</strong>
            <span>Consultá disponibilidad</span>
          </div>
        </section>

        <section className="brands-strip" aria-labelledby="brands-title">
          <div>
            <p className="eyebrow">Servicio multimarca</p>
            <h2 id="brands-title">Reparamos equipos de todas las marcas.</h2>
          </div>
          <div className="brand-logos">
            {supportedBrands.map((brand) => (
              <img
                key={brand.name}
                src={brand.src}
                alt={brand.name}
                width={brand.width}
                height={brand.height}
                loading="lazy"
                decoding="async"
              />
            ))}
          </div>
        </section>

        <section className="section services-section" id="servicios">
          <div className="section-heading">
            <p className="eyebrow">Qué reparamos</p>
            <h2>Del vidrio a la placa.</h2>
            <p>
              Trabajamos con iPhone, Android y otros equipos electrónicos. Si no encontrás
              tu problema en la lista, escribinos: probablemente también tenga solución.
            </p>
          </div>

          <div className="services-grid">
            {services.map((service) => (
              <article className="service-card" key={service.number}>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="component-section">
          <div>
            <p className="eyebrow eyebrow-light">Más que cambiar piezas</p>
            <h2>Reparamos a nivel componente.</h2>
          </div>
          <div>
            <p>
              Cuando el equipo lo permite, buscamos la falla real y trabajamos sobre la
              placa para recuperar el dispositivo sin reemplazar conjuntos completos de
              manera innecesaria.
            </p>
            <ul>
              <li>Microsoldadura</li>
              <li>Reballing</li>
              <li>Fallas de encendido</li>
              <li>Diagnóstico electrónico</li>
            </ul>
          </div>
        </section>

        <section className="section process-section" id="proceso">
          <div className="section-heading compact">
            <p className="eyebrow">Cómo trabajamos</p>
            <h2>Claro desde el primer mensaje.</h2>
          </div>

          <ol className="process-list">
            {steps.map(([title, copy], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="reviews-section">
          <div>
            <p className="eyebrow">Opiniones reales</p>
            <p className="rating" aria-label="Cinco estrellas de cinco">5.0</p>
            <div className="stars" aria-hidden="true">★★★★★</div>
          </div>
          <div>
            <h2>La confianza también se repara todos los días.</h2>
            <p>
              La mejor referencia es la experiencia de quienes ya trajeron su equipo a
              FMK Service.
            </p>
            <a className="text-link" href={mapsUrl} target="_blank" rel="noreferrer">
              Ver reseñas en Google <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="contact-section" id="contacto">
          <div>
            <p className="eyebrow eyebrow-light">FMK Service · San Martín</p>
            <h2>¿Qué le pasó a tu equipo?</h2>
            <p>Contanos el modelo y la falla. Te orientamos por WhatsApp antes de acercarte.</p>
            <a className="button button-light" href={whatsappUrl} target="_blank" rel="noreferrer">
              Escribir por WhatsApp <ArrowIcon />
            </a>
          </div>

          <address>
            <div>
              <span>Dirección</span>
              <strong>25 de Mayo 8192</strong>
              <p>Villa José León Suárez, San Martín</p>
              <a href={mapsUrl} target="_blank" rel="noreferrer">Abrir en Google Maps</a>
            </div>
            <div>
              <span>Contacto</span>
              <strong>11 3319-0913</strong>
              <p>Atención todos los días</p>
              <a href={instagramUrl} target="_blank" rel="noreferrer">@fmkservice.ok</a>
            </div>
          </address>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio">
          <img src="/fmk-service-wordmark.png" alt="FMK Service" width="564" height="272" />
        </a>
        <p>Servicio técnico · San Martín</p>
        <a href={instagramUrl} target="_blank" rel="noreferrer">Instagram <ArrowIcon /></a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
