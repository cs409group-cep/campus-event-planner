ACM @ UIUC Core API — EventEase Integration

This document describes how EventEase integrates with the ACM @ UIUC Core API (ACM Core) to periodically import events.

1) Overview

- A sync service (`backend/services/acmSyncService.js`) fetches events from the ACM Core API and upserts them into the local `Event` collection.
- Imported events are identified by `externalSource: 'ACM'` and `externalId: <acm id>` so updates don't create duplicates.
- A manual trigger is available at `POST /api/admin/acm-sync/sync`.

2) Environment variables (backend `.env`)

Add the following variables to `backend/.env` (some may already be present):

- `ACM_API_BASE_URL` — Base URL for the ACM Core API (default: `https://core.acm.illinois.edu`)
- `ACM_API_KEY` — API key for the ACM Core API (sent as `X-Api-Key` header if provided)
- `ACM_SYNC_CRON` — Cron expression controlling periodic sync (default: `0 */6 * * *` — every 6 hours)
- `ACM_SYNC_UPCOMING_ONLY` — `true`/`false`; if `true` the service requests `upcomingOnly=true` (default `true`)
- `ACM_SYNC_MAX_EVENTS` — Maximum number of events to process per run (default `500`)
- `ACM_SYNC_USER_EMAIL` — Local user email assigned as `organizer` for imported events. If not found, the service creates this user (default: `acm-sync@example.local`)
- `ACM_SYNC_USER_NAME` — Display name for the sync user (default: `ACM Sync User`)

Important: imported events are treated as read-only by EventEase. Events with `externalSource` (for example `ACM`) cannot be edited or deleted by users through the standard event endpoints. This preserves official/authoritative event data.

Example `.env` additions:

```
ACM_API_BASE_URL=https://core.acm.illinois.edu
ACM_API_KEY=
ACM_SYNC_CRON=0 */6 * * *
ACM_SYNC_UPCOMING_ONLY=true
ACM_SYNC_MAX_EVENTS=500
ACM_SYNC_USER_EMAIL=acm-sync@example.local
ACM_SYNC_USER_NAME="ACM Sync User"
```

3) How the mapping works (high level)

- `title` -> `Event.title`
- `description` -> `Event.description`
- `start` -> `Event.date` (stored as JS Date) and `Event.time` (HH:mm string)
- `location` -> `Event.location`
- `metadata.image` -> `Event.imageUrl` (if present)
- `host` -> contributed to `organizerName` (local `organizer` account is used)
- `category` -> Not provided by ACM; imported events default to `other` (you can add mapping rules)
- `externalSource` -> `'ACM'`; `externalId` -> ACM event `id` for idempotency

4) Organizer user

The `Event` model requires an `organizer`. The sync service uses the account specified by `ACM_SYNC_USER_EMAIL`. If that email is not found, the service auto-creates an `organizer` user with a random password and role `organizer`.

Recommendation: set `ACM_SYNC_USER_EMAIL` to an existing organizer email to avoid auto-created accounts.

5) Manual trigger

Endpoint: `POST /api/admin/acm-sync/sync`

- No auth by default. It returns JSON like `{ ok: true, result: { processed, created, updated } }` on success.
- Protect this endpoint by applying your auth middleware in `backend/routes/acmSync.js` if you want it restricted.

6) Scheduler

- The sync scheduler starts on backend startup after MongoDB connection, using the `ACM_SYNC_CRON` expression.
- The scheduler also performs an initial run at startup.

7) Notes & further improvements

- Timezones: ACM timestamps in the OpenAPI spec use America/Chicago in examples. The current implementation uses `new Date()` parsing. For precise timezone handling consider adding `moment-timezone` or `luxon` and parse with `America/Chicago` explicitly.
- Categories: add mapping rules if you want to map ACM hosts/metadata to EventEase `category` values.
- Pagination: if the ACM API paginates large result sets, implement pagination to fetch all pages rather than slicing to `ACM_SYNC_MAX_EVENTS`.
- Rate limits: if the ACM API enforces rate limits, add backoff/retry logic.

8) Testing

- Manual test:
  1. Start the backend:
     ```powershell
     cd backend
     npm run dev
     ```
  2. Trigger a sync:
     ```powershell
     curl -X POST http://localhost:5000/api/admin/acm-sync/sync -H "Content-Type: application/json"
     ```

- Programmatic test: call `syncOnce()` exported by `backend/services/acmSyncService.js` from a node REPL or test harness with a mocked response.

9) Next steps I can take

- Protect the manual endpoint with existing auth middleware.
- Add timezone-aware parsing (I can add `moment-timezone` and adjust `package.json`).
- Implement pagination, retries, and better logging.

If you want one of those, tell me which and I will implement it next.
