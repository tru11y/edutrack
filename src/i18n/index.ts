import fr from "./fr.json";
import en from "./en.json";

type LangKey = "fr" | "en";
type Translations = Record<string, string>;

const langs: Record<LangKey, Translations> = { fr, en };
let current: LangKey = "fr";

export function t(key: string): string {
  return langs[current][key] || key;
}

export function setLang(l: LangKey): void {
  current = l;
}
