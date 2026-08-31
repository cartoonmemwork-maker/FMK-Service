import type { FunctionContext } from '../_types';

const allowedHosts = new Set(['fmkservice.ar', 'www.fmkservice.ar']);
const allowedOrigins = new Set(['https://fmkservice.ar', 'https://www.fmkservice.ar']);
const allowedEvents = new Set([
  'page_view',
  'header_share',
  'header_whatsapp',
  'hero_whatsapp',
  'hero_maps',
  'hero_instagram',
  'rating_maps',
  'carousel_internal',
  'carousel_multibrand',
  'carousel_microsoldering',
  'gallery_instagram',
  'reviews_maps',
  'reviews_share',
  'contact_whatsapp',
  'contact_maps',
  'contact_instagram',
]);
const allowedDevices = new Set(['desktop', 'mobile', 'tablet']);

type EventPayload = {
  pageViewId?: unknown;
  eventName?: unknown;
  path?: unknown;
  source?: unknown;
  device?: unknown;
};

function isValidPayload(payload: EventPayload) {
  return (
    typeof payload.pageViewId === 'string' &&
    /^[a-zA-Z0-9-]{16,64}$/.test(payload.pageViewId) &&
    typeof payload.eventName === 'string' &&
    allowedEvents.has(payload.eventName) &&
    typeof payload.path === 'string' &&
    payload.path.startsWith('/') &&
    payload.path.length <= 120 &&
    typeof payload.source === 'string' &&
    /^[a-zA-Z0-9._:-]{1,80}$/.test(payload.source) &&
    typeof payload.device === 'string' &&
    allowedDevices.has(payload.device)
  );
}

function emptyResponse(status = 204) {
  return new Response(null, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

export async function onRequestPost(context: FunctionContext) {
  const { request, env } = context;
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');

  if (!allowedHosts.has(requestUrl.hostname) || !origin || !allowedOrigins.has(origin)) {
    return emptyResponse(403);
  }

  try {
    const rawBody = await request.text();

    if (!rawBody || rawBody.length > 2_048) return emptyResponse(400);

    const payload = JSON.parse(rawBody) as EventPayload;

    if (!isValidPayload(payload)) return emptyResponse(400);
    if (!env.DB) return emptyResponse();

    await env.DB
      .prepare(
        `INSERT INTO analytics_events
          (page_view_id, event_name, path, source, device)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .bind(
        payload.pageViewId,
        payload.eventName,
        payload.path,
        payload.source,
        payload.device,
      )
      .run();

    return emptyResponse();
  } catch {
    return emptyResponse();
  }
}
