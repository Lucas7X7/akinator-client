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
  console.log("=== Akinator API v2 Unofficial ===\n");

  const aki = new AkinatorClient({
    language: Languages.Portuguese,
    childMode: false,
    theme: Themes.Character,
  });

  console.log("Iniciando jogo...");
  const first = await aki.start();
  console.log(`\nPergunta: ${first.question}\n`);

  while (!aki.won && !aki.ko) {
    console.log("Respostas:");
    console.log("  0 - Sim");
    console.log("  1 - Não");
    console.log("  2 - Não sei");
    console.log("  3 - Provavelmente sim");
    console.log("  4 - Provavelmente não");
    console.log("  b - Voltar pergunta");

    const input = await ask("\nSua resposta (0-4 ou b): ");

    if (input.trim().toLowerCase() === "b") {
      try {
        const result = await aki.back();
        console.log(`\n[Pergunta anterior] ${result.question}\n`);
      } catch (e) {
        console.log(`\nErro: ${e.message}\n`);
      }
      continue;
    }

    const answerIndex = parseInt(input, 10);
    if (isNaN(answerIndex) || answerIndex < 0 || answerIndex > 4) {
      console.log("\nResposta inválida. Use 0-4 ou b.\n");
      continue;
    }

    const result = await aki.answer(ANSWER_MAP[answerIndex]);
    console.log(`\n(${result.step}/100 | ${result.progression.toFixed(1)}%) ${result.question}\n`);
  }

  if (aki.ko) {
    console.log("O Akinator não conseguiu adivinhar! Você venceu!");
  } else {
    const win = aki.winResult;
    console.log("O Akinator fez um chute!");
    console.log(`  Nome: ${win.name}`);
    console.log(`  Descrição: ${win.description}`);
    console.log(`  Enviado por: ${win.submittedBy}`);
    if (win.pictureUrl) console.log(`  Foto: ${win.pictureUrl}`);

    const confirm = await ask("\nO Akinator acertou? (s/n): ");
    if (confirm.trim().toLowerCase() === "s") {
      await aki.submitWin();
      console.log("Akinator confirmou a vitória!");
    } else {
      const cont = await ask("Continuar jogando? (s/n): ");
      if (cont.trim().toLowerCase() === "s") {
        const next = await aki.continue();
        console.log(`\nContinuando... ${next.question}\n`);
      }
    }
  }

  rl.close();
}

main().catch((err) => {
  console.error("Erro:", err.message);
  rl.close();
});
