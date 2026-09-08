// Restore a saved game and, if it was won, call continue() via ScraperAPI.
//
// Usage (run twice):
//   SCRAPERAPI_KEY=<key> node examples/restore-and-continue.js   # 1st: play + save
//   SCRAPERAPI_KEY=<key> node examples/restore-and-continue.js   # 2nd: restore + continue()
const { AkinatorClient, Languages, Themes, Answers } = require("../dist/cjs");
const fs = require("fs");

const SAVE_FILE = "akinator-won-session.json";

function transport() {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) {
    throw new Error(
      "Set SCRAPERAPI_KEY so continue() can pass Akinator's anti-bot check."
    );
  }
  // Either the sync API key...
  return { scraperApiKey: key };
  // ...or a ScraperAPI sticky-session proxy:
  // return {
  //   proxy: `http://scraperapi.session_number=123456:${key}@proxy-server.scraperapi.com:8001`,
  // };
}

// Answer the whole game until Akinator proposes a wrong guess.
async function playUntilProposal(aki) {
  const MAX_ANSWERS = 60;
  let guard = 0;
  while (!aki.won && !aki.ko && guard < MAX_ANSWERS) {
    await aki.answer(Answers.Yes);
    guard++;
  }
  return aki.won;
}

async function main() {
  if (fs.existsSync(SAVE_FILE)) {
    // --- Run 2: restore a real persisted game and continue() it ---
    const aki = AkinatorClient.fromJSON(
      JSON.parse(fs.readFileSync(SAVE_FILE, "utf8"))
    );
    console.log(`restored: step=${aki.step} won=${aki.won} ko=${aki.ko}`);

    if (aki.won) {
      const next = await aki.continue(); // needs the ScraperAPI transport
      console.log(
        `continue() -> won=${next.won} step=${next.step} q="${next.question}"`
      );
    } else {
      const r = await aki.answer(Answers.Yes);
      console.log(`resumed answer -> step=${r.step} q="${r.question}"`);
    }
    return;
  }

  // --- Run 1: play a real game until Akinator guesses wrong, then save ---
  const aki = new AkinatorClient({
    language: Languages.English,
    theme: Themes.Character,
    ...transport(),
  });
  await aki.start();

  const won = await playUntilProposal(aki);
  if (!won) throw new Error(`No proposal after 60 answers (ko=${aki.ko})`);

  console.log(`Akinator proposed: ${aki.winResult.name}`);
  fs.writeFileSync(SAVE_FILE, JSON.stringify(aki.toJSON(), null, 2));
  console.log(`Saved won session (step=${aki.step}). Run again to continue()`);
}

main().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});