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

describe("HTML response detection (issue #3)", () => {
  beforeEach(() => {
    mockGotScraping.mockReset();
    mockGotScraping.mockResolvedValue({
      statusCode: 200,
      body: FAKE_GAME_HTML,
      headers: {},
    });
  });

  it("throws a clear error when answer() gets HTML instead of JSON", async () => {
    const client = new AkinatorClient({ language: Languages.English });
    await client.start();

    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: "<!DOCTYPE html><html><body>Error</body></html>",
      headers: {},
    });

    await expect(client.answer(0 as any)).rejects.toThrow(
      /Akinator returned HTML instead of JSON.*\/answer/
    );
  });

  it("throws a clear error when continue() gets HTML instead of JSON", async () => {
    const client = new AkinatorClient({ language: Languages.English });
    await client.start();

    const winResponse = JSON.stringify({
      id_proposition: "123",
      name_proposition: "Test",
      pseudo: "test",
    });
    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: winResponse,
      headers: {},
    });
    await client.answer(0 as any);

    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: "<!DOCTYPE html><html><body>Error</body></html>",
      headers: {},
    });

    await expect(client.continue()).rejects.toThrow(
      /Akinator returned HTML instead of JSON.*\/exclude/
    );
  });

  it("detects a Cloudflare challenge and reports it distinctly", async () => {
    const client = new AkinatorClient({ language: Languages.English });
    await client.start();

    const winResponse = JSON.stringify({
      id_proposition: "123",
      name_proposition: "Test",
      pseudo: "test",
    });
    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: winResponse,
      headers: {},
    });
    await client.answer(0 as any);

    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: `<html><title>Akinator</title>'<script src="/cdn-cgi/challenge-platform/scripts/jsd/main.js"></script>'error=Vml0YWwgQVBJIGJsb2NrZWQ%3D`,
      headers: {},
    });

    await expect(client.continue()).rejects.toThrow(/\"Vital API blocked\"\/Cloudflare/);
  });
});

describe("continue() reliability (issue #3 fix)", () => {
  beforeEach(() => {
    mockGotScraping.mockReset();
    mockGotScraping.mockResolvedValue({
      statusCode: 200,
      body: FAKE_GAME_HTML,
      headers: {},
    });
  });

  it("sends forward_answer and the win answer's updated step to /exclude", async () => {
    const client = new AkinatorClient({ language: Languages.English });
    await client.start();

    const winResponse = JSON.stringify({
      id_proposition: "123",
      name_proposition: "Test",
      pseudo: "test",
      step: 7,
    });
    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: winResponse,
      headers: {},
    });
    await client.answer(0 as any);

    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: JSON.stringify({ step: 8, progression: 50, question: "Next?" }),
      headers: {},
    });
    const res = await client.continue();
    expect(res.won).toBe(false);

    const [opts] = mockGotScraping.mock.calls.at(-1) as [Record<string, any>];
    expect(opts.url).toContain("/exclude");
    expect(opts.method).toBe("POST");
    expect(opts.body).toContain("step=7");
    expect(opts.body).toContain("forward_answer=1");
    expect(opts.body).not.toContain("step=0");
  });

  it("captures Set-Cookie and forwards it on subsequent requests", async () => {
    const client = new AkinatorClient({ language: Languages.English });
    mockGotScraping.mockResolvedValueOnce({
      statusCode: 200,
      body: FAKE_GAME_HTML,
      headers: { "set-cookie": ["SERVERID250165=7179d0bc|ap9B5"] },
    });
    await client.start();

    const [, [opts]] = mockGotScraping.mock.calls as [Record<string, any>[], Record<string, any>[]];
    expect(opts.headers.cookie).toBe("SERVERID250165=7179d0bc|ap9B5");
    expect(opts.headers["user-agent"]).toBe(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    );
  });

  it("respects the ua option and disables the random header generator", async () => {
    const client = new AkinatorClient({
      language: Languages.English,
      ua: "Mozilla/5.0 (custom)",
    });
    await client.start();

    for (const [opts] of mockGotScraping.mock.calls) {
      const options = opts as Record<string, any>;
      expect(options.headers["user-agent"]).toBe("Mozilla/5.0 (custom)");
      expect(options.context).toEqual({ useHeaderGenerator: false });
    }
  });
});
