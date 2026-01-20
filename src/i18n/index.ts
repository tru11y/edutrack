import * as frData from "./fr.json";
import * as enData from "./en.json";

const langs: any = { fr: frData.default, en: enData.default };
let current = "fr";

export function t(key: string) {
  return langs[current][key] || key;
}

export function setLang(l: "fr" | "en") {
  current = l;
}
