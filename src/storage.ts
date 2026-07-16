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

export const ANSWER_LABELS: Record<Languages, string[]> = {
  [Languages.English]:    ["Yes", "No", "Don't know", "Probably yes", "Probably no"],
  [Languages.Arabic]:     ["نعم", "لا", "لا أعرف", "ربما نعم", "ربما لا"],
  [Languages.Chinese]:    ["是", "不是", "不知道", "可能是", "可能不是"],
  [Languages.German]:     ["Ja", "Nein", "Weiß nicht", "Wahrscheinlich ja", "Wahrscheinlich nein"],
  [Languages.Spanish]:    ["Sí", "No", "No sé", "Probablemente sí", "Probablemente no"],
  [Languages.French]:     ["Oui", "Non", "Je ne sais pas", "Probablement oui", "Probablement non"],
  [Languages.Hebrew]:     ["כן", "לא", "לא יודע", "כנראה כן", "כנראה לא"],
  [Languages.Italian]:    ["Sì", "No", "Non so", "Probabilmente sì", "Probabilmente no"],
  [Languages.Japanese]:   ["はい", "いいえ", "わからない", "たぶんはい", "たぶんいいえ"],
  [Languages.Korean]:     ["예", "아니오", "모르겠습니다", "아마 예", "아마 아니오"],
  [Languages.Dutch]:      ["Ja", "Nee", "Weet niet", "Waarschijnlijk ja", "Waarschijnlijk nee"],
  [Languages.Polish]:     ["Tak", "Nie", "Nie wiem", "Pewnie tak", "Pewnie nie"],
  [Languages.Portuguese]: ["Sim", "Não", "Não sei", "Provavelmente sim", "Provavelmente não"],
  [Languages.Russian]:    ["Да", "Нет", "Не знаю", "Наверное да", "Наверное нет"],
  [Languages.Turkish]:    ["Evet", "Hayır", "Bilmiyorum", "Evet galiba", "Hayır galiba"],
  [Languages.Indonesian]: ["Ya", "Tidak", "Tidak tahu", "Mungkin ya", "Mungkin tidak"],
};

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
