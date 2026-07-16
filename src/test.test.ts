import { describe, it, expect } from "vitest";
import { AkinatorClient, Languages, Themes, Answers } from "./index.js";
import { ANSWER_LABELS, AVAILABLE_THEMES } from "./storage.js";

describe("AkinatorClient", () => {
  describe("constructor", () => {
    it("should create with default options", () => {
      const client = new AkinatorClient();
      expect(client.language).toBe(Languages.Portuguese);
      expect(client.theme).toBe(Themes.Character);
      expect(client.childMode).toBe(false);
    });

    it("should create with custom options", () => {
      const client = new AkinatorClient({
        language: Languages.English,
        theme: Themes.Animals,
        childMode: true,
        proxy: "http://proxy:8080",
        retries: 5,
      });
      expect(client.language).toBe(Languages.English);
      expect(client.theme).toBe(Themes.Animals);
      expect(client.childMode).toBe(true);
    });

    it("should accept string language code", () => {
      const client = new AkinatorClient({ language: "en" as Languages });
      expect(client.language).toBe("en");
    });
  });

  describe("answers", () => {
    it("should return English labels for English", () => {
      const client = new AkinatorClient({ language: Languages.English });
      expect(client.answers).toEqual(["Yes", "No", "Don't know", "Probably yes", "Probably no"]);
    });

    it("should return Portuguese labels for Portuguese", () => {
      const client = new AkinatorClient({ language: Languages.Portuguese });
      expect(client.answers).toEqual(["Sim", "Não", "Não sei", "Provavelmente sim", "Provavelmente não"]);
    });

    it("should return French labels for French", () => {
      const client = new AkinatorClient({ language: Languages.French });
      expect(client.answers).toEqual(["Oui", "Non", "Je ne sais pas", "Probablement oui", "Probablement non"]);
    });

    it("should return Japanese labels for Japanese", () => {
      const client = new AkinatorClient({ language: Languages.Japanese });
      expect(client.answers).toEqual(["はい", "いいえ", "わからない", "たぶんはい", "たぶんいいえ"]);
    });

    it("should fallback to English for unknown language", () => {
      const client = new AkinatorClient({ language: "xx" as Languages });
      expect(client.answers).toEqual(ANSWER_LABELS[Languages.English]);
    });
  });

  describe("state", () => {
    it("should not be started initially", () => {
      const client = new AkinatorClient();
      expect(client.started).toBe(false);
      expect(client.won).toBe(false);
      expect(client.ko).toBe(false);
    });

    it("should have empty question initially", () => {
      const client = new AkinatorClient();
      expect(client.question).toBe("");
      expect(client.step).toBe(0);
      expect(client.progression).toBe(0);
    });
  });

  describe("validation", () => {
    it("should throw if answer called before start", async () => {
      const client = new AkinatorClient();
      await expect(client.answer(Answers.Yes)).rejects.toThrow("Game not started");
    });

    it("should throw if back called before start", async () => {
      const client = new AkinatorClient();
      await expect(client.back()).rejects.toThrow("Game not started");
    });

    it("should throw if continue called before start", async () => {
      const client = new AkinatorClient();
      await expect(client.continue()).rejects.toThrow("Game not started");
    });

    it("should throw if submitWin called before start", async () => {
      const client = new AkinatorClient();
      await expect(client.submitWin()).rejects.toThrow("Game not started");
    });

    it("should throw for unavailable theme", async () => {
      const client = new AkinatorClient({
        language: Languages.Korean,
        theme: Themes.Animals,
      });
      await expect(client.start()).rejects.toThrow("not available");
    });
  });
});

describe("AVAILABLE_THEMES", () => {
  it("should have all languages", () => {
    const languages = Object.values(Languages);
    for (const lang of languages) {
      expect(AVAILABLE_THEMES[lang]).toBeDefined();
    }
  });

  it("should have Character theme for all languages", () => {
    for (const lang of Object.values(Languages)) {
      expect(AVAILABLE_THEMES[lang]).toContain(Themes.Character);
    }
  });
});

describe("ANSWER_LABELS", () => {
  it("should have labels for all languages", () => {
    for (const lang of Object.values(Languages)) {
      expect(ANSWER_LABELS[lang]).toBeDefined();
      expect(ANSWER_LABELS[lang]).toHaveLength(5);
    }
  });
});
