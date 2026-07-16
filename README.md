# akinator-client

Unofficial Node.js/TypeScript client for the Akinator game API. Supports multiple languages, themes, and the full game lifecycle.

## Installation

```bash
npm install akinator-client
```

## Usage

```js
import { AkinatorClient, Languages, Answers, Themes } from "akinator-client";

const akinator = new AkinatorClient({
  language: Languages.English,
  theme: Themes.Character,
  childMode: false,
});

// Start game
const first = await akinator.start();
console.log(first.question); // "Is your character real?"

// Answer questions
const result = await akinator.answer(Answers.Yes);
console.log(result.question);

// Go back to previous question
const back = await akinator.back();

// When Akinator guesses
if (result.won) {
  console.log(akinator.winResult.name); // Character name
  await akinator.submitWin(); // Confirm guess
}
```

## API

### `new AkinatorClient(options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `language` | `Languages` | `Portuguese` | Game language |
| `theme` | `Themes` | `Character` | Game theme |
| `childMode` | `boolean` | `false` | Child mode |

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
| `winResult` | `WinResult` | Character data (after `won: true`) |

### `AnswerResult`

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
```

### `WinResult`

```ts
interface WinResult {
  propositionId: number;
  basePropositionId: number;
  submittedBy: string;
  name: string;
  pictureUrl: string;
  description: string;
}
```

## Languages

| Code | Language | Themes |
|------|----------|--------|
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
| `Themes.Character` | 1 | Characters (default) |
| `Themes.Objects` | 2 | Objects |
| `Themes.Animals` | 14 | Animals |

## Interactive Example

```bash
npx tsx example.js
```

## License

MIT
