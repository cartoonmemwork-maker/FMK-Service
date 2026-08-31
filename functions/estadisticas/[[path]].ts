import type { FunctionContext } from '../_types';

export async function onRequest(context: FunctionContext) {
  const { request } = context;
  const requestUrl = new URL(request.url);

  if (requestUrl.hostname !== 'fmkservice.ar') {
    return new Response('Not found', { status: 404 });
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
