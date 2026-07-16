# akinator-api-v2-unofficial

Módulo JS/TS não-oficial para a API do Akinator. Suporta múltiplos idiomas, temas e o ciclo completo do jogo.

## Instalação

```bash
npm install akinator-api-v2-unofficial
```

## Uso

```js
import { AkinatorClient, Languages, Answers, Themes } from "akinator-api-v2-unofficial";

const akinator = new AkinatorClient({
  language: Languages.Portuguese,
  theme: Themes.Character,
  childMode: false,
});

// Iniciar jogo
const first = await akinator.start();
console.log(first.question); // "É uma pessoa real?"

// Responder perguntas
const result = await akinator.answer(Answers.Yes);
console.log(result.question);

// Voltar à pergunta anterior
const back = await akinator.back();

// Quando o Akinator adivinhar
if (result.won) {
  console.log(akinator.winResult.name); // Nome do personagem
  await akinator.submitWin(); // Confirmar chute
}
```

## API

### `new AkinatorClient(options?)`

| Opção | Tipo | Padrão | Descrição |
|-------|------|--------|-----------|
| `language` | `Languages` | `Portuguese` | Idioma do jogo |
| `theme` | `Themes` | `Character` | Tema do jogo |
| `childMode` | `boolean` | `false` | Modo infantil |

### Métodos

| Método | Retorna | Descrição |
|--------|---------|-----------|
| `start()` | `Promise<AnswerResult>` | Inicia uma nova partida |
| `answer(answer)` | `Promise<AnswerResult>` | Responde a pergunta atual |
| `back()` | `Promise<AnswerResult>` | Volta à pergunta anterior |
| `continue()` | `Promise<AnswerResult>` | Continua após chute errado |
| `submitWin()` | `Promise<void>` | Confirma chute correto |

### Propriedades

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `question` | `string` | Pergunta atual |
| `step` | `number` | Número da pergunta (0-indexed) |
| `progression` | `number` | Progresso (0-100) |
| `won` | `boolean` | Se o Akinator acertou |
| `ko` | `boolean` | Se o Akinator desistiu |
| `started` | `boolean` | Se o jogo começou |
| `winResult` | `WinResult` | Dados do personagem (após `won: true`) |

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

## Idiomas

| Código | Idioma | Temas |
|--------|--------|-------|
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

## Temas

| Temo | ID | Descrição |
|------|-----|-----------|
| `Themes.Character` | 1 | Personagens (padrão) |
| `Themes.Objects` | 2 | Objetos |
| `Themes.Animals` | 14 | Animais |

## Exemplo interativo

```bash
npx tsx example.js
```

## Licença

MIT
