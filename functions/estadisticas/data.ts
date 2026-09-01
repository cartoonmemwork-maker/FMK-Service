import { hasStatsPassword, hasValidStatsSession } from '../_auth';
import type { D1Result, FunctionContext } from '../_types';

type TotalsRow = {
  visits: number;
  unique_devices: number;
  whatsapp_clicks: number;
  whatsapp_visitors: number;
  maps_clicks: number;
  maps_visitors: number;
  instagram_clicks: number;
  instagram_visitors: number;
  shares: number;
  share_visitors: number;
  carousel_interactions: number;
};

type DailyRow = {
  day: string;
  visits: number;
  unique_devices: number;
  whatsapp: number;
  whatsapp_devices: number;
  instagram: number;
  maps: number;
  shares: number;
};
type GroupRow = { label: string; value: number };
type Period = 'week' | 'month' | 'year';
type BucketStatus = 'active' | 'future' | 'untracked';

const allowedPeriods = new Set<Period>(['week', 'month', 'year']);
const argentinaTimeZone = 'America/Argentina/Buenos_Aires';
const trackingStartDay = '2026-09-01';

function argentinaDate(timestamp = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: argentinaTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function addCalendarDays(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function addCalendarMonths(day: string, amount: number) {
  const date = new Date(`${day.slice(0, 7)}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 10);
}

function startOfWeek(day: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

function startOfPeriod(day: string, period: Period) {
  if (period === 'week') return startOfWeek(day);
  if (period === 'month') return `${day.slice(0, 7)}-01`;
  return `${day.slice(0, 4)}-01-01`;
}

function nextPeriodStart(day: string, period: Period) {
  if (period === 'week') return addCalendarDays(day, 7);
  if (period === 'month') return addCalendarMonths(day, 1);
  return `${Number(day.slice(0, 4)) + 1}-01-01`;
}

function periodBuckets(start: string, end: string, period: Period) {
  const buckets: string[] = [];
  let cursor = start;

  while (cursor < end) {
    buckets.push(cursor);
    cursor = period === 'year' ? addCalendarMonths(cursor, 1) : addCalendarDays(cursor, 1);
  }

  return buckets;
}

function bucketStatus(day: string, period: Period, today: string): BucketStatus {
  const bucketEnd = period === 'year' ? addCalendarMonths(day, 1) : addCalendarDays(day, 1);
  const currentBucket = period === 'year' ? `${today.slice(0, 7)}-01` : today;

  if (bucketEnd <= trackingStartDay) return 'untracked';
  if (day > currentBucket) return 'future';
  return 'active';
}

function argentinaDayStart(day: string) {
  return Math.floor(Date.parse(`${day}T03:00:00Z`) / 1000);
}

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

function firstRow<Row>(result: D1Result<Row>) {
  return result.results[0];
}

export async function onRequestGet(context: FunctionContext) {
  const { request, env } = context;
  const requestUrl = new URL(request.url);

  if (requestUrl.hostname !== 'fmkservice.ar') return jsonResponse({ error: 'Not found' }, 404);
  if (!hasStatsPassword(env)) {
    return jsonResponse({ error: 'La contraseña del panel todavía no está configurada.' }, 503);
  }
  if (!(await hasValidStatsSession(request, env))) {
    return jsonResponse({ error: 'La sesión del panel venció.' }, 401);
  }
  if (!env.DB) return jsonResponse({ error: 'La base de estadísticas todavía no está conectada.' }, 503);

  const requestedPeriod = requestUrl.searchParams.get('period') as Period | null;
  const period: Period = requestedPeriod && allowedPeriods.has(requestedPeriod) ? requestedPeriod : 'month';
  const today = argentinaDate();
  const currentPeriodStart = startOfPeriod(today, period);
  const firstSelectablePeriod = today < trackingStartDay
    ? currentPeriodStart
    : startOfPeriod(trackingStartDay, period);
  const requestedAnchor = requestUrl.searchParams.get('anchor');
  const validAnchor = requestedAnchor && /^\d{4}-\d{2}-\d{2}$/.test(requestedAnchor)
    ? startOfPeriod(requestedAnchor, period)
    : currentPeriodStart;
  const periodStart = validAnchor < firstSelectablePeriod
    ? firstSelectablePeriod
    : validAnchor > currentPeriodStart
      ? currentPeriodStart
      : validAnchor;
  const periodEnd = nextPeriodStart(periodStart, period);
  const nextDay = addCalendarDays(today, 1);
  const queryEnd = periodEnd < nextDay ? periodEnd : nextDay;
  const since = argentinaDayStart(periodStart);
  const until = argentinaDayStart(queryEnd);
  const bucketExpression = period === 'year'
    ? "strftime('%Y-%m-01', created_at, 'unixepoch', '-3 hours')"
    : "date(created_at, 'unixepoch', '-3 hours')";

  const totalsStatement = env.DB
    .prepare(
      `SELECT
         SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS visits,
         COUNT(DISTINCT CASE
           WHEN event_name = 'page_view' THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS unique_devices,
         SUM(CASE WHEN event_name IN ('header_whatsapp', 'hero_whatsapp', 'contact_whatsapp') THEN 1 ELSE 0 END) AS whatsapp_clicks,
         COUNT(DISTINCT CASE
           WHEN event_name IN ('header_whatsapp', 'hero_whatsapp', 'contact_whatsapp') THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS whatsapp_visitors,
         SUM(CASE WHEN event_name IN ('hero_maps', 'rating_maps', 'reviews_maps', 'contact_maps') THEN 1 ELSE 0 END) AS maps_clicks,
         COUNT(DISTINCT CASE
           WHEN event_name IN ('hero_maps', 'rating_maps', 'reviews_maps', 'contact_maps') THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS maps_visitors,
         SUM(CASE WHEN event_name IN ('hero_instagram', 'gallery_instagram', 'contact_instagram') THEN 1 ELSE 0 END) AS instagram_clicks,
         COUNT(DISTINCT CASE
           WHEN event_name IN ('hero_instagram', 'gallery_instagram', 'contact_instagram') THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS instagram_visitors,
         SUM(CASE WHEN event_name IN ('header_share', 'reviews_share') THEN 1 ELSE 0 END) AS shares,
         COUNT(DISTINCT CASE
           WHEN event_name IN ('header_share', 'reviews_share') THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS share_visitors,
         SUM(CASE WHEN event_name IN ('carousel_internal', 'carousel_multibrand', 'carousel_microsoldering') THEN 1 ELSE 0 END) AS carousel_interactions
       FROM analytics_events
       WHERE created_at >= ? AND created_at < ?`,
    )
    .bind(since, until);

  const dailyStatement = env.DB
    .prepare(
      `SELECT
         ${bucketExpression} AS day,
         SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) AS visits,
         COUNT(DISTINCT CASE
           WHEN event_name = 'page_view' THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS unique_devices,
         SUM(CASE WHEN event_name IN ('header_whatsapp', 'hero_whatsapp', 'contact_whatsapp') THEN 1 ELSE 0 END) AS whatsapp,
         COUNT(DISTINCT CASE
           WHEN event_name IN ('header_whatsapp', 'hero_whatsapp', 'contact_whatsapp') THEN
             CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END
         END) AS whatsapp_devices,
         SUM(CASE WHEN event_name IN ('hero_instagram', 'gallery_instagram', 'contact_instagram') THEN 1 ELSE 0 END) AS instagram,
         SUM(CASE WHEN event_name IN ('hero_maps', 'rating_maps', 'reviews_maps', 'contact_maps') THEN 1 ELSE 0 END) AS maps,
         SUM(CASE WHEN event_name IN ('header_share', 'reviews_share') THEN 1 ELSE 0 END) AS shares
       FROM analytics_events
       WHERE created_at >= ? AND created_at < ?
       GROUP BY day
       ORDER BY day ASC`,
    )
    .bind(since, until);

  const devicesStatement = env.DB
    .prepare(
      `SELECT device AS label,
              COUNT(DISTINCT CASE WHEN page_view_id LIKE 'd-%' THEN substr(page_view_id, 3, 32) ELSE page_view_id END) AS value
       FROM analytics_events
       WHERE event_name = 'page_view' AND created_at >= ? AND created_at < ?
       GROUP BY device
       ORDER BY value DESC`,
    )
    .bind(since, until);

  const sourcesStatement = env.DB
    .prepare(
      `SELECT source AS label, COUNT(*) AS value
       FROM analytics_events
       WHERE event_name = 'page_view' AND created_at >= ? AND created_at < ?
       GROUP BY source
       ORDER BY value DESC`,
    )
    .bind(since, until);

  const actionsStatement = env.DB
    .prepare(
      `SELECT event_name AS label, COUNT(*) AS value
       FROM analytics_events
       WHERE event_name != 'page_view' AND created_at >= ? AND created_at < ?
       GROUP BY event_name
       ORDER BY value DESC, event_name
       LIMIT 20`,
    )
    .bind(since, until);

  try {
    const [totalsResult, dailyResult, devicesResult, sourcesResult, actionsResult] =
      await env.DB.batch([totalsStatement, dailyStatement, devicesStatement, sourcesStatement, actionsStatement]);
    const totals = firstRow(totalsResult as D1Result<TotalsRow>);

    return jsonResponse({
      generatedAt: new Date().toISOString(),
      period,
      periodStart,
      periodEnd,
      today,
      trackingStartDay,
      totals: {
        visits: Number(totals?.visits ?? 0),
        uniqueDevices: Number(totals?.unique_devices ?? 0),
        whatsappClicks: Number(totals?.whatsapp_clicks ?? 0),
        whatsappVisitors: Number(totals?.whatsapp_visitors ?? 0),
        mapsClicks: Number(totals?.maps_clicks ?? 0),
        mapsVisitors: Number(totals?.maps_visitors ?? 0),
        instagramClicks: Number(totals?.instagram_clicks ?? 0),
        instagramVisitors: Number(totals?.instagram_visitors ?? 0),
        shares: Number(totals?.shares ?? 0),
        shareVisitors: Number(totals?.share_visitors ?? 0),
        carouselInteractions: Number(totals?.carousel_interactions ?? 0),
      },
      daily: (() => {
        const rows = new Map((dailyResult.results as DailyRow[]).map((row) => [row.day, row]));

        return periodBuckets(periodStart, periodEnd, period).map((day) => {
          const row = rows.get(day);

          return {
            day,
            status: bucketStatus(day, period, today),
            visits: Number(row?.visits ?? 0),
            uniqueDevices: Number(row?.unique_devices ?? 0),
            whatsapp: Number(row?.whatsapp ?? 0),
            whatsappDevices: Number(row?.whatsapp_devices ?? 0),
            instagram: Number(row?.instagram ?? 0),
            maps: Number(row?.maps ?? 0),
            shares: Number(row?.shares ?? 0),
          };
        });
      })(),
      devices: (devicesResult.results as GroupRow[]).map((row) => ({
        label: row.label,
        value: Number(row.value ?? 0),
      })),
      sources: (sourcesResult.results as GroupRow[]).map((row) => ({
        label: row.label,
        value: Number(row.value ?? 0),
      })),
      actions: (actionsResult.results as GroupRow[]).map((row) => ({
        label: row.label,
        value: Number(row.value ?? 0),
      })),
    });
  } catch {
    return jsonResponse({ error: 'No se pudieron consultar las estadísticas.' }, 500);
  }
}
