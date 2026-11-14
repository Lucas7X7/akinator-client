import { Languages, Themes, Answers, AVAILABLE_THEMES, ANSWER_LABELS } from "./storage.js";

export interface WinResult {
  propositionId: number;
  basePropositionId: number;
  submittedBy: string;
  name: string;
  pictureUrl: string;
  description: string;
}

export interface AnswerResult {
  won: boolean;
  ko: boolean;
  akitude: string;
  step: number;
  progression: number;
  question: string;
  answers: string[];
}

export interface QuestionSnapshot {
  step: number;
  progression: number;
  question: string;
  stepLastProposition: string;
  akitude: string;
}

export interface SessionData {
  session: string;
  signature?: string;
  url: string;
  identifiant: string;
  question: string;
  step: number;
  progression: number;
  stepLastProposition: string;
  akitude: string;
  won: boolean;
  ko: boolean;
  started: boolean;
  language: Languages;
  theme: Themes;
  childMode: boolean;
  idProposition: string;
  idBaseProposition: string;
  nameProposition: string;
  descriptionProposition: string;
  photo: string;
  pseudo: string;
  flagPhoto: number;
  cookies?: Record<string, string>;
  scraperApiSession?: number;
  userAgent?: string;
  history?: QuestionSnapshot[];
  initialStep?: number;
}

