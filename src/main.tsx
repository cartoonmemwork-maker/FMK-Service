import { StrictMode, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const whatsappUrl =
  'https://wa.me/5491133190913?text=Hola%20FMK%20Service%2C%20quiero%20consultar%20por%20una%20reparaci%C3%B3n.';
const mapsUrl = 'https://maps.app.goo.gl/j4KGtbFLW4RRRVRo7';
const instagramUrl = 'https://www.instagram.com/fmkservice.ok/';
const shareDomain = 'https://fmkservice.ar/';

type ZarazApi = {
  track: (eventName: string, properties?: Record<string, string>) => Promise<void> | void;
};

function trackAction(button: string) {
  const zaraz = (window as Window & { zaraz?: ZarazApi }).zaraz;
  void zaraz?.track('button_click', { button });
}

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
  { name: 'Xiaomi', src: '/brands/xiaomi.png', width: 350, height: 350 },
  { name: 'LG', src: '/brands/lg.png', width: 630, height: 320 },
  { name: 'TCL', src: '/brands/tcl.png', width: 301, height: 95 },
  { name: 'Infinix', src: '/brands/infinix.png', width: 300, height: 66 },
  { name: 'Tecno', src: '/brands/tecno.png', width: 301, height: 60 },
  { name: 'ZTE', src: '/brands/zte.png', width: 300, height: 147 },
  { name: 'PlayStation', src: '/brands/playstation.png', width: 288, height: 222 },
];

type WorkshopSlide = {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
};

type WorkshopCarousel = {
  analyticsId: string;
  title: string;
  copy: string;
  className?: string;
  slides: WorkshopSlide[];
};

