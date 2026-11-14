import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGotScraping = vi.fn();
vi.mock("got-scraping", () => ({
  gotScraping: (...args: unknown[]) => mockGotScraping(...args),
}));

import { AkinatorClient, Answers, Languages } from "./index.js";

const GAME_HTML = `
<input type="hidden" name="session" value="session-1">
<input type="hidden" name="signature" value="signature-1">
<input type="hidden" name="identifiant" value="ident-1">
<p id="question-label">First question?</p>
<script>localStorage.setItem('step', '1'); localStorage.setItem('progression', '0');</script>
`;

const response = (body: unknown, statusCode = 200, headers: Record<string, unknown> = {}) => ({
  statusCode,
  body: typeof body === "string" ? body : JSON.stringify(body),
  headers,
});

async function startClient(options: ConstructorParameters<typeof AkinatorClient>[0] = {}) {
  mockGotScraping.mockResolvedValueOnce(response("", 200, {
    "set-cookie": ["SERVERID=server-1; Path=/; HttpOnly"],
  }));
  mockGotScraping.mockResolvedValueOnce(response(GAME_HTML));
  const client = new AkinatorClient({ language: Languages.English, ...options });
  await client.start();
  return client;
}

describe("session state and recovery", () => {
  beforeEach(() => mockGotScraping.mockReset());
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  it("persists cookies, ScraperAPI session number and back history", async () => {
    const client = await startClient({ scraperApiSession: 123456 });
    mockGotScraping.mockResolvedValueOnce(response({
      step: 2, progression: 12, question: "Second question?", completion: "OK",
    }));
    await client.answer(Answers.Yes);

    const serialized = JSON.parse(JSON.stringify(client.toJSON()));
    expect(serialized.cookies).toEqual({ SERVERID: "server-1" });
    expect(serialized.scraperApiSession).toBe(123456);
    expect(serialized.history).toHaveLength(1);

    const restored = AkinatorClient.fromJSON(serialized, { scraperApiKey: "restore-secret" });
    expect(restored.toJSON()).toEqual(serialized);
    expect(JSON.stringify(serialized)).not.toContain("restore-secret");

    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({
      step: 3, progression: 0, question: "First question?",
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await restored.back();
    expect(restored.toJSON().history).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [requestUrl, requestOptions] = fetchMock.mock.calls[0] as [string | URL, RequestInit];
    const scraperUrl = new URL(requestUrl);
    expect(scraperUrl.searchParams.get("api_key")).toBe("restore-secret");
    expect(scraperUrl.searchParams.get("session_number")).toBe("123456");
    expect(requestOptions.headers).toMatchObject({ cookie: "SERVERID=server-1" });
  });

  it("does not change the won state when /exclude fails", async () => {
    const client = await startClient();
    mockGotScraping.mockResolvedValueOnce(response({
      id_proposition: "42", name_proposition: "Test character", step: 3,
    }));
    await client.answer(Answers.Yes);
    expect(client.won).toBe(true);

    mockGotScraping.mockResolvedValueOnce(response("temporary error", 503));
    await expect(client.continue()).rejects.toThrow("HTTP error continuing: 503");
    expect(client.won).toBe(true);

    mockGotScraping.mockResolvedValueOnce(response("<html>invalid response</html>"));
    await expect(client.continue()).rejects.toThrow("HTML instead of JSON");
    expect(client.won).toBe(true);

    mockGotScraping.mockResolvedValueOnce(response({
      step: 4, progression: 55, question: "Next question?", completion: "OK",
    }));
    const result = await client.continue();
    expect(result.question).toBe("Next question?");
    expect(client.won).toBe(false);
    expect(client.ko).toBe(false);
  });

  it("prevents back() before any successful answer", async () => {
    const client = await startClient();
    const callsBefore = mockGotScraping.mock.calls.length;
    await expect(client.back()).rejects.toThrow("first question");
    expect(mockGotScraping).toHaveBeenCalledTimes(callsBefore);
  });

  it("tracks back history independently from the server's increasing step", async () => {
    const client = await startClient();
    mockGotScraping.mockResolvedValueOnce(response({ step: 2, progression: 10, question: "Q2?" }));
    await client.answer(Answers.Yes);
    mockGotScraping.mockResolvedValueOnce(response({ step: 3, progression: 20, question: "Q3?" }));
    await client.answer(Answers.No);

    mockGotScraping.mockResolvedValueOnce(response({ step: 4, progression: 10, question: "Q2?" }));
    await client.back();
    expect(client.step).toBe(4);
    mockGotScraping.mockResolvedValueOnce(response({ step: 5, progression: 0, question: "First question?" }));
    await client.back();
    expect(client.step).toBe(5);
    await expect(client.back()).rejects.toThrow("first question");
  });

  it("clears KO and stale win data when starting a new game", async () => {
    const client = await startClient();
    mockGotScraping.mockResolvedValueOnce(response({ completion: "KO", step: 2, progression: 100 }));
    const ko = await client.answer(Answers.Yes);
    expect(ko.ko).toBe(true);
    expect(client.ko).toBe(true);
    await expect(client.continue()).rejects.toThrow("gave up");

    mockGotScraping.mockResolvedValueOnce(response("", 200));
    mockGotScraping.mockResolvedValueOnce(response(GAME_HTML));
    const fresh = await client.start();
    expect(fresh.ko).toBe(false);
    expect(client.ko).toBe(false);
    expect(client.won).toBe(false);
    expect(client.question).toBe("First question?");
  });

  it("keeps ScraperAPI headers enabled from the first request and forwards cookies", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("", {
        status: 200,
        headers: { "set-cookie": "SCRAPER_SESSION=abc; Path=/; HttpOnly" },
      }))
      .mockResolvedValueOnce(new Response(GAME_HTML, { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        step: 2, progression: 15, question: "Second question?",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const client = new AkinatorClient({
      language: Languages.English,
      scraperApiKey: "test-key",
      scraperApiSession: 7654321,
    });
    await client.start();
    await client.answer(Answers.Yes);

    const firstUrl = new URL(fetchMock.mock.calls[0][0] as string);
    expect(firstUrl.searchParams.get("keep_headers")).toBe("true");
    expect(fetchMock.mock.calls[1][1].headers.cookie).toBe("SCRAPER_SESSION=abc");
    expect(new URL(fetchMock.mock.calls[2][0] as string).searchParams.get("session_number")).toBe("7654321");
  });

  it("does not retry state-changing POST requests", async () => {
    const client = await startClient({ retries: 4 });
    mockGotScraping.mockRejectedValueOnce(new Error("socket closed"));
    const before = mockGotScraping.mock.calls.length;
    await expect(client.answer(Answers.Yes)).rejects.toThrow("socket closed");
    expect(mockGotScraping.mock.calls.length - before).toBe(1);
  });
});
