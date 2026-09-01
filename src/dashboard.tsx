import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './dashboard.css';

type Metric = { label: string; value: number };
type DailyMetric = {
  day: string;
  status: 'active' | 'future' | 'untracked';
  visits: number;
  uniqueDevices: number;
  whatsapp: number;
  whatsappDevices: number;
  instagram: number;
  maps: number;
  shares: number;
};
type ChartMetric = 'visits' | 'uniqueDevices' | 'whatsapp' | 'instagram' | 'maps' | 'shares';
type ConversionMetric = Extract<ChartMetric, 'whatsapp' | 'instagram' | 'maps' | 'shares'>;
type Period = 'week' | 'month' | 'year';

type DashboardData = {
  generatedAt: string;
  period: Period;
  periodStart: string;
  periodEnd: string;
  today: string;
  trackingStartDay: string;
  totals: {
    visits: number;
    uniqueDevices: number;
    whatsappClicks: number;
    whatsappVisitors: number;
    mapsClicks: number;
    mapsVisitors: number;
    instagramClicks: number;
    instagramVisitors: number;
    shares: number;
    shareVisitors: number;
    carouselInteractions: number;
  };
  daily: DailyMetric[];
  devices: Metric[];
  sources: Metric[];
  actions: Metric[];
};

const periods = [
  { id: 'week' as const, label: 'Semana' },
  { id: 'month' as const, label: 'Mes' },
  { id: 'year' as const, label: 'Año' },
];

const chartMetricLabels: Record<ChartMetric, string> = {
  visits: 'Visitas',
  uniqueDevices: 'Dispositivos únicos',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  maps: 'Cómo llegar',
  shares: 'Compartidos',
};

