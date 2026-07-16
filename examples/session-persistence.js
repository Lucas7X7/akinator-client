const { AkinatorClient, Languages, Themes, Answers } = require("../dist/cjs");
const fs = require("fs");

const SAVE_FILE = "akinator-session.json";

async function saveSession(aki) {
  const data = aki.toJSON();
  fs.writeFileSync(SAVE_FILE, JSON.stringify(data, null, 2));
  console.log("Session saved!");
}

async function loadSession() {
  if (!fs.existsSync(SAVE_FILE)) return null;
  const data = JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"));
  return AkinatorClient.fromJSON(data);
}

async function main() {
  let aki;

  if (fs.existsSync(SAVE_FILE)) {
    console.log("Loading saved session...");
    aki = await loadSession();
    console.log(`Resumed at step ${aki.step}, ${aki.progression.toFixed(1)}%`);
    console.log(`Question: ${aki.question}`);
  } else {
    console.log("Starting new game...");
    aki = new AkinatorClient({ language: Languages.English, theme: Themes.Character });
    const result = await aki.start();
    console.log(`Question: ${result.question}`);
  }

  const readline = require("readline");
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q) => new Promise((r) => rl.question(q, r));

  while (!aki.won && !aki.ko) {
    console.log("\n0-Yes  1-No  2-Don't know  3-Probably  4-Probably not  b-Back  s-Save");
    const input = await ask("Answer: ");

    if (input === "s") {
      await saveSession(aki);
      continue;
    }

    if (input === "b") {
      try {
        const r = await aki.back();
        console.log(`\n${r.question}`);
      } catch (e) {
        console.log(e.message);
      }
      continue;
    }

    const idx = parseInt(input);
    if (isNaN(idx) || idx < 0 || idx > 4) {
      console.log("Invalid input");
      continue;
    }

    const result = await aki.answer([Answers.Yes, Answers.No, Answers.IDontKnow, Answers.Probably, Answers.ProbablyNot][idx]);
    console.log(`\n(${result.step}/100 | ${result.progression.toFixed(1)}%) ${result.question}`);
  }

  if (aki.ko) {
    console.log("\nAkinator gave up! You win!");
  } else {
    const win = aki.winResult;
    console.log(`\nAkinator guessed: ${win.name}`);
    console.log(`Description: ${win.description}`);
  }

  if (fs.existsSync(SAVE_FILE)) fs.unlinkSync(SAVE_FILE);
  rl.close();
}

main().catch(console.error);
