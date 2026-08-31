const analyticsEndpoint = '/api/events';
const productionHosts = new Set(['fmkservice.ar', 'www.fmkservice.ar']);

type ZarazApi = {
  track: (eventName: string, properties?: Record<string, string>) => Promise<void> | void;
};

type AnalyticsPayload = {
  pageViewId: string;
  eventName: string;
  path: string;
  source: string;
  device: 'desktop' | 'mobile' | 'tablet';
};

const pageViewId = createPageViewId();
let pageViewTracked = false;

function createPageViewId() {
  if ('randomUUID' in crypto) return crypto.randomUUID();

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 18)}`;
}

function getDevice(): AnalyticsPayload['device'] {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet|kindle|silk/.test(userAgent)) return 'tablet';
  if (/android|iphone|ipod|mobile/.test(userAgent)) return 'mobile';
  return 'desktop';
}

function normalizeCampaign(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function getSource() {
  const campaign = normalizeCampaign(new URLSearchParams(window.location.search).get('utm_source') ?? '');

  if (campaign) return `utm:${campaign}`;
  if (!document.referrer) return 'Directo';

  try {
    const hostname = new URL(document.referrer).hostname.replace(/^www\./, '').toLowerCase();

    if (productionHosts.has(hostname)) return 'Interno';
    if (hostname.includes('google.')) return 'Google';
    if (hostname.endsWith('instagram.com')) return 'Instagram';
    if (hostname.endsWith('facebook.com') || hostname === 'fb.com') return 'Facebook';
    if (hostname.endsWith('whatsapp.com') || hostname === 'wa.me') return 'WhatsApp';

    return hostname.slice(0, 80);
  } catch {
    return 'Directo';
  }
}

function canTrack() {
  return productionHosts.has(window.location.hostname) && window.location.pathname === '/';
}

function sendEvent(eventName: string) {
  if (!canTrack()) return;

  const payload: AnalyticsPayload = {
    pageViewId,
    eventName,
    path: window.location.pathname,
    source: getSource(),
    device: getDevice(),
  };
  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon(analyticsEndpoint, new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch(analyticsEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'omit',
    keepalive: true,
  }).catch(() => undefined);
}

export function trackPageView() {
  if (pageViewTracked) return;

  pageViewTracked = true;
  sendEvent('page_view');
}

export function trackAction(button: string) {
  sendEvent(button);

  const zaraz = (window as Window & { zaraz?: ZarazApi }).zaraz;
  void zaraz?.track('button_click', { button });
}
