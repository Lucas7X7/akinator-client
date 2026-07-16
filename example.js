const readline = require("readline");
const { AkinatorClient, Languages, Themes, Answers } = require("./dist/cjs");

const ANSWER_MAP = {
  0: Answers.Yes,
  1: Answers.No,
  2: Answers.IDontKnow,
  3: Answers.Probably,
  4: Answers.ProbablyNot,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  console.log("=== Akinator Client ===\n");

  const aki = new AkinatorClient({
    language: "pt",
    childMode: false,
    theme: Themes.Character,
  });

  console.log("Starting game...");
  const first = await aki.start();
  console.log(`\nQuestion: ${first.question}\n`);

  while (!aki.won && !aki.ko) {
    console.log("Answers:");
    console.log("  0 - Yes");
    console.log("  1 - No");
    console.log("  2 - Don't know");
    console.log("  3 - Probably yes");
    console.log("  4 - Probably no");
    console.log("  b - Go back");

    const input = await ask("\nYour answer (0-4 or b): ");

    if (input.trim().toLowerCase() === "b") {
      try {
        const result = await aki.back();
        console.log(`\n[Previous question] ${result.question}\n`);
      } catch (e) {
        console.log(`\nError: ${e.message}\n`);
      }
      continue;
    }

    const answerIndex = parseInt(input, 10);
    if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 4) {
      console.log("\nInvalid answer. Use 0-4 or b.\n");
      continue;
    }

    const result = await aki.answer(ANSWER_MAP[answerIndex]);
    console.log(`\n(${result.step}/100 | ${result.progression.toFixed(1)}%) ${result.question}\n`);
  }

  if (aki.ko) {
    console.log("Akinator couldn't guess! You won!");
  } else {
    const win = aki.winResult;
    console.log("Akinator made a guess!");
    console.log(`  Name: ${win.name}`);
    console.log(`  Description: ${win.description}`);
    console.log(`  Submitted by: ${win.submittedBy}`);
    if (win.pictureUrl) console.log(`  Photo: ${win.pictureUrl}`);

    const confirm = await ask("\nDid Akinator guess correctly? (y/n): ");
    if (confirm.trim().toLowerCase() === "y") {
      await aki.submitWin();
      console.log("Akinator confirmed the win!");
    } else {
      const cont = await ask("Keep playing? (y/n): ");
      if (cont.trim().toLowerCase() === "y") {
        const next = await aki.continue();
        console.log(`\nContinuing... ${next.question}\n`);
      }
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  rl.close();
});
