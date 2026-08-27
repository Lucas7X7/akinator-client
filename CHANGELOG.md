# Changelog

## [1.2.3] - 2026-08-27

### Changed
- Detect and report Cloudflare anti-bot challenges distinctly (root cause of `continue()` returning HTML — "Vital API blocked") (#3)

## [1.2.2] - 2026-08-25

### Fixed
- Clear error message when Akinator returns HTML instead of JSON (session expired / proxy interrupted) (#3)

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
