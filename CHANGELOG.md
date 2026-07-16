# Changelog

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
