# AI change log

## 2026-09-25 — 0.2.0

- Added bounded ingestion of the official Assemblée nationale parliamentary-publications RSS feed.
- Normalizes titles/descriptions, deduplicates GUIDs, validates official HTTPS links and exposes an injectable fetcher
  for deterministic tests and downstream products.
- Updated the public TypeScript contract and documented the legal-monitoring boundary.

## 2026-09-21 — 0.1.0

Created the first public alpha around one bounded French-domain decision. Added a validated pinned Jev client, an offline fake, deterministic safeguards, tests, CI, documentation, and a synthetic demo. No live Jev request or domain accuracy benchmark was run.
