export enum Languages {
  English = "en",
  Arabic = "ar",
  Chinese = "cn",
  German = "de",
  Spanish = "es",
  French = "fr",
  Hebrew = "il",
  Italian = "it",
  Japanese = "jp",
  Korean = "kr",
  Dutch = "nl",
  Polish = "pl",
  Portuguese = "pt",
  Russian = "ru",
  Turkish = "tr",
  Indonesian = "id",
}

export enum Themes {
  Character = 1,
  Objects = 2,
  Animals = 14,
}

export enum Answers {
  Yes,
  No,
  IDontKnow,
  Probably,
  ProbablyNot,
}

export const REGIONS = Object.values(Languages);

export const AVAILABLE_THEMES: Record<Languages, Themes[]> = {
  [Languages.English]:    [Themes.Character, Themes.Animals, Themes.Objects],
  [Languages.Arabic]:     [Themes.Character],
  [Languages.Chinese]:    [Themes.Character],
  [Languages.German]:     [Themes.Character, Themes.Animals],
  [Languages.Spanish]:    [Themes.Character, Themes.Animals],
  [Languages.French]:     [Themes.Character, Themes.Animals, Themes.Objects],
  [Languages.Hebrew]:     [Themes.Character],
  [Languages.Italian]:    [Themes.Character, Themes.Animals],
  [Languages.Japanese]:   [Themes.Character, Themes.Animals],
  [Languages.Korean]:     [Themes.Character],
  [Languages.Dutch]:      [Themes.Character],
  [Languages.Polish]:     [Themes.Character],
  [Languages.Portuguese]: [Themes.Character],
  [Languages.Russian]:    [Themes.Character],
  [Languages.Turkish]:    [Themes.Character],
  [Languages.Indonesian]: [Themes.Character],
};
