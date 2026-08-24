import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGotScraping = vi.fn();

vi.mock("got-scraping", () => ({
  gotScraping: (...args: unknown[]) => mockGotScraping(...args),
}));

import { AkinatorClient, Languages } from "./index.js";

const FAKE_GAME_HTML =
  '<input type="hidden" name="session" id="session" value="sess">' +
  '<input type="hidden" name="signature" id="signature" value="sig">';

describe("proxy support (regression: issue #2)", () => {
  beforeEach(() => {
    mockGotScraping.mockReset();
    mockGotScraping.mockResolvedValue({
      statusCode: 200,
      body: FAKE_GAME_HTML,
      headers: {},
    });
  });

  it("passes proxyUrl (not proxy) to got-scraping", async () => {
    const client = new AkinatorClient({
      language: Languages.English,
      proxy: "http://proxy:8080",
    });
    await client.start();

    expect(mockGotScraping).toHaveBeenCalled();
    for (const [opts] of mockGotScraping.mock.calls) {
      const options = opts as Record<string, unknown>;
      expect(options.proxyUrl).toBe("http://proxy:8080");
      expect(options.proxy).toBeUndefined();
    }
  });

  it("does not pass proxyUrl when no proxy configured", async () => {
    const client = new AkinatorClient({ language: Languages.English });
    await client.start();

    for (const [opts] of mockGotScraping.mock.calls) {
      const options = opts as Record<string, unknown>;
      expect(options.proxyUrl).toBeUndefined();
      expect(options.proxy).toBeUndefined();
    }
  });
});
