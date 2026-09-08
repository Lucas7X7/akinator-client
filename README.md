# akinator-client

[![npm version](https://img.shields.io/npm/v/akinator-client.svg)](https://www.npmjs.com/package/akinator-client)
[![npm downloads](https://img.shields.io/npm/dm/akinator-client.svg)](https://www.npmjs.com/package/akinator-client)
[![license](https://img.shields.io/npm/l/akinator-client.svg)](https://github.com/Lucas7X7/akinator-client/blob/main/LICENSE)
[![typescript](https://img.shields.io/badge/typescript-5.5+-blue.svg)](https://www.typescriptlang.org/)

A modern, fully typed Node.js client for the [Akinator](https://akinator.com/) game.

## Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [How the protocol works](#how-the-protocol-works)
- [API Reference](#api-reference)
- [continue() and the /exclude endpoint](#continue-and-the-exclude-endpoint)
- [Error handling and challenges](#error-handling-and-challenges)
- [Full Example](#full-example)
- [Languages](#languages)
- [Themes](#themes)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

## Features

- 🚀 Fully typed TypeScript API
- 🌍 16 supported languages
- 🎭 3 game themes
- 🔄 Complete game lifecycle (start, answer, back, continue, win)
- ☁️ Handles Akinator's current web protection flow
- 🔁 Automatic retry on network errors
- 🌐 HTTP proxy support
- 👶 Child mode support
- 💾 Session persistence (save/load games)

## Requirements

- Node.js >= 18

## Quick Start

```bash
npm install akinator-client
```

Create a new client and start a game:

```js
import { AkinatorClient, Languages, Answers, Themes } from "akinator-client";

const akinator = new AkinatorClient({
  language: Languages.English,
  theme: Themes.Character,
});

// Start the game
const first = await akinator.start();
console.log(first.question); // "Is your character real?"

// Answer questions
const result = await akinator.answer(Answers.Yes);
console.log(result.question);

// Go back if needed
await akinator.back();

// When Akinator guesses
if (result.won) {
  console.log(akinator.winResult.name);
  await akinator.submitWin();
}
```

## How the protocol works

Akinator's web app is a small state machine. The client reproduces the requests the browser's `scratch.js` makes, so it needs to keep some server-side state consistent. Here is the full flow:

1. `GET /` — loads the page. The server answers with `Set-Cookie` (`SERVERID...`, `GPID`). The client keeps a mini cookie jar and forwards these on every request.
2. `POST /game` with `sid` (theme) and `cm` (child mode) — returns the question page as **HTML** containing hidden fields `session` and `signature`. These are the game tokens.
3. `POST /answer` repeatedly — returns **JSON**. Every answer response advances `step` and `progression`, and may rotate `session`/`signature`. The client persists all four from every response (this is what makes `continue()` and the win flow work later).
4. `POST /exclude` only after a win (see [continue() and /exclude](#continue-and-the-exclude-endpoint)) — returns JSON with a new guess or question while excluding the previous answer.

A `WinResult` is returned by the `/answer` that guessed right. Its payload also contains the **next `step`**; if you don't persist it, the follow-up `/exclude` request is sent with a stale position and the server rejects it. The client handles this automatically since v1.3.0.

The anti-bot protection only bites at `/exclude`: it serves an HTML "Vital API blocked" page to HTTP clients whose TLS fingerprint doesn't match a real browser, blocking `continue()`. `start()`, `answer()` and `back()` are not affected.

## API Reference

```ts
import {
  AkinatorClient,
  Languages,
  Themes,
  Answers,
} from "akinator-client";
```

### Constructor

```ts
new AkinatorClient(options?)
```

You can use the enum or the string code directly:

```js
// Using enum
new AkinatorClient({ language: Languages.English })

// Using string code
new AkinatorClient({ language: "en" })
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `language` | `Languages` | `Languages.Portuguese` | Game language |
| `theme` | `Themes` | `Themes.Character` | Game theme |
| `childMode` | `boolean` | `false` | Enable child mode (no explicit content) |
| `proxy` | `string` | - | HTTP proxy URL (e.g. `http://proxy:8080`) |
| `retries` | `number` | `3` | Number of retries on network errors |
| `ua` | `string` | Chrome 131 UA | Override the `User-Agent` header |
| `scraperApiKey` | `string` | - | [ScraperAPI](https://www.scraperapi.com/) key. Routes requests through their sync API so `continue()` works past the anti-bot check (see [transport options](#continue-and-the-exclude-endpoint)) |
| `scraperApiSession` | `number` | random | Sticky IP session number used with `scraperApiKey` |

### Methods

| Method | Returns | Throws | Description |
|--------|---------|--------|-------------|
| `start()` | `Promise<AnswerResult>` | Theme not available, HTTP error | Start a new game |
| `answer(answer)` | `Promise<AnswerResult>` | Game not started, already guessed | Answer the current question |
| `back()` | `Promise<AnswerResult>` | Game not started, first question | Go back to the previous question |
| `continue()` | `Promise<AnswerResult>` | Game not started, no guess | Continue after a wrong guess |
| `submitWin()` | `Promise<void>` | Game not started, no guess | Confirm a correct guess |

> **Note on `continue()`:** it needs a browser-aware transport (ScraperAPI key or sticky-session proxy), otherwise it throws a descriptive error. See [continue() and the /exclude endpoint](#continue-and-the-exclude-endpoint).

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `question` | `string` | Current question |
| `step` | `number` | Question number (0-indexed) |
| `progression` | `number` | Progress (0-100) |
| `won` | `boolean` | Whether Akinator guessed correctly |
| `ko` | `boolean` | Whether Akinator gave up |
| `started` | `boolean` | Whether the game has started |
| `winResult` | `WinResult` | Character data (available when `won` is `true`) |

### Types

```ts
interface AnswerResult {
  won: boolean;
  ko: boolean;
  akitude: string; // Akinator's current reaction/expression
  step: number;
  progression: number;
  question: string;
  answers: string[];
}

interface WinResult {
  propositionId: number;
  basePropositionId: number;
  submittedBy: string;
  name: string;
  pictureUrl: string;
  description: string;
}
```

## continue() and the /exclude endpoint

`continue()` is called after Akinator guessed a character that is **wrong** (`won === true`). It posts to `/exclude`, which re-runs the algorithm excluding that answer and returns either another guess or a fresh question.

```js
if (akinator.won) {
  const next = await akinator.continue();
  console.log(next.won, next.question); // false, "Is your character a woman?"
}
```

It fails for **two independent reasons**, and you need to understand both:

1. **Stale `step`.** The win response from `/answer` contains the *next* `step` value. The web client sends that value on the follow-up `/exclude`; if the client keeps the old one, the server rejects the request. This was a bug in the library (fixed in v1.3.0) — the exclude body now looks like the browser's:

   ```text
   step=<win response step>&sid=1&cm=false&progression=<last progression>
   session=<session>&signature=<signature>&forward_answer=1
   ```

2. **`forward_answer`.** The browser always sends `forward_answer: 1` on `/exclude`. The library sends it too (v1.3.0). Sending `/exclude` without it is treated as a different (unsupported) call shape.
3. **Anti-bot challenge.** `/exclude` is the only endpoint that checks the client before answering. A plain HTTP client (default transport) with a mismatched TLS fingerprint receives an HTML page ("Vital API blocked") instead of JSON, so `continue()` throws a descriptive error.

### Transport options

To make `continue()` work, route the requests through something that presents a consistent browser-like fingerprint:

| Transport | Enables `continue()` | Behavior |
|-----------|---------------------|----------|
| Default (no options) | ❌ throws on `/exclude` | `got-scraping` talks directly to `akinator.com` using Node's TLS. Works for the whole game, but the fingerprint is not a real browser's. |
| `proxy` (plain HTTP proxy) | depends on the exit node | TCP is routed through the proxy; the TLS handshake happens on the exit side. A generic/datacenter proxy still gets challenged. |
| `proxy` pointing at a [ScraperAPI](https://www.scraperapi.com/) sticky session | ✅ | `http://scraperapi.session_number=123456:KEY@proxy-server.scraperapi.com:8001` — the exit side presents a consistent browser profile and IP, so `/exclude` passes. |
| `scraperApiKey` (sync API) | ✅ | Every request is a `GET`/`POST` to `api.scraperapi.com?api_key=...&url=<target>&session_number=N`, and cookies are forwarded with `keep_headers`. Same effect as above without a proxy layer. |

```js
// Option A – ScraperAPI sync API (simplest)
new AkinatorClient({ scraperApiKey: "YOUR_SCRAPERAPI_KEY" })

// Option B – ScraperAPI proxy with a sticky IP session
new AkinatorClient({
  proxy: "http://scraperapi.session_number=123456:YOUR_SCRAPERAPI_KEY@proxy-server.scraperapi.com:8001",
})
```

Notes that matter in practice:

- Each request against `pt.akinator.com` costs **1 credit** (verified via the `urlcost` endpoint); a full game plus a `continue()` uses roughly 15-25 credits. No Cloudflare/Turnstile bypass is triggered on this domain.
- The sync API (**Option A**) does **not** forward a custom `User-Agent`: ScraperAPI returns HTTP 500 when `keep_headers` is combined with a custom UA header, so the client only forwards cookies through that path.
- Keep the `session_number` sticky across the whole game (the client does this automatically; it picks a random one unless you pass `scraperApiSession`).
- If you cannot use either transport, recover by starting a fresh game with `start()` — see [Error handling and challenges](#error-handling-and-challenges).

## Error handling and challenges

The client throws `Error`s with actionable messages. A few realistic patterns:

**Anti-bot challenge (most important).** `continue()` throws whenever `/exclude` answers with HTML:

```js
const aki = new AkinatorClient();

while (!aki.won && !aki.ko) {
  await aki.answer(Answers.Yes);
}

try {
  await aki.continue();
} catch (err) {
  console.log(err.message);
  // "Akinator served an anti-bot challenge ("Vital API blocked"/Cloudflare) on
  //  "/exclude" instead of JSON. A direct HTTP request with a mismatched TLS
  //  fingerprint cannot pass it. Pass a ScraperAPI key via the "scraperApiKey"
  //  option (or route through a browser-aware proxy) ..."

  // Recover: either switch transport and keep playing,
  // or start over and don't attempt continue().
  const fresh = new AkinatorClient();
  await fresh.start();
}
```

**Retries.** Transient network errors are retried automatically (`retries`, default `3`); non-200 responses from Akinator throw `HTTP error starting game: <code>` / `HTTP error answering: <code>`. On a repeated failure, create a new client:

```js
const aki = new AkinatorClient({ retries: 5 });
```

**Expired sessions / HTML where JSON was expected.** `answer()` throws `Akinator returned HTML instead of JSON on "/answer". ... Try starting a new game.` Just `start()` again.

**Akinator gives up (`ko`).** `continue()` then throws `No more questions`; start a new game.

**Wrong guess recovery without a transport.** If you don't have ScraperAPI, treat a wrong guess like a loss and start over:

```js
if (akinator.won) {
  console.log(`I thought of: ${akinator.winResult.name}`);
  const correct = await ask("Was that right? (y/n)");
  if (correct !== "y") await akinator.start(); // start over instead of continue()
}
```

## Full Example

```js
import { AkinatorClient, Languages, Answers, Themes } from "akinator-client";
import readline from "readline";

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((r) => rl.question(q, r));

const akinator = new AkinatorClient({
  language: Languages.English,
  theme: Themes.Character,
});

console.log("Starting game...");
await akinator.start();
console.log(`\n${akinator.question}\n`);

while (!akinator.won && !akinator.ko) {
  console.log("0 - Yes | 1 - No | 2 - Don't know | 3 - Probably yes | 4 - Probably no | b - Back");
  const input = await ask("\nAnswer: ");

  if (input.trim().toLowerCase() === "b") {
    const prev = await akinator.back();
    console.log(`\n${prev.question}\n`);
    continue;
  }

  const idx = parseInt(input, 10);
  if (isNaN(idx) || idx < 0 || idx > 4) continue;

  const answers = [Answers.Yes, Answers.No, Answers.IDontKnow, Answers.Probably, Answers.ProbablyNot];
  const result = await akinator.answer(answers[idx]);
  console.log(`\n(${result.step}/100 | ${result.progression.toFixed(1)}%) ${result.question}\n`);
}

if (akinator.ko) {
  console.log("Akinator couldn't guess! You won!");
} else {
  const win = akinator.winResult;
  console.log(`Akinator guessed: ${win.name}`);
  console.log(`Description: ${win.description}`);

  const confirm = await ask("\nCorrect? (y/n): ");
  if (confirm.trim().toLowerCase() === "y") {
    await akinator.submitWin();
    console.log("Confirmed!");
  } else {
    console.log("\nStarting a new game (continue() needs a scraperApiKey or browser-aware proxy)\n");
    await akinator.start();
    await ask("\nAsk your next character!\n");
  }
}

rl.close();
```

Run with: `npx tsx example.js`

## Languages

| Code | Language | Available Themes |
|------|----------|------------------|
| `en` | English | Character, Animals, Objects |
| `fr` | Français | Character, Animals, Objects |
| `de` | Deutsch | Character, Animals |
| `es` | Español | Character, Animals |
| `it` | Italiano | Character, Animals |
| `jp` | 日本語 | Character, Animals |
| `pt` | Português | Character |
| `ar` | العربية | Character |
| `cn` | 中文 | Character |
| `il` | עברית | Character |
| `kr` | 한국어 | Character |
| `nl` | Nederlands | Character |
| `pl` | Polski | Character |
| `ru` | Русский | Character |
| `tr` | Türkçe | Character |
| `id` | Bahasa Indonesia | Character |

## Themes

| Theme | ID | Description |
|-------|-----|-------------|
| `Themes.Character` | 1 | Guess a character (default) |
| `Themes.Objects` | 2 | Guess an object |
| `Themes.Animals` | 14 | Guess an animal |

## FAQ

### Does this work behind Cloudflare?

Yes. The library uses `got-scraping` to handle Akinator's current web protection flow automatically during the game.

### Can I use proxies?

Yes. Any HTTP proxy works during the game:
```js
new AkinatorClient({ proxy: "http://proxy:8080" })
```

To bypass the anti-bot check that protects `continue()`, the proxy's exit node must present a real browser fingerprint (see [Transport options](#continue-and-the-exclude-endpoint)). The validated recipes are a [ScraperAPI](https://www.scraperapi.com/) sticky-session proxy or its sync API key. Each request against `pt.akinator.com` costs 1 credit; a full game with `continue()` uses roughly 15-25 credits.

### Can I resume a game?

Yes. `toJSON()` serializes the full game state (session, signature, step, progression, cookies), and `AkinatorClient.fromJSON()` restores it. The realistic flow is: play a bit, save; later, load and keep answering or run `continue()` on a won game.

```js
const fs = require("fs");

// Save mid-game
fs.writeFileSync("session.json", JSON.stringify(akinator.toJSON()));

// Load later and keep playing
const restored = AkinatorClient.fromJSON(
  JSON.parse(fs.readFileSync("session.json", "utf8"))
);
console.log(restored.question);            // same question, same state
await restored.answer(Answers.Yes);

// If the restored game was already won, continue() works with a
// browser-aware transport:
if (restored.won) {
  const next = await restored.continue();
}
```

See `examples/session-persistence.js` (interactive save/resume) and `examples/restore-and-continue.js` (restore then `continue()` with ScraperAPI) for complete examples.

### Which Node.js version is required?

Node.js 18 or higher.

## Contributing

Pull requests are welcome! Feel free to open issues for bugs or feature requests.

## Roadmap

- [x] Session persistence
- [x] More examples
- [ ] Browser support
- [ ] SOCKS5 proxy support

## License

MIT
