import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="site-shell">
      <div className="site-frame">
        <header className="site-header">
          <img
            className="brand-mark"
            src="/fmk-service-logo.png"
            alt="FMK Service"
            width="720"
            height="720"
          />
          <span className="status-badge">Sitio en preparación</span>
        </header>

        <section className="intro" aria-labelledby="page-title">
          <p className="eyebrow">Servicio técnico de celulares</p>
          <h1 id="page-title">Nueva web en preparación.</h1>
          <p className="intro-copy">
            Estamos dejando lista la base técnica de FMK Service. El contenido
            definitivo se incorporará en la próxima etapa.
          </p>

          <dl className="setup-status" aria-label="Estado inicial del proyecto">
            <div>
              <dt>Proyecto</dt>
              <dd>Configurado</dd>
            </div>
            <div>
              <dt>Repositorio</dt>
              <dd>GitHub</dd>
            </div>
            <div>
              <dt>Publicación</dt>
              <dd>Cloudflare Pages</dd>
            </div>
          </dl>
        </section>

        <footer className="site-footer">
          <span>FMK Service</span>
          <span aria-hidden="true">·</span>
          <span>Base inicial responsive</span>
        </footer>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
