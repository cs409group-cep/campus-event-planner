const https = require('https');
const { URL } = require('url');
const cron = require('node-cron');
const { DateTime } = require('luxon');
const Event = require('../models/Event');
const User = require('../models/User');

const DEFAULT_BASE = process.env.ACM_API_BASE_URL || 'https://core.acm.illinois.edu';
const API_KEY = process.env.ACM_API_KEY || '';
const SYNC_CRON = process.env.ACM_SYNC_CRON || '0 */6 * * *'; // every 6 hours
const UPCOMING_ONLY = (process.env.ACM_SYNC_UPCOMING_ONLY || 'true') === 'true';
const MAX_EVENTS = parseInt(process.env.ACM_SYNC_MAX_EVENTS || '500', 10);
const SYNC_USER_EMAIL = process.env.ACM_SYNC_USER_EMAIL || 'acm-sync@example.local';
const SYNC_USER_NAME = process.env.ACM_SYNC_USER_NAME || 'ACM Sync User';

function httpGetJson(fullUrl) {
  return new Promise((resolve, reject) => {
    const u = new URL(fullUrl);
    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    };

    if (API_KEY) options.headers['X-Api-Key'] = API_KEY;

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data || 'null');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            const err = new Error(`Remote API error ${res.statusCode}`);
            err.status = res.statusCode;
            err.body = json;
            reject(err);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function ensureSyncUser() {
  let user = await User.findOne({ email: SYNC_USER_EMAIL });
  if (!user) {
    const randomPassword = Math.random().toString(36).slice(2, 12) + Date.now();
    user = new User({ name: SYNC_USER_NAME, email: SYNC_USER_EMAIL, password: randomPassword, role: 'organizer' });
    await user.save();
    console.log('Created ACM sync user:', SYNC_USER_EMAIL);
  }
  return user;
}

function parseStartToDateAndTime(startStr) {
  // Use luxon to parse in America/Chicago explicitly for consistent TZ handling.
  if (!startStr) return { date: null, time: '' };
  // Prefer ISO parsing; if string has timezone, luxon will respect it.
  const dt = DateTime.fromISO(startStr, { zone: 'America/Chicago' });
  if (!dt.isValid) {
    // Try parsing as RFC or fallback to native Date
    const alt = DateTime.fromRFC2822(startStr, { zone: 'America/Chicago' });
    if (!alt.isValid) return { date: null, time: '' };
    const dAlt = alt.toJSDate();
    const hhAlt = String(alt.hour).padStart(2, '0');
    const mmAlt = String(alt.minute).padStart(2, '0');
    return { date: dAlt, time: `${hhAlt}:${mmAlt}` };
  }

  const date = dt.toJSDate();
  const hh = String(dt.hour).padStart(2, '0');
  const mm = String(dt.minute).padStart(2, '0');
  return { date, time: `${hh}:${mm}` };
}

function mapAcmToEvent(acmEvent, organizer) {
  const { date, time } = parseStartToDateAndTime(acmEvent.start || acmEvent.startDate || '');
  return {
    title: acmEvent.title || 'No title',
    description: acmEvent.description || '',
    category: 'other',
    date: date || new Date(),
    time: time || '00:00',
    location: acmEvent.location || '',
    organizer: organizer._id,
    organizerName: organizer.name || organizer.email || 'ACM',
    imageUrl: acmEvent.metadata && acmEvent.metadata.image ? acmEvent.metadata.image : '',
    externalSource: 'ACM',
    externalId: acmEvent.id || acmEvent.uuid || null
  };
}

async function syncOnce(options = {}) {
  try {
    const base = options.base || DEFAULT_BASE;
    const upcomingOnly = options.upcomingOnly !== undefined ? options.upcomingOnly : UPCOMING_ONLY;
    const includeMetadata = true;

    const q = new URL(`${base}/api/v1/events`);
    if (upcomingOnly) q.searchParams.set('upcomingOnly', 'true');
    if (includeMetadata) q.searchParams.set('includeMetadata', 'true');

    const data = await httpGetJson(q.toString());
    if (!Array.isArray(data)) {
      throw new Error('Unexpected ACM events response format');
    }

    const events = data.slice(0, MAX_EVENTS);
    const organizer = await ensureSyncUser();

    let created = 0, updated = 0;
    for (const ev of events) {
      const mapped = mapAcmToEvent(ev, organizer);
      if (!mapped.externalId) continue;

      const res = await Event.findOneAndUpdate(
        { externalSource: 'ACM', externalId: mapped.externalId },
        mapped,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (res.createdAt && res.createdAt.getTime() === res.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`ACM sync complete: processed=${events.length} created=${created} updated=${updated}`);
    return { processed: events.length, created, updated };
  } catch (err) {
    console.error('Error syncing ACM events:', err);
    throw err;
  }
}

function startAcmSync() {
  try {
    cron.schedule(SYNC_CRON, () => {
      syncOnce().catch(err => console.error('ACM scheduled sync error:', err));
    });
    console.log(`ACM sync scheduler started (${SYNC_CRON})`);
    // Run once on startup
    syncOnce().catch(err => console.error('ACM initial sync error:', err));
  } catch (err) {
    console.error('Failed to start ACM sync scheduler:', err);
  }
}

module.exports = {
  startAcmSync,
  syncOnce
};
