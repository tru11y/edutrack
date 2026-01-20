import fr from "./fr.json";
import en from "./en.json";

const langs: any = { fr, en };
let current = "fr";

export function t(key: string) {
  return langs[current][key] || key;
}

export function setLang(l: "fr" | "en") {
  current = l;
}