const workshopCarousels: WorkshopCarousel[] = [
  {
    analyticsId: 'internal',
    title: 'Trabajo interno',
    copy: 'Diagnóstico y reemplazo de componentes.',
    className: 'work-card-iphone',
    slides: [
      {
        src: '/work/internal-multibrand-workbench.webp',
        alt: 'Equipos Motorola desarmados para reparación interna en el banco de trabajo de FMK Service',
        width: 1200,
        height: 1600,
      },
      {
        src: '/work/iphone-repair.webp',
        alt: 'iPhone abierto durante una reparación interna en el taller de FMK Service',
        width: 900,
        height: 1600,
        objectPosition: '50% 66%',
      },
      {
        src: '/work/internal-samsung-battery.webp',
        alt: 'Celular Samsung abierto durante el reemplazo de su batería original',
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    analyticsId: 'multibrand',
    title: 'Equipos multimarca',
    copy: 'También trabajamos con equipos plegables.',
    slides: [
      {
        src: '/work/multibrand-iphone.webp',
        alt: 'iPhone reparado y listo para las pruebas finales en el taller',
        width: 1200,
        height: 1600,
      },
      {
        src: '/work/multibrand-samsung.webp',
        alt: 'Celular Samsung revisado con equipamiento profesional en FMK Service',
        width: 1200,
        height: 1600,
      },
      {
        src: '/work/foldable-repair.webp',
        alt: 'Celulares plegables Motorola durante una reparación en FMK Service',
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    analyticsId: 'microsoldering',
    title: 'Microsoldadura',
    copy: 'Precisión para fallas a nivel placa.',
    slides: [
      {
        src: '/work/microsoldering-bga.webp',
        alt: 'Componente electrónico BGA preparado para un trabajo de microsoldadura en FMK Service',
        width: 1200,
        height: 1600,
      },
      {
        src: '/work/microsoldering-board.webp',
        alt: 'Placa electrónica preparada para microsoldadura y reballing de un componente BGA',
        width: 1200,
        height: 1600,
      },
      {
        src: '/work/microsoldering-connector.webp',
        alt: 'Conector interno de precisión reparado mediante microsoldadura',
        width: 1200,
        height: 1600,
      },
    ],
  },
];

function WorkCarousel({ carousel }: { carousel: WorkshopCarousel }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const imageRequest = useRef(0);
  const activeSlide = carousel.slides[activeIndex];

  const showSlide = (nextIndex: number) => {
    const normalizedIndex =
      (nextIndex + carousel.slides.length) % carousel.slides.length;
    const requestId = imageRequest.current + 1;
    const nextImage = new Image();

    imageRequest.current = requestId;
    nextImage.onload = nextImage.onerror = () => {
      if (imageRequest.current === requestId) {
        setActiveIndex(normalizedIndex);
      }
    };
    nextImage.src = carousel.slides[normalizedIndex].src;
  };

  const showRelativeSlide = (offset: number) => {
    trackAction(`carousel_${carousel.analyticsId}`);
    showSlide(activeIndex + offset);
  };

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    suppressClick.current = false;
    pointerStart.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const start = pointerStart.current;

    if (!start || start.id !== event.pointerId) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    const moved = Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8;

    pointerStart.current = null;
    suppressClick.current = moved;

    if (Math.abs(deltaX) > 35 && Math.abs(deltaX) > Math.abs(deltaY)) {
      showRelativeSlide(deltaX < 0 ? 1 : -1);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    showRelativeSlide(event.key === 'ArrowRight' ? 1 : -1);
  };

  return (
    <article className={`work-card ${carousel.className ?? ''}`}>
      <button
        className="work-card-control"
        type="button"
        aria-label={`${carousel.title}. Foto ${activeIndex + 1} de ${carousel.slides.length}: ${activeSlide.alt}. Tocá, hacé clic o deslizá para cambiar.`}
        onClick={() => {
          if (suppressClick.current) {
            suppressClick.current = false;
            return;
          }
          showRelativeSlide(1);
        }}
        onKeyDown={handleKeyDown}
        onPointerCancel={() => {
          pointerStart.current = null;
          suppressClick.current = true;
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <img
          key={activeSlide.src}
          src={activeSlide.src}
          alt={activeSlide.alt}
          width={activeSlide.width}
          height={activeSlide.height}
          loading="lazy"
          decoding="async"
          draggable="false"
          style={{ objectPosition: activeSlide.objectPosition }}
        />
      </button>
      <div className="work-card-caption">
        <h3>{carousel.title}</h3>
        <p>{carousel.copy}</p>
      </div>
    </article>
  );
}

function ArrowIcon() {
  return <span aria-hidden="true">↗</span>;
}

function ShareIcon({ copied }: { copied: boolean }) {
  if (copied) return <span aria-hidden="true">✓</span>;

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function App() {
  const [shareCopied, setShareCopied] = useState(false);
  const shareTimer = useRef<number | null>(null);

  const copySiteAddress = async () => {
    trackAction('header_share');
    let copied = false;

    try {
      await navigator.clipboard.writeText(shareDomain);
      copied = true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = shareDomain;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand('copy');
      textarea.remove();
    }

    if (!copied) return;

    setShareCopied(true);
    if (shareTimer.current !== null) window.clearTimeout(shareTimer.current);
    shareTimer.current = window.setTimeout(() => setShareCopied(false), 1800);
  };

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

        <div className="header-actions">
          <button
            className={`header-share ${shareCopied ? 'is-copied' : ''}`}
            type="button"
            aria-label={shareCopied ? 'Enlace copiado' : 'Copiar enlace de FMK Service'}
            title={shareCopied ? 'Enlace copiado' : 'Copiar enlace'}
            onClick={copySiteAddress}
          >
            <ShareIcon copied={shareCopied} />
          </button>
          <a
            className="header-cta"
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() => trackAction('header_whatsapp')}
          >
            Consultar
          </a>
        </div>
      </header>

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <p className="eyebrow">Técnico certificado · San Martín</p>
            <h1>Servicio técnico</h1>
            <p className="hero-lead">
              Reparamos iPhone, celulares Android y equipos electrónicos con diagnóstico
              preciso, trabajando a nivel componente y garantizando la más alta calidad.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('hero_whatsapp')}>
                <img className="button-icon" src="/whatsapp-white.png" alt="" width="122" height="121" />
                Consultar reparación
              </a>
              <a className="button button-secondary" href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('hero_maps')}>
                Cómo llegar
              </a>
              <a
                className="button button-secondary button-icon-only"
                href={instagramUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Ver FMK Service en Instagram"
                title="Instagram"
                onClick={() => trackAction('hero_instagram')}
              >
                <img src="/instagram-blue.png" alt="" width="250" height="249" />
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
          <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('rating_maps')}>
            <strong>5.0 ★</strong>
            <span>Calificación en Google</span>
          </a>
          <div>
            <strong>24 h</strong>
            <span>Entrega express</span>
          </div>
          <div>
            <strong>Certificado</strong>
            <span>Formación técnica</span>
          </div>
          <div>
            <strong>15 años</strong>
            <span>De trayectoria</span>
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
            <p className="eyebrow">¿Qué reparamos?</p>
            <h2>Desde el vidrio a la placa.</h2>
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

        <section className="work-section" aria-labelledby="work-title">
          <div className="work-heading">
            <p className="eyebrow">Laboratorio de electrónica</p>
            <h2 id="work-title">Equipo profesional y soluciones reales.</h2>
          </div>

          <div className="work-gallery">
            {workshopCarousels.map((carousel) => (
              <WorkCarousel carousel={carousel} key={carousel.title} />
            ))}
          </div>
          <div className="work-actions">
            <a
              className="button button-secondary"
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackAction('gallery_instagram')}
            >
              <img className="button-icon" src="/instagram-blue.png" alt="" width="250" height="249" />
              Ver más en Instagram <ArrowIcon />
            </a>
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
            <div className="training-proof">
              <strong>5 capacitaciones certificadas</strong>
              <span>Microelectrónica, microsoldadura y reparación de dispositivos Apple.</span>
              <div className="training-logos" aria-label="Instituciones y reconocimientos de formación">
                <img
                  src="/training/yo-reparo-academy.png"
                  alt="Yo Reparo Academy"
                  width="1024"
                  height="457"
                  loading="lazy"
                  decoding="async"
                />
                <img
                  src="/training/certification-badge.png"
                  alt="Insignia de formación certificada"
                  width="138"
                  height="135"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
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
              La mejor reseña es que, cuando nos conocen, siempre nos recomiendan.
            </p>
            <a className="text-link" href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('reviews_maps')}>
              Ver reseñas en Google <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="contact-section" id="contacto">
          <div>
            <p className="eyebrow eyebrow-light">FMK Service · San Martín</p>
            <h2>¿Qué le pasó a tu equipo?</h2>
            <p>Contanos el modelo y la falla. Te orientamos por WhatsApp antes de acercarte.</p>
            <a className="button button-light" href={whatsappUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('contact_whatsapp')}>
              <img className="button-icon" src="/whatsapp-blue.png" alt="" width="122" height="121" />
              Escribir por WhatsApp
            </a>
          </div>

          <address>
            <div>
              <span>Dirección</span>
              <strong>25 de Mayo 8192</strong>
              <p>Villa José León Suárez, San Martín</p>
              <a href={mapsUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('contact_maps')}>Abrir en Google Maps</a>
            </div>
            <div>
              <span>Contacto</span>
              <strong>11 3319-0913</strong>
              <p>Atención todos los días</p>
              <a className="instagram-link" href={instagramUrl} target="_blank" rel="noreferrer" onClick={() => trackAction('contact_instagram')}>
                <img src="/instagram.png" alt="" width="250" height="249" />
                @fmkservice.ok
              </a>
            </div>
          </address>
        </section>
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#inicio">
          <img src="/fmk-service-wordmark.png" alt="FMK Service" width="564" height="272" />
        </a>
        <p className="footer-location">Servicio técnico · San Martín</p>
        <p className="footer-copyright">FMK Service © 2026</p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
