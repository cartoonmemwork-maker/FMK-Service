import {
  createStatsSession,
  hasStatsPassword,
  statsSessionCookie,
  verifyStatsPassword,
} from '../_auth';
import type { FunctionContext } from '../_types';

const allowedOrigin = 'https://fmkservice.ar';

function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
      ...headers,
    },
  });
}

export async function onRequestPost(context: FunctionContext) {
  const { request, env } = context;
  const requestUrl = new URL(request.url);

  if (requestUrl.hostname !== 'fmkservice.ar') return jsonResponse({ error: 'Not found' }, 404);
  if (request.headers.get('Origin') !== allowedOrigin) {
    return jsonResponse({ error: 'Solicitud no permitida.' }, 403);
  }
  if (!hasStatsPassword(env)) {
    return jsonResponse({ error: 'La contraseña del panel todavía no está configurada.' }, 503);
  }

  try {
    const rawBody = await request.text();
    if (!rawBody || rawBody.length > 512) return jsonResponse({ error: 'Solicitud inválida.' }, 400);

    const payload = JSON.parse(rawBody) as { password?: unknown };
    if (typeof payload.password !== 'string' || payload.password.length > 256) {
      return jsonResponse({ error: 'Solicitud inválida.' }, 400);
    }

    if (!(await verifyStatsPassword(payload.password, env))) {
      return jsonResponse({ error: 'Contraseña incorrecta.' }, 401);
    }

    const session = await createStatsSession(env);
    return jsonResponse(
      { ok: true },
      200,
      { 'Set-Cookie': statsSessionCookie(session) },
    );
  } catch {
    return jsonResponse({ error: 'No pudimos iniciar la sesión.' }, 400);
  }
}
