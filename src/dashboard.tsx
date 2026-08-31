import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './dashboard.css';

type Metric = { label: string; value: number };
type DailyMetric = {
  day: string;
  visits: number;
  uniqueDevices: number;
  whatsapp: number;
  whatsappDevices: number;
  instagram: number;
  maps: number;
  shares: number;
};
type ChartMetric = 'visits' | 'uniqueDevices' | 'whatsapp' | 'conversion' | 'instagram' | 'maps' | 'shares';

type DashboardData = {
  generatedAt: string;
  rangeDays: number;
  totals: {
    visits: number;
    uniqueDevices: number;
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

const chartMetricLabels: Record<ChartMetric, string> = {
  visits: 'Visitas',
  uniqueDevices: 'Dispositivos únicos',
  whatsapp: 'WhatsApp',
  conversion: 'Dispositivos que consultaron',
  instagram: 'Instagram',
  maps: 'Cómo llegar',
  shares: 'Compartidos',
};

const actionSections = ['Encabezado', 'Portada', 'Calificación', 'Trabajos', 'Reseñas', 'Contacto'] as const;

const actionDefinitions = [
  { id: 'header_share', action: 'Compartir', location: 'Barra superior', section: 'Encabezado' },
  { id: 'header_whatsapp', action: 'WhatsApp', location: 'Barra superior', section: 'Encabezado' },
  { id: 'hero_whatsapp', action: 'WhatsApp', location: 'Acción principal', section: 'Portada' },
  { id: 'hero_maps', action: 'Cómo llegar', location: 'Acción principal', section: 'Portada' },
  { id: 'hero_instagram', action: 'Instagram', location: 'Acción principal', section: 'Portada' },
  { id: 'rating_maps', action: 'Google Maps', location: 'Calificación', section: 'Calificación' },
  { id: 'carousel_internal', action: 'Carrusel', location: 'Trabajo interno', section: 'Trabajos' },
  { id: 'carousel_multibrand', action: 'Carrusel', location: 'Equipos multimarca', section: 'Trabajos' },
  { id: 'carousel_microsoldering', action: 'Carrusel', location: 'Microsoldadura', section: 'Trabajos' },
  { id: 'gallery_instagram', action: 'Ver más en Instagram', location: 'Galería', section: 'Trabajos' },
  { id: 'reviews_maps', action: 'Ver reseñas en Google', location: 'Acción principal', section: 'Reseñas' },
  { id: 'reviews_share', action: 'Compartir', location: 'Acción principal', section: 'Reseñas' },
  { id: 'contact_whatsapp', action: 'WhatsApp', location: 'Datos del negocio', section: 'Contacto' },
  { id: 'contact_maps', action: 'Cómo llegar', location: 'Datos del negocio', section: 'Contacto' },
  { id: 'contact_instagram', action: 'Instagram', location: 'Datos del negocio', section: 'Contacto' },
] as const;

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
  if (source === 'Facebook') return 'Facebook / Messenger';
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

function getTrendValue(item: DailyMetric, metric: ChartMetric) {
  if (metric === 'conversion') return item.whatsappDevices;

  return item[metric];
}

function formatTrendValue(value: number) {
  return formatNumber(value);
}

function TrendChart({ data, metric }: { data: DailyMetric[]; metric: ChartMetric }) {
  const values = data.map((item) => getTrendValue(item, metric));
  const maxValue = Math.max(1, ...values);
  const labelStep = data.length > 45 ? 10 : data.length > 14 ? 5 : 1;

  return (
    <div className="trend-scroll">
      <div className="trend-chart" style={{ minWidth: `${Math.max(34, data.length * 2.1)}rem` }}>
        {data.map((item, index) => {
          const date = new Date(`${item.day}T12:00:00`);
          const label = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit' }).format(date);
          const value = getTrendValue(item, metric);

          return (
            <div
              className="trend-column"
              key={item.day}
              title={`${label}: ${formatTrendValue(value)} · ${chartMetricLabels[metric]}`}
            >
              <div className="trend-values">
                <strong>{formatTrendValue(value)}</strong>
              </div>
              <div className="trend-bar-track" aria-hidden="true">
                <span style={{ height: value === 0 ? '0' : `${Math.max(4, (value / maxValue) * 100)}%` }} />
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
  const [chartMetric, setChartMetric] = useState<ChartMetric>('visits');
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
    if (!data?.totals.uniqueDevices) return 0;
    return (data.totals.whatsappVisitors / data.totals.uniqueDevices) * 100;
  }, [data]);

  const metricCards = data ? [
    { id: 'visits' as const, label: 'Visitas', value: formatNumber(data.totals.visits), detail: 'Cargas de la página' },
    { id: 'uniqueDevices' as const, label: 'Dispositivos únicos', value: formatNumber(data.totals.uniqueDevices), detail: 'Equipos diferentes' },
    { id: 'whatsapp' as const, label: 'WhatsApp', value: formatNumber(data.totals.whatsappClicks), detail: 'Clics de consulta' },
    { id: 'conversion' as const, label: 'Conversión', value: `${conversion.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%`, detail: 'Dispositivos que consultaron' },
    { id: 'instagram' as const, label: 'Instagram', value: formatNumber(data.totals.instagramClicks), detail: 'Clics al perfil' },
    { id: 'maps' as const, label: 'Cómo llegar', value: formatNumber(data.totals.mapsClicks), detail: 'Clics en Maps' },
    { id: 'shares' as const, label: 'Compartidos', value: formatNumber(data.totals.shares), detail: 'Recomendaciones' },
  ] : [];

  const actions = useMemo(() => {
    const counts = new Map(data?.actions.map((item) => [item.label, item.value]) ?? []);

    return actionDefinitions.map((definition) => ({
      ...definition,
      value: counts.get(definition.id) ?? 0,
    }));
  }, [data]);

  const actionGroups = useMemo(() => actionSections.map((section) => {
    const items = actions.filter((item) => item.section === section);

    return {
      section,
      items,
      total: items.reduce((sum, item) => sum + item.value, 0),
    };
  }), [actions]);

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
            <span>Dispositivos mediante un código aleatorio local; sin cuentas, cookies ni direcciones IP.</span>
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
            {metricCards.map((metric) => (
              <button
                aria-controls="analytics-trend"
                aria-pressed={chartMetric === metric.id}
                className={chartMetric === metric.id ? 'is-active' : ''}
                key={metric.id}
                onClick={() => setChartMetric(metric.id)}
                type="button"
              >
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </button>
            ))}
          </section>

          <section className="dashboard-card trend-card" id="analytics-trend">
            <div className="card-heading">
              <div>
                <span>Tendencia</span>
                <h2>{chartMetricLabels[chartMetric]} por día</h2>
              </div>
              <p>Seleccioná una tarjeta para cambiar el gráfico.</p>
            </div>
            <TrendChart data={data.daily} metric={chartMetric} />
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
              <p className="dashboard-card-note">
                “Directo” también puede incluir WhatsApp y otras aplicaciones que no informan el origen.
                <br />
                “Facebook / Messenger” indica que se informó un dominio de Facebook; no necesariamente una publicación pública.
              </p>
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
            <div className="actions-heading">
              <div>
                <span>Interacciones</span>
                <h2>Qué botones funcionaron</h2>
              </div>
              <p>{formatNumber(data.totals.instagramClicks)} Instagram · {formatNumber(data.totals.carouselInteractions)} carruseles</p>
            </div>
            <div className="action-groups">
              {actionGroups.map((group) => (
                <details className="action-group" key={group.section}>
                  <summary>
                    <span>{group.section}</span>
                    <span className="action-group-total">{formatNumber(group.total)} clics</span>
                    <i aria-hidden="true" />
                  </summary>
                  <div className="actions-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Acción</th>
                          <th>Ubicación</th>
                          <th>Clics</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.items.map((item) => (
                          <tr key={item.id}>
                            <td>{item.action}</td>
                            <td>{item.location}</td>
                            <td>{formatNumber(item.value)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
              ))}
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
