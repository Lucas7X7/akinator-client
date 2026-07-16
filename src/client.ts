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

export interface SessionData {
  session: string;
  signature: string;
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
}

export interface AkinatorOptions {
  language?: Languages;
  childMode?: boolean;
  theme?: Themes;
  proxy?: string;
  retries?: number;
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

  private _got!: GotScraping;

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
  }

  toJSON(): SessionData {
    return {
      session: this._session,
      signature: this._signature,
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
    client._signature = data.signature;
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
    client._flagPhoto = data.flagPhoto;
    return client;
  }

  private async _init(): Promise<void> {
    if (!this._got) {
      const mod = await import("got-scraping");
      this._got = mod.gotScraping;
    }
  }

  private async _requestWithRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= this._retries; attempt++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        if (attempt < this._retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError!;
  }

  private async _get(url: string): Promise<string> {
    await this._init();
    return this._requestWithRetry(async () => {
      const res = await this._got({
        url,
        throwHttpErrors: false,
        ...(this._proxy ? { proxy: this._proxy } : {}),
      });
      return res.body;
    });
  }

  private async _post(url: string, body: Record<string, string | number | boolean>, options: { followRedirect?: boolean } = {}): Promise<any> {
    await this._init();
    const formBody = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      formBody.append(key, String(value));
    }
    return this._requestWithRetry(async () => {
      const res = await this._got({
        url,
        method: "POST",
        body: formBody.toString(),
        headers: { "content-type": "application/x-www-form-urlencoded" },
        throwHttpErrors: false,
        followRedirect: options.followRedirect ?? true,
        ...(this._proxy ? { proxy: this._proxy } : {}),
      });
      return res;
    });
  }

  async start(): Promise<AnswerResult> {
    const available = AVAILABLE_THEMES[this._language];
    if (!available || !available.includes(this._theme)) {
      throw new Error(
        `Theme "${Themes[this._theme]}" is not available for language "${this._language}".`
      );
    }

    this._url = `https://${this._language}.akinator.com`;

    await this._get(this._url + "/");

    const res = await this._post(this._url + "/game", {
      sid: this._theme,
      cm: this._childMode,
    });

    if (res.statusCode !== 200) {
      throw new Error(`HTTP error starting game: ${res.statusCode}`);
    }

    const html = res.body as string;

    const sessionMatch = html.match(/name="session" id="session" value="([^"]+)"/);
    const signatureMatch = html.match(/name="signature" id="signature" value="([^"]+)"/);
    if (!sessionMatch || !signatureMatch) {
      throw new Error("Failed to extract session/signature from HTML response.");
    }
    this._session = sessionMatch[1];
    this._signature = signatureMatch[1];

    const questionMatch = html.match(
      /<div class="bubble-body"><p class="question-text" id="question-label">(.*?)<\/p><\/div>/
    );
    if (questionMatch && questionMatch[1]) {
      this._question = questionMatch[1];
    }

    const identifiantMatch = html.match(/localStorage\.setItem\('identifiant', '([^']+)'\);/);
    if (identifiantMatch && identifiantMatch[1]) {
      this._identifiant = identifiantMatch[1];
    }

    const akitudeMatch = html.match(/akitude[^"]*"[^"]*([^/]+\.png)"/);
    this._akitude = akitudeMatch ? akitudeMatch[1] : "defi.png";

    this._progression = 0;
    this._step = 0;
    this._stepLastProposition = "";
    this._started = true;
    this._won = false;
    this._ko = false;

    return {
      won: false,
      ko: false,
      akitude: this._akitude,
      step: 0,
      progression: 0,
      question: this._question,
      answers: this.answers,
    };
  }

  async answer(answer: Answers): Promise<AnswerResult> {
    if (!this._started) throw new Error("Game not started. Call start() first.");
    if (this._won) throw new Error("A guess was already made. Call continue() or submitWin().");
    if (this._ko) throw new Error("Akinator already gave up. Call continue() to play again.");

    const res = await this._post(this._url + "/answer", {
      step: this._step,
      progression: this._progression,
      sid: this._theme,
      cm: this._childMode,
      answer: answer as number,
      step_last_proposition: this._stepLastProposition,
      session: this._session,
      signature: this._signature,
    });

    if (res.statusCode !== 200) {
      throw new Error(`HTTP error answering: ${res.statusCode}`);
    }

    return this._updateResult(JSON.parse(res.body));
  }

  async back(): Promise<AnswerResult> {
    if (!this._started) throw new Error("Game not started.");
    if (this._step === 0) throw new Error("Cannot go back further. Already on the first question.");

    const res = await this._post(this._url + "/cancel_answer", {
      step: this._step,
      progression: this._progression,
      sid: this._theme,
      cm: this._childMode,
      session: this._session,
      signature: this._signature,
    });

    if (res.statusCode !== 200) {
      throw new Error(`HTTP error going back: ${res.statusCode}`);
    }

    return this._updateResult(JSON.parse(res.body));
  }

  async continue(): Promise<AnswerResult> {
    if (!this._started) throw new Error("Game not started.");
    if (!this._won) throw new Error("No guess to continue from. Game is still in progress.");
    if (this._ko) throw new Error("Akinator already gave up. No more questions.");

    const res = await this._post(this._url + "/exclude", {
      step: this._step,
      sid: this._theme,
      cm: this._childMode,
      progression: this._progression,
      session: this._session,
      signature: this._signature,
    });

    if (res.statusCode !== 200) {
      throw new Error(`HTTP error continuing: ${res.statusCode}`);
    }

    this._won = false;
    return this._updateResult(JSON.parse(res.body));
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
      signature: this._signature,
      step: this._step,
    }, { followRedirect: false });

    if (res.statusCode !== 200 && res.statusCode !== 302) {
      throw new Error(`HTTP error confirming win: ${res.statusCode}`);
    }
  }

  private _updateResult(data: any): AnswerResult {
    const idProposition = data["id_proposition"];

    if (idProposition) {
      this._won = true;
      this._idProposition = idProposition;
      this._idBaseProposition = data["id_base_proposition"] ?? "";
      this._nameProposition = data["name_proposition"] ?? "";
      this._descriptionProposition = data["description_proposition"] ?? "";
      this._pseudo = data["pseudo"] ?? "";
      this._photo = data["photo"] ?? "";
      this._flagPhoto = data["flag_photo"] ?? 0;

      return {
        won: true,
        ko: false,
        akitude: data["akitude"] ?? "",
        step: this._step,
        progression: this._progression,
        question: this._question,
        answers: this.answers,
      };
    }

    if (data["completion"] === "KO") {
      this._ko = true;
      return {
        won: false,
        ko: true,
        akitude: data["akitude"] ?? "",
        step: this._step,
        progression: this._progression,
        question: "",
        answers: [],
      };
    }

    this._akitude = data["akitude"] ?? this._akitude;
    this._step = Number(data["step"]) || this._step;
    this._progression = Number(data["progression"]) || this._progression;
    this._question = data["question"] ?? this._question;

    return {
      won: false,
      ko: false,
      akitude: this._akitude,
      step: this._step,
      progression: this._progression,
      question: this._question,
      answers: this.answers,
    };
  }
}