const conversionMetricLabels: Record<ConversionMetric, string> = {
  whatsapp: 'WhatsApp',
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

function dateFromDay(day: string) {
  return new Date(`${day}T12:00:00Z`);
}

function addCalendarDays(day: string, amount: number) {
  const date = dateFromDay(day);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function addCalendarMonths(day: string, amount: number) {
  const date = new Date(`${day.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 10);
}

function startOfWeek(day: string) {
  const date = dateFromDay(day);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function startOfPeriod(day: string, period: Period) {
  if (period === 'week') return startOfWeek(day);
  if (period === 'month') return `${day.slice(0, 7)}-01`;
  return `${day.slice(0, 4)}-01-01`;
}

function nextPeriod(day: string, period: Period) {
  if (period === 'week') return addCalendarDays(day, 7);
  if (period === 'month') return addCalendarMonths(day, 1);
  return `${Number(day.slice(0, 4)) + 1}-01-01`;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPeriodOption(day: string, period: Period) {
  const date = dateFromDay(day);

  if (period === 'week') {
    const end = dateFromDay(addCalendarDays(day, 6));
    const startLabel = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
    const endLabel = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(end);
    return `${startLabel} – ${endLabel}`;
  }

  if (period === 'month') {
    return capitalize(new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date));
  }

  return day.slice(0, 4);
}

function getPeriodOptions(period: Period, trackingStartDay: string, today: string) {
  const current = startOfPeriod(today, period);
  let cursor = startOfPeriod(trackingStartDay, period);
  const options: Array<{ value: string; label: string }> = [];

  if (cursor > current) cursor = current;

  while (cursor <= current) {
    options.push({ value: cursor, label: formatPeriodOption(cursor, period) });
    cursor = nextPeriod(cursor, period);
  }

  return options.reverse();
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('es-AR').format(value);
}

function formatSource(source: string) {
  if (source === 'utm:google_maps' || source === 'utm:google-maps') return 'Google Maps';
  if (source.startsWith('utm:')) return `Campaña · ${source.slice(4)}`;
  if (source === 'Facebook') return 'Facebook / Messenger';
  if (source === 'Google') return 'Google · Búsqueda o Maps';
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
  return item[metric];
}

function formatTrendValue(value: number) {
  return formatNumber(value);
}

function trendLabels(day: string, period: Period) {
  const date = dateFromDay(day);

  if (period === 'week') {
    const weekday = new Intl.DateTimeFormat('es-AR', { weekday: 'long', timeZone: 'UTC' }).format(date);
    return {
      axis: capitalize(weekday),
      title: `${capitalize(weekday)} ${new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date)}`,
    };
  }

  if (period === 'month') {
    const label = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(date);
    return { axis: date.getUTCDay() === 1 ? label : '', title: label };
  }

  const month = new Intl.DateTimeFormat('es-AR', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', '');
  return { axis: capitalize(month), title: capitalize(month) };
}

function TrendChart({ data, metric, period }: { data: DailyMetric[]; metric: ChartMetric; period: Period }) {
  const values = data.map((item) => getTrendValue(item, metric));
  const maxValue = Math.max(1, ...values);

  return (
    <div className="trend-scroll">
      <div className="trend-chart" style={{ minWidth: `${Math.max(34, data.length * 2.1)}rem` }}>
        {data.map((item, index) => {
          const labels = trendLabels(item.day, period);
          const value = getTrendValue(item, metric);

          return (
            <div
              className={`trend-column is-${item.status}`}
              key={item.day}
              title={`${labels.title}: ${formatTrendValue(value)} · ${chartMetricLabels[metric]}`}
            >
              <div className="trend-values">
                <strong>{formatTrendValue(value)}</strong>
              </div>
              <div className="trend-bar-track" aria-hidden="true">
                <span
                  key={`${metric}-${item.day}`}
                  style={{
                    animationDelay: `${index * 35}ms`,
                    height: value === 0 ? '0' : `${Math.max(4, (value / maxValue) * 100)}%`,
                  }}
                />
              </div>
              <time dateTime={item.day}>{labels.axis}</time>
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
  const [period, setPeriod] = useState<Period>('month');
  const [anchor, setAnchor] = useState('');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('visits');
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const query = new URLSearchParams({ period });
      if (anchor) query.set('anchor', anchor);
      const response = await fetch(`/estadisticas/data?${query.toString()}`, {
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
  }, [anchor, period]);

  useEffect(() => {
    document.title = 'Estadísticas | FMK Service';
    void loadData();

    return () => {
      document.title = 'FMK Service | Reparación de iPhone y celulares en San Martín';
    };
  }, [loadData]);

  const conversionMetric: ConversionMetric = (
    chartMetric === 'instagram' || chartMetric === 'maps' || chartMetric === 'shares'
      ? chartMetric
      : 'whatsapp'
  );

  const conversionVisitors = data ? {
    whatsapp: data.totals.whatsappVisitors,
    instagram: data.totals.instagramVisitors,
    maps: data.totals.mapsVisitors,
    shares: data.totals.shareVisitors,
  }[conversionMetric] : 0;

  const conversion = data?.totals.uniqueDevices
    ? (conversionVisitors / data.totals.uniqueDevices) * 100
    : 0;

  const metricCards = data ? [
    { id: 'visits' as const, label: 'Visitas', value: formatNumber(data.totals.visits), detail: 'Cargas de la página' },
    { id: 'uniqueDevices' as const, label: 'Dispositivos únicos', value: formatNumber(data.totals.uniqueDevices), detail: 'Equipos diferentes' },
    { id: 'whatsapp' as const, label: 'WhatsApp', value: formatNumber(data.totals.whatsappClicks), detail: 'Clics de consulta' },
    { id: 'instagram' as const, label: 'Instagram', value: formatNumber(data.totals.instagramClicks), detail: 'Clics al perfil' },
    { id: 'maps' as const, label: 'Cómo llegar', value: formatNumber(data.totals.mapsClicks), detail: 'Clics en Maps' },
    { id: 'shares' as const, label: 'Compartidos', value: formatNumber(data.totals.shares), detail: 'Recomendaciones' },
  ] : [];

  const periodOptions = useMemo(() => data
    ? getPeriodOptions(period, data.trackingStartDay, data.today)
    : [], [data, period]);

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
            {periods.map((option) => (
              <button
                className={period === option.id ? 'is-active' : ''}
                type="button"
                key={option.id}
                onClick={() => {
                  setAnchor('');
                  setPeriod(option.id);
                }}
              >
                {option.label}
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
            <article className="conversion-card" aria-live="polite">
              <span>Conversión · {conversionMetricLabels[conversionMetric]}</span>
              <strong>{conversion.toLocaleString('es-AR', { maximumFractionDigits: 1 })}%</strong>
              <small>{formatNumber(conversionVisitors)} de {formatNumber(data.totals.uniqueDevices)} dispositivos</small>
            </article>
          </section>

          <section className="dashboard-card trend-card" id="analytics-trend">
            <div className="card-heading">
              <div>
                <span>Tendencia</span>
                <h2>{chartMetricLabels[chartMetric]} · {formatPeriodOption(data.periodStart, period)}</h2>
              </div>
              <div className="trend-period-picker">
                <label htmlFor="trend-period">Período del gráfico</label>
                <select
                  id="trend-period"
                  onChange={(event) => setAnchor(event.target.value)}
                  value={data.periodStart}
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <TrendChart data={data.daily} metric={chartMetric} period={period} />
            <p className="trend-note">Gris oscuro: anterior a la medición · Gris claro: todavía no ocurrió.</p>
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
                Cada visita se asigna a un origen; la suma coincide con “Visitas”.
                <br />
                “Directo” también puede incluir WhatsApp y otras aplicaciones que no informan el origen.
                <br />
                Google agrupa Búsqueda y Maps cuando el enlace no está identificado.
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
              {new Intl.DateTimeFormat('es-AR', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: 'America/Argentina/Buenos_Aires',
              }).format(new Date(data.generatedAt))}
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
