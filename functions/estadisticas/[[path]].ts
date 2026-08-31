import type { FunctionContext } from '../_types';

export async function onRequest(context: FunctionContext) {
  const { request } = context;
  const requestUrl = new URL(request.url);
  const accessToken = request.headers.get('Cf-Access-Jwt-Assertion');

  if (requestUrl.hostname !== 'fmkservice.ar') {
    return new Response('Not found', { status: 404 });
  }

  if (!accessToken) {
    return new Response('Panel privado. Configurá Cloudflare Access para ingresar.', {
      status: 401,
      headers: {
        'Cache-Control': 'private, no-store',
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }

  const response = await context.next();
  const headers = new Headers(response.headers);

  headers.set('Cache-Control', 'private, no-store');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
