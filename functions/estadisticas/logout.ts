import { clearStatsSessionCookie } from '../_auth';
import type { FunctionContext } from '../_types';

export function onRequestPost(context: FunctionContext) {
  const { request } = context;
  const requestUrl = new URL(request.url);

  if (
    requestUrl.hostname !== 'fmkservice.ar' ||
    request.headers.get('Origin') !== 'https://fmkservice.ar'
  ) {
    return Response.json({ error: 'Solicitud no permitida.' }, { status: 403 });
  }

  return Response.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'private, no-store',
        'Set-Cookie': clearStatsSessionCookie(),
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  );
}
