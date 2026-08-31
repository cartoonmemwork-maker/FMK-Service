import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './dashboard.css';

type Metric = { label: string; value: number };
type DailyMetric = { day: string; visits: number; whatsapp: number };

type DashboardData = {
  generatedAt: string;
  rangeDays: number;
  totals: {
    visits: number;
    whatsappClicks: number;
    whatsappVisitors: number;
    mapsClicks: number;
    instagramClicks: number;
    shares: number;
    carouselInteractions: number;
  };
  daily: DailyMetric[];
  devices: Metric[];
  sources: Metric[];
  actions: Metric[];
};

const ranges = [7, 30, 90] as const;

const actionLabels: Record<string, string> = {
  header_share: 'Compartir · encabezado',
  header_whatsapp: 'WhatsApp · encabezado',
  hero_whatsapp: 'WhatsApp · portada',
  hero_maps: 'Cómo llegar · portada',
  hero_instagram: 'Instagram · portada',
  rating_maps: 'Calificación de Google',
  carousel_internal: 'Carrusel · trabajo interno',
  carousel_multibrand: 'Carrusel · multimarca',
  carousel_microsoldering: 'Carrusel · microsoldadura',
  gallery_instagram: 'Instagram · trabajos',
  reviews_maps: 'Reseñas en Google',
  reviews_share: 'Compartir · reseñas',
  contact_whatsapp: 'WhatsApp · contacto',
  contact_maps: 'Maps · contacto',
  contact_instagram: 'Instagram · contacto',
};

const deviceLabels: Record<string, string> = {
  desktop: 'Computadora',
  mobile: 'Celular',
  tablet: 'Tablet',
};

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR').format(value);
}

function formatSource(source: string) {
  if (source.startsWith('utm:')) return `Campaña · ${source.slice(4)}`;
  return source;
}

