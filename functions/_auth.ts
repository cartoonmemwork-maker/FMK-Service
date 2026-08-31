import type { Environment } from './_types';

const cookieName = 'fmk_stats_session';
const sessionDurationSeconds = 7 * 24 * 60 * 60;
const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = '';

  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));

  return toBase64Url(new Uint8Array(signature));
}

function readCookie(request: Request) {
  const cookies = request.headers.get('Cookie') ?? '';

  for (const cookie of cookies.split(';')) {
    const [name, ...valueParts] = cookie.trim().split('=');
    if (name === cookieName) return valueParts.join('=');
  }

  return null;
}

export function hasStatsPassword(env: Environment) {
  return typeof env.ANALYTICS_PASSWORD === 'string' && env.ANALYTICS_PASSWORD.length >= 12;
}

export async function verifyStatsPassword(candidate: string, env: Environment) {
  if (!hasStatsPassword(env)) return false;

  const [candidateDigest, configuredDigest] = await Promise.all([
    digest(candidate),
    digest(env.ANALYTICS_PASSWORD as string),
  ]);

  return constantTimeEqual(candidateDigest, configuredDigest);
}

export async function createStatsSession(env: Environment) {
  if (!hasStatsPassword(env)) throw new Error('Analytics password is not configured.');

  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const payload = `${expiresAt}.${toBase64Url(nonce)}`;
  const signature = await sign(payload, env.ANALYTICS_PASSWORD as string);

  return `${payload}.${signature}`;
}

export async function hasValidStatsSession(request: Request, env: Environment) {
  if (!hasStatsPassword(env)) return false;

  const token = readCookie(request);
  if (!token) return false;

  const [expiresAtRaw, nonce, suppliedSignature, ...unexpected] = token.split('.');
  const expiresAt = Number(expiresAtRaw);

  if (
    unexpected.length > 0 ||
    !expiresAtRaw ||
    !nonce ||
    !suppliedSignature ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return false;
  }

  const expectedSignature = await sign(
    `${expiresAtRaw}.${nonce}`,
    env.ANALYTICS_PASSWORD as string,
  );
  const [suppliedDigest, expectedDigest] = await Promise.all([
    digest(suppliedSignature),
    digest(expectedSignature),
  ]);

  return constantTimeEqual(suppliedDigest, expectedDigest);
}

export function statsSessionCookie(token: string) {
  return `${cookieName}=${token}; Max-Age=${sessionDurationSeconds}; Path=/estadisticas; HttpOnly; Secure; SameSite=Strict`;
}

export function clearStatsSessionCookie() {
  return `${cookieName}=; Max-Age=0; Path=/estadisticas; HttpOnly; Secure; SameSite=Strict`;
}
