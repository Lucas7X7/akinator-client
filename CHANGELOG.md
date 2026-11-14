# Changelog

## [Unreleased]

### Fixed
- Persist cookies, the ScraperAPI sticky-session number, and the full local navigation history in `toJSON()` / `fromJSON()`.
- Keep the previous win state intact when `/exclude` fails or returns invalid JSON.
- Track `back()` eligibility using local answer history instead of the server's non-monotonic step semantics.
- Reset stale win/KO data when a new game starts and keep win/KO flags mutually exclusive.
- Prevent automatic retries of state-changing POST requests, avoiding duplicate answers after ambiguous network failures.
- Preserve ScraperAPI response headers from the first request and forward cookies consistently.
- Separate ESM and CommonJS package scopes and add runtime entry-point smoke tests.

### Tests and release
- Add automated coverage for persistence, failed `continue()`, multiple `back()` calls, KO recovery, and POST retry behavior.
- Exclude test files from published build output.
- Run tests, both builds, and ESM/CommonJS smoke tests before publishing.

## [1.3.0] - 2026-09-07

### Added
- `ua` option to override the `User-Agent` header (default: Chrome 131)
- `scraperApiKey` and `scraperApiSession` options to route requests through ScraperAPI's sync API and get past the anti-bot check on `continue()` (#3)
- Cookie jar: `Set-Cookie` values are captured and forwarded on subsequent requests
- `continue()` now sends `forward_answer` on `/exclude`, matching the web client

### Fixed
- `continue()` after a win sent a stale `step` to `/exclude`, so Akinator served the anti-bot challenge ("Vital API blocked") instead of JSON. `session`, `signature`, `step` and `progression` are now persisted from every answer response before the win/give-up branches (#3)
- Requests use a constant, consistent User-Agent (`useHeaderGenerator: false`), avoiding mismatched browser header sets that triggered the anti-bot challenge

### Docs
- Document ScraperAPI usage (sync API key and sticky-session proxy) as a way to make `continue()` reliable

## [1.2.4] - 2026-08-27

### Docs
- Document that Akinator's `/exclude` (used by `continue()`) is currently broken server-side; recommend `start()` as a workaround (#3)

## [1.2.3] - 2026-08-27

### Changed
- Detect and report Cloudflare anti-bot challenges distinctly (root cause of `continue()` returning HTML — "Vital API blocked") (#3)

## [1.2.2] - 2026-08-25

### Fixed
- Clear error message when Akinator returns HTML instead of JSON (session expired / proxy interrupted the request)

## [1.2.1] - 2026-08-24

### Fixed
- `proxy` option was forwarded with the wrong option name and rejected by got (`Unexpected option: proxy`). It is now correctly mapped to got-scraping's `proxyUrl` (#2)

## [1.2.0] - 2026-07-16

### Added
- Session persistence: `toJSON()` and `fromJSON()` methods
- Discord bot example with buttons
- Session persistence example (save/load to file)

## [1.1.1] - 2026-07-16

### Fixed
- submitWin redirect loop

## [1.1.0] - 2026-07-16

### Added
- Automatic retry on network errors (configurable via `retries` option)
- HTTP proxy support (via `proxy` option)
- 18 unit tests with vitest
- LICENSE file

### Changed
- Localized answer labels for all 16 languages
- English error messages

## [1.0.0] - 2026-07-16

### Added
- Initial release
- Full game lifecycle: start, answer, back, continue, submitWin
- 16 languages support
- 3 themes: Character, Objects, Animals
- TypeScript with dual ESM/CJS output
- Cloudflare bypass via got-scraping
- Child mode support
