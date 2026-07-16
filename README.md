# akinator-client

Unofficial Node.js/TypeScript client for the [Akinator](https://akinator.com/) game API.

## Features

- Full game lifecycle: start, answer, back, continue, win
- 16 languages with localized answer labels
- 3 themes: Character, Objects, Animals
- TypeScript with dual ESM/CJS output
- Cloudflare bypass built-in
- Child mode support

## Quick Start

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

## API

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
| `language` | `Languages` | `Portuguese` | Game language |
| `theme` | `Themes` | `Character` | Game theme |
| `childMode` | `boolean` | `false` | Enable child mode (no explicit content) |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `start()` | `Promise<AnswerResult>` | Start a new game |
| `answer(answer)` | `Promise<AnswerResult>` | Answer the current question |
| `back()` | `Promise<AnswerResult>` | Go back to the previous question |
| `continue()` | `Promise<AnswerResult>` | Continue after a wrong guess |
| `submitWin()` | `Promise<void>` | Confirm a correct guess |

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
| `fr` | Francais | Character, Animals, Objects |
| `de` | Deutsch | Character, Animals |
| `es` | Espanol | Character, Animals |
| `it` | Italiano | Character, Animals |
| `jp` | Japanese | Character, Animals |
| `pt` | Portugues | Character |
| `ar` | Arabic | Character |
| `cn` | Chinese | Character |
| `il` | Hebrew | Character |
| `kr` | Korean | Character |
| `nl` | Dutch | Character |
| `pl` | Polish | Character |
| `ru` | Russian | Character |
| `tr` | Turkish | Character |
| `id` | Indonesian | Character |

## Themes

| Theme | ID | Description |
|-------|-----|-------------|
| `Themes.Character` | 1 | Guess a character (default) |
| `Themes.Objects` | 2 | Guess an object |
| `Themes.Animals` | 14 | Guess an animal |

## License

MIT