export interface AkinatorOptions {
  language?: Languages;
  childMode?: boolean;
  theme?: Themes;
  proxy?: string;
  retries?: number;
  ua?: string;
  scraperApiKey?: string;
  scraperApiSession?: number;
}

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function extractGameValue(html: string, field: string): string | undefined {
  const escapedField = field.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const patterns = [
    new RegExp(`localStorage\\.setItem\\(['"]${escapedField}['"],\\s*['"]([^'"]+)['"]\\)`),
    new RegExp(`#${escapedField}['"]\\)\\.val\\(['"]([^'"]+)['"]\\)`),
    new RegExp(
      `<input\\b(?=[^>]*\\b(?:name|id)=["']${escapedField}["'])(?=[^>]*\\bvalue=["']([^"']+)["'])[^>]*>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

type GotScraping = typeof import("got-scraping").gotScraping;

export class AkinatorClient {
  private _session = "";
  private _signature = "";
  private _url = "";
  private _identifiant = "";

  private _akitude = "";
  private _progression = 0;
  private _question = "";
  private _step = 0;
  private _initialStep = 0;
  private _history: QuestionSnapshot[] = [];
  private _stepLastProposition = "";

  private _idProposition = "";
  private _idBaseProposition = "";
  private _nameProposition = "";
  private _descriptionProposition = "";
  private _photo = "";
  private _pseudo = "";
  private _flagPhoto = 0;

  private _won = false;
  private _ko = false;
  private _started = false;

  private _language: Languages;
  private _childMode: boolean;
  private _theme: Themes;
  private _proxy?: string;
  private _retries: number;
  private _ua: string;
  private _scraperApiKey?: string;
  private _scraperApiSession: number;

  private _got!: GotScraping;
  private _cookies: Record<string, string> = {};

  get question(): string { return this._question; }
  get step(): number { return this._step; }
  get progression(): number { return this._progression; }
  get won(): boolean { return this._won; }
  get ko(): boolean { return this._ko; }
  get started(): boolean { return this._started; }
  get language(): Languages { return this._language; }
  get theme(): Themes { return this._theme; }
  get childMode(): boolean { return this._childMode; }

  get answers(): string[] {
    return ANSWER_LABELS[this._language] ?? ANSWER_LABELS[Languages.English];
  }

  get winResult(): WinResult {
    return {
      propositionId: Number(this._idProposition),
      basePropositionId: Number(this._idBaseProposition),
      submittedBy: this._pseudo,
      name: this._nameProposition,
      pictureUrl: this._photo,
      description: this._descriptionProposition,
    };
  }

  constructor(options: AkinatorOptions = {}) {
    this._language = options.language ?? Languages.Portuguese;
    this._childMode = options.childMode ?? false;
    this._theme = options.theme ?? Themes.Character;
    this._proxy = options.proxy;
    this._retries = options.retries ?? 3;
    if (!Number.isInteger(this._retries) || this._retries < 0) throw new Error("retries must be a non-negative integer.");
    this._ua = options.ua ?? DEFAULT_UA;
    this._scraperApiKey = options.scraperApiKey;
    this._scraperApiSession =
      options.scraperApiSession ?? Math.floor(Math.random() * 1_000_000_000);
  }

  toJSON(): SessionData {
    return {
      session: this._session,
      ...(this._signature ? { signature: this._signature } : {}),
      url: this._url,
      identifiant: this._identifiant,
      question: this._question,
      step: this._step,
      progression: this._progression,
      stepLastProposition: this._stepLastProposition,
      akitude: this._akitude,
      won: this._won,
      ko: this._ko,
      started: this._started,
      language: this._language,
      theme: this._theme,
      childMode: this._childMode,
      idProposition: this._idProposition,
      idBaseProposition: this._idBaseProposition,
      nameProposition: this._nameProposition,
      descriptionProposition: this._descriptionProposition,
      photo: this._photo,
      pseudo: this._pseudo,
      flagPhoto: this._flagPhoto,
      cookies: { ...this._cookies },
      scraperApiSession: this._scraperApiSession,
      userAgent: this._ua,
      history: this._history.map((entry) => ({ ...entry })),
      initialStep: this._initialStep,
    };
  }

  static fromJSON(data: SessionData, options?: AkinatorOptions): AkinatorClient {
    const client = new AkinatorClient({
      language: data.language,
      childMode: data.childMode,
      theme: data.theme,
      ...options,
    });
    client._session = data.session;
    client._signature = data.signature ?? "";
    client._url = data.url;
    client._identifiant = data.identifiant;
    client._question = data.question;
    client._step = data.step;
    client._progression = data.progression;
    client._stepLastProposition = data.stepLastProposition;
    client._akitude = data.akitude;
    client._won = data.won;
    client._ko = data.ko;
    client._started = data.started;
    client._idProposition = data.idProposition;
    client._idBaseProposition = data.idBaseProposition;
    client._nameProposition = data.nameProposition;
    client._descriptionProposition = data.descriptionProposition;
    client._photo = data.photo;
    client._pseudo = data.pseudo;
    client._flagPhoto = data.flagPhoto ?? 0;
    client._cookies = { ...(data.cookies ?? {}) };
    client._scraperApiSession = data.scraperApiSession ?? client._scraperApiSession;
    client._ua = data.userAgent ?? client._ua;
    client._history = (data.history ?? []).map((entry) => ({ ...entry }));
    client._initialStep = data.initialStep ?? (data.step - client._history.length);
    return client;
  }

  private async _init(): Promise<void> {
    if (!this._got) {
      const mod = await import("got-scraping");
      this._got = mod.gotScraping;
    }
  }

  private async _requestWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this._retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < this._retries) {
          await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  private _cookieHeader(): string {
    const names = Object.keys(this._cookies);
    if (names.length === 0) return "";
    return names.map((n) => `${n}=${this._cookies[n]}`).join("; ");
  }

  private _captureSetCookies(headers: any): void {
    const raw = headers?.["set-cookie"] ?? headers?.["Set-Cookie"];
    if (!raw) return;
    const list = Array.isArray(raw)
      ? raw
      : typeof raw === "string"
        ? raw.split(/,(?=\s*[^;,=\s]+=[^;,]*)/)
        : [];
    for (const item of list) {
      if (typeof item !== "string") continue;
      const match = item.trim().match(/^([^=;]+)=([^;]*)/);
      if (match) this._cookies[match[1].trim()] = match[2].trim();
    }
  }

  private async _scraperApiCall(
    method: "GET" | "POST",
    url: string,
    body?: string
  ): Promise<{ statusCode: number; body: string; headers: Record<string, string | string[] | undefined> }> {
    const api = new URL("https://api.scraperapi.com");
    api.searchParams.set("api_key", this._scraperApiKey!);
    api.searchParams.set("url", url);
    api.searchParams.set("session_number", String(this._scraperApiSession));
    api.searchParams.set("keep_headers", "true");
    const cookie = this._cookieHeader();
    const headers: Record<string, string> = {};
    if (cookie) headers["cookie"] = cookie;
    const init: RequestInit = { method, headers, signal: AbortSignal.timeout(60000) };
    if (method === "POST") {
      headers["content-type"] = "application/x-www-form-urlencoded";
      init.body = body ?? "";
    }
    const res = await fetch(api, init);
    const responseHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies = responseHeaders.getSetCookie?.() ?? responseHeaders.get("set-cookie") ?? undefined;
    return {
      statusCode: res.status,
      body: await res.text(),
      headers: { "set-cookie": setCookies },
    };
  }

  private async _get(url: string): Promise<string> {
    if (this._scraperApiKey) {
      return this._requestWithRetry(async () => {
        const res = await this._scraperApiCall("GET", url);
        this._captureSetCookies(res.headers);
        return res.body;
      });
    }
    await this._init();
    return this._requestWithRetry(async () => {
      const res = await this._got({
        url,
        throwHttpErrors: false,
        headers: {
          "user-agent": this._ua,
          ...(this._cookieHeader() ? { cookie: this._cookieHeader() } : {}),
        },
        context: { useHeaderGenerator: false },
        ...(this._proxy ? { proxyUrl: this._proxy } : {}),
      });
      this._captureSetCookies(res.headers);
      return res.body;
    });
  }

  private _parseJson(body: string, endpoint: string): any {
    const trimmed = body.trimStart();
    if (trimmed.charAt(0) === "<") {
      const isChallenge =
        body.includes("challenge-platform") || body.includes("Vml0YWwgQVBJIGJsb2NrZWQ");
      if (isChallenge) {
        throw new Error(
          `Akinator served an anti-bot challenge ("Vital API blocked"/Cloudflare) on "${endpoint}" instead of JSON. A direct HTTP request with a mismatched TLS fingerprint cannot pass it. Pass a ScraperAPI key via the "scraperApiKey" option (or route through a browser-aware proxy) so the challenge is handled on the provider side, then continue() will work.`
        );
      }
      throw new Error(
        `Akinator returned HTML instead of JSON on "${endpoint}". This usually means the session expired or your proxy interrupted the request. Try starting a new game.`
      );
    }
    return JSON.parse(trimmed);
  }

  private async _post(url: string, body: Record<string, string | number | boolean>, options: { followRedirect?: boolean } = {}): Promise<any> {
    const formBody = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      formBody.append(key, String(value));
    }
    if (this._scraperApiKey) {
      const res = await this._scraperApiCall("POST", url, formBody.toString());
      this._captureSetCookies(res.headers);
      return res;
    }
    await this._init();
    const res = await this._got({
        url,
        method: "POST",
        body: formBody.toString(),
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": this._ua,
          ...(this._cookieHeader() ? { cookie: this._cookieHeader() } : {}),
        },
        throwHttpErrors: false,
        followRedirect: options.followRedirect ?? true,
        context: { useHeaderGenerator: false },
        ...(this._proxy ? { proxyUrl: this._proxy } : {}),
      });
    this._captureSetCookies(res.headers);
    return res;
  }

  private _clearGameState(): void {
    this._session = "";
    this._signature = "";
    this._identifiant = "";
    this._akitude = "";
    this._progression = 0;
    this._question = "";
    this._step = 0;
    this._initialStep = 0;
    this._stepLastProposition = "";
    this._idProposition = "";
    this._idBaseProposition = "";
    this._nameProposition = "";
    this._descriptionProposition = "";
    this._photo = "";
    this._pseudo = "";
    this._flagPhoto = 0;
    this._won = false;
    this._ko = false;
    this._started = false;
    this._history = [];
  }

  private _snapshot(): QuestionSnapshot {
    return {
      step: this._step,
      progression: this._progression,
      question: this._question,
      stepLastProposition: this._stepLastProposition,
      akitude: this._akitude,
    };
  }

  async start(): Promise<AnswerResult> {
    const available = AVAILABLE_THEMES[this._language];
    if (!available || !available.includes(this._theme)) {
      throw new Error(`Theme "${Themes[this._theme]}" is not available for language "${this._language}".`);
    }

    this._clearGameState();
    this._url = `https://${this._language}.akinator.com`;
    await this._get(this._url + "/");

    const res = await this._post(this._url + "/game", { sid: this._theme, cm: this._childMode });
    if (res.statusCode !== 200) throw new Error(`HTTP error starting game: ${res.statusCode}`);

    const html = String(res.body);
    const session = extractGameValue(html, "session");
    if (!session) throw new Error("Failed to extract session from HTML response.");

    const question = html.match(/<p\b[^>]*\bid=["']question-label["'][^>]*>(.*?)<\/p>/is)?.[1]?.trim() ?? "";
    const initialStepValue = Number(extractGameValue(html, "step"));
    const initialProgressionValue = Number(extractGameValue(html, "progression"));
    const akitudeTag = html.match(/<img\b(?=[^>]*\bid=["']akitude["'])[^>]*>/i)?.[0];
    const akitudeSrc = akitudeTag?.match(/\bsrc=["']([^"']+)["']/i)?.[1];

    this._session = session;
    this._signature = extractGameValue(html, "signature") ?? "";
    this._question = question;
    this._identifiant = extractGameValue(html, "identifiant") ?? "";
    this._step = Number.isFinite(initialStepValue) ? initialStepValue : 0;
    this._initialStep = this._step;
    this._progression = Number.isFinite(initialProgressionValue) ? initialProgressionValue : 0;
    this._akitude = akitudeSrc?.split(/[?#]/)[0].split("/").pop() || "defi.png";
    this._started = true;

    return {
      won: false, ko: false, akitude: this._akitude,
      step: this._step, progression: this._progression,
      question: this._question, answers: this.answers,
    };
  }

  async answer(answer: Answers): Promise<AnswerResult> {
    if (!this._started) throw new Error("Game not started. Call start() first.");
    if (this._won) throw new Error("A guess was already made. Call continue() or submitWin().");
    if (this._ko) throw new Error("Akinator already gave up. Call start() to begin a new game.");
    if (!Number.isInteger(answer) || answer < Answers.Yes || answer > Answers.ProbablyNot) {
      throw new Error("Invalid answer. Use an Answers enum value from 0 to 4.");
    }

    const previous = this._snapshot();
    const res = await this._post(this._url + "/answer", {
      step: this._step, progression: this._progression, sid: this._theme,
      cm: this._childMode, answer: answer as number,
      step_last_proposition: this._stepLastProposition, session: this._session,
      ...(this._signature ? { signature: this._signature } : {}),
    });
    if (res.statusCode !== 200) throw new Error(`HTTP error answering: ${res.statusCode}`);
    const result = this._updateResult(this._parseJson(res.body, "/answer"));
    this._history.push(previous);
    return result;
  }

  async back(): Promise<AnswerResult> {
    if (!this._started) throw new Error("Game not started.");
    if (this._history.length === 0) throw new Error("Cannot go back further. Already on the first question.");

    const res = await this._post(this._url + "/cancel_answer", {
      step: this._step, progression: this._progression, sid: this._theme,
      cm: this._childMode, session: this._session,
      ...(this._signature ? { signature: this._signature } : {}),
    });
    if (res.statusCode !== 200) throw new Error(`HTTP error going back: ${res.statusCode}`);
    const result = this._updateResult(this._parseJson(res.body, "/cancel_answer"));
    this._history.pop();
    return result;
  }

  async continue(): Promise<AnswerResult> {
    if (!this._started) throw new Error("Game not started.");
    if (this._ko) throw new Error("Akinator already gave up. Call start() to begin a new game.");
    if (!this._won) throw new Error("No guess to continue from. Game is still in progress.");

    const res = await this._post(this._url + "/exclude", {
      step: this._step, sid: this._theme, cm: this._childMode,
      progression: this._progression, session: this._session,
      ...(this._signature ? { signature: this._signature } : {}),
      forward_answer: 1,
    });
    if (res.statusCode !== 200) throw new Error(`HTTP error continuing: ${res.statusCode}`);

    // Parse and validate before changing any local state. A failed response leaves the win intact.
    const data = this._parseJson(res.body, "/exclude");
    return this._updateResult(data);
  }

  async submitWin(): Promise<void> {
    if (!this._started) throw new Error("Game not started.");
    if (!this._won) throw new Error("No guess to confirm.");

    const res = await this._post(this._url + "/choice", {
      sid: this._theme,
      pid: this._idProposition,
      identifiant: this._identifiant,
      pflag_photo: this._flagPhoto,
      charac_name: this._nameProposition,
      charac_desc: this._descriptionProposition,
      session: this._session,
      ...(this._signature ? { signature: this._signature } : {}),
      step: this._step,
    }, { followRedirect: false });

    if (res.statusCode !== 200 && res.statusCode !== 302) {
      throw new Error(`HTTP error confirming win: ${res.statusCode}`);
    }
  }

  private _updateResult(data: any): AnswerResult {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw new Error("Akinator returned an invalid JSON response.");
    }

    this._session = data.session ?? this._session;
    this._identifiant = data.identifiant ?? this._identifiant;
    this._signature = data.signature ?? this._signature;
    this._stepLastProposition = data.step_last_proposition ?? this._stepLastProposition;

    const step = Number(data.step);
    const progression = Number(data.progression);
    if (Number.isFinite(step)) this._step = step;
    if (Number.isFinite(progression)) this._progression = progression;
    this._akitude = data.akitude ?? this._akitude;

    if (data.id_proposition) {
      this._won = true;
      this._ko = false;
      this._idProposition = String(data.id_proposition);
      this._idBaseProposition = String(data.id_base_proposition ?? "");
      this._nameProposition = String(data.name_proposition ?? "");
      this._descriptionProposition = String(data.description_proposition ?? "");
      this._pseudo = String(data.pseudo ?? "");
      this._photo = String(data.photo ?? "");
      this._flagPhoto = Number(data.flag_photo ?? 0);
      return {
        won: true, ko: false, akitude: this._akitude, step: this._step,
        progression: this._progression, question: this._question, answers: this.answers,
      };
    }

    this._clearWinResult();
    if (data.completion === "KO") {
      this._won = false;
      this._ko = true;
      this._question = "";
      return {
        won: false, ko: true, akitude: this._akitude, step: this._step,
        progression: this._progression, question: "", answers: [],
      };
    }

    this._won = false;
    this._ko = false;
    this._question = data.question ?? this._question;
    return {
      won: false, ko: false, akitude: this._akitude, step: this._step,
      progression: this._progression, question: this._question, answers: this.answers,
    };
  }

  private _clearWinResult(): void {
    this._idProposition = "";
    this._idBaseProposition = "";
    this._nameProposition = "";
    this._descriptionProposition = "";
    this._photo = "";
    this._pseudo = "";
    this._flagPhoto = 0;
  }
}