function ProgressList({ items, labels }: { items: Metric[]; labels?: Record<string, string> }) {
  const maxValue = Math.max(1, ...items.map((item) => item.value));

  if (items.length === 0) return <p className="dashboard-empty-inline">Todavía no hay datos.</p>;

  return (
    <div className="progress-list">
      {items.map((item) => (
        <div className="progress-row" key={item.label}>
          <div className="progress-meta">
            <span>{labels?.[item.label] ?? formatSource(item.label)}</span>
            <strong>{formatNumber(item.value)}</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${Math.max(3, (item.value / maxValue) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ data }: { data: DailyMetric[] }) {
  const maxValue = Math.max(1, ...data.map((item) => item.visits));
  const labelStep = data.length > 45 ? 10 : data.length > 14 ? 5 : 1;

  return (
    <div className="trend-scroll">
      <div className="trend-chart" style={{ minWidth: `${Math.max(34, data.length * 2.1)}rem` }}>
        {data.map((item, index) => {
          const date = new Date(`${item.day}T12:00:00`);
          const label = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(date);

          return (
            <div
              className="trend-column"
              key={item.day}
              title={`${label}: ${item.visits} visitas · ${item.whatsapp} WhatsApp`}
            >
              <div className="trend-values">
                {item.whatsapp > 0 && <span>{item.whatsapp}</span>}
                <strong>{item.visits}</strong>
              </div>
              <div className="trend-bar-track" aria-hidden="true">
                <span style={{ height: `${Math.max(4, (item.visits / maxValue) * 100)}%` }} />
              </div>
              <time dateTime={item.day}>{index % labelStep === 0 ? label : ''}</time>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="dashboard-state" role="status">
      <div className="dashboard-spinner" />
      <p>Cargando estadísticas…</p>
    </div>
  );
}

function DashboardLogin({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/estadisticas/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? 'No pudimos iniciar la sesión.');
      }

      setPassword('');
      await onSuccess();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No pudimos iniciar la sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dashboard-login" aria-labelledby="dashboard-login-title">
      <div className="dashboard-lock" aria-hidden="true">
        <span />
      </div>
      <span className="dashboard-login-eyebrow">Acceso exclusivo</span>
      <h2 id="dashboard-login-title">Panel de FMK Service</h2>
      <p>Ingresá la contraseña para consultar las visitas y acciones de la página.</p>
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="dashboard-password">Contraseña</label>
        <input
          autoComplete="current-password"
          autoFocus
          id="dashboard-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Tu contraseña"
          required
          type="password"
          value={password}
        />
        {error && <p className="dashboard-login-error" role="alert">{error}</p>}
        <button disabled={submitting || password.length === 0} type="submit">
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
      <small>Sesión segura · La contraseña no se guarda en el navegador</small>
    </section>
  );
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]>(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/estadisticas/data?days=${range}`, {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });

      if (response.status === 401) {
        setAuthenticated(false);
        setData(null);
        return;
      }

      if (!response.ok) throw new Error(`No se pudieron cargar las estadísticas (${response.status}).`);

      setAuthenticated(true);
      setData((await response.json()) as DashboardData);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las estadísticas.');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    document.title = 'Estadísticas | FMK Service';
    void loadData();

    return () => {
      document.title = 'FMK Service | Reparación de iPhone y celulares en San Martín';
    };
  }, [loadData]);

  const conversion = useMemo(() => {
    if (!data?.totals.visits) return 0;
    return (data.totals.whatsappVisitors / data.totals.visits) * 100;
  }, [data]);

  const logOut = async () => {
    try {
      await fetch('/estadisticas/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
    } finally {
      setData(null);
      setError('');
      setAuthenticated(false);
    }
  };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <a href="/" className="dashboard-brand" aria-label="Volver a FMK Service">
          <img src="/fmk-service-wordmark.png" alt="FMK Service" width="564" height="272" />
        </a>
        <div className="dashboard-title">
          <span>Panel privado</span>
          <h1>Estadísticas</h1>
        </div>
        <a className="dashboard-back" href="/">Ver página ↗</a>
      </header>

      {authenticated && (
        <section className="dashboard-controls" aria-label="Período de estadísticas">
          <div>
            <p>Rendimiento comercial</p>
            <span>Medición anónima: sin cookies de seguimiento ni direcciones IP.</span>
          </div>
          <div className="range-switch" role="group" aria-label="Seleccionar período">
            {ranges.map((days) => (
              <button
                className={range === days ? 'is-active' : ''}
                type="button"
                key={days}
                onClick={() => setRange(days)}
              >
                {days} días
              </button>
            ))}
          </div>
        </section>
      )}

      {authenticated === false ? (
        <DashboardLogin onSuccess={loadData} />
      ) : loading && !data ? (
        <DashboardLoading />
      ) : error ? (
        <section className="dashboard-state dashboard-error" role="alert">
          <h2>No pudimos abrir el panel</h2>
          <p>{error}</p>
          <button type="button" onClick={() => void loadData()}>Reintentar</button>
        </section>
      ) : data ? (
        <>
          <section className="metric-grid" aria-label="Resumen">
            <article>
              <span>Visitas</span>
              <strong>{formatNumber(data.totals.visits)}</strong>
              <small>Sesiones de la página</small>
            </article>
            <article className="metric-primary">
              <span>WhatsApp</span>
              <strong>{formatNumber(data.totals.whatsappClicks)}</strong>
              <small>Clics de consulta</small>
            </article>
            <article>
              <span>Conversión</span>
              <strong>{conversion.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%</strong>
              <small>Visitas que consultaron</small>
            </article>
            <article>
              <span>Cómo llegar</span>
              <strong>{formatNumber(data.totals.mapsClicks)}</strong>
              <small>Clics en Maps</small>
            </article>
            <article>
              <span>Compartidos</span>
              <strong>{formatNumber(data.totals.shares)}</strong>
              <small>Recomendaciones</small>
            </article>
          </section>

          <section className="dashboard-card trend-card">
            <div className="card-heading">
              <div>
                <span>Tendencia</span>
                <h2>Visitas y consultas por día</h2>
              </div>
              <div className="chart-legend" aria-label="Referencias del gráfico">
                <span><i /> Visitas</span>
                <span><b /> WhatsApp</span>
              </div>
            </div>
            <TrendChart data={data.daily} />
          </section>

          <div className="dashboard-columns">
            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <span>Procedencia</span>
                  <h2>Cómo llegaron</h2>
                </div>
              </div>
              <ProgressList items={data.sources} />
            </section>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <span>Dispositivos</span>
                  <h2>Dónde navegaron</h2>
                </div>
              </div>
              <ProgressList items={data.devices} labels={deviceLabels} />
            </section>
          </div>

          <section className="dashboard-card actions-card">
            <div className="card-heading">
              <div>
                <span>Interacciones</span>
                <h2>Qué botones funcionaron</h2>
              </div>
              <p>{formatNumber(data.totals.instagramClicks)} Instagram · {formatNumber(data.totals.carouselInteractions)} carruseles</p>
            </div>
            <div className="actions-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Acción</th>
                    <th>Clics</th>
                  </tr>
                </thead>
                <tbody>
                  {data.actions.map((item) => (
                    <tr key={item.label}>
                      <td>{actionLabels[item.label] ?? item.label}</td>
                      <td>{formatNumber(item.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.actions.length === 0 && <p className="dashboard-empty-inline">Todavía no hay interacciones.</p>}
            </div>
          </section>

          <footer className="dashboard-footer">
            <p>
              Última actualización:{' '}
              {new Intl.DateTimeFormat('es-AR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(data.generatedAt))}
            </p>
            <div className="dashboard-footer-actions">
              <button className="dashboard-logout" type="button" onClick={() => void logOut()}>
                Cerrar sesión
              </button>
              <button type="button" onClick={() => void loadData()} disabled={loading}>
                {loading ? 'Actualizando…' : 'Actualizar'}
              </button>
            </div>
          </footer>
        </>
      ) : null}
    </main>
  );
}
