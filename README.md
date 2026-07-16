# akinator-client

A modern, fully typed Node.js client for the [Akinator](https://akinator.com/) game.

## Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Full Example](#full-example)
- [Languages](#languages)
- [Themes](#themes)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## Features

- 🚀 Fully typed TypeScript API
- 🌍 16 supported languages
- 🎭 3 game themes
- 🔄 Complete game lifecycle (start, answer, back, continue, win)
- ☁️ Built-in Cloudflare bypass
- 🔁 Automatic retry on network errors
- 🌐 HTTP proxy support
- 👶 Child mode support

## Quick Start

Requires Node.js 18+

```bash
npm install akinator-client
```

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

## API Reference

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

### Methods

| Method | Returns | Throws | Description |
|--------|---------|--------|-------------|
| `start()` | `Promise<AnswerResult>` | Theme not available, HTTP error | Start a new game |
| `answer(answer)` | `Promise<AnswerResult>` | Game not started, already guessed | Answer the current question |
| `back()` | `Promise<AnswerResult>` | Game not started, first question | Go back to the previous question |
| `continue()` | `Promise<AnswerResult>` | Game not started, no guess | Continue after a wrong guess |
| `submitWin()` | `Promise<void>` | Game not started, no guess | Confirm a correct guess |

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
  akitude: string;
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

  const result = await akinator.answer([Answers.Yes, Answers.No, Answers.IDontKnow, Answers.Probably, Answers.ProbablyNot][idx]);
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
    const next = await akinator.continue();
    console.log(`\nContinuing... ${next.question}\n`);
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
| `id` | Indonesia | Character |

## Themes

| Theme | ID | Description |
|-------|-----|-------------|
| `Themes.Character` | 1 | Guess a character (default) |
| `Themes.Objects` | 2 | Guess an object |
| `Themes.Animals` | 14 | Guess an animal |

## FAQ

**Does this work behind Cloudflare?**
Yes. The library uses `got-scraping` to bypass Cloudflare's TLS fingerprinting automatically.

**Can I use proxies?**
Yes. Pass a proxy URL in the constructor:
```js
new AkinatorClient({ proxy: "http://proxy:8080" })
```

**Can I resume a game?**
No. Each `start()` creates a new session. There's no persistence between games.

**Which Node.js version is required?**
Node.js 18 or higher.

## Contributing

Pull requests are welcome! Feel free to open issues for bugs or feature requests.

## License

MIT
